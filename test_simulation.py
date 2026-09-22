import numpy as np


home_expected = 2.60
away_expected = 0.86

simulations = 10000

home_wins = 0
draws = 0
away_wins = 0

total_home_goals = 0
total_away_goals = 0

extreme_upsets = 0

for _ in range(simulations):

    home_goals = np.random.poisson(home_expected)
    away_goals = np.random.poisson(away_expected)

    total_home_goals += home_goals
    total_away_goals += away_goals

    if home_goals > away_goals:
        home_wins += 1
    elif home_goals == away_goals:
        draws += 1
    else:
        away_wins += 1

    if away_goals - home_goals >= 4:
        extreme_upsets += 1


print("Simulation Results")
print()

print(f"Simulations: {simulations}")

print(
    f"Average Man United goals: "
    f"{total_home_goals / simulations:.2f}"
)

print(
    f"Average Arsenal goals: "
    f"{total_away_goals / simulations:.2f}"
)

print(
    f"Man United wins: "
    f"{home_wins / simulations * 100:.2f}%"
)

print(
    f"Draws: "
    f"{draws / simulations * 100:.2f}%"
)

print(
    f"Arsenal wins: "
    f"{away_wins / simulations * 100:.2f}%"
)

print(
    f"Arsenal wins by 4+ goals: "
    f"{extreme_upsets / simulations * 100:.2f}%"
)