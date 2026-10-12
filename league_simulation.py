"""
league_simulation.py

Full League Mode simulation engine for EPL REWIND.
Handles:
- Loading historical team features and player datasets with resilient path resolution.
- Generating valid 38-matchday double round-robin schedules for 20 teams (380 fixtures total).
- Building position-balanced representative starting XIs for historical teams.
- Simulating matches using Random Forest expected-goals baseline + Poisson distribution.
- Applying modest, documented custom squad rating adjustments (Attack, Midfield, Defence, GK).
- Attributing real goal scorers, goal minutes, goalkeeper clean sheets, and MVP scores.
- Tracking live standings, matchday results, and end-of-season awards (Golden Boot, Golden Glove, Season MVP).
"""

import os
import random
import functools
from collections import Counter
import numpy as np
import pandas as pd
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def resolve_path(*relative_paths):
    """Resolve a file path checking BASE_DIR first, then working directory."""
    for rel in relative_paths:
        candidate = os.path.join(BASE_DIR, rel)
        if os.path.exists(candidate):
            return candidate
        if os.path.exists(rel):
            return os.path.abspath(rel)
    return os.path.join(BASE_DIR, relative_paths[0])


# ---------------------------------------------------------------------------
# DATA & MODEL LOADING
# ---------------------------------------------------------------------------

TEAM_ALIAS = {
    "Burnley": "Burnley FC",
    "Bournemouth": "AFC Bournemouth",
    "Brighton": "Brighton and Hove Albion",
    "Brentford": "Brentford FC",
}
REVERSE_ALIAS = {v: k for k, v in TEAM_ALIAS.items()}

# Positional categories matching EPL REWIND Match Simulator
ATTACKER_POSITIONS = {
    "Centre-Forward",
    "Striker",
    "Left Winger",
    "Right Winger",
    "Second Striker",
    "Forward",
}

MIDFIELDER_POSITIONS = {
    "Central Midfield",
    "Defensive Midfield",
    "Attacking Midfield",
    "Left Midfield",
    "Right Midfield",
    "Midfielder",
}

DEFENDER_POSITIONS = {
    "Centre-Back",
    "Left-Back",
    "Right-Back",
    "Defender",
}

GOALKEEPER_POSITIONS = {
    "Goalkeeper",
}

BASE_MODEL_FEATURES = [
    "GoalsPerMatch",
    "ConcededPerMatch",
    "GoalDifference",
    "WinRate",
    "HomeWinRate",
    "AwayWinRate",
    "ShotsPerMatch",
    "ShotsOnTargetPerMatch",
    "CornersPerMatch",
    "FoulsPerMatch",
    "YellowCardsPerMatch",
    "RedCardsPerMatch",
]

_team_features_df = None
_players_df = None
_players_rated_df = None
_home_model = None
_away_model = None
_feature_columns = None


def get_team_features_df():
    global _team_features_df
    if _team_features_df is None:
        path = resolve_path("data/team_season_features.csv", "frontend/public/data/team_season_features.csv")
        _team_features_df = pd.read_csv(path)
    return _team_features_df


def get_players_df():
    global _players_df
    if _players_df is None:
        path = resolve_path("data/players.csv", "frontend/public/data/players.csv")
        # Read with utf-8 fallback to latin-1
        try:
            _players_df = pd.read_csv(path, encoding="utf-8")
        except Exception:
            _players_df = pd.read_csv(path, encoding="latin-1")
    return _players_df


def get_players_rated_df():
    global _players_rated_df
    if _players_rated_df is None:
        path = resolve_path("frontend/public/data/players_rated.csv", "data/players_rated.csv")
        if os.path.exists(path):
            try:
                _players_rated_df = pd.read_csv(path, encoding="utf-8")
            except Exception:
                _players_rated_df = pd.read_csv(path, encoding="latin-1")
        else:
            _players_rated_df = pd.DataFrame()
    return _players_rated_df


