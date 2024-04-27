import * as d3 from "d3";

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
}

export default function drawChart(rawData) {
    if (rawData.length === 0) {
        return;
    }
    d3.select('#chart').selectAll("*").remove(); // This line clears the SVG

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
    if (minValue < 0 && maxValue > 0) {
        svg.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", y(0))
            .attr("y2", y(0))
            .attr("stroke-width", 2)
            .attr("stroke", "black")
            .style("stroke-dasharray", ("3, 3"));
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
            focus.style("opacity", 1);
            focusLayer.style("opacity", 1);
            tooltip.style("opacity", 1);
        })
        .on("mouseout", function () {
            focus.style("opacity", 0);
            focusLayer.style("opacity", 0);
            tooltip.style("opacity", 0);
        })
        .on("mousemove", mousemove);

    function mousemove(event) {
        const x0 = x.invert(d3.pointer(event, this)[0]),
            i = d3.bisector(d => d.date).left(data, x0, 1),
            d0 = data[i - 1],
            d1 = data[i],
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;
        focus.attr("cx", x(d.date))
            .attr("cy", y(d.value));
        focusLayer.attr("cx", x(d.date))
            .attr("cy", y(d.value));
        tooltip.html(`${d3.timeFormat('%Y-%m-%d')(d.date)}<br/>${formatCurrency(d.value)}`)
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 10}px`)
            .style('opacity', 1)
    }
}