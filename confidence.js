function buildCanvas(selector, width, height, xlabel, ylabel, xdomain, ydomain) {
    var svg = d3.select(selector)
    var WIDTH = width,
        HEIGHT = height,
        MARGINS = {
            top: 20,
            right: 20,
            bottom: 50,
            left: 70
        }
    var xScale = d3.time.scale().range([MARGINS.left, WIDTH - MARGINS.right]).domain(xdomain)
    var yScale = d3.scale.linear().range([HEIGHT - MARGINS.bottom, MARGINS.top]).domain(ydomain)

    var xAxis = d3.svg.axis()
        .scale(xScale).tickSize(-HEIGHT, 0, 0)
    var yAxis = d3.svg.axis()
        .scale(yScale).tickSize(-WIDTH, 0, 0)
        .orient("left")

    svg.append("svg:g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (HEIGHT - MARGINS.bottom) + ")")
        .call(xAxis);
    svg.append("svg:text")
        .attr("transform", "translate(" + (WIDTH / 2) + " ," + HEIGHT + ")")
        .style("text-anchor", "middle")
        .attr("dx", "1em")
        .text(xlabel);
    svg.append("svg:g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + (MARGINS.left) + ",0)")
        .call(yAxis);
    svg.append("svg:text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0)
        .attr("x", 0 - (HEIGHT / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(ylabel);

    return {
        "svg": svg,
        "xmin": MARGINS.left,
        "xmax": WIDTH - MARGINS.right,
        "ymin": MARGINS.top,
        "ymax": HEIGHT - MARGINS.bottom,
        "width": WIDTH - MARGINS.right - MARGINS.left,
        "height": MARGINS.top - HEIGHT + MARGINS.bottom,
        "xscale": xScale,
        "yscale": yScale
    }
}

function build_legend(canvas, position, labels) {
   var legend = canvas.svg.selectAll('.legend')
        .data(labels)
        .enter()
        .append('svg:g')
        .attr('class', 'legend');

    var left = canvas.xmin + 15
    var top = canvas.ymin + 10
    if (position == 'bottom-right') {
        var left = canvas.xmax - d3.max(labels.map(function(d){ return d.name.length * 7; }))
        var top = canvas.ymax - (labels.length * 20)
    }

    legend.append('svg:rect')
        .attr('x', left)
        .attr('y', function(d, i){ return top + i *  20;})
        .attr('width', 10)
        .attr('height', 10)
        .style('fill', function(d) {
          return d.color;
        });

    legend.append('svg:text')
        .attr('x', left + 15)
        .attr('y', function(d, i){ return top + (i *  20) + 9;})
        .text(function(d){ return d.name; });
}

class ConfidencePlot {

    constructor(selector, width, height, title, legend_pos='top-left') {
        this.selector = selector
        this.width = width
        this.height = height
        this.title = title
        this.legend_pos = legend_pos
    }

    draw(series) {

        var all_dates = Array();
        var all_values = Array();

        for (var i=0; i < series.length; i++) {
            all_dates.push(d3.min(series[i].values.map(function(d){ return d.ts; })));
            all_dates.push(d3.max(series[i].values.map(function(d){ return d.ts; })));
            all_values.push(series[i].values[series[i].values.length-1].low);
            all_values.push(series[i].values[series[i].values.length-1].high);
        }

        var mindate = d3.min(all_dates)
        var maxdate = d3.max(all_dates)
        var minval = d3.min(all_values)
        var maxval = d3.max(all_values)

        var xdomain = [mindate, maxdate]
        var ydomain = [0, maxval * 1.2]

        var canvas = buildCanvas(this.selector, this.width, this.height, 'time', this.title, xdomain, ydomain)

        var lineGen = d3.svg.line()
            .x(function(d) {
                return canvas.xscale(d.ts);
            })
            .y(function(d) {
                return canvas.yscale(d.val);
            });

        var areaGen = d3.svg.area()
            .x(function(d) { return canvas.xscale(d.ts); })
            .y0(function(d) {
                return canvas.yscale(d.low); })
            .y1(function(d) {
                return canvas.yscale(d.high); });

        var c10 = d3.scale.category10();

        for (var i=0; i < series.length; i++) {
            canvas.svg.append('svg:path')
                .attr('d', lineGen(series[i].values))
                .attr('stroke', c10(i))
                .attr('stroke-width', 2)
                .attr('fill', 'none');

            canvas.svg.append('svg:path')
                .attr('d', areaGen(series[i].values))
                .attr('stroke', c10(i))
                .attr('stroke-width', 2)
                .attr('fill', c10(i))
                .attr('opacity', .3);
        }

        var labels = []
        for (var i=0; i < series.length; i++) {
            labels[i] = { "name": series[i].id, "color": c10(i) }
        }
        build_legend(canvas, this.legend_pos, labels)
    }
}