def get_models():
    global _home_model, _away_model, _feature_columns
    if _home_model is None or _away_model is None or _feature_columns is None:
        hm_path = resolve_path("models/home_goals_model_v3.pkl")
        am_path = resolve_path("models/away_goals_model_v3.pkl")
        fc_path = resolve_path("models/model_features_v3.pkl")
        _home_model = joblib.load(hm_path)
        _away_model = joblib.load(am_path)
        _feature_columns = joblib.load(fc_path)
    return _home_model, _away_model, _feature_columns


def get_season_teams(season):
    """Return sorted list of the 20 clubs for the given season from team_season_features.csv."""
    df = get_team_features_df()
    season_df = df[df["Season"] == season]
    if season_df.empty:
        raise ValueError(f"Season {season} not found in historical data.")
    return sorted(season_df["Team"].unique().tolist())


# ---------------------------------------------------------------------------
# SCHEDULE GENERATION (Circle Method / Berger Tables)
# ---------------------------------------------------------------------------

def generate_double_round_robin_schedule(teams):
    """
    Generate a valid 38-matchday double round-robin schedule for 20 teams (380 fixtures total).
    Guarantees:
    - 20 teams.
    - 19 opponents, home and away (38 fixtures per team).
    - Exactly 10 matches per matchday.
    - Every team plays exactly once per matchday.
    - Every pair meets twice with reversed home/away in the second half.
    """
    if len(teams) != 20:
        raise ValueError(f"Double round-robin schedule requires exactly 20 teams, got {len(teams)}")

    t = list(teams)
    n = len(t)
    first_half_rounds = []

    # First half: 19 rounds
    for r in range(n - 1):
        round_matches = []
        for i in range(n // 2):
            t1 = t[i]
            t2 = t[n - 1 - i]
            # Alternate home/away for the pivot team and pairs
            if (r + i) % 2 == 0:
                round_matches.append({"home_team": t1, "away_team": t2})
            else:
                round_matches.append({"home_team": t2, "away_team": t1})
        first_half_rounds.append(round_matches)
        # Rotate all teams except index 0
        t = [t[0]] + [t[-1]] + t[1:-1]

    # Second half: exactly mirror rounds 0..18 with swapped home/away
    second_half_rounds = []
    for r_matches in first_half_rounds:
        rev_matches = [
            {"home_team": m["away_team"], "away_team": m["home_team"]}
            for m in r_matches
        ]
        second_half_rounds.append(rev_matches)

    all_rounds = first_half_rounds + second_half_rounds

    schedule = []
    fix_id = 1
    for m_idx, round_fixtures in enumerate(all_rounds, start=1):
        fixtures_list = []
        for f in round_fixtures:
            fixtures_list.append({
                "id": f"fix_{fix_id}",
                "matchday": m_idx,
                "home_team": f["home_team"],
                "away_team": f["away_team"],
            })
            fix_id += 1
        schedule.append({
            "matchday": m_idx,
            "fixtures": fixtures_list,
        })

    return schedule


# ---------------------------------------------------------------------------
# REPRESENTATIVE STARTING XI BUILDER FOR HISTORICAL TEAMS
# ---------------------------------------------------------------------------

_squad_cache = {}

def get_representative_xi(team, season):
    """
    Builds a position-balanced 11-player representative Starting XI for a historical opponent.
    Returns list of 11 dicts: [{'Player': ..., 'Position': ..., 'position_group': ..., 'Rating': ...}].
    """
    cache_key = (team, season)
    if cache_key in _squad_cache:
        return _squad_cache[cache_key]

    players_df = get_players_df()
    rated_df = get_players_rated_df()

    # Determine matched team name in players.csv
    mapped_team = TEAM_ALIAS.get(team, team)

    # 1. Search in players.csv
    club_players = players_df[(players_df["Season"] == season) & (players_df["Team"] == mapped_team)].copy()
    if club_players.empty and mapped_team != team:
        club_players = players_df[(players_df["Season"] == season) & (players_df["Team"] == team)].copy()

    if club_players.empty:
        # Fallback to general search
        club_players = players_df[(players_df["Season"] == season) & (players_df["Team"].str.contains(team, case=False, na=False))].copy()

    # Pre-lookup ratings from rated_df if available
    ratings_map = {}
    if not rated_df.empty:
        sub_rated = rated_df[rated_df["Season"] == season]
        for _, row in sub_rated.iterrows():
            p_name = row["Player"]
            r = row.get("Rating", 75)
            if p_name not in ratings_map or r > ratings_map[p_name]:
                ratings_map[p_name] = int(r)

    players_list = []
    for _, row in club_players.iterrows():
        p_name = str(row["Player"])
        pos = str(row["Position"])
        
        # Categorize position group
        if pos in GOALKEEPER_POSITIONS or "GOALKEEPER" in pos.upper() or pos == "GK":
            group = "GK"
        elif pos in DEFENDER_POSITIONS or "DEF" in pos.upper() or "BACK" in pos.upper():
            group = "DEF"
        elif pos in MIDFIELDER_POSITIONS or "MID" in pos.upper():
            group = "MID"
        else:
            group = "FWD"

        rating = ratings_map.get(p_name, 76)
        players_list.append({
            "Player": p_name,
            "Position": pos,
            "position_group": group,
            "Rating": rating,
        })

    # Sort players by rating descending
    players_list.sort(key=lambda p: p["Rating"], reverse=True)

    gks = [p for p in players_list if p["position_group"] == "GK"]
    defs = [p for p in players_list if p["position_group"] == "DEF"]
    mids = [p for p in players_list if p["position_group"] == "MID"]
    fwds = [p for p in players_list if p["position_group"] == "FWD"]

    # Select balanced 4-4-2 or 4-3-3 structure:
    # 1 GK, 4 DEF, 4 MID, 2 FWD
    selected_xi = []
    selected_names = set()

    def add_p(p):
        if p["Player"] not in selected_names and len(selected_xi) < 11:
            selected_xi.append(p)
            selected_names.add(p["Player"])

    # 1 GK
    if gks:
        add_p(gks[0])
    # 4 DEF
    for d in defs[:4]:
        add_p(d)
    # 4 MID
    for m in mids[:4]:
        add_p(m)
    # 2 FWD
    for f in fwds[:2]:
        add_p(f)

    # Fill remaining slots up to 11 with best remaining players
    for p in players_list:
        add_p(p)

    # If still fewer than 11 players in dataset, create fallback placeholders
    while len(selected_xi) < 11:
        idx = len(selected_xi) + 1
        pos = "Goalkeeper" if not any(p["position_group"] == "GK" for p in selected_xi) else "Midfielder"
        grp = "GK" if pos == "Goalkeeper" else "MID"
        selected_xi.append({
            "Player": f"{team} Player {idx}",
            "Position": pos,
            "position_group": grp,
            "Rating": 75,
        })

    _squad_cache[cache_key] = selected_xi
    return selected_xi


# ---------------------------------------------------------------------------
# PREDICT EXPECTED GOALS (Random Forest Baseline)
# ---------------------------------------------------------------------------

@functools.lru_cache(maxsize=4096)
def predict_baseline_xg(home_team, home_season, away_team, away_season):
    """
    Computes baseline expected goals (home_xg, away_xg) using the trained Random Forest model.
    """
    df = get_team_features_df()
    home_match = df[(df["Season"] == home_season) & (df["Team"] == home_team)]
    away_match = df[(df["Season"] == away_season) & (df["Team"] == away_team)]

    if home_match.empty:
        raise ValueError(f"Home team '{home_team}' not found for season {home_season}")
    if away_match.empty:
        raise ValueError(f"Away team '{away_team}' not found for season {away_season}")

    home_row = home_match.iloc[0]
    away_row = away_match.iloc[0]

    values = {}
    for feature in BASE_MODEL_FEATURES:
        values["Home_" + feature] = home_row[feature]
        values["Away_" + feature] = away_row[feature]
        values["Difference_" + feature] = home_row[feature] - away_row[feature]

    home_model, away_model, feature_cols = get_models()
    X = pd.DataFrame([values])[feature_cols]

    home_xg = float(home_model.predict(X)[0])
    away_xg = float(away_model.predict(X)[0])
    return max(0.2, home_xg), max(0.2, away_xg)


# ---------------------------------------------------------------------------
# CUSTOM SQUAD RATING MODIFIERS
# ---------------------------------------------------------------------------

def compute_squad_ratings(squad_xi):
    """
    Extracts positional ratings (Attack, Midfield, Defence, GK, Overall) from a starting XI.
    """
    fwds = [p for p in squad_xi if p.get("position_group") == "FWD" or "FORWARD" in str(p.get("Position", "")).upper() or "STRIKER" in str(p.get("Position", "")).upper() or "WINGER" in str(p.get("Position", "")).upper()]
    mids = [p for p in squad_xi if p.get("position_group") == "MID" or "MID" in str(p.get("Position", "")).upper()]
    defs = [p for p in squad_xi if p.get("position_group") == "DEF" or "DEF" in str(p.get("Position", "")).upper() or "BACK" in str(p.get("Position", "")).upper()]
    gks = [p for p in squad_xi if p.get("position_group") == "GK" or "GOALKEEPER" in str(p.get("Position", "")).upper() or "GK" in str(p.get("Position", "")).upper()]

    def avg_r(arr, default=76.0):
        if not arr:
            return default
        vals = [float(p.get("Rating", default)) for p in arr]
        return float(np.mean(vals))

    att = avg_r(fwds)
    mid = avg_r(mids)
    defense = avg_r(defs)
    gk = avg_r(gks)
    overall = avg_r(squad_xi)

    return {
        "attack": round(att),
        "midfield": round(mid),
        "defence": round(defense),
        "gk": round(gk),
        "overall": round(overall),
    }


def apply_custom_team_modifiers(
    base_home_xg,
    base_away_xg,
    custom_is_home,
    custom_ratings,
    replaced_ratings=None,
    replaced_club=None,
    season=None,
):
    """
    Applies calibrated ratings modifiers comparing the custom XI against the replaced club's baseline.
    - Attack & Midfield improve custom team expected goals relative to the replaced club.
    - Defence, GK & Midfield reduce opponent expected goals relative to the replaced club.
    - Uses blended proportional + additive scaling calibrated to realistic Premier League performance:
      * Attack advantage produces realistic goal output (+35 to +40 goals over season for +15 rating delta).
      * Defence/GK advantage reduces opponent expected goals (+15 rating delta saves ~35 goals over season).
    - Prevents excessively weak influence (ensuring a 90 OVR squad replacing a relegation club finishes near the top)
      while avoiding overpowering bonuses.
    """
    if replaced_ratings is None:
        if replaced_club and season:
            rep_xi = get_representative_xi(replaced_club, season)
            replaced_ratings = compute_squad_ratings(rep_xi)
        else:
            # Fallback to realistic starter baseline if replaced club not provided
            replaced_ratings = {
                "attack": 85.0,
                "midfield": 82.0,
                "defence": 85.0,
                "gk": 88.0,
                "overall": 85.0,
            }

    diff_att = float(custom_ratings.get("attack", 76)) - float(replaced_ratings.get("attack", 76))
    diff_mid = float(custom_ratings.get("midfield", 76)) - float(replaced_ratings.get("midfield", 76))
    diff_def = float(custom_ratings.get("defence", 76)) - float(replaced_ratings.get("defence", 76))
    diff_gk  = float(custom_ratings.get("gk", 76)) - float(replaced_ratings.get("gk", 76))

    # Offensive delta: Attack rating is primary (70%), supported by midfield creativity (30%)
    off_delta = (0.70 * diff_att) + (0.30 * diff_mid)

    # Defensive delta: Defensive unit (50%), goalkeeper shot-stopping (30%), midfield screening (20%)
    def_delta = (0.50 * diff_def) + (0.30 * diff_gk) + (0.20 * diff_mid)

    # Multiplier and additive calibrations:
    # att_mult scales the fixture context; att_add provides an absolute quality lift/floor
    att_mult = max(0.35, min(2.50, 1.0 + (off_delta * 0.022)))
    att_add  = off_delta * 0.038

    # def_mult suppresses opponent expected goals; def_sub provides absolute defensive suppression
    def_mult = max(0.30, min(2.50, 1.0 - (def_delta * 0.025)))
    def_sub  = def_delta * 0.038

    if custom_is_home:
        custom_xg = max(0.20, (base_home_xg * att_mult) + att_add)
        opp_xg    = max(0.20, (base_away_xg * def_mult) - def_sub)
        return custom_xg, opp_xg
    else:
        opp_xg    = max(0.20, (base_home_xg * def_mult) - def_sub)
        custom_xg = max(0.20, (base_away_xg * att_mult) + att_add)
        return opp_xg, custom_xg


# ---------------------------------------------------------------------------
# SCORER ATTRIBUTION & GOAL MINUTES
# ---------------------------------------------------------------------------

def choose_scorer_from_xi(squad_xi):
    """
    Picks a goal scorer from squad_xi weighted by position:
    - Attackers: 60%
    - Midfielders: 30%
    - Defenders: 10%
    """
    attackers = [p for p in squad_xi if p.get("position_group") == "FWD"]
    midfielders = [p for p in squad_xi if p.get("position_group") == "MID"]
    defenders = [p for p in squad_xi if p.get("position_group") == "DEF"]

    groups = []
    if attackers:
        groups.append((attackers, 60))
    if midfielders:
        groups.append((midfielders, 30))
    if defenders:
        groups.append((defenders, 10))

    if not groups:
        # Fallback to any non-GK player
        non_gks = [p for p in squad_xi if p.get("position_group") != "GK"] or squad_xi
        return random.choice(non_gks)["Player"]

    total_weight = sum(w for _, w in groups)
    val = random.uniform(0, total_weight)
    cur = 0
    selected_group = groups[0][0]
    for grp, w in groups:
        cur += w
        if val <= cur:
            selected_group = grp
            break

    chosen = random.choice(selected_group)
    return chosen["Player"]


def generate_scorers_and_minutes(squad_xi, goals_count):
    """
    Generates dict of {player_name: goal_count} and sorted list of goal minutes for goals_count goals.
    """
    if goals_count <= 0:
        return {}, []

    scorers_list = []
    for _ in range(goals_count):
        scorer = choose_scorer_from_xi(squad_xi)
        scorers_list.append(scorer)

    scorers_counts = dict(Counter(scorers_list))

    # Generate goal minutes
    if goals_count <= 90:
        minutes = sorted(random.sample(range(1, 91), goals_count))
    else:
        minutes = sorted([random.randint(1, 90) for _ in range(goals_count)])

    return scorers_counts, minutes


# ---------------------------------------------------------------------------
# SINGLE MATCH SIMULATOR
# ---------------------------------------------------------------------------

def simulate_league_fixture(
    home_team_name,
    away_team_name,
    season,
    replaced_club,
    custom_club_name,
    custom_xi,
    custom_ratings=None,
    replaced_ratings=None,
):
    """
    Simulates a single fixture within League Mode.
    Accurately attributes goals, clean sheets, and player MVP points.
    """
    # 1. Identify baseline teams for Random Forest model
    custom_is_home = (home_team_name == custom_club_name)
    custom_is_away = (away_team_name == custom_club_name)

    effective_home = replaced_club if custom_is_home else home_team_name
    effective_away = replaced_club if custom_is_away else away_team_name

    base_home_xg, base_away_xg = predict_baseline_xg(effective_home, season, effective_away, season)

    # 2. Apply Custom XI ratings modifier if custom club is involved
    if custom_is_home or custom_is_away:
        if custom_ratings is None:
            custom_ratings = compute_squad_ratings(custom_xi)
        if replaced_ratings is None and replaced_club:
            rep_xi = get_representative_xi(replaced_club, season)
            replaced_ratings = compute_squad_ratings(rep_xi)
        home_xg, away_xg = apply_custom_team_modifiers(
            base_home_xg=base_home_xg,
            base_away_xg=base_away_xg,
            custom_is_home=custom_is_home,
            custom_ratings=custom_ratings,
            replaced_ratings=replaced_ratings,
            replaced_club=replaced_club,
            season=season,
        )
    else:
        home_xg, away_xg = base_home_xg, base_away_xg

    # 3. Poisson distribution with momentum adjustments matching 1v1 match simulator
    if home_xg > away_xg:
        home_lambda = home_xg * 1.10
        away_lambda = away_xg * 0.90
    elif away_xg > home_xg:
        home_lambda = home_xg * 0.90
        away_lambda = away_xg * 1.10
    else:
        home_lambda = home_xg
        away_lambda = away_xg

    home_lambda = max(0.1, home_lambda)
    away_lambda = max(0.1, away_lambda)

    sim_home_goals = int(np.random.poisson(home_lambda))
    sim_away_goals = int(np.random.poisson(away_lambda))

    # 4. Resolve starting XIs
    if custom_is_home:
        home_xi_squad = custom_xi
    else:
        home_xi_squad = get_representative_xi(home_team_name, season)

    if custom_is_away:
        away_xi_squad = custom_xi
    else:
        away_xi_squad = get_representative_xi(away_team_name, season)

    # 5. Attributed scorers and goal minutes
    home_scorers, home_minutes = generate_scorers_and_minutes(home_xi_squad, sim_home_goals)
    away_scorers, away_minutes = generate_scorers_and_minutes(away_xi_squad, sim_away_goals)

    # 6. Clean sheets and Goalkeepers
    home_clean_sheet = (sim_away_goals == 0)
    away_clean_sheet = (sim_home_goals == 0)

    home_gk_player = next(
        (p["Player"] for p in home_xi_squad if p.get("position_group") == "GK" or "GOALKEEPER" in str(p.get("Position", "")).upper()),
        home_xi_squad[0]["Player"]
    )
    away_gk_player = next(
        (p["Player"] for p in away_xi_squad if p.get("position_group") == "GK" or "GOALKEEPER" in str(p.get("Position", "")).upper()),
        away_xi_squad[0]["Player"]
    )

    # 7. Player MVP Scoring (matching existing formula from simulate_match.py)
    home_won = sim_home_goals > sim_away_goals
    away_won = sim_away_goals > sim_home_goals

    player_scores = {}
    player_stats_list = []

    def score_squad(squad, team_name, is_home, won, clean_sheet, scorers_dict, team_gk):
        for p in squad:
            name = p["Player"]
            pos = str(p.get("Position", "")).upper()
            grp = p.get("position_group", "MID")
            is_gk = (name == team_gk or grp == "GK" or "GOALKEEPER" in pos or pos == "GK")

            score = 0
            if won:
                score += 5

            goals = scorers_dict.get(name, 0)
            if goals > 0:
                score += goals * 10
                if "FORWARD" in pos or "ATTACK" in pos or grp == "FWD" or "STRIKER" in pos:
                    score += goals * 4
                elif "MID" in pos or grp == "MID":
                    score += goals * 5
                elif "DEF" in pos or grp == "DEF":
                    score += goals * 7

            if clean_sheet:
                if is_gk:
                    score += 10
                elif "DEF" in pos or grp == "DEF":
                    score += 5

            player_scores[name] = score
            player_stats_list.append({
                "player": name,
                "team": team_name,
                "goals": goals,
                "clean_sheet": bool(clean_sheet and is_gk),
                "mvp_points": score,
                "is_gk": is_gk,
            })

    score_squad(home_xi_squad, home_team_name, True, home_won, home_clean_sheet, home_scorers, home_gk_player)
    score_squad(away_xi_squad, away_team_name, False, away_won, away_clean_sheet, away_scorers, away_gk_player)

    man_of_match = max(player_scores, key=player_scores.get) if player_scores else "None"
    mvp_score = player_scores.get(man_of_match, 0)

    return {
        "home_team": home_team_name,
        "away_team": away_team_name,
        "home_goals": sim_home_goals,
        "away_goals": sim_away_goals,
        "home_xg": round(home_xg, 2),
        "away_xg": round(away_xg, 2),
        "home_scorers": home_scorers,
        "away_scorers": away_scorers,
        "home_minutes": home_minutes,
        "away_minutes": away_minutes,
        "man_of_match": man_of_match,
        "mvp_score": mvp_score,
        "home_clean_sheet": home_clean_sheet,
        "away_clean_sheet": away_clean_sheet,
        "home_goalkeeper": home_gk_player,
        "away_goalkeeper": away_gk_player,
        "player_stats": player_stats_list,
    }


# ---------------------------------------------------------------------------
# SIMULATE MATCHDAY (10 FIXTURES)
# ---------------------------------------------------------------------------

def simulate_matchday(
    season,
    replaced_club,
    custom_club_name,
    custom_xi,
    fixtures,
    matchday_num=None
):
    """
    Simulates all 10 fixtures for a specific matchday.
    """
    custom_ratings = compute_squad_ratings(custom_xi)
    rep_ratings = compute_squad_ratings(get_representative_xi(replaced_club, season))
    results = []

    for f in fixtures:
        h_team = f["home_team"]
        a_team = f["away_team"]
        res = simulate_league_fixture(
            home_team_name=h_team,
            away_team_name=a_team,
            season=season,
            replaced_club=replaced_club,
            custom_club_name=custom_club_name,
            custom_xi=custom_xi,
            custom_ratings=custom_ratings,
            replaced_ratings=rep_ratings,
        )
        res["id"] = f.get("id", "")
        res["matchday"] = matchday_num or f.get("matchday", 1)
        results.append(res)

    return results


# ---------------------------------------------------------------------------
# STANDINGS CALCULATION & END-OF-SEASON AWARDS
# ---------------------------------------------------------------------------

def compute_standings(teams, match_results):
    """
    Given a list of team names and all played match results, returns sorted standings table:
    [
      {
        "rank": 1, "team": "...", "played": 38, "won": 26, "drawn": 8, "lost": 4,
        "gf": 73, "ga": 26, "gd": 47, "points": 86
      }, ...
    ]
    Sorted by: points desc, gd desc, gf desc, team asc.
    """
    table = {
        t: {
            "team": t,
            "played": 0,
            "won": 0,
            "drawn": 0,
            "lost": 0,
            "gf": 0,
            "ga": 0,
            "gd": 0,
            "points": 0,
        }
        for t in teams
    }

    for m in match_results:
        h = m["home_team"]
        a = m["away_team"]
        hg = m["home_goals"]
        ag = m["away_goals"]

        if h not in table:
            table[h] = {"team": h, "played": 0, "won": 0, "drawn": 0, "lost": 0, "gf": 0, "ga": 0, "gd": 0, "points": 0}
        if a not in table:
            table[a] = {"team": a, "played": 0, "won": 0, "drawn": 0, "lost": 0, "gf": 0, "ga": 0, "gd": 0, "points": 0}

        table[h]["played"] += 1
        table[a]["played"] += 1
        table[h]["gf"] += hg
        table[h]["ga"] += ag
        table[a]["gf"] += ag
        table[a]["ga"] += hg

        if hg > ag:
            table[h]["won"] += 1
            table[h]["points"] += 3
            table[a]["lost"] += 1
        elif ag > hg:
            table[a]["won"] += 1
            table[a]["points"] += 3
            table[h]["lost"] += 1
        else:
            table[h]["drawn"] += 1
            table[h]["points"] += 1
            table[a]["drawn"] += 1
            table[a]["points"] += 1

    for row in table.values():
        row["gd"] = row["gf"] - row["ga"]

    sorted_list = sorted(
        table.values(),
        key=lambda r: (r["points"], r["gd"], r["gf"], -ord(r["team"][0])),
        reverse=True
    )

    for idx, row in enumerate(sorted_list, start=1):
        row["rank"] = idx

    return sorted_list


def compute_season_awards(all_match_results):
    """
    Computes official end-of-season awards across all played fixtures:
    - Golden Boot: top scorer(s) and goal totals (supports ties).
    - Golden Glove: goalkeeper(s) with most clean sheets and clean sheet totals (supports ties).
    - Season MVP: player(s) with most accumulated MVP points and points totals (supports ties).
    - League Champion: calculated from standings.
    """
    goal_counts = Counter()
    clean_sheets = Counter()
    mvp_points = Counter()
    player_teams = {}

    for m in all_match_results:
        # 1. Goals
        for p, g in m.get("home_scorers", {}).items():
            goal_counts[p] += g
            player_teams[p] = m["home_team"]
        for p, g in m.get("away_scorers", {}).items():
            goal_counts[p] += g
            player_teams[p] = m["away_team"]

        # 2. Goalkeeper clean sheets
        if m.get("home_clean_sheet") and m.get("home_goalkeeper"):
            clean_sheets[m["home_goalkeeper"]] += 1
            player_teams[m["home_goalkeeper"]] = m["home_team"]

        if m.get("away_clean_sheet") and m.get("away_goalkeeper"):
            clean_sheets[m["away_goalkeeper"]] += 1
            player_teams[m["away_goalkeeper"]] = m["away_team"]

        # 3. Accumulated MVP points from player_stats
        for stat in m.get("player_stats", []):
            p = stat["player"]
            pts = stat.get("mvp_points", 0)
            mvp_points[p] += pts
            player_teams[p] = stat.get("team", player_teams.get(p, ""))

    # Find Golden Boot winners (top goals)
    max_goals = max(goal_counts.values()) if goal_counts else 0
    golden_boot_winners = [
        {"player": p, "team": player_teams.get(p, ""), "goals": max_goals}
        for p, g in goal_counts.items() if g == max_goals and max_goals > 0
    ]

    # Find Golden Glove winners (top clean sheets)
    max_cs = max(clean_sheets.values()) if clean_sheets else 0
    golden_glove_winners = [
        {"player": p, "team": player_teams.get(p, ""), "clean_sheets": max_cs}
        for p, cs in clean_sheets.items() if cs == max_cs and max_cs > 0
    ]

    # Find Season MVP winners (top points)
    max_mvp = max(mvp_points.values()) if mvp_points else 0
    mvp_winners = [
        {"player": p, "team": player_teams.get(p, ""), "points": max_mvp}
        for p, pts in mvp_points.items() if pts == max_mvp and max_mvp > 0
    ]

    # Leaderboard top 10 lists for display
    top_scorers = [
        {"player": p, "team": player_teams.get(p, ""), "goals": g}
        for p, g in goal_counts.most_common(10)
    ]
    top_goalkeepers = [
        {"player": p, "team": player_teams.get(p, ""), "clean_sheets": cs}
        for p, cs in clean_sheets.most_common(10)
    ]
    top_mvps = [
        {"player": p, "team": player_teams.get(p, ""), "points": pts}
        for p, pts in mvp_points.most_common(10)
    ]

    return {
        "golden_boot": {
            "winners": golden_boot_winners,
            "max_goals": max_goals,
            "top_list": top_scorers,
        },
        "golden_glove": {
            "winners": golden_glove_winners,
            "max_clean_sheets": max_cs,
            "top_list": top_goalkeepers,
        },
        "season_mvp": {
            "winners": mvp_winners,
            "max_points": max_mvp,
            "top_list": top_mvps,
        },
    }

