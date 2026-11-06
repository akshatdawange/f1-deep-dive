// Declaration of elements

// The interactive rotating globe
const width = 600, height = 500;
const svg = d3.select("#globe");
const projection = d3.geoOrthographic()
  .scale(200)
  .translate([width / 2, height / 2])
  .clipAngle(90);
const path = d3.geoPath(projection);
let rotating = true;

// Tooltips formatting for the driver network
const tooltip = d3.select("body")
  .append("div")
  .attr("id", "network-tooltip")
  .style("position", "fixed")
  .style("z-index", "9999")
  .style("background", "#333")
  .style("color", "#fff")
  .style("padding", "6px 10px")
  .style("border-radius", "4px")
  .style("font-size", "14px")
  .style("pointer-events", "none")
  .style("opacity", 0);

// Tooltips for the interactive globe
const globeTooltip = d3.select("body")
  .append("div")
  .attr("id", "globe-tooltip")
  .style("position", "fixed")
  .style("z-index", "9999")
  .style("background", "#111")
  .style("color", "#fff")
  .style("padding", "6px 10px")
  .style("border-radius", "4px")
  .style("font-size", "14px")
  .style("pointer-events", "none")
  .style("opacity", 0);

// Formatting the globe
svg.append("path")
  .datum({ type: "Sphere" })
  .attr("fill", "#091867")
  .attr("stroke", "#ccc")
  .attr("d", path);

// Formatting the gridlines
svg.append("path")
  .datum(d3.geoGraticule10())
  .attr("d", path)
  .attr("fill", "none")
  .attr("stroke", "none");

const driverColorMap = {};      // Color mapping for individual drivers
const teamColorMap = {};        // Color mapping for individual team

const fallbackColors = d3.schemeTableau10;      // Built in color palette scheme set by D3

// Function to map the colors to team. If the color is not present in the given list, it takes from the palette
function someFallbackColor(team) {
  if (!teamColorMap[team]) {
    const keys = Object.keys(teamColorMap);
    teamColorMap[team] = fallbackColors[keys.length % fallbackColors.length];
  }
  return teamColorMap[team];
}

// Interactive elements and data parsing

// Initializing the year dropdown to null, remains the same unless the user changes the value
let selectedYear = null;

// Data structure to store ther data from the CSV file after parsing
let data = [];

// Storing the values of year and team based on the user selection
const yearSelect = document.getElementById("yearSelect");
const teamSelect = document.getElementById("teamSelect");

// Loading the data file using the 
d3.csv("final.csv", d => {
  return {
    ...d,
    year: parseInt(d.year),
    points: parseFloat(d.points),
    color: d.color?.trim() || "#38bdf8"
  };
}).then(loadedData => {
  data = loadedData;

  // Create color maps
  data.forEach(d => {
    const driverKey = `${d.driverName}::${d.year}`;
    const teamKey = `${d.constructor}::${d.year}`;
    driverColorMap[driverKey] = d.color;
    teamColorMap[teamKey] = d.color;
  });

  // Creating the year dropdown
  const years = [...new Set(data.map(d => d.year).filter(y => !isNaN(y)))].sort();
  years.forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  });

  // Set defaults
  const defaultYear = years[0];
  selectedYear = defaultYear;
  yearSelect.value = defaultYear;

  const defaultTeams = [...new Set(data.filter(d => d.year === defaultYear).map(d => d.constructor))].sort();
  const defaultTeam = defaultTeams[0];
  teamSelect.innerHTML = "";
  defaultTeams.forEach(team => {
    const option = document.createElement("option");
    option.value = team;
    option.textContent = team;
    teamSelect.appendChild(option);
  });
  teamSelect.value = defaultTeam;

  // Creating the plots based on the data
  drawHorizontalLineChart(data, selectedYear, defaultTeam, true);
  updateDriverBar(data, selectedYear, defaultTeam);
});

// Global variable to store the parsed data from the unique.csv file
let teammateData = [];

// Loading the unique.csv file
d3.csv("unique.csv").then(data => {
  teammateData = data;

  // Interactivity in the bars
  document.getElementById("left-bar").addEventListener("click", () => {
    const name = document.getElementById("left-driver-name").textContent;
    showNetwork(name);
  });
  document.getElementById("right-bar").addEventListener("click", () => {
    const name = document.getElementById("right-driver-name").textContent;
    showNetwork(name);
  });
});

