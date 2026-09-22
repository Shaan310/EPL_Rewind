import random
from collections import Counter


ATTACKERS = [
    "Centre-Forward",
    "Striker",
    "Left Winger",
    "Right Winger",
    "Second Striker"
]

MIDFIELDERS = [
    "Central Midfield",
    "Defensive Midfield",
    "Attacking Midfield",
    "Left Midfield",
    "Right Midfield",
    "Midfielder"
]

DEFENDERS = [
    "Centre-Back",
    "Left-Back",
    "Right-Back",
    "Defender"
]


def choose_scorer(selected_players):

    attackers = selected_players[
        selected_players["Position"].isin(ATTACKERS)
    ]

    midfielders = selected_players[
        selected_players["Position"].isin(MIDFIELDERS)
    ]

    defenders = selected_players[
        selected_players["Position"].isin(DEFENDERS)
    ]

    groups = []

    if not attackers.empty:
        groups.append(("attacker", attackers, 60))

    if not midfielders.empty:
        groups.append(("midfielder", midfielders, 30))

    if not defenders.empty:
        groups.append(("defender", defenders, 10))

    total_weight = sum(
        weight for _, _, weight in groups
    )

    value = random.uniform(0, total_weight)

    current = 0

    selected_group = None

    for _, group, weight in groups:

        current += weight

        if value <= current:
            selected_group = group
            break

    player = selected_group.sample(
        n=1
    ).iloc[0]

    return player["Player"]


def generate_scorers(selected_players, goals):

    scorers = []

    for _ in range(goals):

        scorer = choose_scorer(
            selected_players
        )

        scorers.append(scorer)

    return Counter(scorers)