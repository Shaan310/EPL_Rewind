import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error

matches = pd.read_csv("data/epl_final.csv")

home_model = joblib.load("home_goals_model.pkl")
away_model = joblib.load("away_goals_model.pkl")

team_features = pd.read_csv("data/team_season_features.csv")

home_features = team_features.add_prefix("Home_")
away_features = team_features.add_prefix("Away_")

home_features = home_features.rename(columns={
    "Home_Season": "Season",
    "Home_Team": "HomeTeam"
})

away_features = away_features.rename(columns={
    "Away_Season": "Season",
    "Away_Team": "AwayTeam"
})

data = matches.merge(
    home_features,
    on=["Season", "HomeTeam"],
    how="inner"
)

data = data.merge(
    away_features,
    on=["Season", "AwayTeam"],
    how="inner"
)

feature_columns = [
    "Home_GoalsPerMatch",
    "Home_ConcededPerMatch",
    "Home_GoalDifference",
    "Home_WinRate",
    "Home_HomeWinRate",
    "Home_AwayWinRate",
    "Home_ShotsPerMatch",
    "Home_ShotsOnTargetPerMatch",
    "Home_CornersPerMatch",

    "Away_GoalsPerMatch",
    "Away_ConcededPerMatch",
    "Away_GoalDifference",
    "Away_WinRate",
    "Away_HomeWinRate",
    "Away_AwayWinRate",
    "Away_ShotsPerMatch",
    "Away_ShotsOnTargetPerMatch",
    "Away_CornersPerMatch"
]

X = data[feature_columns]

y_home = data["FullTimeHomeGoals"]
y_away = data["FullTimeAwayGoals"]

_, X_test, _, y_home_test, _, y_away_test = train_test_split(
    X,
    y_home,
    y_away,
    test_size=0.2,
    random_state=42
)

home_predictions = home_model.predict(X_test)
away_predictions = away_model.predict(X_test)

home_baseline = np.full(
    len(y_home_test),
    y_home.mean()
)

away_baseline = np.full(
    len(y_away_test),
    y_away.mean()
)

print("Baseline vs Random Forest\n")

print("Home Goals")
print(f"Baseline MAE:      {mean_absolute_error(y_home_test, home_baseline):.3f}")
print(f"Random Forest MAE: {mean_absolute_error(y_home_test, home_predictions):.3f}")

print("\nAway Goals")
print(f"Baseline MAE:      {mean_absolute_error(y_away_test, away_baseline):.3f}")
print(f"Random Forest MAE: {mean_absolute_error(y_away_test, away_predictions):.3f}")