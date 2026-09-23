import numpy as np
import pandas as pd
import random
from predict_match import predict_match
from simulate_scorers import generate_scorers


def simulate_match(
    home_team,
    home_season,
    away_team,
    away_season,
    home_xi,
    away_xi
):
    home_xg, away_xg = predict_match(
        home_team,
        home_season,
        away_team,
        away_season
    )

    simulated_home_goals = np.random.poisson(home_xg)
    simulated_away_goals = np.random.poisson(away_xg)

    home_players = pd.DataFrame(home_xi)
    away_players = pd.DataFrame(away_xi)

    home_scorers = generate_scorers(
        home_players,
        simulated_home_goals
    )

    away_scorers = generate_scorers(
        away_players,
        simulated_away_goals
    )

    home_minutes = sorted(
        random.sample(
            range(1, 91),
            simulated_home_goals
        )
    )

    away_minutes = sorted(
        random.sample(
            range(1, 91),
            simulated_away_goals
        )
    )


    all_players = home_players.to_dict("records") + away_players.to_dict("records")
    scorer_names = []

    for player, goals in home_scorers.items():
        scorer_names.extend([player] * goals)

    for player, goals in away_scorers.items():
        scorer_names.extend([player] * goals)

    if scorer_names:
        man_of_match = random.choice(scorer_names)
    else:
        man_of_match = random.choice(
                [player["Player"] for player in all_players]
            )

    return {
        "home_xg": float(home_xg),
        "away_xg": float(away_xg),
        "home_goals": int(simulated_home_goals),
        "away_goals": int(simulated_away_goals),
        "home_scorers": dict(home_scorers),
        "away_scorers": dict(away_scorers),
        "home_minutes": home_minutes,
        "away_minutes": away_minutes,
        "man_of_match": man_of_match
    }


if __name__ == "__main__":
    result = simulate_match(
        "Arsenal",
        "2003/04",
        "Man United",
        "2007/08",
        [],
        []
    )

    print("\nSimulated Match")
    print("---------------------------")

    print(
        f"Arsenal (2003/04) "
        f"{result['home_goals']} - "
        f"{result['away_goals']} "
        f"Man United (2007/08)"
    )

    print("\nHome Scorers:")
    print(result["home_scorers"])

    print("\nAway Scorers:")
    print(result["away_scorers"])