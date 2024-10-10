// main.js

const width = 800;
const height = 1000; 

const svg = d3.select("#map-container").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("display", "block")
    .style("margin", "0 auto");


const projection = d3.geoMercator()
    .center([-2.5, 55.5]) 
    .scale(3200) 
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

const tooltip = d3.select("body").append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("display", "none")
    .style("background-color", "lightgray")
    .style("border", "1px solid black")
    .style("padding", "5px")
    .style("border-radius", "5px");

const legend = svg.append("g")
    .attr("id", "legend")
    .attr("transform", `translate(${width - 200}, 20)`);
legend.style("display", "none");

d3.json("uk.geojson").then(function(uk) {
    svg.append("g")
        .selectAll("path")
        .data(uk.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", "#BFD3C1")
        .attr("stroke", "#333");

    loadTownData();
});

function loadTownData() {
    const townLimit = document.getElementById('towns-slider').value;
    d3.json("http://34.147.162.172/Circles/Towns/" + townLimit).then(function(towns) {
        const mapType = document.getElementById('map-type').value;
        if (mapType === 'bubble') {
            plotBubbleMap(towns);
            legend.style("display", "none");
        } else if (mapType === 'heatmap') {
            plotHeatMap(towns);
            legend.style("display", "block");
            updateLegend(towns);
        }
    }).catch(function(error) {
        console.error("Error fetching town data:", error);
    });
}

function plotBubbleMap(townData) {
    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(townData, d => d.Population)])
        .range([0, 20]);

    svg.selectAll(".town-group").remove();

    const towns = svg.selectAll(".town-group")
        .data(townData, d => d.Town)
        .join("g")
        .attr("class", "town-group")
        .attr("transform", d => `translate(${projection([d.lng, d.lat])})`);

    towns.append("circle")
        .attr("r", 0) 
        .attr("fill", "blue") 
        .on("mouseover", function(event, d) {
            tooltip.style("display", "block")
                .html(`County: ${d.County}<br>Population: ${d.Population}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("display", "none");
        })
        .transition()
        .duration(500)
        .ease(d3.easeBounce)
        .attr("r", d => radiusScale(d.Population));

    towns.append("text")
        .attr("dy", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", "#333")
        .text(d => d.Town);
}

function plotHeatMap(townData) {
    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
        .domain([0, d3.max(townData, d => d.Population)]);

    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(townData, d => d.Population)])
        .range([0, 20]);

    svg.selectAll(".town-group").remove();

    const towns = svg.selectAll(".town-group")
        .data(townData, d => d.Town)
        .join("g")
        .attr("class", "town-group")
        .attr("transform", d => `translate(${projection([d.lng, d.lat])})`);

    towns.append("circle")
        .attr("r", 0) 
        .attr("fill", d => colorScale(d.Population))
        .attr("opacity", 0)
        .on("mouseover", function(event, d) {
            tooltip.style("display", "block")
                .html(`County: ${d.County}<br>Population: ${d.Population}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("display", "none");
        })
        .transition()
        .duration(500)
        .ease(d3.easeBounce)
        .attr("r", d => radiusScale(d.Population)) 
        .attr("opacity", 0.6);

    towns.append("text")
        .attr("dy", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", "#333")
        .text(d => d.Town);
}

function updateLegend(townData) {
    const maxPopulation = d3.max(townData, d => d.Population);
    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
        .domain([0, maxPopulation]);

    legend.selectAll("*").remove();

    const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("x2", "100%");

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colorScale(0));
    
    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colorScale(maxPopulation));

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 180)
        .attr("height", 10)
        .style("fill", "url(#legend-gradient)");

    legend.append("text")
        .attr("x", 0)
        .attr("y", 25)
        .style("font-size", "12px")
        .text("Low");

    legend.append("text")
        .attr("x", 160)
        .attr("y", 25)
        .style("font-size", "12px")
        .attr("text-anchor", "end")
        .text("High");

    legend.append("text")
        .attr("x", 90)
        .attr("y", 40)
        .style("font-size", "12px")
        .attr("text-anchor", "middle")
        .text(`Population (0 - ${maxPopulation.toLocaleString()})`);
}

const slider = document.getElementById('towns-slider');
const sliderValue = document.getElementById('slider-value');
const inputBox = document.getElementById('towns-input');

slider.addEventListener('input', function() {
    sliderValue.textContent = slider.value;
    inputBox.value = slider.value;
});

inputBox.addEventListener('input', function() {
    slider.value = inputBox.value;
    sliderValue.textContent = inputBox.value;
});

document.getElementById('reload-btn').addEventListener('click', loadTownData);
