import pandas as pd
from pathlib import Path
import re

base_path = Path("dataset/DATA_CSV")
output_path = Path("data/players.csv")

all_players = []

team_name_map = {
    "Arsenal_FC": "Arsenal",
    "Aston_Villa": "Aston Villa",
    "Birmingham_City": "Birmingham",
    "Blackburn_Rovers": "Blackburn",
    "Blackpool_FC": "Blackpool",
    "Bolton_Wanderers": "Bolton",
    "Bournemouth": "Bournemouth",
    "Bradford_City": "Bradford",
    "Brentford": "Brentford",
    "Brighton": "Brighton",
    "Burnley": "Burnley",
    "Cardiff_City": "Cardiff",
    "Charlton_Athletic": "Charlton",
    "Chelsea_FC": "Chelsea",
    "Coventry_City": "Coventry",
    "Crystal_Palace": "Crystal Palace",
    "Derby_County": "Derby",
    "Everton_FC": "Everton",
    "Fulham_FC": "Fulham",
    "Huddersfield_Town": "Huddersfield",
    "Hull_City": "Hull",
    "Ipswich_Town": "Ipswich",
    "Leeds_United": "Leeds",
    "Leicester_City": "Leicester",
    "Liverpool_FC": "Liverpool",
    "Luton_Town": "Luton",
    "Manchester_City": "Man City",
    "Manchester_United": "Man United",
    "Middlesbrough_FC": "Middlesbrough",
    "Newcastle_United": "Newcastle",
    "Norwich_City": "Norwich",
    "Nottingham_Forest": "Nott'm Forest",
    "Portsmouth_FC": "Portsmouth",
    "Queens_Park_Rangers": "QPR",
    "Reading_FC": "Reading",
    "Sheffield_United": "Sheffield United",
    "Southampton_FC": "Southampton",
    "Stoke_City": "Stoke",
    "Sunderland_AFC": "Sunderland",
    "Swansea_City": "Swansea",
    "Tottenham_Hotspur": "Tottenham",
    "Watford_FC": "Watford",
    "West_Bromwich_Albion": "West Brom",
    "West_Ham_United": "West Ham",
    "Wigan_Athletic": "Wigan",
    "Wolverhampton_Wanderers": "Wolves"
}

for season_folder in sorted(base_path.glob("Season_20*")):
    if not season_folder.is_dir():
        continue

    season_year = season_folder.name.replace("Season_", "")

    if not season_year.isdigit():
        continue

    season_year = int(season_year)

    if season_year < 2000 or season_year > 2024:
        continue

    season = f"{season_year}/{str(season_year + 1)[-2:]}"

    for csv_file in season_folder.glob("*.csv"):
        try:
            df = pd.read_csv(csv_file)
        except Exception as e:
            print(f"Could not read {csv_file}: {e}")
            continue

        if "name" not in df.columns or "position" not in df.columns:
            print(f"Skipping {csv_file.name}: required columns missing")
            continue

        match = re.match(r"(.+)_\d+_\d{4}\.csv$", csv_file.name)

        if match:
            raw_team = match.group(1)
        else:
            raw_team = csv_file.stem.rsplit("_", 2)[0]

        team = team_name_map.get(raw_team, raw_team.replace("_", " "))

        players = df[["name", "position"]].copy()

        players = players.rename(columns={
            "name": "Player",
            "position": "Position"
        })

        players["Season"] = season
        players["Team"] = team

        players = players[["Season", "Team", "Player", "Position"]]

        all_players.append(players)

if not all_players:
    print("No player data found.")
else:
    players_df = pd.concat(all_players, ignore_index=True)

    players_df = players_df.dropna(subset=["Player", "Position"])

    players_df["Player"] = players_df["Player"].astype(str).str.strip()
    players_df["Position"] = players_df["Position"].astype(str).str.strip()

    players_df = players_df.drop_duplicates(
        subset=["Season", "Team", "Player"]
    )

    players_df = players_df.sort_values(
        ["Season", "Team", "Player"]
    ).reset_index(drop=True)

    players_df.to_csv(output_path, index=False)

    print("Player dataset created.")
    print(f"Rows: {len(players_df)}")
    print(f"Seasons: {players_df['Season'].nunique()}")
    print(f"Teams: {players_df['Team'].nunique()}")
    print(f"Players: {players_df['Player'].nunique()}")
    print(f"Saved to: {output_path}")