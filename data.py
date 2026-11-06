import requests
import pandas as pd

years = list(range(2000, 2025))  # or 2000 to 2024
all_records = []

for year in years:
    print(f"Fetching race data for {year}...")
    url = f"http://ergast.com/api/f1/{year}/results.json?limit=1000"
    response = requests.get(url)
    
    if response.status_code == 200:
        races = response.json()['MRData']['RaceTable']['Races']
        season_records = []

        for race in races:
            for result in race['Results']:
                driver = result['Driver']
                constructor = result['Constructor']
                
                record = {
                    'driverId': driver['driverId'],
                    'driverName': f"{driver['givenName']} {driver['familyName']}",
                    'constructor': constructor['name'],
                    'year': year
                }
                season_records.append(record)

        df_season = pd.DataFrame(season_records).drop_duplicates(subset=['driverId', 'constructor', 'year'])

        # 🔽 Get driver standings for the year (points)
        standings_url = f"http://ergast.com/api/f1/{year}/driverStandings.json"
        standings_response = requests.get(standings_url)

        if standings_response.status_code == 200:
            standings = standings_response.json()['MRData']['StandingsTable']['StandingsLists'][0]['DriverStandings']
            points_data = [
                {'driverId': d['Driver']['driverId'], 'points': float(d['points'])}
                for d in standings
            ]
            df_points = pd.DataFrame(points_data)

            # 🧩 Merge driver points with season data
            df_merged = pd.merge(df_season, df_points, on='driverId', how='left')
            all_records.append(df_merged)
        else:
            print(f"Could not get standings for {year}")
    else:
        print(f"Failed to fetch race results for {year}")

# Combine all years
final_df = pd.concat(all_records, ignore_index=True)

final_df.to_csv("final_new.csv")

# Preview
print(final_df.head())