import pandas as pd
import joblib

from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error

matches = pd.read_csv("data/epl_final.csv")
team_features = pd.read_csv("data/team_season_features.csv")

home = team_features.add_prefix("Home_")
away = team_features.add_prefix("Away_")

home = home.rename(columns={
    "Home_Season": "Season",
    "Home_Team": "HomeTeam"
})

away = away.rename(columns={
    "Away_Season": "Season",
    "Away_Team": "AwayTeam"
})

data = matches.merge(
    home,
    on=["Season", "HomeTeam"],
    how="inner"
)

data = data.merge(
    away,
    on=["Season", "AwayTeam"],
    how="inner"
)

base_features = [
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
    "RedCardsPerMatch"
]

difference_data = {}

feature_columns = []

for feature in base_features:
    home_col = "Home_" + feature
    away_col = "Away_" + feature
    difference_col = "Difference_" + feature

    difference_data[difference_col] = (
        data[home_col] - data[away_col]
    )

    feature_columns.append(home_col)
    feature_columns.append(away_col)
    feature_columns.append(difference_col)

difference_df = pd.DataFrame(difference_data, index=data.index)

data = pd.concat([data, difference_df], axis=1)

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

home_mae = mean_absolute_error(
    y_home_test,
    home_predictions
)

away_mae = mean_absolute_error(
    y_away_test,
    away_predictions
)

home_rmse = mean_squared_error(
    y_home_test,
    home_predictions
) ** 0.5

away_rmse = mean_squared_error(
    y_away_test,
    away_predictions
) ** 0.5

print("V2 Model Performance")

print(f"Home Goals MAE: {home_mae:.3f}")
print(f"Home Goals RMSE: {home_rmse:.3f}")

print(f"Away Goals MAE: {away_mae:.3f}")
print(f"Away Goals RMSE: {away_rmse:.3f}")

joblib.dump(home_model, "home_goals_model_v2.pkl")
joblib.dump(away_model, "away_goals_model_v2.pkl")

joblib.dump(feature_columns, "model_features_v2.pkl")

print("\nV2 models saved.")