// Event Handlers

// Update information based on the year selection
yearSelect.addEventListener("change", function () {
  selectedYear = parseInt(this.value);

  // Filter data based on the team that is selected
  const teams = [...new Set(data.filter(d => d.year === selectedYear).map(d => d.constructor))].sort();

  // Options for the team selection dropdown
  teamSelect.innerHTML = "";
  teams.forEach(team => {
    const option = document.createElement("option");
    option.value = team;
    option.textContent = team;
    teamSelect.appendChild(option);
  });

  // Setting the first team as the default selected team for that year so the chart is not empty
  const firstTeam = teams[0];
  teamSelect.value = firstTeam;

  // Rendering based on selections
  drawHorizontalLineChart(data, selectedYear, firstTeam, true);
  updateDriverBar(data, selectedYear, firstTeam);
});

// Plotting after the team is selected
teamSelect.addEventListener("change", function () {
  const selectedTeam = this.value;
  if (!selectedYear || !selectedTeam) return;

  updateDriverBar(data, selectedYear, selectedTeam);
  drawHorizontalLineChart(data, selectedYear, selectedTeam, false);
});


// Functions

// Function for the Drivers Network
function showNetwork(driverName) {

  // Setting up and initializing the driver network
  const svg = d3.select("#teammate-network");
  svg.selectAll("*").remove();
  svg
  .attr("viewBox", "0 0 800 600")
  .attr("preserveAspectRatio", "xMidYMid meet")
  .attr("width", "100%")
  .attr("height", "100%");
  const g = svg.append("g")
  .attr("transform", `translate(400, 300)`);
  document.getElementById("network-modal").style.display = "block";
  document.getElementById("modal-title").textContent = `Teammates of ${driverName}`;

  // Initializing containers to filter and store data
  const entries = teammateData.filter(d => d.driverName === driverName);
  const teammates = [];

  // Creating an array of objects to store information for the tooltips
  entries.forEach(entry => {
    const year = +entry.year;
    const team = entry.constructor;
    const mates = teammateData.filter(d =>
      d.year == year && d.constructor === team && d.driverName !== driverName
    );
    mates.forEach(m => {
      teammates.push({ source: driverName, target: m.driverName, team, year });
    });
  });

  // Store information of the tooltips so we can access is directly based on the selection
  const teammateSummaryMap = {};
  teammates.forEach(({ source, target, team, year }) => {
    [[source, target], [target, source]].forEach(([a, b]) => {
      if (!teammateSummaryMap[b]) teammateSummaryMap[b] = {};
      if (!teammateSummaryMap[b][team]) teammateSummaryMap[b][team] = new Set();
      teammateSummaryMap[b][team].add(+year);
    });
  });

  // Creating the links of the drivers
  const nodes = {};
  const teammateCounts = {};
  teammates.forEach(d => {
    const key = [d.source, d.target].sort().join("::");
    teammateCounts[key] = (teammateCounts[key] || 0) + 1;
  });

  // Setting the thickness of the links based on the number of years they have been teammates for
  const links = Object.entries(teammateCounts).map(([key, count]) => {
    const [source, target] = key.split("::");
    nodes[source] = { id: source };
    nodes[target] = { id: target };
    return { source, target, width: count };
  });

  // Creating the tooltip function to display information when hovered on the nodes
  function handleTooltip(event, d) {
    if (d.id === driverName) return;

    const summary = teammateSummaryMap[d.id];
    if (!summary) return;

    const teamEntries = Object.entries(summary).map(([team, years]) => {
      const yearList = [...years].sort().join(", ");
      return `${team} (${yearList})`;
    });

    tooltip.transition().duration(200).style("opacity", 1);
    tooltip
      .html(
        `<strong>${d.id}</strong><br>` +
        `Teammate for <strong>${teamEntries.reduce((acc, t) => acc + (t.match(/\d+/g)?.length || 0), 0)}</strong> year(s)<br>` +
        `Team(s): <br><span style="color:#facc15">${teamEntries.join("<br>")}</span>`
      )
      .style("left", `${event.clientX + 10}px`)
      .style("top", `${event.clientY - 28}px`);
  }

  // Simulation for drawing the chart
  const sim = d3
    .forceSimulation(Object.values(nodes))
    .force("link", d3.forceLink(links).id(d => d.id).distance(100))
    .force("charge", d3.forceManyBody().strength(-250))
    .force("center", d3.forceCenter(0,-140));

  // Edges formatting
  g.append("g")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke", "#000")
    .attr("stroke-width", d => d.width);

  // Nodes Formatting
  const node = g.append("g")
    .selectAll("circle")
    .data(Object.values(nodes))
    .join("circle")
    .attr("r", 30)
    .attr("fill", d => {
  
  // The central driver color coding
  if (d.id === driverName) return "#4F2F75";

  // Find all teammate links involving this driver
  const matches = teammates
    .filter(t => t.target === d.id || t.source === d.id)
    .sort((a, b) => b.year - a.year); // Most recent first

  if (matches.length === 0) return "#999";

  const key = `${d.id}::${matches[0].year}`;
  return driverColorMap[key] || "#999";
})

    // Display the tooltips when the mouse is over the node
    .on("mouseover", handleTooltip)

    // Show a fading animation when the mouse is moved away.
    .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0))
    .call(drag(sim));

  // Labels
  const label = g.append("g")
    .selectAll("text")
    .data(Object.values(nodes))
    .join("text")
    .text(d => d.id)
    .attr("font-size", 12)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("fill", "#000")
    .on("mouseover", handleTooltip)
    .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0));

  // Position update as the selection changes
  sim.on("tick", () => {
    svg.selectAll("line")
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);
    svg.selectAll("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
    svg.selectAll("text")
      .attr("x", d => d.x + 5)
      .attr("y", d => d.y - 30);
  });

  // Drag behavior
  function drag(simulation) {
    return d3.drag()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x; d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null; d.fy = null;
      });
  }
}

