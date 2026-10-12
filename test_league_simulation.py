"""
test_league_simulation.py
Focused backend verification for EPL REWIND League Mode.
"""
import league_simulation as ls

def run_tests():
    print("1. Testing season teams lookup...")
    teams = ls.get_season_teams("2003/04")
    assert len(teams) == 20, f"Expected 20 teams, got {len(teams)}"
    print(f"  OK: 20 teams found for 2003/04: {teams[:4]}...")

    print("2. Testing double round-robin schedule generator...")
    custom_team = "Custom XI"
    replaced_club = "Leicester"
    custom_teams = [custom_team if t == replaced_club else t for t in teams]
    schedule = ls.generate_double_round_robin_schedule(custom_teams)
    assert len(schedule) == 38, f"Expected 38 matchdays, got {len(schedule)}"

    all_fixtures = [f for m in schedule for f in m["fixtures"]]
    assert len(all_fixtures) == 380, f"Expected 380 fixtures, got {len(all_fixtures)}"

    # Verify home/away balance and pairings
    home_counts = {t: 0 for t in custom_teams}
    away_counts = {t: 0 for t in custom_teams}
    pairings = set()

    for m in schedule:
        assert len(m["fixtures"]) == 10, f"Expected 10 fixtures in matchday {m['matchday']}"
        teams_in_day = set()
        for f in m["fixtures"]:
            h = f["home_team"]
            a = f["away_team"]
            assert h != a
            assert h not in teams_in_day
            assert a not in teams_in_day
            teams_in_day.add(h)
            teams_in_day.add(a)
            home_counts[h] += 1
            away_counts[a] += 1
            pairings.add((h, a))
        assert len(teams_in_day) == 20

    assert all(c == 19 for c in home_counts.values()), "Not all teams have 19 home games"
    assert all(c == 19 for c in away_counts.values()), "Not all teams have 19 away games"
    assert len(pairings) == 380, f"Expected 380 unique pairings, got {len(pairings)}"
    print("  OK: 38 matchdays, 380 fixtures, 19 home and 19 away for every team.")

    print("3. Testing matchday simulation with custom squad...")
    custom_xi = [
        {"Player": "Custom GK", "Position": "Goalkeeper", "position_group": "GK", "Rating": 85},
        {"Player": "Custom CB1", "Position": "Centre-Back", "position_group": "DEF", "Rating": 84},
        {"Player": "Custom CB2", "Position": "Centre-Back", "position_group": "DEF", "Rating": 83},
        {"Player": "Custom LB", "Position": "Left-Back", "position_group": "DEF", "Rating": 82},
        {"Player": "Custom RB", "Position": "Right-Back", "position_group": "DEF", "Rating": 82},
        {"Player": "Custom CM1", "Position": "Central Midfield", "position_group": "MID", "Rating": 86},
        {"Player": "Custom CM2", "Position": "Central Midfield", "position_group": "MID", "Rating": 85},
        {"Player": "Custom LM", "Position": "Left Midfield", "position_group": "MID", "Rating": 84},
        {"Player": "Custom RM", "Position": "Right Midfield", "position_group": "MID", "Rating": 84},
        {"Player": "Custom ST1", "Position": "Centre-Forward", "position_group": "FWD", "Rating": 88},
        {"Player": "Custom ST2", "Position": "Centre-Forward", "position_group": "FWD", "Rating": 87},
    ]

    m1_results = ls.simulate_matchday(
        season="2003/04",
        replaced_club=replaced_club,
        custom_club_name=custom_team,
        custom_xi=custom_xi,
        fixtures=schedule[0]["fixtures"],
        matchday_num=1,
    )
    assert len(m1_results) == 10, f"Expected 10 match results, got {len(m1_results)}"
    for r in m1_results:
        assert "home_goals" in r and "away_goals" in r
        assert "home_scorers" in r and "away_scorers" in r
        assert "man_of_match" in r and "mvp_score" in r
        assert "home_clean_sheet" in r and "away_clean_sheet" in r
        assert "home_goalkeeper" in r and "away_goalkeeper" in r
        print(f"  {r['home_team']} {r['home_goals']} - {r['away_goals']} {r['away_team']} (MOTM: {r['man_of_match']})")
    print("  OK: Matchday 1 simulated cleanly.")

    print("4. Testing standings calculation...")
    standings = ls.compute_standings(custom_teams, m1_results)
    assert len(standings) == 20
    assert standings[0]["rank"] == 1
    total_points = sum(r["points"] for r in standings)
    print(f"  OK: Standings updated. Top team: {standings[0]['team']} ({standings[0]['points']} pts). Total points: {total_points}")

    print("5. Testing awards calculation...")
    awards = ls.compute_season_awards(m1_results)
    assert "golden_boot" in awards
    assert "golden_glove" in awards
    assert "season_mvp" in awards
    print(f"  Golden Boot leader: {awards['golden_boot']['winners']}")
    print(f"  Golden Glove leader: {awards['golden_glove']['winners']}")
    print(f"  Season MVP leader: {awards['season_mvp']['winners']}")

    print("\n6. Testing team-strength calibration (Strong XI vs Weak XI under comparable conditions)...")
    season = "2020/21"
    replaced = "West Brom"
    season_teams = ls.get_season_teams(season)
    full_schedule = ls.generate_double_round_robin_schedule(
        [custom_team if t == replaced else t for t in season_teams]
    )

    strong_xi = [
        {"Player": "GK Prime", "Position": "Goalkeeper", "position_group": "GK", "Rating": 94},
        {"Player": "CB Prime 1", "Position": "Centre-Back", "position_group": "DEF", "Rating": 97},
        {"Player": "CB Prime 2", "Position": "Centre-Back", "position_group": "DEF", "Rating": 97},
        {"Player": "LB Prime", "Position": "Left-Back", "position_group": "DEF", "Rating": 97},
        {"Player": "RB Prime", "Position": "Right-Back", "position_group": "DEF", "Rating": 97},
        {"Player": "CM Prime 1", "Position": "Central Midfield", "position_group": "MID", "Rating": 83},
        {"Player": "CM Prime 2", "Position": "Central Midfield", "position_group": "MID", "Rating": 83},
        {"Player": "LM Prime", "Position": "Left Midfield", "position_group": "MID", "Rating": 83},
        {"Player": "RM Prime", "Position": "Right Midfield", "position_group": "MID", "Rating": 83},
        {"Player": "ST Prime 1", "Position": "Centre-Forward", "position_group": "FWD", "Rating": 95},
        {"Player": "ST Prime 2", "Position": "Centre-Forward", "position_group": "FWD", "Rating": 95},
    ]

    weak_xi = [
        {"Player": "GK Weak", "Position": "Goalkeeper", "position_group": "GK", "Rating": 74},
        {"Player": "CB Weak 1", "Position": "Centre-Back", "position_group": "DEF", "Rating": 74},
        {"Player": "CB Weak 2", "Position": "Centre-Back", "position_group": "DEF", "Rating": 74},
        {"Player": "LB Weak", "Position": "Left-Back", "position_group": "DEF", "Rating": 74},
        {"Player": "RB Weak", "Position": "Right-Back", "position_group": "DEF", "Rating": 74},
        {"Player": "CM Weak 1", "Position": "Central Midfield", "position_group": "MID", "Rating": 74},
        {"Player": "CM Weak 2", "Position": "Central Midfield", "position_group": "MID", "Rating": 74},
        {"Player": "LM Weak", "Position": "Left Midfield", "position_group": "MID", "Rating": 74},
        {"Player": "RM Weak", "Position": "Right Midfield", "position_group": "MID", "Rating": 74},
        {"Player": "ST Weak 1", "Position": "Centre-Forward", "position_group": "FWD", "Rating": 74},
        {"Player": "ST Weak 2", "Position": "Centre-Forward", "position_group": "FWD", "Rating": 74},
    ]

    strong_pts_list, strong_gf_list, strong_ga_list, strong_rank_list = [], [], [], []
    weak_pts_list, weak_gf_list, weak_ga_list, weak_rank_list = [], [], [], []

    num_sim_seasons = 12
    for _ in range(num_sim_seasons):
        # Simulate full season for strong XI
        season_results_strong = []
        for md in full_schedule:
            md_res = ls.simulate_matchday(
                season=season,
                replaced_club=replaced,
                custom_club_name=custom_team,
                custom_xi=strong_xi,
                fixtures=md["fixtures"],
                matchday_num=md["matchday"],
            )
            season_results_strong.extend(md_res)
        table_strong = ls.compute_standings(
            [custom_team if t == replaced else t for t in season_teams],
            season_results_strong
        )
        custom_row_strong = next(r for r in table_strong if r["team"] == custom_team)
        strong_pts_list.append(custom_row_strong["points"])
        strong_gf_list.append(custom_row_strong["gf"])
        strong_ga_list.append(custom_row_strong["ga"])
        strong_rank_list.append(custom_row_strong["rank"])

        # Simulate full season for weak XI under identical conditions
        season_results_weak = []
        for md in full_schedule:
            md_res = ls.simulate_matchday(
                season=season,
                replaced_club=replaced,
                custom_club_name=custom_team,
                custom_xi=weak_xi,
                fixtures=md["fixtures"],
                matchday_num=md["matchday"],
            )
            season_results_weak.extend(md_res)
        table_weak = ls.compute_standings(
            [custom_team if t == replaced else t for t in season_teams],
            season_results_weak
        )
        custom_row_weak = next(r for r in table_weak if r["team"] == custom_team)
        weak_pts_list.append(custom_row_weak["points"])
        weak_gf_list.append(custom_row_weak["gf"])
        weak_ga_list.append(custom_row_weak["ga"])
        weak_rank_list.append(custom_row_weak["rank"])

    avg_strong_pts = sum(strong_pts_list) / len(strong_pts_list)
    avg_weak_pts = sum(weak_pts_list) / len(weak_pts_list)
    avg_strong_gf = sum(strong_gf_list) / len(strong_gf_list)
    avg_weak_gf = sum(weak_gf_list) / len(weak_gf_list)
    avg_strong_ga = sum(strong_ga_list) / len(strong_ga_list)
    avg_weak_ga = sum(weak_ga_list) / len(weak_ga_list)
    avg_strong_rank = sum(strong_rank_list) / len(strong_rank_list)
    avg_weak_rank = sum(weak_rank_list) / len(weak_rank_list)

    print(f"  Strong XI (90 OVR): Pts={avg_strong_pts:.1f}, GF={avg_strong_gf:.1f}, GA={avg_strong_ga:.1f}, Avg Finish={avg_strong_rank:.1f}th")
    print(f"  Weak XI   (74 OVR): Pts={avg_weak_pts:.1f}, GF={avg_weak_gf:.1f}, GA={avg_weak_ga:.1f}, Avg Finish={avg_weak_rank:.1f}th")

    # Assertions demonstrating team-strength calibration
    assert avg_strong_pts >= avg_weak_pts + 35.0, (
        f"Expected Strong XI to earn at least 35 more points on average than Weak XI, got {avg_strong_pts:.1f} vs {avg_weak_pts:.1f}"
    )
    assert avg_strong_gf > avg_weak_gf + 25.0, (
        f"Expected Strong XI to score significantly more goals, got {avg_strong_gf:.1f} vs {avg_weak_gf:.1f}"
    )
    assert avg_strong_ga < avg_weak_ga - 35.0, (
        f"Expected Strong XI to concede significantly fewer goals, got {avg_strong_ga:.1f} vs {avg_weak_ga:.1f}"
    )
    assert avg_strong_rank < avg_weak_rank, (
        f"Expected Strong XI to rank higher (smaller rank number), got {avg_strong_rank:.1f} vs {avg_weak_rank:.1f}"
    )
    assert avg_strong_pts >= 65.0, (
        f"Expected Strong 90 OVR XI replacing West Brom to average at least 65 points, got {avg_strong_pts:.1f}"
    )

    print("  OK: Strong XI decisively outperforms Weak XI on points, attack (GF), defence (GA), and table finish.")

    print("\nALL BACKEND UNIT TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()

