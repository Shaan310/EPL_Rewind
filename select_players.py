import pandas as pd

players = pd.read_csv("data/players.csv")


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

GOALKEEPERS = [
    "Goalkeeper"
]


def get_players(team, season):

    team_players = players[
        (players["Team"] == team) &
        (players["Season"] == season)
    ].copy()

    return team_players


def select_players(team, season):

    team_players = get_players(team, season)

    if team_players.empty:
        print(f"No players found for {team} {season}")
        return []

    def position_order(position):

        if position in ATTACKERS:
            return 0

        if position in MIDFIELDERS:
            return 1

        if position in DEFENDERS:
            return 2

        if position in GOALKEEPERS:
            return 3

        return 4

    team_players["PositionOrder"] = team_players[
        "Position"
    ].apply(position_order)

    team_players = team_players.sort_values(
        by=["PositionOrder", "Player"]
    ).reset_index(drop=True)

    print(f"\n{team} {season}")
    print("---------------------------")

    for index, player in enumerate(
        team_players.itertuples(),
        start=1
    ):
        print(
            f"{index}. {player.Player} "
            f"({player.Position})"
        )

    while True:

        selection = input(
            "\nEnter 11 player numbers separated by spaces: "
        )

        try:
            numbers = [
                int(number)
                for number in selection.split()
            ]
        except ValueError:
            print("Please enter numbers only.")
            continue

        if len(numbers) != 11:
            print("You must select exactly 11 players.")
            continue

        if len(set(numbers)) != 11:
            print("You cannot select the same player twice.")
            continue

        if any(
            number < 1 or number > len(team_players)
            for number in numbers
        ):
            print("One or more player numbers are invalid.")
            continue

        selected = team_players.iloc[
            [number - 1 for number in numbers]
        ]

        attackers = selected[
            selected["Position"].isin(ATTACKERS)
        ]

        midfielders = selected[
            selected["Position"].isin(MIDFIELDERS)
        ]

        defenders = selected[
            selected["Position"].isin(DEFENDERS)
        ]

        goalkeepers = selected[
            selected["Position"].isin(GOALKEEPERS)
        ]

        if len(goalkeepers) < 1:
            print("You must select at least 1 goalkeeper.")
            continue

        if len(defenders) < 3:
            print("You must select at least 3 defenders.")
            continue

        if len(midfielders) < 2:
            print("You must select at least 2 midfielders.")
            continue

        if len(attackers) > 4:
            print("You can select a maximum of 4 attackers.")
            continue

        print("\nSelected XI")
        print("---------------------------")

        for _, player in selected.iterrows():
            print(
                f"{player['Player']} "
                f"({player['Position']})"
            )

        return selected


if __name__ == "__main__":

    team = input("Team: ")
    season = input("Season: ")

    select_players(team, season)