Promise.all([
    d3.csv("data/NBA_2014_Shots.csv"),
    d3.csv("data/NBA_2024_Shots.csv")
]).then(([data2014, data2024]) => {

    createShotShareChart(data2014, data2024);
    createCourtHeatmap(data2014, data2024);
    createEfficiencyScatterPlot(data2024);
    createPlayerProfileChart(data2024);
    createPositionMatrix(data2014, data2024);

}).catch(error => {
    console.error("Error loading the CSV data: ", error);
});


/**
 * Processes raw shot data to calculate the share of each shot type.
 * @param {Array} rawData - The raw shot data from the CSV file.
 * @returns {Array} An array of objects, each containing the shot type and its share.
 */
function processShotData(rawData) {
    let paintShots = 0;
    let midRangeShots = 0;
    let threePtShots = 0;


    rawData.forEach(d => {
        const zone = d.BASIC_ZONE;
        if (zone === 'Restricted Area' || zone === 'In The Paint (Non-RA)') {
            paintShots++;
        } else if (zone === 'Mid-Range') {
            midRangeShots++;
        } else if (zone === 'Above the Break 3' || zone === 'Left Corner 3' || zone === 'Right Corner 3') {
            threePtShots++;
        }
    });

    const totalShots = paintShots + midRangeShots + threePtShots;
    if (totalShots === 0) return [];

    return [
        { type: 'In The Paint', value: paintShots / totalShots },
        { type: 'Mid-Range', value: midRangeShots / totalShots },
        { type: '3-Pointer', value: threePtShots / totalShots }
    ];
}


/**
 * [Vis 1] Creates a grouped bar chart to compare shot shares.
 * @param {Array} data2014 - The raw shot data from 2014.
 * @param {Array} data2024 - The raw shot data from 2024.
 */
function createShotShareChart(data2014, data2024) {
    console.log("Vis 1: Grouped Bar Chart function called.");

    const shotShares2014 = processShotData(data2014);
    const shotShares2024 = processShotData(data2024);

    const combinedData = [
        { season: '2014', shares: shotShares2014 },
        { season: '2024', shares: shotShares2024 }
    ];

    const container = d3.select("#shot-share-chart");
    container.html("");
    const containerWidth = container.node().getBoundingClientRect().width;

    const margin = { top: 40, right: 100, bottom: 50, left: 60 };
    const width = containerWidth - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;

    const svg = container
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const seasons = combinedData.map(d => d.season);
    const shotTypes = combinedData[0].shares.map(d => d.type);


    const x0Scale = d3.scaleBand()
        .domain(seasons)
        .rangeRound([0, width])
        .paddingInner(0.2)

    const x1Scale = d3.scaleBand()
        .domain(shotTypes)
        .rangeRound([0, x0Scale.bandwidth()])
        .padding(0.05)

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(combinedData, d => d3.max(d.shares, s => s.value))])
        .nice()
        .rangeRound([height, 0])

    const colorScale = d3.scaleOrdinal()
        .domain(shotTypes)
        .range(['#1d428a', '#c8102e', '#f26f21'])


    const seasonGroup = svg.append("g")
        .selectAll("g")
        .data(combinedData)
        .join("g")
        .attr("transform", d => `translate(${x0Scale(d.season)},0)`)

    seasonGroup.selectAll("rect")
        .data(d => d.shares)
        .join("rect")
        .attr("x", d => x1Scale(d.type))
        .attr("y", d => yScale(d.value))
        .attr("width", x1Scale.bandwidth())
        .attr("height", d => height - yScale(d.value))
        .attr("fill", d => colorScale(d.type))

    const xAxis = d3.axisBottom(x0Scale);
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")
        .style("font-size", "14px");

    const yAxis = d3.axisLeft(yScale).ticks(null, "%");
    svg.append("g")
        .call(yAxis)
        .selectAll("text")
        .style("font-size", "12px");

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .text("Season");

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 40)
        .attr("x", -height / 2)
        .text("Share of Total Shots");

    const legend = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "start")
        .selectAll("g")
        .data(shotTypes)
        .join("g")
        .attr("transform", (d, i) => `translate(${width + 10},${i * 25})`);

    legend.append("rect")
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", colorScale);

    legend.append("text")
        .attr("x", 24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(d => d);
}


