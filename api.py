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


if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )