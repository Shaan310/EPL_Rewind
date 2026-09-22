import pandas as pd

df = pd.read_csv("data/epl_final.csv")

print("Dataset Shape:")
print(df.shape)

print("\nColumns:")
for column in df.columns:
    print(column)

print("\nData Types:")
print(df.dtypes)

print("\nMissing Values:")
print(df.isnull().sum())

print("\nNumber of Seasons:")
print(df["Season"].nunique())

print("\nSeasons:")
print(df["Season"].unique())

print("\nNumber of Teams:")
teams = set(df["HomeTeam"]) | set(df["AwayTeam"])
print(len(teams))

print("\nTeams:")
print(sorted(teams))

print("\nFull-Time Result Distribution:")
print(df["FullTimeResult"].value_counts())

print("\nDuplicate Rows:")
print(df.duplicated().sum())

print("\nFirst 5 Rows:")
print(df.head())

print("\nLast 5 Rows:")
print(df.tail())