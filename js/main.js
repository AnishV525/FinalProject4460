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

    const margin = { top: 40, right: 40, bottom: 100, left: 120 };
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
        .attr("fill", d => colorScale(d.type));

    // Add percentage labels on top of each bar
    seasonGroup.selectAll("text.bar-label")
        .data(d => d.shares)
        .join("text")
        .attr("class", "bar-label")
        .attr("x", d => x1Scale(d.type) + x1Scale.bandwidth() / 2)
        .attr("y", d => yScale(d.value) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("font-weight", "600")
        .style("fill", "#333")
        .text(d => d3.format(".0%")(d.value));

    const xAxis = d3.axisBottom(x0Scale);
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")
        .style("font-size", "14px");

    const yAxis = d3.axisLeft(yScale)
        .ticks(null, "%")
        .tickSizeInner(6)
        .tickPadding(15);
    
    const yAxisGroup = svg.append("g")
        .call(yAxis);
    
    // Position tick labels to the right of axis line
    yAxisGroup.selectAll("text")
        .style("font-size", "12px")
        .attr("x", -10)
        .attr("dx", "0");

    // X-axis label
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 70)
        .style("font-size", "14px")
        .text("Season");

    // Y-axis label - MUST be positioned far to the left
    // After rotate(-90), text extends upward, so y position controls horizontal offset
    // More negative y = further left from the axis
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${-margin.left + 30}, ${height / 2}) rotate(-90)`)
        .style("font-size", "14px")
        .style("font-weight", "normal")
        .style("fill", "#333")
        .text("Share of Total Shots");

    // Legend below the chart, centered horizontally
    const legend = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 12)
        .attr("text-anchor", "start")
        .attr("transform", `translate(${width / 2 - 120}, ${height + 50})`);

    const legendItems = legend.selectAll("g")
        .data(shotTypes)
        .join("g")
        .attr("transform", (d, i) => `translate(${i * 140}, 0)`);

    legendItems.append("rect")
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", colorScale);

    legendItems.append("text")
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
    const container = d3.select("#court-heatmap-chart");
    container.html("").style("position", "relative");

    const controls = container.append("div")
        .style("position", "absolute").style("top", "8px").style("right", "8px").style("z-index", 2)
        .style("display", "flex").style("flex-direction", "column").style("gap", "8px").style("align-items", "flex-end");

    const btnGroup = controls.append("div").attr("class", "btn-group btn-group-sm");
    const filterButtons = [
        { key: "ALL", label: "All" },
        { key: "3PT", label: "3PT" },
        { key: "2PT", label: "2PT" }
    ];
    let shotFilter = "ALL"; // default to showing all shots

    filterButtons.forEach((b, i) =>
        btnGroup.append("button")
            .attr("type", "button")
            .attr("data-key", b.key)
            .attr("class", `btn btn-${b.key === shotFilter ? "light" : "outline-light"}`)
            .text(b.label)
            .on("click", function () {
                shotFilter = b.key;
                btnGroup.selectAll("button")
                    .attr("class", function() {
                        const btnKey = d3.select(this).attr("data-key");
                        return `btn btn-${btnKey === shotFilter ? "light" : "outline-light"}`;
                    });
                render();
            })
    );

    const toggleBtn = controls.append("button")
        .attr("type", "button").attr("class", "btn btn-sm btn-outline-light")
        .text("Switch to 2024");

    const svg = container.append("svg")
        .attr("class", "court-bubble-svg")
        .style("display", "block").style("width", "100%").style("height", "100%");

    const g = svg.append("g");
    const bubbleLayer = g.append("g").attr("class", "bubbles");
    // dont switch these, courtLayer must be above bubbleLayer or else we wont see the courtLayer
    const courtLayer  = g.append("g").attr("class", "court");

    // remove overflow
    const clip = svg.append("defs").append("clipPath").attr("id", "court-clip").append("rect");
    bubbleLayer.attr("clip-path", "url(#court-clip)");

    const courtX = [-25, 25];
    const courtY = [0, 47];
    const color = d3.scaleSequential(d3.interpolateOrRd);

    function drawCourt(x, y) {
        courtLayer.selectAll("*").remove();
        const stroke = "rgba(255,255,255,0.85)";
        const line = (sel) => sel.attr("fill", "none").attr("stroke", stroke).attr("stroke-width", 1.5);
        courtLayer.append("rect")
            .call(line)
            .attr("x", x(courtX[0])).attr("y", y(courtY[1]))
            .attr("width", x(courtX[1]) - x(courtX[0]))
            .attr("height", y(courtY[0]) - y(courtY[1]));

        // Paint
        courtLayer.append("rect")
            .call(line).attr("x", x(-8)).attr("y", y(19))
            .attr("width", x(8) - x(-8)).attr("height", y(0) - y(19));

        // Rim
        courtLayer.append("circle")
            .call(line).attr("cx", x(0)).attr("cy", y(4.75))
            .attr("r", Math.max(1, (x(1.5) - x(0))));

        // Free throw circle
        courtLayer.append("circle")
            .call(line).attr("cx", x(0)).attr("cy", y(19)).attr("r", Math.abs(x(6) - x(0)));

        // 3pt arc + corners
        const arcR = Math.abs(x(23.75) - x(0));
        const arc = d3.arc().innerRadius(arcR).outerRadius(arcR)
            .startAngle(-Math.PI * 0.83).endAngle(Math.PI * 0.83);
        courtLayer.append("path").call(line)
            .attr("transform", `translate(${x(0)},${y(4.75)})`).attr("d", arc());
        courtLayer.append("line").call(line).attr("x1", x(-22)).attr("y1", y(0)).attr("x2", x(-22)).attr("y2", y(14));
        courtLayer.append("line").call(line).attr("x1", x(22)).attr("y1", y(0)).attr("x2", x(22)).attr("y2", y(14));
    }

    function filterRows(rows) {
        return rows.filter(r => {
            const type = (r.SHOT_TYPE || "").toUpperCase();
            const zone = (r.BASIC_ZONE || "");
            const is3 =
                type.includes("3PT") ||
                zone === "Above the Break 3" || zone === "Left Corner 3" || zone === "Right Corner 3";
            if (shotFilter === "3PT") return is3;
            if (shotFilter === "2PT") return !is3;
            return true;
        });
    }

    function gridAggregate(rows, cellFeet, xScale, yScale) {
        const key = (gx, gy) => `${gx},${gy}`;
        const map = new Map();
        for (const r of rows) {
            const x = +r.LOC_X, y = +r.LOC_Y;
            if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
            const gx = Math.round(x / cellFeet) * cellFeet;
            const gy = Math.round(y / cellFeet) * cellFeet;
            const k = key(gx, gy);
            const o = map.get(k) || { gx, gy, count: 0 };
            o.count += 1;
            map.set(k, o);
        }
        const arr = Array.from(map.values()).map(d => ({ ...d, sx: xScale(d.gx), sy: yScale(d.gy) }));
        arr.sort((a, b) => b.count - a.count);
        return arr;
    }

    let currentSeason = "2014"; // default to 2014 season

    function render() {
        const box = container.node().getBoundingClientRect();
        const pad = 16;
        const W = Math.max(320, box.width) - pad * 2;
        const H = Math.max(260, box.height) - pad * 2;

        svg.attr("viewBox", `0 0 ${W + pad * 2} ${H + pad * 2}`);
        g.attr("transform", `translate(${pad},${pad})`);

        const aspect = (courtX[1] - courtX[0]) / (courtY[1] - courtY[0]);
        let drawW = W, drawH = H;
        if (W / H > aspect) drawW = H * aspect; else drawH = W / aspect;
        const left = (W - drawW) / 2, top = (H - drawH) / 2;

        const x = d3.scaleLinear().domain(courtX).range([left, left + drawW]);
        const y = d3.scaleLinear().domain(courtY).range([top + drawH, top]);
        clip.attr("x", left).attr("y", top).attr("width", drawW).attr("height", drawH);

        const rows2014 = filterRows(data2014);
        const rows2024 = filterRows(data2024);

        const cellFeet = 1.4;
        const agg2014 = gridAggregate(rows2014, cellFeet, x, y);
        const agg2024 = gridAggregate(rows2024, cellFeet, x, y);
        const p95_2014 = d3.quantile(agg2014.map(d => d.count).sort(d3.ascending), 0.95) || 1;
        const p95_2024 = d3.quantile(agg2024.map(d => d.count).sort(d3.ascending), 0.95) || 1;
        const cap = Math.max(1, p95_2014, p95_2024);

        color.domain([1, cap]);
        const rMax = Math.min(drawW, drawH) / 24;
        const r = d3.scaleSqrt().domain([1, cap]).range([2, rMax]);
        const alpha = d3.scaleLinear().domain([1, cap]).range([0.25, 0.9]).clamp(true);

        const agg = (currentSeason === "2014") ? agg2014 : agg2024;

        const circles = bubbleLayer.selectAll("circle.bubble").data(agg, d => `${d.gx},${d.gy}`);
        circles.join(
            enter => enter.append("circle")
                .attr("class", "bubble")
                .attr("cx", d => d.sx).attr("cy", d => d.sy)
                .attr("r", 0).attr("fill", d => color(Math.min(d.count, cap)))
                .attr("stroke", "none").attr("opacity", 0)
                .transition().duration(250)
                .attr("r", d => r(Math.min(d.count, cap)))
                .attr("opacity", d => alpha(Math.min(d.count, cap))),
            update => update.transition().duration(200)
                .attr("cx", d => d.sx).attr("cy", d => d.sy)
                .attr("r", d => r(Math.min(d.count, cap)))
                .attr("fill", d => color(Math.min(d.count, cap)))
                .attr("opacity", d => alpha(Math.min(d.count, cap))),
            exit => exit.transition().duration(150).attr("opacity", 0).attr("r", 0).remove()
        );

        drawCourt(x, y);
        courtLayer.raise();

        toggleBtn.text(currentSeason === "2014" ? "Switch to 2024" : "Switch to 2014");
    }

    toggleBtn.on("click", () => {
        currentSeason = currentSeason === "2014" ? "2024" : "2014";
        render();
    });

    const ro = new ResizeObserver(() => render());
    ro.observe(container.node());
    render();
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
 * [Vis 5] Creates a matrix showing shot distribution by player position for a single season.
 * @param {Array} matrixData - The processed matrix data for the season.
 * @param {String} containerId - The ID of the container element.
 * @param {String} season - The season year (e.g., "2014" or "2024").
 * @param {Number} maxPercentage - The maximum percentage for the color scale.
 */
function createSinglePositionMatrix(matrixData, containerId, season, maxPercentage) {
    console.log(`Vis 5: Position Shot Matrix Heatmap ${season} function called.`);
    
    // Get unique positions and zones
    const positions = ['Guard', 'Forward', 'Center'];
    const zones = ['Restricted Area', 'In The Paint', 'Mid-Range', 'Above the Break 3', 'Left Corner 3', 'Right Corner 3'];
    
    // Zone label mapping: map data zone names to display labels
    const zoneLabelMap = {
        'Restricted Area': 'Restricted Area',
        'In The Paint (Non-RA)': 'In The Paint',
        'Mid-Range': 'Mid-Range',
        'Above the Break 3': 'Above the Break 3',
        'Left Corner 3': 'Left Corner 3',
        'Right Corner 3': 'Right Corner 3'
    };
    
    // Map zone names in the data for display
    const displayData = matrixData.map(d => ({
        ...d,
        zone: zoneLabelMap[d.zone] || d.zone
    }));
    
    // Create container
    const container = d3.select(containerId);
    container.html("");
    
    // Create tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    
    // Set up dimensions - fit within viewport
    const containerRect = container.node().getBoundingClientRect();
    const containerPadding = 40;
    const availableWidth = Math.min(containerRect.width - containerPadding, window.innerWidth - 100);
    const containerHeight = containerRect.height - containerPadding;
    const margin = { top: 60, right: 40, bottom: 80, left: 80 };
    const heatmapWidth = Math.max(200, availableWidth - margin.left - margin.right);
    const heatmapHeight = Math.min(containerHeight - margin.top - margin.bottom, 350);
    const totalWidth = Math.min(heatmapWidth + margin.left + margin.right, availableWidth);
    const totalHeight = heatmapHeight + margin.top + margin.bottom;
    
    // Create SVG - ensure it doesn't exceed container width
    const svg = container
        .append("svg")
        .attr("width", Math.min(totalWidth, availableWidth))
        .attr("height", totalHeight)
        .attr("viewBox", `0 0 ${Math.min(totalWidth, availableWidth)} ${totalHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("max-width", "100%")
        .style("width", "100%")
        .style("height", "auto")
        .style("overflow", "hidden")
        .style("display", "block")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Create scales
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
        .domain([0, maxPercentage]);
    
    // Create heatmap
    const heatmap = svg.append("g")
        .attr("class", `heatmap-${season}`)
        .attr("transform", `translate(0, 0)`);
    
    // Add title
    heatmap.append("text")
        .attr("class", "season-title")
        .attr("x", heatmapWidth / 2)
        .attr("y", -20)
        .text(`${season} Season Total Shots %`);
    
    // Add cells
    const cellGroup = heatmap.selectAll(`.cell-group-${season}`)
        .data(displayData)
        .join("g")
        .attr("class", `cell-group-${season}`)
        .attr("transform", d => `translate(${xScale(d.zone)}, ${yScale(d.position)})`);
    
    cellGroup.append("rect")
        .attr("class", `heatmap-cell cell-${season}`)
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .attr("fill", d => colorScale(d.percentage))
        .on("mouseover", function(event, d) {
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`
                <strong>${season} Season</strong><br/>
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
    
    // Add percentage labels to cells
    cellGroup.append("text")
        .attr("class", "cell-percentage")
        .attr("x", xScale.bandwidth() / 2)
        .attr("y", yScale.bandwidth() / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .style("fill", d => d.percentage > 0.3 ? "white" : "#333")
        .text(d => `${(d.percentage * 100).toFixed(1)}%`);
    
    // Add axes
    heatmap.append("g")
        .attr("class", `x-axis-${season}`)
        .attr("transform", `translate(0, ${heatmapHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("class", "zone-label")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-60)")
        .style("font-size", "10px");
    
    heatmap.append("g")
        .attr("class", `y-axis-${season}`)
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .attr("class", "position-label");
}

/**
 * [Vis 5] Creates matrices showing shot distribution by player position for both seasons.
 * @param {Array} data2014 - The raw shot data from 2014.
 * @param {Array} data2024 - The raw shot data from 2024.
 */
function createPositionMatrix(data2014, data2024) {
    // Process data for both seasons
    const matrix2014 = processPositionMatrixData(data2014);
    const matrix2024 = processPositionMatrixData(data2024);
    
    // Calculate max percentage for consistent color scale
    const maxPercentage = d3.max([...matrix2014, ...matrix2024], d => d.percentage);
    
    // Create separate visualizations
    createSinglePositionMatrix(matrix2014, "#position-matrix-chart-2014", "2014", maxPercentage);
    createSinglePositionMatrix(matrix2024, "#position-matrix-chart-2024", "2024", maxPercentage);
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
    const zoneLabelMap = {
        'Restricted Area': 'Restricted Area',
        'In The Paint (Non-RA)': 'In The Paint',
        'Mid-Range': 'Mid-Range',
        'Above the Break 3': 'Above the Break 3',
        'Left Corner 3': 'Left Corner 3',
        'Right Corner 3': 'Right Corner 3'
    };
    positionGroups.forEach(pos => {
        const totalShots = zones.reduce((sum, zone) => sum + counts[pos][zone], 0);
        zones.forEach(zone => {
            const count = counts[pos][zone];
            const percentage = totalShots > 0 ? count / totalShots : 0;
            matrix.push({
                position: positionLabels[pos], // Use full word instead of letter
                zone: zoneLabelMap[zone] || zone, // Map to display label
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

function renderMidrangeSlope() {
    Promise.all([
        d3.csv("data/NBA_2014_Shots.csv", d3.autoType),
        d3.csv("data/NBA_2024_Shots.csv", d3.autoType)
    ]).then(([data14, data24]) => {

        function midrangePct(data) {
            const total = data.length;
            const mid = data.filter(d => d.BASIC_ZONE === "Mid-Range").length;
            return (mid / total) * 100;
        }

        const pct14 = midrangePct(data14); // ~27%
        const pct24 = midrangePct(data24); // ~11%

        const stats = [
            { season: "2014", value: pct14 },
            { season: "2024", value: pct24 }
        ];

        const containerSel = d3.select("#data-intro-chart");
        const boxNode = containerSel.node();
        const boxWidth = boxNode.clientWidth;
        const boxHeight = boxNode.clientHeight; 

        const margin = { top: 60, right: 80, bottom: 60, left: 80 };
        const innerWidth = boxWidth - margin.left - margin.right;
        const innerHeight = boxHeight - margin.top - margin.bottom;

        const x = d3.scalePoint()
            .domain(stats.map(d => d.season))
            .range([0, innerWidth])
            .padding(0.5);

        const y = d3.scaleLinear()
            .domain([0, d3.max(stats, d => d.value)]).nice()
            .range([innerHeight, 0]);

        containerSel.html("");

        const svg = containerSel
            .append("svg")
            .attr("width", boxWidth)
            .attr("height", boxHeight)
            .attr("class", "midrange-slope-chart");

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        g.append("g")
            .attr("class", "gridlines")
            .call(
                d3.axisLeft(y)
                  .ticks(4)
                  .tickSize(-innerWidth)
                  .tickFormat("")
            )
            .call(grid => grid.selectAll("line")
                .attr("stroke", "#dee2e6")
                .attr("stroke-dasharray", "2,2")
            )
            .call(grid => grid.select(".domain").remove());

        g.append("line")
            .attr("x1", x("2014"))
            .attr("y1", y(pct14))
            .attr("x2", x("2024"))
            .attr("y2", y(pct24))
            .attr("stroke", "#c8102e")       
            .attr("stroke-width", 4)
            .attr("stroke-linecap", "round");

        g.selectAll("circle.point")
            .data(stats)
            .join("circle")
            .attr("class", "point")
            .attr("cx", d => x(d.season))
            .attr("cy", d => y(d.value))
            .attr("r", 8)
            .attr("fill", "#c8102e")
            .attr("stroke", "white")
            .attr("stroke-width", 2);

        g.selectAll("text.pct-label")
            .data(stats)
            .join("text")
            .attr("class", "pct-label")
            .attr("x", d => {
                if (d.season === "2024") return x(d.season) + 20; 
                    else return x(d.season); 
    })
            .attr("y", d => y(d.value) - 20) 
            .attr("text-anchor", "middle")
            .style("font-family", "Anton, sans-serif")
            .style("font-size", "32px")
            .style("fill", "#c8102e")
            .text(d => d.value.toFixed(1) + "%");


        g.selectAll("text.season-label")
            .data(stats)
            .join("text")
            .attr("class", "season-label")
            .attr("x", d => x(d.season))
            .attr("y", d => y(d.value) + 28)
            .attr("text-anchor", "middle")
            .style("font-family", "Anton, sans-serif")
            .style("font-size", "20px")
            .style("fill", "#1a1a1a")
            .text(d => d.season);

        const yAxis = d3.axisLeft(y)
            .ticks(4)
            .tickFormat(d => d + "%");

        g.append("g")
            .attr("transform", `translate(${-40},0)`)
            .call(yAxis)
            .call(axis => axis.selectAll("text")
                .style("font-size", "13px")
                .style("font-family", "Roboto, sans-serif")
                .style("fill", "#6c757d")
            )
            .call(axis => axis.selectAll("line")
                .attr("stroke", "#dee2e6")
            )
            .call(axis => axis.select(".domain").remove());

svg.append("text")
    .attr("x", boxWidth / 2)
    .attr("y", boxHeight - 30)
    .attr("text-anchor", "middle")
    .style("font-family", "Roboto, sans-serif")
    .style("font-size", "12px")
    .style("fill", "#6c757d")
    .text("Mid-range usage collapsed from ~27% of all shots to ~11% in 10 years.");

svg.append("text")
    .attr("x", boxWidth / 2)
    .attr("y", boxHeight - 15)
    .attr("text-anchor", "middle")
    .style("font-family", "Roboto, sans-serif")
    .style("font-size", "12px")
    .style("fill", "#6c757d")
    .text("Each point shows the share of total field goal attempts taken from the mid-range.");


    });
}

renderMidrangeSlope();

function renderClosingSummary() {
    const containerSel = d3.select("#closing-thoughts-chart");
    containerSel.html("");

    const node = containerSel.node();
    const boxWidth = node.clientWidth;
    const boxHeight = node.clientHeight; 

    const svg = containerSel
        .append("svg")
        .attr("width", boxWidth)
        .attr("height", boxHeight)
        .attr("class", "closing-era-comparison");

    const margin = { top: 40, right: 40, bottom: 60, left: 40 };
    const innerWidth = boxWidth - margin.left - margin.right;
    const innerHeight = boxHeight - margin.top - margin.bottom;

    const leftCenterX  = margin.left + innerWidth * 0.28;
    const rightCenterX = margin.left + innerWidth * 0.72;
    const centerY      = margin.top + innerHeight * 0.55;

    const leftRimR        = 35;
    const leftMidR        = 80;
    const leftThreeR      = 120;

    const rightRimR       = 40;
    const rightMidR       = 55;
    const rightThreeR     = 120;

    const rimColor    = "#c8102e";  // red
    const midColor    = "#f4a261";  // orange 
    const threeColor  = "#ffce1cff";  
    const neutralFill     = "#d9d9d9";  
    const textDark        = "#1a1a1a";
    const textGray        = "#6c757d";
    const accentBlue      = "#000000ff";

    function softCircle(g, cx, cy, r, fill, fillOpacity, stroke, strokeOpacity) {
        g.append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", r)
            .attr("fill", fill)
            .attr("fill-opacity", fillOpacity)
            .attr("stroke", stroke || fill)
            .attr("stroke-width", 2)
            .attr("stroke-opacity", strokeOpacity != null ? strokeOpacity : fillOpacity * 0.6);
    }

    const leftGroup = svg.append("g").attr("class", "era-left");

    // LEFT ERA 
softCircle(leftGroup, leftCenterX, centerY, leftThreeR, threeColor, 0.25, threeColor, 0.3); // yellow outer ring
softCircle(leftGroup, leftCenterX, centerY, leftMidR, midColor, 0.3, midColor, 0.4);       // orange mid ring
softCircle(leftGroup, leftCenterX, centerY, leftRimR, rimColor, 0.35, rimColor, 0.6);      // red inner circle


    leftGroup.append("text")
        .attr("x", leftCenterX)
        .attr("y", centerY - leftThreeR - 30)
        .attr("text-anchor", "middle")
        .style("font-family", "Anton, sans-serif")
        .style("font-size", "20px")
        .style("fill", textDark)
        .text("Early 2010s (~2014)");

    leftGroup.append("text")
        .attr("x", leftCenterX)
        .attr("y", centerY - leftThreeR - 8)
        .attr("text-anchor", "middle")
        .style("font-family", "Roboto, sans-serif")
        .style("font-size", "13px")
        .style("fill", accentBlue)
        .text("Mid-range volume high");

    // RIGHT ERA 
    const rightGroup = svg.append("g").attr("class", "era-right");

softCircle(rightGroup, rightCenterX, centerY, rightThreeR, threeColor, 0.25, threeColor, 0.3);
softCircle(rightGroup, rightCenterX, centerY, rightMidR, midColor, 0.3, midColor, 0.4);
softCircle(rightGroup, rightCenterX, centerY, rightRimR, rimColor, 0.35, rimColor, 0.6);


    rightGroup.append("text")
        .attr("x", rightCenterX)
        .attr("y", centerY - rightThreeR - 30)
        .attr("text-anchor", "middle")
        .style("font-family", "Anton, sans-serif")
        .style("font-size", "20px")
        .style("fill", textDark)
        .text("Modern Era (~2024)");

    rightGroup.append("text")
        .attr("x", rightCenterX)
        .attr("y", centerY - rightThreeR - 8)
        .attr("text-anchor", "middle")
        .style("font-family", "Roboto, sans-serif")
        .style("font-size", "13px")
        .style("fill", accentBlue)
        .text("Rim + 3s dominate");

    const arrowGroup = svg.append("g").attr("class", "arrow-group");

    const arrowX1 = (leftCenterX + rightCenterX) / 2 - 30;
    const arrowX2 = (leftCenterX + rightCenterX) / 2 + 30;
    const arrowY  = centerY;

    arrowGroup.append("line")
        .attr("x1", arrowX1)
        .attr("y1", arrowY)
        .attr("x2", arrowX2)
        .attr("y2", arrowY)
        .attr("stroke", accentBlue)
        .attr("stroke-width", 3)
        .attr("stroke-linecap", "round");

    arrowGroup.append("path")
        .attr("d", `M ${arrowX2-10} ${arrowY-6} L ${arrowX2} ${arrowY} L ${arrowX2-10} ${arrowY+6} Z`)
        .attr("fill", accentBlue)
        .attr("stroke", "none");

   
    const legendY = boxHeight - margin.bottom + 20;
    const legendGroup = svg.append("g")
        .attr("class", "legend-group")
        .attr("transform", `translate(${boxWidth/2 - 20},${legendY})`);

    const legendItems = [
        {
            label: "At the Rim (High Value)",
            color: rimColor,
            fillOpacity: 0.35,
            stroke: rimColor
        },
        {
            label: "Mid-Range (Low Volume)",
            color: midColor,
            fillOpacity: 0.8,
            stroke: midColor
        },
        {
            label: "Three-Point (High Volume)",
            color: threeColor,
            fillOpacity: 0.12,
            stroke: threeColor
        }
    ];

    const legendSpacing = 220;

    const eachLegend = legendGroup.selectAll("g.legend-item")
        .data(legendItems)
        .join("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(${(i-1)*legendSpacing},0)`);

    eachLegend.append("circle")
        .attr("r", 14)
        .attr("cx", 0)
        .attr("cy", -5)
        .attr("fill", d => d.color)
        .attr("fill-opacity", d => d.fillOpacity)
        .attr("stroke", d => d.stroke)
        .attr("stroke-width", 2)
        .attr("stroke-opacity", 0.6);

    eachLegend.append("text")
        .attr("x", 22)
        .attr("y", 0)
        .style("font-family", "Roboto, sans-serif")
        .style("font-size", "13px")
        .style("fill", textDark)
        .text(d => d.label);

}

renderClosingSummary();

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