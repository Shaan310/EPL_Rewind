import random


def generate_match_stats(
    home_xg,
    away_xg,
    home_goals,
    away_goals
):

    home_shots = max(
        3,
        int(random.gauss(10 + home_xg * 3, 3))
    )

    away_shots = max(
        3,
        int(random.gauss(10 + away_xg * 3, 3))
    )

    home_shots_on_target = min(
        home_shots,
        max(
            1,
            int(random.gauss(
                home_shots * 0.4,
                1.5
            ))
        )
    )

    away_shots_on_target = min(
        away_shots,
        max(
            1,
            int(random.gauss(
                away_shots * 0.4,
                1.5
            ))
        )
    )

    home_corners = max(
        1,
        int(random.gauss(
            4 + home_xg,
            1.5
        ))
    )

    away_corners = max(
        1,
        int(random.gauss(
            4 + away_xg,
            1.5
        ))
    )

    home_fouls = max(
        5,
        int(random.gauss(11, 3))
    )

    away_fouls = max(
        5,
        int(random.gauss(11, 3))
    )

    home_yellows = max(
        0,
        int(random.gauss(2, 1))
    )

    away_yellows = max(
        0,
        int(random.gauss(2, 1))
    )

    home_reds = 1 if random.random() < 0.04 else 0
    away_reds = 1 if random.random() < 0.04 else 0

    home_possession = int(
        random.gauss(
            50 + (home_xg - away_xg) * 5,
            5
        )
    )

    home_possession = max(
        30,
        min(70, home_possession)
    )

    away_possession = 100 - home_possession

    return {
        "home_shots": home_shots,
        "away_shots": away_shots,

        "home_shots_on_target": home_shots_on_target,
        "away_shots_on_target": away_shots_on_target,

        "home_corners": home_corners,
        "away_corners": away_corners,

        "home_fouls": home_fouls,
        "away_fouls": away_fouls,

        "home_yellows": home_yellows,
        "away_yellows": away_yellows,

        "home_reds": home_reds,
        "away_reds": away_reds,

        "home_possession": home_possession,
        "away_possession": away_possession
    }

if __name__ == "__main__":

    stats = generate_match_stats(
        home_xg=2.60,
        away_xg=0.86,
        home_goals=2,
        away_goals=1
    )

    print("\nMATCH STATISTICS")

    for key, value in stats.items():
            print(f"{key}: {value}")