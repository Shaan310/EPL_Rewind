import numpy as np
from predict_match import predict_match


def simulate_match(
    home_team,
    home_season,
    away_team,
    away_season
):
    home_goals, away_goals = predict_match(
        home_team,
        home_season,
        away_team,
        away_season
    )

    simulated_home_goals = np.random.poisson(home_goals)
    simulated_away_goals = np.random.poisson(away_goals)

    print("\nSimulated Match")
    print("---------------------------")

    print(
        f"{home_team} ({home_season}) "
        f"{simulated_home_goals} - "
        f"{simulated_away_goals} "
        f"{away_team} ({away_season})"
    )


simulate_match(
    "Arsenal",
    "2003/04",
    "Man United",
    "2007/08"
)