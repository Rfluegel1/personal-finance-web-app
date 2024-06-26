import * as d3 from "d3";
import { formatCurrency } from '$lib/formatters';


export default function drawChart(rawData) {
    if (rawData.length === 0) {
        return;
    }
    d3.select('#chart').selectAll("*").remove(); // This line clears the SVG

    let data = rawData.map(d => ({date: new Date(d.epochTimestamp), value: d.value}));

    const oldestDate = data[0].date;
    const newestDate = data[data.length - 1].date;
    const range = rawData[rawData.length - 1].epochTimestamp - rawData[0].epochTimestamp;
    const oneFourthDate = new Date(rawData[0].epochTimestamp + range * 0.25);
    const halfDate = new Date(rawData[0].epochTimestamp + range * 0.5);
    const threeFourtDate = new Date(rawData[0].epochTimestamp + range * 0.75);

    const margin = {top: 100, right: 25, bottom: 100, left: 25},
        width = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    const svg = d3.select('#chart')
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const minValue = d3.min(data, d => d.value);
    const maxValue = d3.max(data, d => d.value);

    // Determine the scale factor
    const minScaleFactor = minValue < 0 ? 1.1 : 0.9;
    const maxScaleFactor = maxValue < 0 ? 0.9 : 1.1;

    const x = d3.scaleTime().range([0, width]).domain(d3.extent(data, d => d.date));
    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([minValue * minScaleFactor, maxValue * maxScaleFactor]);

    const line = d3.line().x(d => x(d.date)).y(d => y(d.value));

    // Add a neutral line at 0 net worth
    if (minValue < 0 && maxValue > 0) {
        svg.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", y(0))
            .attr("y2", y(0))
            .attr("stroke-width", 2)
            .attr("stroke", "gray")
            .style("opacity", 0.25)
            .style("stroke-dasharray", ("3, 3"))
    }

    // Draw line
    svg.append("path")
        .data([data])
        .attr("class", "line")
        .attr("d", line)
        .style("fill", "none")
        .style("stroke", "green")
        .style("stroke-width", "6px");

    // Add the X Axis
    const xAxis = svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .style("stroke-opacity", 0)
        .call(d3.axisBottom(x)
            .tickValues([oldestDate, oneFourthDate, halfDate, threeFourtDate, newestDate])
            .tickFormat(d3.timeFormat('%b %Y')))

    xAxis.selectAll("text")  // Select all text elements in the X axis group
        .style("font-size", "12px")
        .style('stroke', 'transparent')
        .style('fill', 'rgb(88, 94, 95)')

    xAxis.selectAll("line")  // Select all line elements in the X axis group
        .style("stroke-opacity", 0);

    const focusBar = svg.append("line")
        .attr("class", "focus-bar")
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke-width", 2)
        .attr("stroke", "black")
        .style("stroke-dasharray", ("3, 3"))
        .style("opacity", 0); // Initially hidden

    // Single dot for hover
    const focus = svg.append("circle")
        .style("fill", "green")
        .attr("stroke", "green")
        .attr("r", 10)
        .style("opacity", 0); // Initially hidden

    const focusLayer = svg.append("circle")
        .style("fill", "white")
        .attr("stroke", "white")
        .attr("r", 4)
        .style("opacity", 0); // Initially hidden

    // Tooltip for displaying information
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background-color', 'white')
        .style('padding', '10px')
        .style('border-radius', '5px')
        .style('border', '1px solid #ccc')
        .style('opacity', 0)
        .style('pointer-events', 'none');

    svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .style("opacity", 0)
        .on("mouseover", function () {
            focusBar.style("opacity", 1);
            focus.style("opacity", 1);
            focusLayer.style("opacity", 1);
            tooltip.style("opacity", 1);
        })
        .on("mouseout", function () {
            focusBar.style("opacity", 0);
            focus.style("opacity", 0);
            focusLayer.style("opacity", 0);
            tooltip.style("opacity", 0);
        })
        .on("mousemove", mousemove);

    function mousemove(event) {
        const focusSVG = `<span style="position: relative; display: inline-block; vertical-align: middle;"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8" fill="green" stroke="green"/> <!-- Larger Circle -->
    <circle cx="12" cy="12" r="3" fill="white" stroke="white"/> <!-- Smaller Circle on top -->
</svg></span>`;

        const x0 = x.invert(d3.pointer(event, this)[0]),
            i = d3.bisector(d => d.date).left(data, x0, 1),
            d0 = data[i - 1],
            d1 = data[i],
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;
        focusBar.attr("x1", x(d.date))
            .attr("x2", x(d.date))
        focus.attr("cx", x(d.date))
            .attr("cy", y(d.value));
        focusLayer.attr("cx", x(d.date))
            .attr("cy", y(d.value));

        const rect = document.querySelector('#chart > g > rect').getBoundingClientRect();
        const chartTop = rect.top + window.pageYOffset;

        tooltip.html(`<b>${d3.timeFormat('%b %d, %Y')(d.date)}</b><br/>${focusSVG} ${formatCurrency(d.value)}`)
            .style('opacity', 0) // Temporarily hide tooltip to calculate height without showing it
            .style('visibility', 'hidden'); // Ensure it does not affect layout while invisible

        // Force layout calculation to update dimensions
        tooltip.node().offsetHeight;

        const tooltipHeight = tooltip.node().offsetHeight;
        const tooltipWidth = tooltip.node().offsetWidth;

        tooltip.style('left', `${event.pageX - (tooltipWidth/2)}px`)
            .style('top', `${chartTop - tooltipHeight}px`) // Position above the rect by the height of the tooltip
            .style('opacity', 1)
            .style('visibility', 'visible'); // Make it visible again
    }
}