// Support for dragging the nodes
function drag(sim) {
  return d3.drag()
    .on("start", (event, d) => {
      if (!event.active) sim.alphaTarget(0.3).restart();
      d.fx = d.x; d.fy = d.y;
    })
    .on("drag", (event, d) => {
      d.fx = event.x; d.fy = event.y;
    })
    .on("end", (event, d) => {
      if (!event.active) sim.alphaTarget(0);
      d.fx = null; d.fy = null;
    });
}

function closeModal() {

  // When the close button is clicked, it changes to hidden state
  document.getElementById("network-modal").style.display = "none";
  d3.select("#teammate-network").selectAll("*").remove();
}

// Updating the driver contribution bars based on the teams selected for the season
function updateDriverBar(data, selectedYear, selectedTeam) {
  const filtered = data.filter(d => d.year === selectedYear && d.constructor === selectedTeam);
  if (filtered.length < 2) return;

  const [d1, d2] = filtered.sort((a, b) => b.points - a.points);

  // Update Driver names
  document.getElementById("left-driver-name").textContent = d1.driverName;
  document.getElementById("right-driver-name").textContent = d2.driverName;

  document.getElementById("left-bar").onclick = () => showNetwork(d1.driverName);
  document.getElementById("right-bar").onclick = () => showNetwork(d2.driverName);

  // If the scores are 0
  if (d1.points === 0 && d2.points === 0) {
    document.getElementById("left-bar").style.height = "0";
    document.getElementById("right-bar").style.height = "0";
    document.getElementById("left-points").textContent = "0";
    document.getElementById("right-points").textContent = "0";
    document.getElementById("total-points").textContent = "0";
    return;
  }

  const total = d1.points + d2.points;

  const set = (id, name, val, heightPercent, color) => {
    const bar = document.getElementById(id + "-bar");
    bar.style.height = heightPercent + "%";
    bar.style.backgroundColor = color;
    document.getElementById(id + "-points").textContent = val;
  };

  set("left", d1.driverName, d1.points, (d1.points / total) * 100, d1.color);
  set("right", d2.driverName, d2.points, (d2.points / total) * 100, d2.color);

  let current = 0;
  const totalEl = document.getElementById("total-points");
  const duration = 1000;
  const increment = Math.ceil(total / 30);
  const counter = setInterval(() => {
    current += increment;
    if (current >= total) {
      current = total;
      clearInterval(counter);
    }
    totalEl.textContent = current;
  }, duration / (total / increment));
}

