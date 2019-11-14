function validateOptionsSelection() {
    makeChart();
}

function addOption(name) {
    let my_colors = ['#1F77B4', '#FF7F0E', '#2CA02C', '#D62728', '#9467BD', '#8C564B', '#CFECF9', '#7F7F7F', '#BCBD22', '#17BECF'];
    var checkboxes = document.getElementsByName("option");
    var index = checkboxes.length;

    localStorage.setItem("COLOR_" + name, my_colors[index]);

    var myDiv = document.getElementById("options");
    var checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.name = "option";
    checkbox.value = name;
    checkbox.id = "id_option_" + name;
    checkbox.checked = "checked";
    checkbox.onclick = () => validateOptionsSelection();

    var label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.style.color = my_colors[index];
    label.appendChild(document.createTextNode(name));
    myDiv.appendChild(checkbox);
    myDiv.appendChild(label);

    var br = document.createElement('br');
    myDiv.appendChild(br);
}

function uploadFile() {
    let files = document.getElementById('input_file').files;
    let file = files[0];
    let reader = new FileReader();
    reader.onload = (function (theFile) {
        return function (e) {
            let result = Array.from(e.target.result);
            let new_result = result.filter(function(item) {
                return item !== '>' && item !== '<';
            }).join('');
            let data = $.csv.toObjects(new_result);
            if (!localStorage[data[0].TICKER]) {
                localStorage.setItem(data[0].TICKER, new_result);
                addOption(data[0].TICKER);
                makeChart();
            }
        }
    })(file);
    reader.readAsText(file);
}

//yyyymmdd
function ParseDate(str) {
    let new_str = str.slice(0, 4) + "-" + str.slice(4, 6) + "-" + str.slice(6, 8);
    return new_str;
}

//hhmmss
function ParseTime(str) {
    let new_str = str.slice(0, 2) + ":" + str.slice(2, 4) + ":" + str.slice(4, 6) + "." + "000";
    return new_str;
}

function Parse(date, time) {
    let new_time = ParseDate(date) + "T" + ParseTime(time) + "+03:00";
    let new_date = new Date(Date.parse(new_time));
    //console.log(date + " " + time + " = " + new_date);
    return new_date;
}

function makeChart() {

    let checkboxes = document.getElementsByName("option");
    let checked = [];
    for (let i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked && localStorage[checkboxes[i].value]) {
            checked.push(checkboxes[i].value);
        }
    }

    let div_example = document.getElementById('example');
    let new_div = document.createElement("div");
    new_div.id = "example";
    new_div.setAttribute("style", "width: 1200px; height: 900px; float: left");

    div_example.replaceWith(new_div);

    let xScale = new Plottable.Scales.Time();
    let yScale = new Plottable.Scales.Linear();
    let xAxis = new Plottable.Axes.Time(xScale, "bottom");
    let yAxis = new Plottable.Axes.Numeric(yScale, "left");

    /*let plots = [];
    for (let value of checked) {
        console.log(value);
        let data = localStorage.getItem(value);
        data = $.csv.toObjects(data);
        let plot = new Plottable.Plots.Line()
            .x(function(d) {
                let date = Parse(d["DATE"], d["TIME"]);
                return date;
            }, xScale)
            .y(function(d) {return d["OPEN"]; }, yScale);
        plot.addDataset(new Plottable.Dataset(data));
        plots.push(plot);
    }

    let group = new Plottable.Components.Group(plots);*/

    let chosen_radio_button = localStorage.getItem("CHOICE_RADIO");

    let group = new Plottable.Plots.Line()
        .x(function(d) {
            let date = Parse(d["DATE"], d["TIME"]);
            return date;
        }, xScale)
        .y(function(d) {return +d[chosen_radio_button]; }, yScale)
        .attr("stroke", function (d, i, dataset) {
            let name = dataset.metadata().name;
            return localStorage.getItem("COLOR_" + name);
        });

    for (let value of checked) {
        console.log(value);
        let data = localStorage.getItem(value);
        data = $.csv.toObjects(data);
        group.addDataset(new Plottable.Dataset(data, {name: value}));
    }

    let pzi = new Plottable.Interactions.PanZoom();
    pzi.addXScale(xScale);
    pzi.addYScale(yScale);
    pzi.attachTo(group);

    let chart = new Plottable.Components.Table([
        [yAxis, group],
        [null, xAxis]
    ]);

    chart.renderTo('#example');

    var tooltipAnchorSelection = group
        .foreground()
        .append("circle")
        .attr("r", 3)
        .attr("opacity", 0);

    var tooltipAnchor = $(tooltipAnchorSelection.node());

    tooltipAnchor.tooltip({
        animation: false,
        container: "body",
        placement: "auto",
        title: "text",
        trigger: "manual"
    });

    let pointer = new Plottable.Interactions.Pointer();

    pointer.onPointerMove(function(p) {
        let closest = group.entityNearest(p);
        if (closest) {
            tooltipAnchor.attr({
                cx: closest.position.x,
                cy: closest.position.y,
                "data-original-title": "Value: " + closest.datum[localStorage.getItem("CHOICE_RADIO")]
            });
            tooltipAnchor.tooltip("show");
        }
    });

    pointer.onPointerExit(function () {
        tooltipAnchor.tooltip("hide");
    });

    pointer.attachTo(group);
}

function addListeners() {
    let radios = document.getElementsByName('data_y');
    for (let i = 0; i < radios.length; ++i) {
        radios[i].onclick = function () {
            localStorage.setItem("CHOICE_RADIO", this.value);
            makeChart();
        };
    }
}