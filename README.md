# EPL Rewind

## Description

EPL Rewind is a historical Premier League match simulation engine that allows users to recreate hypothetical matchups between teams from different seasons. Users can select custom starting XIs and simulate matches using machine-learning-based expected goals, position-based goal scoring, match statistics, and Man of the Match calculations.

## Features

- Historical Matchups — Simulate teams from different Premier League seasons.
- Custom Starting XI — Select exactly 11 players for each team.
- ML-Based xG — Predict expected goals using trained machine-learning models.
- Goal Scoring Simulation — Generate goal scorers based on player positions.
- Match Statistics — Generate shots, shots on target, corners, fouls, cards, and possession.
- Man of the Match — Calculate a simulated MOTM based on match performance.
- Repeatable Simulations — Run the same historical matchup multiple times to explore different outcomes.

## How It Works

```text
Historical Team + Season
        |
        v
Select Starting XI
        |
        v
Team/Season Features
        |
        v
ML Goal Prediction
        |
        v
Match Simulation
        |
        v
Goal Scorers + Statistics
        |
        v
xG + Man of the Match
```

Tech Stack
----------

* Python
* Pandas
* Scikit-learn
* Joblib
* Machine Learning
* CSV datasets
* Pickle (`.pkl`) trained models

## Project Structure

```text
EPL_Rewind/
|
├── data/
├── dataset/
|
├── build_players.py
├── team_features.py
├── train_model.py
├── train_model_v2.py
├── train_model_v3.py
|
├── predict_match.py
├── select_players.py
├── simulate_match.py
├── simulate_scorers.py
├── match_simulator.py
├── match_stats.py
├── motm.py
|
├── evaluate_models.py
├── evaluate_time_split.py
├── test_simulation.py
|
└── README.md
```
## Web Application

EPL Rewind is being developed as an interactive web application where users will be able to:

- Select historical Premier League teams and seasons
- Build custom starting XIs
- Simulate hypothetical matches
- View predicted xG
- View simulated results and goal scorers
- View match statistics
- View the simulated Man of the Match

The web interface is currently under development.

## Current Version

The current version contains the core Python-based simulation engine, including:

- Historical team and season data
- Machine-learning-based goal prediction
- Starting XI selection
- Goal scorer simulation
- Match statistics generation
- Expected Goals (xG)
- Man of the Match calculation

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

EPL Rewind is a hypothetical simulation project. Simulated results, expected goals, statistics, and player performances do not represent actual historical match results.


