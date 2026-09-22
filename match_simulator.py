import numpy as np
from match_stats import generate_match_stats
from select_players import select_players
from simulate_scorers import generate_scorers
from predict_match import predict_match
from motm import calculate_motm


def simulate_match(
    home_team,
    home_season,
    away_team,
    away_season
):

    print("HOME TEAM")

    home_players = select_players(
        home_team,
        home_season
    )

    print("\nAWAY TEAM")

    away_players = select_players(
        away_team,
        away_season
    )

    home_expected, away_expected = predict_match(
        home_team,
        home_season,
        away_team,
        away_season
    )

    home_goals = np.random.poisson(
        home_expected
    )

    away_goals = np.random.poisson(
        away_expected
    )

    home_scorers = generate_scorers(
        home_players,
        home_goals
    )

    away_scorers = generate_scorers(
        away_players,
        away_goals
    )

    match_stats = generate_match_stats(
        home_expected,
        away_expected,
        home_goals,
        away_goals
    )

    motm_player, motm_team = calculate_motm(
        home_players,
        away_players,
        home_scorers,
        away_scorers,
        home_goals,
        away_goals
    )

    print("\nFINAL RESULT")

    print(
        f"{home_team} {home_goals} - "
        f"{away_goals} {away_team}"
    )

    print("\nGOAL SCORERS")

    print(f"\n{home_team}")

    if home_scorers:
        for player, goals in home_scorers.items():
            print(f"{player} - {goals}")
    else:
        print("No goals")

    print(f"\n{away_team}")

    if away_scorers:
        for player, goals in away_scorers.items():
            print(f"{player} - {goals}")
    else:
        print("No goals")

    print("\nMATCH STATISTICS")
    print(
        f"{'':20}"
        f"{home_team:15}"
        f"{away_team:15}"
    )

    print(
        f"{'Possession':20}"
        f"{match_stats['home_possession']}%{'':10}"
        f"{match_stats['away_possession']}%"
    )

    print(
        f"{'Shots':20}"
        f"{match_stats['home_shots']:<15}"
        f"{match_stats['away_shots']}"
    )

    print(
        f"{'Shots on Target':20}"
        f"{match_stats['home_shots_on_target']:<15}"
        f"{match_stats['away_shots_on_target']}"
    )

    print(
        f"{'Corners':20}"
        f"{match_stats['home_corners']:<15}"
        f"{match_stats['away_corners']}"
    )

    print(
        f"{'Fouls':20}"
        f"{match_stats['home_fouls']:<15}"
        f"{match_stats['away_fouls']}"
    )

    print(
        f"{'Yellow Cards':20}"
        f"{match_stats['home_yellows']:<15}"
        f"{match_stats['away_yellows']}"
    )

    print(
        f"{'Red Cards':20}"
        f"{match_stats['home_reds']:<15}"
        f"{match_stats['away_reds']}"
    )

    print("\nEXPECTED GOALS (xG)")
    print(f"{home_team}: {home_expected:.2f}")
    print(f"{away_team}: {away_expected:.2f}")

    print("\nMAN OF THE MATCH")
    print(f"{motm_player} ({motm_team})")


if __name__ == "__main__":

    home_team = input("Home Team: ")
    home_season = input("Home Season: ")

    away_team = input("Away Team: ")
    away_season = input("Away Season: ")

    simulate_match(
        home_team,
        home_season,
        away_team,
        away_season
    )