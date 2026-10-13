# EPL Rewind

## Description

EPL Rewind is a historical English Premier League simulation application that lets users recreate hypothetical matchups between teams from different seasons and manage a custom team through an entire simulated Premier League season.

Built using Python, Flask, React, TypeScript, and machine learning, the project combines historical football data, player ratings, custom starting XIs, and probabilistic match simulation to explore alternative football outcomes.

## Features

- Historical Matchups — Simulate matches between Premier League teams from different seasons.
- Custom Starting XI — Select 11 players for each team.
- ML-Based Goal Prediction — Predict expected goals using trained Random Forest models.
- Match Simulation — Generate hypothetical scores using Poisson-based simulation.
- Goal Scorers — Display simulated goal scorers and goal minutes.
- Match Statistics — Display simulated shots, shots on target, corners, fouls, cards, and possession.
- Man of the Match — Calculate the match MVP using player-level scoring rules.
- League Mode — Build a custom team and compete through an entire historical Premier League season.
- Player Market — Browse historical players with calculated ratings and prices.
- Formation Selection — Choose formations and build a starting XI that matches the selected formation.
- Budget Management — Build a team within the selected difficulty budget.
- Full Season Simulation — Simulate a 20-team league across 38 matchdays and 380 fixtures.
- Matchday Results — View match scores and goal scorers throughout the simulated season.
- League Table — Track points, wins, draws, losses, goals scored, goals conceded, and goal difference.
- Golden Boot — Awarded to the player or players with the most simulated goals.
- Golden Glove — Awarded to the goalkeeper or goalkeepers with the most clean sheets.
- Season MVP — Awarded using accumulated player performance points.

## How It Works

### Historical Match Simulator

```text
Historical Team + Season
        |
        v
Select Starting XI
        |
        v
Historical Team Features
        |
        v
Random Forest Goal Prediction
        |
        v
Poisson Match Simulation
        |
        v
Scores + Goal Scorers
        |
        v
Match Statistics + MVP
```

### League Mode

```text
Historical Season + Difficulty
        |
        v
Choose Historical Club to Replace
        |
        v
Choose Formation
        |
        v
Build Custom Starting XI
        |
        v
Calculate Team Strength
        |
        v
Generate 380 Fixtures
        |
        v
Simulate Full Season
        |
        v
Match Results + League Table
        |
        v
Golden Boot + Golden Glove + Season MVP
```

## Tech Stack

- Python
- Flask
- Flask-CORS
- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- PapaParse
- Pandas
- NumPy
- Scikit-learn
- Random Forest Regression
- Joblib
- Poisson Distribution
- CSV Datasets
- Pytest

## Project Structure

```text
EPL TIME MACHINE/
|
├── api.py
├── league_simulation.py
├── predict_match.py
├── simulate_match.py
├── simulate_scorers.py
├── build_player_ratings.py
|
├── data/
│   ├── team_season_features.csv
│   └── pl_top_scorer_gk.csv
|
├── models/
│   ├── home_goals_model_v3.pkl
│   ├── away_goals_model_v3.pkl
│   └── model_features_v3.pkl
|
├── frontend/
│   ├── public/
│   │   ├── data/
│   │   │   ├── players.csv
│   │   │   ├── players_rated.csv
│   │   │   ├── team_season_features.csv
│   │   │   └── pl_top_scorer_gk.csv
│   │   └── EplVideo.mp4
│   |
│   └── src/
│       ├── App.tsx
│       ├── index.css
│       └── main.tsx
|
├── test_league_simulation.py
├── requirements.txt
└── README.md
```

## Machine Learning and Simulation

The Historical Match Simulator uses trained Random Forest regression models to predict home and away goal expectations from historical team-season statistics.

The predicted goals are used as inputs to a Poisson-based simulation to produce hypothetical match scores. Goal scorers are generated from the selected lineups, and player performance points are calculated from simulated match events.

League Mode extends the simulation across a full season. It uses historical team-season data to represent opposing clubs and calculates a team-strength profile from the user's custom starting XI.

Simulated fixtures update the league table, player goal totals, goalkeeper clean sheets, and end-of-season awards.

All predicted goals, scores, statistics, and awards represent simulated outcomes rather than actual historical results.

## Data Sources and Credits

### Datasets

- **Historical Premier League Match Data (2000–2025):** [Kaggle — English Premier League (EPL) Match Data](https://www.kaggle.com/datasets/marcohuiii/english-premier-league-epl-match-data-2000-2025?resource=download)
- **Historical Squads and Player Data:** [GitHub — ewenme/squads](https://github.com/ewenme/squads)
- **Historical Top Scorers and Starting Goalkeepers:** Generated using historical league statistics and stored in `pl_top_scorer_gk.csv`.
- **Player Ratings and Prices:** Generated by the project's player-rating builder using the available player dataset and market-value information.
- **Team-Season Features:** Processed historical match data used by the machine-learning goal-prediction models.

### Visual Assets

- **Videos and Images:** [Pexels](https://www.pexels.com/) and [Unsplash](https://unsplash.com/).

### Attribution

EPL Rewind uses historical football datasets and visual assets from external sources. All assets remain subject to their respective licences and usage terms. Individual asset credits should be provided where required.

Original data providers' licensing and attribution requirements should be followed.

## Deployment

The application uses a separate frontend and backend deployment:

- Frontend: Vercel
- Backend: Render

The frontend communicates with the Flask backend through its configured API URL.

## Future Improvements

- Improve player-rating and team-strength calibration.
- Refine historical player and goalkeeper selection.
- Expand tactical and player-performance modelling.
- Improve match statistics and season summaries.
- Complete History and About pages.
- Document all image, video, font, icon, and other asset sources.
- Improve the realism of historical simulations.


## Future Plans

- Interactive web interface
- Button-based player selection
- Historical team and season selection
- Interactive match simulation
- Visual match statistics
- Match result presentation
- Improved simulation realism
- More detailed player and team performance modelling

## Disclaimer

EPL Rewind is an independent, unofficial football simulation project created for educational and entertainment purposes. Simulated match results, expected goals, player ratings, statistics, and performances are hypothetical and do not represent official Premier League results.

Team names, player names, datasets, and visual assets may be subject to their respective owners' rights and licensing terms.


