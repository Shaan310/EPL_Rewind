from __future__ import annotations

import re
import zipfile
from pathlib import Path

import numpy as np
import pandas as pd

INPUT_ZIP = Path('dataset.zip')
OUTPUT_CSV = Path('players_rated.csv')

FIRST_SEASON = 2000
LAST_SEASON = 2024

# EPL Rewind rating design:
# 1. Historical market value is the primary signal where available.
# 2. Missing values are estimated from the player's observed market-value strength
#    relative to a position/age curve learned from the same dataset.
# 3. Rating is a within-season, within-position percentile so inflation across eras
#    does not make modern players automatically stronger.
# 4. Rating is mapped to 50..98; price is derived from that rating for League Mode.

POSITION_MAP = {
    'Goalkeeper': 'GK',
    'Centre-Back': 'DEF',
    'Left-Back': 'DEF',
    'Right-Back': 'DEF',
    'Defender': 'DEF',
    'Defensive Midfield': 'MID',
    'Central Midfield': 'MID',
    'Attacking Midfield': 'MID',
    'Left Midfield': 'MID',
    'Right Midfield': 'MID',
    'Midfielder': 'MID',
    'Centre-Forward': 'FWD',
    'Striker': 'FWD',
    'Left Winger': 'FWD',
    'Right Winger': 'FWD',
    'Second Striker': 'FWD',
}


def clean_team_name(raw: str) -> str:
    """Convert Transfermarkt-style filename team names to project display names."""
    name = raw.strip()
    # The filename always ends with _<club id>_<season year>.
    name = re.sub(r'_\d+_\d{4}$', '', name)
    name = name.replace('_FC_(-_2004)', '')
    name = name.replace('_FC', '')
    name = name.replace('_AFC', '')
    name = name.replace('_', ' ')
    name = re.sub(r'\s+', ' ', name).strip()
    return name


def season_label(year: int) -> str:
    return f'{year}/{str(year + 1)[-2:]}'


def age_curve_models(observed: pd.DataFrame):
    """Fit position-specific quadratic curves to log market value by age."""
    models = {}
    global_x = observed['age'].to_numpy()
    global_y = observed['log_mv'].to_numpy()
    global_coef = np.polyfit(global_x, global_y, 2)
    models['__GLOBAL__'] = global_coef

    for pos, g in observed.groupby('position_group'):
        g = g.dropna(subset=['age', 'log_mv'])
        if len(g) >= 20 and g['age'].nunique() >= 3:
            deg = min(2, g['age'].nunique() - 1)
            models[pos] = np.polyfit(g['age'], g['log_mv'], deg)
        else:
            models[pos] = global_coef
    return models


def curve_value(age: float, pos: str, models) -> float:
    coef = models.get(pos, models['__GLOBAL__'])
    a = float(np.clip(age, 16, 40))
    return float(np.polyval(coef, a))


def price_from_rating(rating: int) -> float:
    x = max(0.0, float(rating) - 50.0)
    return round(0.8 + 0.10 * x + 0.008 * (x ** 2), 1)