// Draw the horizontal line chart depicting the team scores
function drawHorizontalLineChart(data, selectedYear, selectedTeam, shouldAnimate = false) {
  const svg = d3.select("#line-chart");
  svg.selectAll("*").remove();

  // Setting the layout for the horizontal line chart
  const margin = { top: 20, right: 30, bottom: 30, left: 30 },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // Calculating the team points based on the year and sorting it in decending order
  const teamTotals = d3.rollups(
    data.filter(d => d.year === selectedYear),
    v => d3.sum(v, d => d.points),
    d => d.constructor
  ).sort((a, b) => b[1] - a[1]);

  const x = d3.scaleLinear().domain([0, d3.max(teamTotals, d => d[1]) * 1.1]).range([0, width]);
  const y = d3.scalePoint().domain(teamTotals.map(d => d[0])).range([0, height]).padding(0.5);

  // Creating the horizontal lines to display
  g.selectAll("line")
    .data(teamTotals)
    .join("line")
    .attr("y1", d => y(d[0]))
    .attr("y2", d => y(d[0]))
    .attr("x1", 0)
    .transition()
    .duration(shouldAnimate ? 1000 : 0)
    .attr("x2", d => x(d[1]))

    // Filling the color for the specific constructor
    .attr("stroke", d => teamColorMap[`${d[0]}::${selectedYear}`] || "#999")

    // If the team is selected, increase the width
    .attr("stroke-width", d => d[0] === selectedTeam ? 10 : 2)

    // If the team is selected, reduce the opacity of the others
    .attr("stroke-opacity", d => d[0] === selectedTeam ? 1 : 0.5);

  // Add the circles in the end of the line to mark
  g.selectAll("circle")
    .data(teamTotals)
    .join("circle")
    .attr("cy", d => y(d[0]))
    .attr("r", d => d[0] === selectedTeam ? 5 : 3)
    .attr("fill", d => teamColorMap[`${d[0]}::${selectedYear}`] || "#aaa")
    .attr("cx", d => x(d[1]));

  // Text labels for the lines
  g.selectAll("text")
    .data(teamTotals)
    .join("text")
    .text(d => `${d[0]} (${d[1]})`)
    .attr("y", d => y(d[0]) + 5)
    .attr("x", d => x(d[1]) + 6)
    .attr("font-size", 11)
    .attr("fill", d => teamColorMap[`${d[0]}::${selectedYear}`] || "#aaa");
}

// Loading the globe layout and our data for the F1 tracks location
Promise.all([
  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
  d3.csv("circuits.csv")
]).then(([world, data]) => {
  const countries = topojson.feature(world, world.objects.countries);
  svg.append("path")
    .datum(countries)
    .attr("d", path)
    .attr("fill", "#2dd4bf")
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.2);

  // Setting the region wise colors
  const regionColor = {
    Europe: "#0bb019",
    Asia: "#b00b4b",
    NorthAmerica: "#f87171",
    MiddleEast: "#fbbf24",
    SouthAmerica: "#ce6a07"
  };

  // When the mouse is on the point, show the tooltip
  const dots = svg.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("r", 4)
    .attr("fill", d => regionColor[d.region] || "#999")
    .attr("stroke", "#000")
    .attr("stroke-width", 0.3)
    .on("mouseover", function (event, d) {
      rotating = false;
      globeTooltip.transition().duration(200).style("opacity", 0.95);
      globeTooltip.html(`<strong>${d.name}</strong><br>
          <img src="https://flagcdn.com/16x12/${d.country_code}.png" alt="${d.country}" style="vertical-align:middle; margin-right:6px;">
          ${d.country}`)
        .style("left", (event.clientX + 12) + "px")
        .style("top", (event.clientY - 28) + "px");
    })

    // When the mouse is out, hide the tooltip
    .on("mouseout", function () {
      rotating = true;
      globeTooltip.transition().duration(300).style("opacity", 0);
    });

  // Make the globe rotating
  d3.timer(elapsed => {
    if (rotating) projection.rotate([elapsed * 0.009, -15]);
    svg.selectAll("path").attr("d", path);
    dots
      .attr("cx", d => projection([+d.lng, +d.lat])[0])
      .attr("cy", d => projection([+d.lng, +d.lat])[1])
      .attr("display", d => {
        const center = projection.rotate();
        const visible = d3.geoDistance([+d.lng, +d.lat], [-center[0], -center[1]]) < Math.PI / 2;
        return visible ? "inline" : "none";
      });
  });
});