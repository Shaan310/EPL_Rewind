from flask import Flask, request, jsonify
from flask_cors import CORS

from simulate_match import simulate_match


app = Flask(__name__)
CORS(app)


@app.route("/api/simulate", methods=["POST"])
def simulate():

    data = request.get_json()

    home_team = data.get("home_team")
    home_season = data.get("home_season")

    away_team = data.get("away_team")
    away_season = data.get("away_season")

    home_xi = data.get("home_xi")
    away_xi = data.get("away_xi")

    if not all([
        home_team,
        home_season,
        away_team,
        away_season,
        home_xi,
        away_xi
    ]):
        return jsonify({
            "error": "Missing match information"
        }), 400

    try:

        result = simulate_match(
            home_team,
            home_season,
            away_team,
            away_season,
            home_xi,
            away_xi
        )

        return jsonify(result)

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


@app.route("/api/health", methods=["GET"])
def health():

    return jsonify({
        "status": "ok"
    })


# ---------------------------------------------------------------------------
# LEAGUE MODE ENDPOINTS
# ---------------------------------------------------------------------------

@app.route("/api/league/teams", methods=["GET"])
def league_teams():
    season = request.args.get("season")
    if not season:
        return jsonify({"error": "Missing season query parameter"}), 400

    try:
        from league_simulation import get_season_teams
        teams = get_season_teams(season)
        return jsonify({
            "season": season,
            "teams": teams
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/league/init", methods=["POST"])
def league_init():
    data = request.get_json() or {}
    season = data.get("season")
    replaced_club = data.get("replaced_club")
    custom_club_name = data.get("custom_club_name") or "Custom XI"
    custom_xi = data.get("custom_xi") or []

    if not season or not replaced_club:
        return jsonify({"error": "Missing season or replaced_club"}), 400

    try:
        from league_simulation import get_season_teams, generate_double_round_robin_schedule, compute_standings
        actual_teams = get_season_teams(season)
        if replaced_club not in actual_teams:
            return jsonify({
                "error": f"Replaced club '{replaced_club}' is not in season {season}"
            }), 400

        # Replace selected club with custom club in the league roster
        league_teams = [
            custom_club_name if t == replaced_club else t
            for t in actual_teams
        ]

        schedule = generate_double_round_robin_schedule(league_teams)
        for s in schedule:
            s["matches"] = s.get("fixtures", [])
        initial_standings = compute_standings(league_teams, [])

        return jsonify({
            "success": True,
            "season": season,
            "replaced_club": replaced_club,
            "custom_club_name": custom_club_name,
            "teams": league_teams,
            "total_matchdays": 38,
            "total_matches": 380,
            "schedule": schedule,
            "initial_standings": initial_standings
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/league/simulate-matchday", methods=["POST"])
def league_simulate_matchday():
    data = request.get_json() or {}
    season = data.get("season")
    replaced_club = data.get("replaced_club")
    custom_club_name = data.get("custom_club_name") or "Custom XI"
    custom_xi = data.get("custom_xi") or []
    fixtures = data.get("matches") or data.get("fixtures") or []
    matchday_num = data.get("matchday")
    current_standings = data.get("current_standings") or []
    player_stats_in = data.get("player_stats") or {}

    if not season or not replaced_club or not fixtures:
        return jsonify({"error": "Missing matchday simulation parameters"}), 400

    try:
        from league_simulation import simulate_matchday
        raw_results = simulate_matchday(
            season=season,
            replaced_club=replaced_club,
            custom_club_name=custom_club_name,
            custom_xi=custom_xi,
            fixtures=fixtures,
            matchday_num=matchday_num
        )

        formatted_results = []
        for r in raw_results:
            motm_player = r.get("man_of_match")
            motm_team = r["home_team"] if motm_player in r.get("home_scorers", {}) or motm_player == r.get("home_goalkeeper") else r["away_team"]
            motm_rating = round(min(10.0, max(6.5, 6.0 + float(r.get("mvp_score", 0)) * 0.12)), 1)

            formatted_results.append({
                "home_team": r["home_team"],
                "away_team": r["away_team"],
                "home_score": r["home_goals"],
                "away_score": r["away_goals"],
                "home_xg": r["home_xg"],
                "away_xg": r["away_xg"],
                "home_scorers": r.get("home_minutes", []),
                "away_scorers": r.get("away_minutes", []),
                "motm": {
                    "player": motm_player,
                    "team": motm_team,
                    "rating": motm_rating
                },
                "clean_sheet_home": r.get("home_clean_sheet", False),
                "clean_sheet_away": r.get("away_clean_sheet", False)
            })

        # Incremental standings update
        standings_dict = {
            t["team"]: dict(t) for t in current_standings
        }
        for r in raw_results:
            h = r["home_team"]
            a = r["away_team"]
            hg = r["home_goals"]
            ag = r["away_goals"]
            if h not in standings_dict:
                standings_dict[h] = {"team": h, "played": 0, "won": 0, "drawn": 0, "lost": 0, "gf": 0, "ga": 0, "gd": 0, "points": 0}
            if a not in standings_dict:
                standings_dict[a] = {"team": a, "played": 0, "won": 0, "drawn": 0, "lost": 0, "gf": 0, "ga": 0, "gd": 0, "points": 0}

            standings_dict[h]["played"] += 1
            standings_dict[a]["played"] += 1
            standings_dict[h]["gf"] += hg
            standings_dict[h]["ga"] += ag
            standings_dict[a]["gf"] += ag
            standings_dict[a]["ga"] += hg

            if hg > ag:
                standings_dict[h]["won"] += 1
                standings_dict[h]["points"] += 3
                standings_dict[a]["lost"] += 1
            elif ag > hg:
                standings_dict[a]["won"] += 1
                standings_dict[a]["points"] += 3
                standings_dict[h]["lost"] += 1
            else:
                standings_dict[h]["drawn"] += 1
                standings_dict[h]["points"] += 1
                standings_dict[a]["drawn"] += 1
                standings_dict[a]["points"] += 1

        for row in standings_dict.values():
            row["gd"] = row["gf"] - row["ga"]

        sorted_standings = sorted(
            standings_dict.values(),
            key=lambda r: (r["points"], r["gd"], r["gf"], -ord(r["team"][0])),
            reverse=True
        )
        for idx, row in enumerate(sorted_standings, start=1):
            row["rank"] = idx

        # Player stats accumulation
        goals_map = dict(player_stats_in.get("goals") or {})
        clean_sheets_map = dict(player_stats_in.get("clean_sheets") or {})
        mvp_points_map = dict(player_stats_in.get("mvp_points") or {})
        player_meta_map = dict(player_stats_in.get("player_meta") or {})

        for r in raw_results:
            for p, g in r.get("home_scorers", {}).items():
                key = f"{p}||{r['home_team']}"
                goals_map[key] = goals_map.get(key, 0) + g
                if key not in player_meta_map:
                    player_meta_map[key] = {"player": p, "team": r["home_team"], "position_group": "FWD"}

            for p, g in r.get("away_scorers", {}).items():
                key = f"{p}||{r['away_team']}"
                goals_map[key] = goals_map.get(key, 0) + g
                if key not in player_meta_map:
                    player_meta_map[key] = {"player": p, "team": r["away_team"], "position_group": "FWD"}

            if r.get("home_clean_sheet") and r.get("home_goalkeeper"):
                gk = r["home_goalkeeper"]
                key = f"{gk}||{r['home_team']}"
                clean_sheets_map[key] = clean_sheets_map.get(key, 0) + 1
                if key not in player_meta_map:
                    player_meta_map[key] = {"player": gk, "team": r["home_team"], "position_group": "GK"}

            if r.get("away_clean_sheet") and r.get("away_goalkeeper"):
                gk = r["away_goalkeeper"]
                key = f"{gk}||{r['away_team']}"
                clean_sheets_map[key] = clean_sheets_map.get(key, 0) + 1
                if key not in player_meta_map:
                    player_meta_map[key] = {"player": gk, "team": r["away_team"], "position_group": "GK"}

            for stat in r.get("player_stats", []):
                p = stat["player"]
                tm = stat["team"]
                pts = stat.get("mvp_points", 0)
                grp = "GK" if stat.get("is_gk") else "MID"
                key = f"{p}||{tm}"
                mvp_points_map[key] = round(mvp_points_map.get(key, 0.0) + float(pts), 1)
                if key not in player_meta_map:
                    player_meta_map[key] = {"player": p, "team": tm, "position_group": grp}

        def get_top_awards(metric_map):
            if not metric_map:
                return []
            max_val = max(metric_map.values())
            if max_val <= 0:
                return []
            leaders = []
            for k, val in metric_map.items():
                if val == max_val:
                    meta = player_meta_map.get(k, {})
                    leaders.append({
                        "player": meta.get("player", k.split("||")[0]),
                        "team": meta.get("team", k.split("||")[1] if "||" in k else ""),
                        "val": val
                    })
            return leaders

        top_scorers = [
            {"player": item["player"], "team": item["team"], "goals": int(item["val"])}
            for item in get_top_awards(goals_map)
        ]
        top_gloves = [
            {"player": item["player"], "team": item["team"], "clean_sheets": int(item["val"])}
            for item in get_top_awards(clean_sheets_map)
        ]
        top_mvps = [
            {"player": item["player"], "team": item["team"], "mvp_points": round(item["val"], 1)}
            for item in get_top_awards(mvp_points_map)
        ]

        updated_player_stats = {
            "goals": goals_map,
            "clean_sheets": clean_sheets_map,
            "mvp_points": mvp_points_map,
            "player_meta": player_meta_map
        }

        awards = {
            "golden_boot": top_scorers,
            "golden_glove": top_gloves,
            "season_mvp": top_mvps
        }

        return jsonify({
            "success": True,
            "matchday": matchday_num,
            "results": formatted_results,
            "standings": sorted_standings,
            "player_stats": updated_player_stats,
            "awards": awards
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )