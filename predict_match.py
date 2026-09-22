import pandas as pd
import joblib

team_features = pd.read_csv("data/team_season_features.csv")

home_model = joblib.load("home_goals_model_v3.pkl")
away_model = joblib.load("away_goals_model_v3.pkl")
feature_columns = joblib.load("model_features_v3.pkl")

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


def get_team(season, team):

    result = team_features[
        (team_features["Season"] == season) &
        (team_features["Team"] == team)
    ]

    if result.empty:
        raise ValueError(
            f"{team} was not found in season {season}"
        )

    return result.iloc[0]


def predict_match(
    home_team,
    home_season,
    away_team,
    away_season
):

    home = get_team(home_season, home_team)
    away = get_team(away_season, away_team)

    values = {}

    for feature in base_features:

        home_col = "Home_" + feature
        away_col = "Away_" + feature
        difference_col = "Difference_" + feature

        values[home_col] = home[feature]
        values[away_col] = away[feature]

        values[difference_col] = (
            home[feature] - away[feature]
        )

    X = pd.DataFrame([values])

    X = X[feature_columns]

    predicted_home_goals = home_model.predict(X)[0]
    predicted_away_goals = away_model.predict(X)[0]

    return predicted_home_goals, predicted_away_goals