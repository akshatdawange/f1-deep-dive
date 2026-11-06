# 🏎️ F1: A Deep Dive for New Fans

An interactive, browser-based data visualisation that introduces newcomers to Formula 1. It explains how the sport works, maps the 2024 race calendar on a rotating globe, and lets you explore driver and constructor performance from 2000 to 2024.

> Built as a university assessment project (Student ID: 34611266).

## ✨ Features

- **Intro to F1**: a plain-language overview of the championship, Grands Prix, and the 2024 season (24 scheduled, 23 held).
- **Interactive 3D globe**: a rotating D3 orthographic globe showing every 2024 race venue, colour-coded by region (Oceania, Asia, Europe, Middle East, North America, South America). Hover a point to see the circuit.
- **Constructors section**: the 10 teams on the 2024 grid, plus the incoming 2026 entrants (Audi and Cadillac). It explains how constructor points are scored; McLaren won 2024 with 666 points, ahead of Ferrari on 652.
- **Season explorer**: choose a year (2000–2024) and a team to compare that team's drivers by championship points, using team colours.
- **Teammate network**: click a driver bar to open a draggable force-directed graph of that driver's teammates across seasons, with tooltips and a modal view.

## 🗂️ Project Structure

| File | Purpose |
|---|---|
| `index.html` | Page structure and content |
| `style.css` | Styling (F1 red theme, Racing Sans One and Inter fonts) |
| `main.js` | All D3 logic: globe, dropdowns, bar and line charts, teammate network |
| `data.py` | Python script that pulls driver, constructor and points data from the Ergast API (2000–2024) |
| `final.csv` | Driver, team, year, points and team colour |
| `unique.csv` | Unique driver–team–year records, used for the teammate network |
| `circuits.csv` | Circuit names, coordinates, country and region, used for the globe |

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Visualisation:** [D3.js v7](https://d3js.org/), [TopoJSON](https://github.com/topojson/topojson)
- **Parsing:** [PapaParse](https://www.papaparse.com/)
- **Data collection:** Python 3, `requests`, `pandas`
- **Data source:** [Ergast Motor Racing API](http://ergast.com/mrd/)

## 📊 How It Works

1. `data.py` fetches race results and driver standings for each season from 2000 to 2024, then merges them into one table.
2. `main.js` loads `final.csv`, `unique.csv` and the circuit data, then fills the year and team dropdowns.
3. Selecting a year and team redraws the driver comparison bars and the points line chart.
4. Clicking a driver opens the teammate network.

## ⚠️ Notes & Limitations

- The analysis focuses on the **2024 season**, the latest completed season when the project was written. 2025 was still in progress.
- The Ergast API has been deprecated, so `data.py` may need a new endpoint such as Jolpica-F1.
- Team logos and the F1 logo are loaded from external URLs and belong to their respective owners. This project is non-commercial and educational.