/**
 * [Vis 2] Creates an interactive heatmap of shot locations.
 * @param {Array} data2014 - The raw shot data from 2014.
 * @param {Array} data2024 - The raw shot data from 2024.
 */
function createCourtHeatmap(data2014, data2024) {
    console.log("Vis 2: Interactive Court Heatmap function called.");
    // 1. Draw an SVG basketball court.
    // 2. Use a library like d3-hexbin to create density plots.
    // 3. Add a toggle/button to switch the data source between 2014 and 2024.
}

// Helper to map a playerName --> player stats, full return:
// Map(playerName -> { player, threePA_pg, threePA_total, threePM, threePCT, corner3A, aboveBreakA })
function buildPlayerThreePointStats(raw) {
    const byPlayer = d3.rollup(
        raw,
        v0 => {
            const v = v0.filter(r => {
                if (r.SHOT_TYPE) return String(r.SHOT_TYPE).includes('3PT');
                const z = r.BASIC_ZONE;
                return z === 'Above the Break 3' || z === 'Left Corner 3' || z === 'Right Corner 3';
            });

            const threePA_total = v.length;
            const threePM = d3.sum(v, r => String(r.SHOT_MADE).toLowerCase() === 'true' ? 1 : 0);

            let corner3A = 0;
            for (const r of v) {
                const z = r.BASIC_ZONE;
                if (z === 'Left Corner 3' || z === 'Right Corner 3') corner3A++;
            }
            const aboveBreakA = threePA_total - corner3A;

            const threePCT = threePA_total ? threePM / threePA_total : 0;

            const games = new Set(v.map(r => r.GAME_ID)).size || 1;
            const threePA_pg = threePA_total / games;

            return { threePA_pg, threePA_total, threePM, threePCT, corner3A, aboveBreakA };
        },
        r => r.PLAYER_NAME
    );

    const out = new Map();
    for (const [player, stats] of byPlayer) out.set(player, { player, ...stats });
    return out;
}

// Helper to calculate Aggregate Corner vs Above-Break profile for a set of players
// To-do: test this function more, it glitches sometimes
function computeShotProfileForPlayers(playerSet, playerStatsMap) {
    let corner = 0, above = 0;
    playerSet.forEach(p => {
        const s = playerStatsMap.get(p);
        if (!s) return;
        corner += s.corner3A;
        above  += s.aboveBreakA;
    });
    const total = corner + above;
    return total > 0
        ? { corner, above, total, cornerPct: corner/total, abovePct: above/total }
        : { corner: 0, above: 0, total: 0, cornerPct: 0, abovePct: 0 };
}

const link = d3.dispatch("selection");

