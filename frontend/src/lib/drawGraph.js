import * as d3 from "d3";

export default function drawChart(rawData) {
    let data = rawData.map(d => ({date: new Date(d.epochTimestamp), value: d.value}));

    const oldestDate = data[0].date;
    const newestDate = data[data.length - 1].date;
    const range = rawData[rawData.length - 1].epochTimestamp - rawData[0].epochTimestamp;
    const twoTenthDate = new Date(rawData[0].epochTimestamp + range * 0.2);
    const fourTenthDate = new Date(rawData[0].epochTimestamp + range * 0.4);
    const sixTenthDate = new Date(rawData[0].epochTimestamp + range * 0.6);
    const eightTenthDate = new Date(rawData[0].epochTimestamp + range * 0.8);

    const margin = {top: 100, right: 100, bottom: 100, left: 100},
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
    svg.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y(0))
        .attr("y2", y(0))
        .attr("stroke-width", 2)
        .attr("stroke", "black")
        .style("stroke-dasharray", ("3, 3"));

    // Draw line
    svg.append("path")
        .data([data])
        .attr("class", "line")
        .attr("d", line)
        .style("fill", "none")
        .style("stroke", "green")
        .style("stroke-width", "2px");

    // Add the X Axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .tickValues([oldestDate, twoTenthDate, fourTenthDate, sixTenthDate, eightTenthDate, newestDate])
            .tickFormat(d3.timeFormat('%Y-%m-%d')))
        .append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2) // Center the label
        .attr('y', margin.bottom - 20) // Position below the x-axis line
        .attr('fill', '#000') // Text color
        .attr('text-anchor', 'middle') // Center the text
        .text('Date (YYYY-MM-DD)');

    // Add the Y Axis
    svg.append("g")
        .call(d3.axisLeft(y))
        .append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)') // Rotate the text for a vertical label
        .attr('y', 0 - margin.left) // Position to the left of the y-axis line
        .attr('x', 0 - (height / 2)) // Center the label vertically
        .attr('dy', '1em') // Nudge the label down a bit
        .attr('fill', '#000') // Text color
        .attr('text-anchor', 'middle') // Center the text
        .text('Net Worth in USD');

    // Dot and tooltip setup
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background-color', 'white')
        .style('padding', '10px')
        .style('border-radius', '5px')
        .style('border', '1px solid #ccc')
        .style('opacity', 0)
        .style('pointer-events', 'none');

    svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d.date))
        .attr("cy", d => y(d.value))
        .attr("r", 3)
        .on("mouseover", (event, d) => {
            tooltip.transition()
                .duration(200)
                .style('opacity', .9);
            tooltip.html(`Date: ${d3.timeFormat('%Y-%m-%d')(d.date)}<br/>Net Worth: ${d.value}`)
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY - 10}px`);
        })
        .on("mouseout", () => {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
}