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

    if home_xg > away_xg:
        home_lambda = home_xg * 1.10
        away_lambda = away_xg * 0.90
    elif away_xg > home_xg:
        home_lambda = home_xg * 0.90
        away_lambda = away_xg * 1.10
    else:
        home_lambda = home_xg
        away_lambda = away_xg

    simulated_home_goals = np.random.poisson(home_lambda)
    simulated_away_goals = np.random.poisson(away_lambda)

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

    # -----------------------------
    # PLAYER MVP SCORING
    # -----------------------------

    player_scores = {}

    home_player_names = set(home_players["Player"])
    away_player_names = set(away_players["Player"])

    home_won = simulated_home_goals > simulated_away_goals
    away_won = simulated_away_goals > simulated_home_goals

    home_clean_sheet = simulated_away_goals == 0
    away_clean_sheet = simulated_home_goals == 0

    for player in home_players.to_dict("records"):
        name = player["Player"]
        position = str(player["Position"]).upper()

        score = 0

        # Win bonus
        if home_won:
            score += 5

        # Goal scoring
        goals = home_scorers.get(name, 0)

        if goals > 0:
            score += goals * 10

            if "FORWARD" in position or "ATTACK" in position:
                score += goals * 4
            elif "MID" in position:
                score += goals * 5
            elif "DEF" in position:
                score += goals * 7

        # Clean sheet
        if home_clean_sheet:
            if "GOALKEEPER" in position or "GK" in position:
                score += 10
            elif "DEF" in position:
                score += 5

        player_scores[name] = score

    for player in away_players.to_dict("records"):
        name = player["Player"]
        position = str(player["Position"]).upper()

        score = 0

        # Win bonus
        if away_won:
            score += 5

        # Goal scoring
        goals = away_scorers.get(name, 0)

        if goals > 0:
            score += goals * 10

            if "FORWARD" in position or "ATTACK" in position:
                score += goals * 4
            elif "MID" in position:
                score += goals * 5
            elif "DEF" in position:
                score += goals * 7

        # Clean sheet
        if away_clean_sheet:
            if "GOALKEEPER" in position or "GK" in position:
                score += 10
            elif "DEF" in position:
                score += 5

        player_scores[name] = score

    # Highest scoring player becomes MVP
    man_of_match = max(
        player_scores,
        key=player_scores.get
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

    

    return {
        "home_xg": float(home_xg),
        "away_xg": float(away_xg),
        "home_goals": int(simulated_home_goals),
        "away_goals": int(simulated_away_goals),
        "home_scorers": dict(home_scorers),
        "away_scorers": dict(away_scorers),
        "home_minutes": home_minutes,
        "away_minutes": away_minutes,
        "man_of_match": man_of_match,
        "mvp_score": player_scores[man_of_match],
        "player_scores": player_scores
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