/*************** Vis 3 — Efficiency vs Volume (3PA/game vs 3P%) ***************/
function createEfficiencyScatterPlot(data2024) {
    const statsMap = buildPlayerThreePointStats(data2024);
    const data = Array.from(statsMap.values())
        .filter(d => d.threePA_total >= 10); // guardrail to reduce noise

    const container = d3.select("#efficiency-scatter-plot");
    container.html("");
    const containerWidth = container.node().getBoundingClientRect().width;
    const margin = { top: 30, right: 20, bottom: 50, left: 60 };
    const width  = containerWidth - margin.left - margin.right;
    const height = 420 - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width",  width + margin.left + margin.right)
        .attr("height", height + margin.top  + margin.bottom);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.threePA_pg) || 5]).nice()
        .range([0, width]);
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.threePCT) || 0.5]).nice()
        .range([height, 0]);

    g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
    g.append("g").call(d3.axisLeft(y).tickFormat(d3.format(".0%")));

    g.append("text").attr("x", width/2).attr("y", height+40).attr("text-anchor","middle")
        .text("3PA per game (volume)");
    g.append("text").attr("transform","rotate(-90)").attr("x", -height/2).attr("y", -45)
        .attr("text-anchor","middle").text("3P% (efficiency)");

    const tooltip = d3.select("body").append("div")
        .attr("class","tooltip").style("position","absolute").style("pointer-events","none").style("opacity",0);

    const dots = g.selectAll("circle.dot")
        .data(data, d => d.player)
        .join("circle")
        .attr("class","dot")
        .attr("cx", d => x(d.threePA_pg))
        .attr("cy", d => y(d.threePCT))
        .attr("r", 4)
        .attr("fill", "#1d428a")
        .attr("opacity", 0.9)
        .on("mousemove", (event, d) => {
            tooltip.style("opacity", 1)
                .html(
                    `<strong>${d.player}</strong><br/>
           3PA/g: ${d.threePA_pg.toFixed(2)}<br/>
           3P%: ${(d.threePCT*100).toFixed(1)}%<br/>
           Corner 3A: ${d.corner3A}<br/>
           Above-break 3A: ${d.aboveBreakA}`
                )
                .style("left", (event.pageX + 10) + "px")
                .style("top",  (event.pageY - 28) + "px");
        })
        .on("mouseleave", () => tooltip.style("opacity", 0));

    const brush = d3.brush()
        .extent([[0,0],[width,height]])
        .on("start brush end", brushed);
    g.append("g").attr("class","brush").call(brush);

    function brushed(event) {
        const s = event.selection;
        const selected = new Set();
        if (s) {
            const [[x0,y0],[x1,y1]] = s;
            dots.classed("selected", d => {
                const inside = x0 <= x(d.threePA_pg) && x(d.threePA_pg) <= x1 &&
                    y0 <= y(d.threePCT)   && y(d.threePCT)   <= y1;
                if (inside) selected.add(d.player);
                return inside;
            }).attr("fill", d => selected.has(d.player) ? "#c8102e" : "#1d428a");
        } else {
            dots.classed("selected", false).attr("fill", "#1d428a");
        }
        link.call("selection", null, selected);
    }
}

/*************** Vis 4 — Linked Player Shot Profile (Corner vs Above) ***************/
function createPlayerProfileChart(data2024) {
    const statsMap   = buildPlayerThreePointStats(data2024);
    const allPlayers = new Set(statsMap.keys());

    const container = d3.select("#player-profile-chart");
    container.html("");
    const containerWidth = container.node().getBoundingClientRect().width;
    const margin = { top: 30, right: 20, bottom: 45, left: 60 };
    const width  = containerWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width",  width + margin.left + margin.right)
        .attr("height", height + margin.top  + margin.bottom);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(["Corner 3", "Above-the-Break 3"])
        .range([0, width])
        .padding(0.35);

    const y = d3.scaleLinear()
        .domain([0, 1])
        .range([height, 0])
        .nice();

    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    g.append("g")
        .call(d3.axisLeft(y).tickFormat(d3.format(".0%")));

    const title = g.append("text")
        .attr("x", 0)
        .attr("y", -10)
        .attr("class", "profile-title")
        .text("Shot profile: No selection (showing all players)");

    const barsG = g.append("g");

    function render(profile) {
        const data = [
            { key: "Corner 3", value: profile.cornerPct },
            { key: "Above-the-Break 3", value: profile.abovePct }
        ];

        const bars = barsG.selectAll("rect").data(data, d => d.key);
        bars.join(
            enter => enter.append("rect")
                .attr("x", d => x(d.key))
                .attr("width", x.bandwidth())
                .attr("y", y(0))
                .attr("height", 0)
                .attr("fill", d => d.key === "Corner 3" ? "#f26f21" : "#1d428a")
                .call(enter => enter.transition().duration(500)
                    .attr("y", d => y(d.value))
                    .attr("height", d => y(0) - y(d.value))),
            update => update.transition().duration(500)
                .attr("x", d => x(d.key))
                .attr("width", x.bandwidth())
                .attr("y", d => y(d.value))
                .attr("height", d => y(0) - y(d.value)),
            exit => exit.remove()
        );

        const labels = barsG.selectAll("text.value").data(data, d => d.key);
        labels.join(
            enter => enter.append("text")
                .attr("class", "value")
                .attr("text-anchor", "middle")
                .attr("x", d => x(d.key) + x.bandwidth()/2)
                .attr("y", y(0) - 4)
                .text(d => d3.format(".0%")(d.value))
                .call(enter => enter.transition().duration(500)
                    .attr("y", d => y(d.value) - 6)),
            update => update
                .transition().duration(500)
                .attr("x", d => x(d.key) + x.bandwidth()/2)
                .attr("y", d => y(d.value) - 6)
                .tween("text", function(d){
                    const prev = +String(this.textContent || "0%").replace('%','')/100 || 0;
                    const i = d3.interpolateNumber(prev, d.value);
                    return t => { this.textContent = d3.format(".0%")(i(t)); };
                }),
            exit => exit.remove()
        );
    }

    render(computeShotProfileForPlayers(allPlayers, statsMap));

    link.on("selection.playerProfile", (selectedSet) => {
        const active = (selectedSet && selectedSet.size) ? selectedSet : allPlayers;
        const who = (selectedSet && selectedSet.size)
            ? `Selected group (${selectedSet.size} players)`
            : "No selection (showing all players)";
        title.text(`Shot profile: ${who}`);
        render(computeShotProfileForPlayers(active, statsMap));
    });
}

