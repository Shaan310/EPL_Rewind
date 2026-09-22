import pandas as pd
from pathlib import Path

input_path = Path("data/epl_final.csv")
output_path = Path("data/team_season_features.csv")

df = pd.read_csv(input_path)

records = []

for (season, team), group in df.groupby(["Season", "HomeTeam"]):
    home = group.copy()

    records.append({
        "Season": season,
        "Team": team,
        "Matches": len(home),
        "HomeWins": (home["FullTimeResult"] == "H").sum(),
        "HomeDraws": (home["FullTimeResult"] == "D").sum(),
        "HomeLosses": (home["FullTimeResult"] == "A").sum(),
        "HomeGoalsScored": home["FullTimeHomeGoals"].sum(),
        "HomeGoalsConceded": home["FullTimeAwayGoals"].sum(),
        "HomeShots": home["HomeShots"].sum(),
        "HomeShotsOnTarget": home["HomeShotsOnTarget"].sum(),
        "HomeCorners": home["HomeCorners"].sum(),
        "HomeFouls": home["HomeFouls"].sum(),
        "HomeYellowCards": home["HomeYellowCards"].sum(),
        "HomeRedCards": home["HomeRedCards"].sum()
    })

home_features = pd.DataFrame(records)

records = []

for (season, team), group in df.groupby(["Season", "AwayTeam"]):
    away = group.copy()

    records.append({
        "Season": season,
        "Team": team,
        "Matches": len(away),
        "AwayWins": (away["FullTimeResult"] == "A").sum(),
        "AwayDraws": (away["FullTimeResult"] == "D").sum(),
        "AwayLosses": (away["FullTimeResult"] == "H").sum(),
        "AwayGoalsScored": away["FullTimeAwayGoals"].sum(),
        "AwayGoalsConceded": away["FullTimeHomeGoals"].sum(),
        "AwayShots": away["AwayShots"].sum(),
        "AwayShotsOnTarget": away["AwayShotsOnTarget"].sum(),
        "AwayCorners": away["AwayCorners"].sum(),
        "AwayFouls": away["AwayFouls"].sum(),
        "AwayYellowCards": away["AwayYellowCards"].sum(),
        "AwayRedCards": away["AwayRedCards"].sum()
    })

away_features = pd.DataFrame(records)

features = pd.merge(
    home_features,
    away_features,
    on=["Season", "Team"],
    how="outer"
)

features = features.fillna(0)

features["Matches"] = features["Matches_x"] + features["Matches_y"]

features["Wins"] = features["HomeWins"] + features["AwayWins"]
features["Draws"] = features["HomeDraws"] + features["AwayDraws"]
features["Losses"] = features["HomeLosses"] + features["AwayLosses"]

features["GoalsScored"] = (
    features["HomeGoalsScored"] +
    features["AwayGoalsScored"]
)

features["GoalsConceded"] = (
    features["HomeGoalsConceded"] +
    features["AwayGoalsConceded"]
)

features["GoalDifference"] = (
    features["GoalsScored"] -
    features["GoalsConceded"]
)

features["Points"] = (
    features["Wins"] * 3 +
    features["Draws"]
)

features["GoalsPerMatch"] = (
    features["GoalsScored"] /
    features["Matches"]
)

features["ConcededPerMatch"] = (
    features["GoalsConceded"] /
    features["Matches"]
)

features["ShotsPerMatch"] = (
    features["HomeShots"] +
    features["AwayShots"]
) / features["Matches"]

features["ShotsOnTargetPerMatch"] = (
    features["HomeShotsOnTarget"] +
    features["AwayShotsOnTarget"]
) / features["Matches"]

features["CornersPerMatch"] = (
    features["HomeCorners"] +
    features["AwayCorners"]
) / features["Matches"]

features["FoulsPerMatch"] = (
    features["HomeFouls"] +
    features["AwayFouls"]
) / features["Matches"]

features["YellowCardsPerMatch"] = (
    features["HomeYellowCards"] +
    features["AwayYellowCards"]
) / features["Matches"]

features["RedCardsPerMatch"] = (
    features["HomeRedCards"] +
    features["AwayRedCards"]
) / features["Matches"]

features["HomeWinRate"] = (
    features["HomeWins"] /
    features["Matches_x"]
)

features["AwayWinRate"] = (
    features["AwayWins"] /
    features["Matches_y"]
)

features["WinRate"] = (
    features["Wins"] /
    features["Matches"]
)

features = features.sort_values(
    ["Season", "Team"]
).reset_index(drop=True)

features.to_csv(output_path, index=False)

print("Team-season dataset created.")
print(f"Rows: {len(features)}")
print(f"Columns: {len(features.columns)}")
print(f"Saved to: {output_path}")

print("\nFirst 10 rows:")
print(features.head(10))