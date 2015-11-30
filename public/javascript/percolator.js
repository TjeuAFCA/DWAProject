/**
 * Created by tjeuj_000 on 24-11-2015.
 */

var connection = new WebSocket("ws://localhost:3000");

/**
 * Get a list of all memory models.
 */
window.onload = function () {
    console.log("LOADING ALL MEMORY MODELS");
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", '/api/MemoryModels', true);
    xhttp.onload = function (e) {
        var res = JSON.parse(xhttp.responseText);

        // SET MEMORY MODELS IN SELECTBOX
        var memoryModels = res;
        var sel = document.getElementById('memoryModelsList');
        for (var i = 0; i < memoryModels.length; i++) {
            $(sel).append("<li><a onclick='chooseMemoryModel(this, false)' data-value='" + memoryModels[i].mmid + "' data-version='" + memoryModels[i].version + "'  href='#'>" + memoryModels[i].modelName + "</a></li>")
        }

    };
    xhttp.send();
};


/**
 * Get a memory model with a given ID. And get previous versions of these.
 */
var currentMemoryModel = {};
function chooseMemoryModel(id, prevVersion) {
    console.log("GETTING SPECIFIC MEMORY MODEL");
    $("#undoButton").css("display", "block");
    var version = null;
    if (prevVersion) {
        id = currentMemoryModel.id;
        if (currentMemoryModel.version > 1) {
            version = currentMemoryModel.version - 1;
            currentMemoryModel.version += -1;
        } else {
            version = 1;
            alert("There is not an older version");
        }
    } else {
        var currentVersion = parseInt($(id).attr('data-version'));
        id = $(id).attr('data-value');
        currentMemoryModel.id = id;
        currentMemoryModel.version = currentVersion;
    }
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", '/api/MemoryModels/' + id + '/' + version, true);
    xhttp.onload = function (e) {
        var res = JSON.parse(xhttp.responseText);
        currentMemoryModel.memoryModel = res.memoryModel;
        // SET MEMORY MODEL ON SCREEN
        drawMemoryModel(res.memoryModel);
    };
    xhttp.send();
}


/**
 * Draws the memory model.
 */
function drawMemoryModel(model) {

    var diagramContainer = $('#diagramContainer');
    diagramContainer.children().remove();

    var stack = diagramContainer.append("<div class='Stack'></div>");
    var heap = diagramContainer.append("<div class='Heap'></div>");

    drawFrames("Stack", model.stack);
    drawFrames("Heap", model.heap);
}


/**
 * Draws the frames of the memory model.
 */
function drawFrames(location, frame) {
    $('.' + location).append(
        "<div class='frameLabel'>" + location + "</div>"
    );

    frame.forEach(function (item) {

        $('.' + location).append(
            "<div id='" + item.id + "' class='frame'> " +
            "<div class='frameLabel'>" + item.name + "</div>" +
            "</div>");

        if (item.vars) drawVars('#' + item.id, item.vars);
        if (item.funcs)drawFuncs('#' + item.id, item.funcs);

    });
}

/**
 * Draws the variables of the memory model.
 */
function drawVars(location, vars) {

    vars.forEach(function (variable) {
        //console.log(variable.id);

        var value = determineVar(variable);
        $(location).append(
            "<div class='variable'>" +
            "<div class='variableLabel'>" + variable.name + "</div>" +
            "<div id='" + variable.id + "' class='variableValue'>" + value + "</div>" +
            "</div>");
    });
}

/**
 * Draws the functions of the memory model.
 */
function drawFuncs(location, funcs) {


    funcs.forEach(function (variable) {
        var value = determineVar(variable);

        $(location).append(
            "<div class='variable'>" +
            "<div class='variableLabel'>" + variable.name + "</div>" +
            "<div id='" + variable.id + "' class='variableValue pointer'>" + value + "</div>" +
            "</div>");
    });
}


/**
 * Looks of the variable is a pointer or a variable
 */
var relations = [];
function determineVar(variable) {
    if (variable.reference) {
        relations.push({source: variable.id, target: variable.reference});
        return "";
    }
    else if (variable.undefined) return "undefined";
    else if (variable.value) return variable.value;
    else return "null"
}

/**
 * Puts jsPlumb into the application
 */
function initPlumb() {
    jsPlumb.ready(function () {
        jsPlumb.Defaults.Container = $("#diagramContainer");

        var common = {
            endpoint: "Blank",
            anchor: ["Left", "Right"],
            overlays: [["Arrow", {width: 40, length: 20}]],
            isSource: true,
            isTarget: true
        };

        //function referenceStyle (variable) {
        //    if (variable === "pointer"){
        //
        //    }
        //
        //        endpoint: "Dot",
        //        anchor: ["Left", "Right"],
        //        overlays: [["Arrow", {width: 40, length: 20}]],
        //        isSource: true,
        //        isTarget: true
        //}


        $(".frame").draggable({
            drag: function (e) {
                //console.log("REPAINTING");
                jsPlumb.repaintEverything();
            },
            containment: "parent"
        });

        //jsPlumb.addEndpoint($(".frame"), common);
        //jsPlumb.addEndpoint($(".pointer"), common);
        relations.forEach(function (relation) {
            //console.log(relation);
            jsPlumb.connect({
                source: relation.source.toString(),
                target: relation.target.toString()
            }, common);
        });
        //jsPlumb.connect({
        //    source: "var1pointer",
        //    target: "var3pointer"
        //}, common);

        //jsPlumb.addEndpoint($(".pointer"), common);


    });
}