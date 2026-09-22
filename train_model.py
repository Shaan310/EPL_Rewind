import pandas as pd
import joblib

from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error

matches = pd.read_csv("data/epl_final.csv")
team_features = pd.read_csv("data/team_season_features.csv")

home_features = team_features.copy()
away_features = team_features.copy()

home_features = home_features.add_prefix("Home_")
away_features = away_features.add_prefix("Away_")

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

print("Training dataset created.")
print(f"Rows: {len(data)}")
print(f"Columns: {len(data.columns)}")

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

X_train, X_test, y_home_train, y_home_test, y_away_train, y_away_test = train_test_split(
    X,
    y_home,
    y_away,
    test_size=0.2,
    random_state=42
)

home_model = RandomForestRegressor(
    n_estimators=300,
    random_state=42,
    min_samples_leaf=3
)

away_model = RandomForestRegressor(
    n_estimators=300,
    random_state=42,
    min_samples_leaf=3
)

home_model.fit(X_train, y_home_train)
away_model.fit(X_train, y_away_train)

home_predictions = home_model.predict(X_test)
away_predictions = away_model.predict(X_test)

home_mae = mean_absolute_error(y_home_test, home_predictions)
away_mae = mean_absolute_error(y_away_test, away_predictions)

home_rmse = mean_squared_error(
    y_home_test,
    home_predictions
) ** 0.5

away_rmse = mean_squared_error(
    y_away_test,
    away_predictions
) ** 0.5

print("\nModel Performance")

print(f"Home Goals MAE: {home_mae:.3f}")
print(f"Home Goals RMSE: {home_rmse:.3f}")

print(f"Away Goals MAE: {away_mae:.3f}")
print(f"Away Goals RMSE: {away_rmse:.3f}")

joblib.dump(home_model, "home_goals_model.pkl")
joblib.dump(away_model, "away_goals_model.pkl")

print("\nModels saved.")