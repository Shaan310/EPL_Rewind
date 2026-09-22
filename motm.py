import random


def calculate_motm(
    home_players,
    away_players,
    home_scorers,
    away_scorers,
    home_goals,
    away_goals
):

    performances = []

    if home_goals > away_goals:
        winning_team = "Home"
    elif away_goals > home_goals:
        winning_team = "Away"
    else:
        winning_team = None

    for _, player in home_players.iterrows():

        goals = home_scorers.get(
            player["Player"],
            0
        )

        score = goals * 10

        if winning_team == "Home":
            score += 5

        if player["Position"] == "Goalkeeper":
            if away_goals == 0:
                score += 8

        if player["Position"] in [
            "Centre-Back",
            "Left-Back",
            "Right-Back",
            "Defender"
        ]:
            if away_goals == 0:
                score += 6

        score += random.randint(0, 3)

        performances.append({
            "Player": player["Player"],
            "Team": "Home",
            "Score": score
        })

    for _, player in away_players.iterrows():

        goals = away_scorers.get(
            player["Player"],
            0
        )

        score = goals * 10

        if winning_team == "Away":
            score += 5

        if player["Position"] == "Goalkeeper":
            if home_goals == 0:
                score += 8

        if player["Position"] in [
            "Centre-Back",
            "Left-Back",
            "Right-Back",
            "Defender"
        ]:
            if home_goals == 0:
                score += 6

        score += random.randint(0, 3)

        performances.append({
            "Player": player["Player"],
            "Team": "Away",
            "Score": score
        })

    motm = max(
        performances,
        key=lambda x: x["Score"]
    )

    return motm["Player"], motm["Team"]