Promise.all([
    d3.csv("data/NBA_2014_Shots.csv"),
    d3.csv("data/NBA_2024_Shots.csv")
]).then(([data2014, data2024]) => {

    createShotShareChart(data2014, data2024);
    createCourtHeatmap(data2014, data2024);
    createEfficiencyScatterPlot(data2024);
    createPlayerProfileChart(data2024);
    createPositionMatrix(data2024);

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

/**
 * [Vis 3 - LINKED PART 1] Creates the efficiency vs. volume scatter plot.
 * @param {Array} data - The raw shot data.
 */
function createEfficiencyScatterPlot(data) {
    // 1. Process the data: group by player to get total shots and FG%.
    // 2. Create scales and axes.
    // 3. Draw circles for each player.
    // 4. Implement D3-brush. On the "end" event of the brush,
    //    call an update function for Vis 4, passing the selected player data.
}

/**
 * [Vis 4 - LINKED PART 2] Creates the player shot profile stacked bar chart.
 * @param {Array} data - The raw shot data.
 */
function createPlayerProfileChart(data) {
    // 1. Set up the chart area, but don't draw any bars initially.
    // 2. Create an "update" function that takes a list of players as an argument.
    // 3. This update function will filter the main dataset, calculate the shot
    //    profiles for the selected players, and draw/update the stacked bars.
}

/**
 * [Vis 5] Creates a matrix showing shot distribution by player position.
 * @param {Array} data - The raw shot data.
 */
function createPositionMatrix(data) {
    // 1. Process data: Group by Position, then by Shot Zone, and count the shots.
    // 2. Create scales for rows (Positions) and columns (Shot Zones).
    // 3. Draw rectangles (or circles) for each cell in the matrix.
    // 4. Use a color scale to represent the percentage of shots for that position.
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