/**
 * [Vis 5] Creates a matrix showing shot distribution by player position.
 * @param {Array} data2014 - The raw shot data from 2014.
 * @param {Array} data2024 - The raw shot data from 2024.
 */
function createPositionMatrix(data2014, data2024) {
    console.log("Vis 5: Position Shot Matrix Heatmap function called.");
    
    // Process data for both seasons
    const matrix2014 = processPositionMatrixData(data2014);
    const matrix2024 = processPositionMatrixData(data2024);
    
    // Get unique positions and zones
    const positions = ['Guard', 'Forward', 'Center'];
    const zones = ['Restricted Area', 'In The Paint (Non-RA)', 'Mid-Range', 'Above the Break 3', 'Left Corner 3', 'Right Corner 3'];
    
    // Create container
    const container = d3.select("#position-matrix-chart");
    container.html("");
    
    // Create tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    
    // Set up dimensions - fit within viewport
    const containerWidth = container.node().getBoundingClientRect().width - 40; // Account for padding
    const containerHeight = container.node().getBoundingClientRect().height - 40;
    const margin = { top: 60, right: 80, bottom: 100, left: 100 };
    const heatmapWidth = (containerWidth - margin.left - margin.right) / 2 - 60;
    const heatmapHeight = Math.min(containerHeight - margin.top - margin.bottom, 400);
    const totalWidth = containerWidth;
    const totalHeight = containerHeight;
    
    // Create SVG
    const svg = container
        .append("svg")
        .attr("width", totalWidth)
        .attr("height", totalHeight)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Add arrow marker definition
    svg.append("defs").append("marker")
        .attr("id", "arrowhead")
        .attr("markerWidth", 10)
        .attr("markerHeight", 7)
        .attr("refX", 9)
        .attr("refY", 3.5)
        .attr("orient", "auto")
        .append("polygon")
        .attr("points", "0 0, 10 3.5, 0 7")
        .attr("fill", "#c8102e");
    
    // Create scales - make cells square
    const cellSize = Math.min(heatmapWidth / zones.length, heatmapHeight / positions.length) * 0.9;
    
    const xScale = d3.scaleBand()
        .domain(zones)
        .range([0, heatmapWidth])
        .padding(0.1);
    
    const yScale = d3.scaleBand()
        .domain(positions)
        .range([0, heatmapHeight])
        .padding(0.1);
    
    // NBA color scheme - using orange to red gradient
    const colorScale = d3.scaleSequential(d3.interpolateOranges)
        .domain([0, d3.max([...matrix2014, ...matrix2024], d => d.percentage)]);
    
    // Create 2014 heatmap
    const heatmap2014 = svg.append("g")
        .attr("class", "heatmap-2014")
        .attr("transform", `translate(0, 0)`);
    
    // Add 2014 title
    heatmap2014.append("text")
        .attr("class", "season-title")
        .attr("x", heatmapWidth / 2)
        .attr("y", -20)
        .text("2014 Season Total Shots %");
    
    // Add 2014 cells
    const cellGroup2014 = heatmap2014.selectAll(".cell-group-2014")
        .data(matrix2014)
        .join("g")
        .attr("class", "cell-group-2014")
        .attr("transform", d => `translate(${xScale(d.zone)}, ${yScale(d.position)})`);
    
    cellGroup2014.append("rect")
        .attr("class", "heatmap-cell cell-2014")
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .attr("fill", d => colorScale(d.percentage))
        .on("mouseover", function(event, d) {
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`
                <strong>2014 Season</strong><br/>
                Position: ${d.position}<br/>
                Zone: ${d.zone}<br/>
                Shots: ${d.count}<br/>
                Percentage: ${(d.percentage * 100).toFixed(1)}%
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition().duration(500).style("opacity", 0);
        });
    
    // Add percentage labels to 2014 cells
    cellGroup2014.append("text")
        .attr("class", "cell-percentage")
        .attr("x", xScale.bandwidth() / 2)
        .attr("y", yScale.bandwidth() / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .style("fill", d => d.percentage > 0.3 ? "white" : "#333")
        .text(d => `${(d.percentage * 100).toFixed(1)}%`);
    
    // Add 2014 axes
    heatmap2014.append("g")
        .attr("class", "x-axis-2014")
        .attr("transform", `translate(0, ${heatmapHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("class", "zone-label")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-60)")
        .style("font-size", "10px");
    
    heatmap2014.append("g")
        .attr("class", "y-axis-2014")
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .attr("class", "position-label");
    
    // Create 2024 heatmap
    const heatmap2024 = svg.append("g")
        .attr("class", "heatmap-2024")
        .attr("transform", `translate(${heatmapWidth + 80}, 0)`);
    
    // Add 2024 title
    heatmap2024.append("text")
        .attr("class", "season-title")
        .attr("x", heatmapWidth / 2)
        .attr("y", -20)
        .text("2024 Season Total Shots %");
    
    // Add 2024 cells
    const cellGroup2024 = heatmap2024.selectAll(".cell-group-2024")
        .data(matrix2024)
        .join("g")
        .attr("class", "cell-group-2024")
        .attr("transform", d => `translate(${xScale(d.zone)}, ${yScale(d.position)})`);
    
    cellGroup2024.append("rect")
        .attr("class", "heatmap-cell cell-2024")
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .attr("fill", d => colorScale(d.percentage))
        .on("mouseover", function(event, d) {
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`
                <strong>2024 Season</strong><br/>
                Position: ${d.position}<br/>
                Zone: ${d.zone}<br/>
                Shots: ${d.count}<br/>
                Percentage: ${(d.percentage * 100).toFixed(1)}%
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition().duration(500).style("opacity", 0);
        });
    
    // Add percentage labels to 2024 cells
    cellGroup2024.append("text")
        .attr("class", "cell-percentage")
        .attr("x", xScale.bandwidth() / 2)
        .attr("y", yScale.bandwidth() / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .style("fill", d => d.percentage > 0.3 ? "white" : "#333")
        .text(d => `${(d.percentage * 100).toFixed(1)}%`);
    
    // Add 2024 axes
    heatmap2024.append("g")
        .attr("class", "x-axis-2024")
        .attr("transform", `translate(0, ${heatmapHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("class", "zone-label")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-60)")
        .style("font-size", "10px");
    
    heatmap2024.append("g")
        .attr("class", "y-axis-2024")
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .attr("class", "position-label");
    
    // Add comparison arrows and labels - REMOVED per user request
    // addComparisonArrows(svg, matrix2014, matrix2024, xScale, yScale, heatmapWidth, heatmapHeight);
    
    // Add color legend - REMOVED per user request
    // addColorLegend(svg, colorScale, heatmapWidth, heatmapHeight);
}

/**
 * Processes raw shot data to create position matrix data
 * @param {Array} data - The raw shot data
 * @returns {Array} Processed matrix data
 */
function processPositionMatrixData(data) {
    const positionGroups = ['G', 'F', 'C'];
    const positionLabels = { 'G': 'Guard', 'F': 'Forward', 'C': 'Center' };
    const zones = ['Restricted Area', 'In The Paint (Non-RA)', 'Mid-Range', 'Above the Break 3', 'Left Corner 3', 'Right Corner 3'];
    
    // Count shots by position and zone
    const counts = {};
    positionGroups.forEach(pos => {
        counts[pos] = {};
        zones.forEach(zone => {
            counts[pos][zone] = 0;
        });
    });
    
    data.forEach(d => {
        const position = d.POSITION_GROUP;
        const zone = d.BASIC_ZONE;
        if (positionGroups.includes(position) && zones.includes(zone)) {
            counts[position][zone]++;
        }
    });
    
    // Calculate percentages
    const matrix = [];
    positionGroups.forEach(pos => {
        const totalShots = zones.reduce((sum, zone) => sum + counts[pos][zone], 0);
        zones.forEach(zone => {
            const count = counts[pos][zone];
            const percentage = totalShots > 0 ? count / totalShots : 0;
            matrix.push({
                position: positionLabels[pos], // Use full word instead of letter
                zone: zone,
                count: count,
                percentage: percentage
            });
        });
    });
    
    return matrix;
}

/**
 * Adds comparison arrows between the two heatmaps
 */
function addComparisonArrows(svg, matrix2014, matrix2024, xScale, yScale, heatmapWidth, heatmapHeight) {
    const arrowSpacing = 80;
    const startX = heatmapWidth + 40;
    const endX = heatmapWidth + 40;
    
    // Find significant changes
    const significantChanges = [];
    matrix2014.forEach(d2014 => {
        const d2024 = matrix2024.find(d => d.position === d2014.position && d.zone === d2014.zone);
        if (d2024) {
            const change = d2024.percentage - d2014.percentage;
            if (Math.abs(change) > 0.05) { // 5% threshold
                significantChanges.push({
                    position: d2014.position,
                    zone: d2014.zone,
                    change: change,
                    x: xScale(d2014.zone) + xScale.bandwidth() / 2,
                    y: yScale(d2014.position) + yScale.bandwidth() / 2
                });
            }
        }
    });
    
    // Draw arrows for top 3 changes
    const topChanges = significantChanges
        .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
        .slice(0, 3);
    
    topChanges.forEach((change, i) => {
        const arrowY = change.y + (i - 1) * arrowSpacing;
        
        // Draw arrow
        svg.append("path")
            .attr("class", "comparison-arrow")
            .attr("d", `M ${startX} ${arrowY} L ${endX} ${arrowY}`)
            .attr("marker-end", "url(#arrowhead)");
        
        // Add change label with better formatting
        const zoneShort = change.zone.split(' ')[0];
        const changeText = `${change.position} - ${zoneShort}: ${(change.change * 100).toFixed(1)}%`;
        
        svg.append("text")
            .attr("class", "arrow-label")
            .attr("x", (startX + endX) / 2)
            .attr("y", arrowY - 20)
            .text(changeText)
            .style("font-size", "12px");
    });
}

/**
 * Adds color legend to the visualization
 */
function addColorLegend(svg, colorScale, heatmapWidth, heatmapHeight) {
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = heatmapWidth + 80 + heatmapWidth - legendWidth;
    const legendY = heatmapHeight + 40;
    
    // Create gradient
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
        .attr("id", "color-gradient");
    
    const domain = colorScale.domain();
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
        const value = domain[0] + (domain[1] - domain[0]) * (i / steps);
        gradient.append("stop")
            .attr("offset", `${(i / steps) * 100}%`)
            .attr("stop-color", colorScale(value));
    }
    
    // Draw legend rectangle
    svg.append("rect")
        .attr("x", legendX)
        .attr("y", legendY)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .attr("fill", "url(#color-gradient)")
        .attr("stroke", "#333")
        .attr("stroke-width", 1);
    
    // Add legend labels
    svg.append("text")
        .attr("x", legendX)
        .attr("y", legendY - 10)
        .attr("class", "zone-label")
        .text("Shot Percentage")
        .style("font-size", "14px")
        .style("font-weight", "bold");
    
    svg.append("text")
        .attr("x", legendX)
        .attr("y", legendY + legendHeight + 25)
        .attr("class", "zone-label")
        .text("0%")
        .style("font-size", "12px");
    
    svg.append("text")
        .attr("x", legendX + legendWidth)
        .attr("y", legendY + legendHeight + 25)
        .attr("class", "zone-label")
        .text(`${(domain[1] * 100).toFixed(1)}%`)
        .style("text-anchor", "end")
        .style("font-size", "12px");
}


document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.4
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (`#${entry.target.id}` === link.getAttribute('href')) {
                        link.classList.add('active')
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });
});