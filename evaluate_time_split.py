import pandas as pd
import joblib

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

difference_df = pd.DataFrame(
    difference_data,
    index=data.index
)

data = pd.concat(
    [data, difference_df],
    axis=1
)

train_data = data[
    data["Season"] <= "2019/20"
]

test_data = data[
    data["Season"] >= "2020/21"
]

X_train = train_data[feature_columns]
X_test = test_data[feature_columns]

y_home_train = train_data["FullTimeHomeGoals"]
y_home_test = test_data["FullTimeHomeGoals"]

y_away_train = train_data["FullTimeAwayGoals"]
y_away_test = test_data["FullTimeAwayGoals"]

home_model = joblib.load("home_goals_model_v2.pkl")
away_model = joblib.load("away_goals_model_v2.pkl")

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

print("Time-Based Evaluation")

print(f"Training matches: {len(train_data)}")
print(f"Testing matches: {len(test_data)}")

print("\nHome Goals")
print(f"MAE:  {home_mae:.3f}")
print(f"RMSE: {home_rmse:.3f}")

print("\nAway Goals")
print(f"MAE:  {away_mae:.3f}")
print(f"RMSE: {away_rmse:.3f}")