def main() -> None:
    if not INPUT_ZIP.exists():
        raise FileNotFoundError(f'Missing {INPUT_ZIP.resolve()}')

    records = []

    with zipfile.ZipFile(INPUT_ZIP) as z:
        for member in z.namelist():
            m = re.match(r'dataset/DATA_CSV/Season_(\d{4})/([^/]+)\.csv$', member)
            if not m:
                continue

            year = int(m.group(1))
            if not FIRST_SEASON <= year <= LAST_SEASON:
                continue

            filename_team = m.group(2)
            df = pd.read_csv(z.open(member))
            df['season_year'] = year
            df['Season'] = season_label(year)
            df['Team'] = clean_team_name(filename_team)
            records.append(df)

    if not records:
        raise RuntimeError('No player season files were found.')

    players = pd.concat(records, ignore_index=True)

    required = ['position', 'name', 'id', 'marketValue', 'age', 'season_year', 'Season', 'Team']
    missing = [c for c in required if c not in players.columns]
    if missing:
        raise RuntimeError(f'Missing expected columns: {missing}')

    players['market_value'] = pd.to_numeric(players['marketValue'], errors='coerce')
    players['age'] = pd.to_numeric(players['age'], errors='coerce')
    players['position_group'] = players['position'].map(POSITION_MAP).fillna('MID')

    observed = players[
        players['market_value'].gt(0)
        & players['age'].notna()
    ].copy()
    observed['log_mv'] = np.log(observed['market_value'])

    models = age_curve_models(observed)

    # Baseline expected log market value from position + age.
    players['baseline_log_mv'] = players.apply(
        lambda r: curve_value(
            r['age'] if pd.notna(r['age']) else 26,
            r['position_group'],
            models,
        ),
        axis=1,
    )

    # Missing values must not use future seasons to rate an earlier season.
    # For seasons with a previous observed value for the same player, carry that
    # value forward using the learned position/age curve. For 2000-2003 (and any
    # player with no earlier observed value), use only the position/age model.
    observed['baseline_log_mv'] = observed.apply(
        lambda r: curve_value(r['age'], r['position_group'], models), axis=1
    )

    previous_values = {}
    for pid, g in players.sort_values(['id', 'season_year']).groupby('id'):
        previous_values[pid] = []
        for _, row in g.iterrows():
            if pd.notna(row['market_value']) and row['market_value'] > 0:
                previous_values[pid].append((int(row['season_year']), float(row['age']) if pd.notna(row['age']) else 26.0, float(row['market_value']), row['position_group']))

    estimates = []
    sources = []
    for _, r in players.iterrows():
        actual = r['market_value']
        if pd.notna(actual) and actual > 0:
            estimates.append(float(actual))
            sources.append('observed_market_value')
            continue

        candidates = [x for x in previous_values.get(r['id'], []) if x[0] < int(r['season_year'])]
        if candidates:
            prev_year, prev_age, prev_value, prev_pos = candidates[-1]
            current_age = float(r['age']) if pd.notna(r['age']) else prev_age + (int(r['season_year']) - prev_year)
            prev_curve = curve_value(prev_age, prev_pos, models)
            curr_curve = curve_value(current_age, r['position_group'], models)
            # Preserve the player's observed strength relative to the age curve,
            # then move that strength to the current season/age.
            log_estimate = np.log(prev_value) - prev_curve + curr_curve
            estimates.append(float(np.exp(log_estimate)))
            sources.append('previous_season_model')
        else:
            age = float(r['age']) if pd.notna(r['age']) else 26.0
            estimates.append(float(np.exp(curve_value(age, r['position_group'], models))))
            sources.append('position_age_model')

    players['estimated_market_value'] = estimates
    players['rating_source'] = sources

    # Within each season and position, market-value percentile -> 50..98.
    players['value_percentile'] = (
        players.groupby(['Season', 'position_group'])['estimated_market_value']
        .rank(method='average', pct=True)
    )
    players['Rating'] = np.rint(50 + players['value_percentile'] * 48).astype(int)
    players['Rating'] = players['Rating'].clip(50, 98)
    players['Price'] = players['Rating'].map(price_from_rating)

    output = players[[
        'Season', 'season_year', 'Team', 'name', 'position', 'position_group',
        'id', 'age', 'market_value', 'estimated_market_value',
        'Rating', 'Price', 'rating_source'
    ]].rename(columns={
        'name': 'Player',
        'position': 'Position',
        'market_value': 'MarketValue',
        'estimated_market_value': 'EstimatedMarketValue',
    })

    output = output.sort_values(['Season', 'Team', 'Rating', 'Player'], ascending=[True, True, False, True])
    output.to_csv(OUTPUT_CSV, index=False)

    print(f'Created: {OUTPUT_CSV.resolve()}')
    print(f'Rows: {len(output):,}')
    print(f'Seasons: {output.Season.nunique()} ({output.Season.min()} -> {output.Season.max()})')
    print(f'Observed market values: {(output.rating_source == "observed_market_value").mean():.1%}')
    print(f'Player-history estimates: {(output.rating_source == "player_history_model").mean():.1%}')
    print(f'Position/age estimates: {(output.rating_source == "position_age_model").mean():.1%}')
    print('\nRating distribution:')
    print(output['Rating'].describe().round(2).to_string())

    print('\nSample historical players:')
    sample_names = ['Thierry Henry', 'Cristiano Ronaldo', 'Wayne Rooney', 'Frank Lampard', 'Steven Gerrard', 'David Seaman']
    sample = output[output['Player'].isin(sample_names)][['Season', 'Team', 'Player', 'Position', 'Rating', 'Price', 'RatingSource' if 'RatingSource' in output.columns else 'rating_source']]
    print(sample.head(30).to_string(index=False))


if __name__ == '__main__':
    main()
