/**
 * Sets up and holds the websocket connection
 * @type {WebSocket}
 */

var connection = new WebSocket("ws://localhost:3000");

/**
 *  Holds the current memory model which is displayed on the webpage
 */
var currentMemoryModel;

/**
 *  Holds the highest version available of the current memory model
 */
var highestVersion;

/**
 * Contains all the relations to be drawn on the screen. Gets emptied after done drawing the relations on the screen
 * @type {Array}
 */
var relations = [];

/**
 * Listener to messages received by the websocket. Fired when a message is received.
 *
 * @param message contains the message received by the websocket
 */
connection.onmessage = function(message) {
    var data = JSON.parse(message.data);
    console.log(data);

    switch(data.msgType){
        case "newData":
            updateMemoryModel(data);
            break;
    }
};

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
            //console.log(memoryModels[i])
            $(sel).append("<li class='list-group-item'><a id='" + memoryModels[i].mmid + "'onclick='chooseMemoryModel(this, false, false)' data-value='" +
                memoryModels[i].mmid + "' data-version='" + memoryModels[i].version + "'  href='#'>" +
                memoryModels[i].modelName + "</a></li>")
        }

    };
    xhttp.send();
};


/**
 * Get a memory model with a given ID. And get previous versions of these.
 *
 * @param id identifier for the chosen memory model.
 * @param prevVersion boolean determining whether an older is chosen
 * @param undo boolean determining whether the undo button has been pressed
 */
function chooseMemoryModel(id, prevVersion, undo) {
    var version = null;
    var firstTime = false;
    var xhttp = new XMLHttpRequest();

    $("#undoButton").css("display", "block");

    if (prevVersion) {
        if(undo) {
            id = currentMemoryModel.mmid;
            version = undoAction();
        }
        else{
            version = $(id).attr('data-version');
            id = currentMemoryModel.mmid;
        }
    } else {
        id = $(id).attr('data-value');
        firstTime = true;
    }

    xhttp.open("GET", '/api/MemoryModels/' + id + '/' + version, true);
    xhttp.onload = function (e) {
        var res = JSON.parse(xhttp.responseText);
        currentMemoryModel = res;

        if(firstTime) highestVersion = currentMemoryModel.version;

        getVersionList();
        setModelInfo();

        console.log(currentMemoryModel.id);

        // SET MEMORY MODEL ON SCREEN
        drawMemoryModel(res.memoryModel).then(function(){
            initPlumb();
            connection.send(JSON.stringify({msgType: "subscribeToChanges", data : {mmid: currentMemoryModel.id}}));
        });
    };
    xhttp.send();
}

/**
 * Updates the owner, name and current version of the memory model, displayed on the screen
 */
function setModelInfo(){
    $("#owner").html('Owner: '+ currentMemoryModel.owner);
    $("#modelName").html('Modelname: '+ currentMemoryModel.modelName);
    $("#version").html('Version: '+ currentMemoryModel.version);
}

/**
 * Determines and draws the list of versions available for the memory model
 */
function getVersionList(){
    var sel = document.getElementById('memoryModelVersionList');
    $(sel).empty();
    for(var i = 1; i < highestVersion+1; i++) {
        $(sel).append("<li class='list-group-item'><a onclick='chooseMemoryModel(this , true, false)' data-value='" +
            currentMemoryModel.mmid + "' data-version='" + i + "'  href='#'>  Version: "+ i + "</a></li>")

    }
}

/**
 * Removes the latest version and sets the single last version available to be active
 * @returns {Number} Version number of the new active version
 */
function undoAction(){
    var version;
    if (currentMemoryModel.version > 1) {
        $.ajax({
            url: '/api/MemoryModels/' + currentMemoryModel.mmid + '/' + currentMemoryModel.version,
            type: 'DELETE',
            success: function (response) {
                console.log('DELETED LAST VERSION');
            }

        });
        version = currentMemoryModel.version - 1;
        currentMemoryModel.version -= 1;
        highestVersion -= 1;
        return version;
    } else {
        version = 1;
        alert("There is not an older version");
        return version;
    }
}


/**
 * Draws the memory model
 *
 * @param model contains the data of the memory model
 * @returns {Promise} Promise to call actions when the drawing is done
 */
function drawMemoryModel(model) {

    return new Promise(function(resolve, reject){
        var diagramContainer = $('#diagramContainer');
        diagramContainer.children().remove();

        diagramContainer.append("<div class='Stack'></div>");
        diagramContainer.append("<div class='Heap'></div>");

        var promises = [];

        promises.push(drawFrames("Stack", model.stack));
        promises.push(drawFrames("Heap", model.heap));

        Promise.all(promises).then(function(){
            resolve();
        });
    })

}

/**
 * Draws the frames of the memory model.
 *
 * @param location Decides where the frames are drawn. Stack or Heap
 * @param frames the data of the memory model
 * @returns {Promise} Promise to call actions when the drawing is done
 */
function drawFrames(location, frames) {
    return new Promise(function(resolve, reject) {
        $('.' + location).append(
            "<div class='frameLabel'>" + location + "</div>"
        );

        frames.forEach(function (item) {
            $('.' + location).append(
                "<div id='" + item.id + "' class='frame'> " +
                "<div class='frameLabel'>" + item.name + "</div>" +
                "</div>");

            if (item.vars) drawVars('#' + item.id, item.vars);
            if (item.funcs)drawFuncs('#' + item.id, item.funcs);

        });
        resolve();
    });
}


/**
 * Draws the variables of the memory model.
 * @param location Location where the vars to be drawn in
 * @param vars Data containing the vars to be drawn
 */
function drawVars(location, vars) {
    vars.forEach(function (variable) {
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
 * @param location Location where the vars to be drawn in
 * @param funcs Data containing the vars to be drawn
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
 * @param variable Value to be converted to a variable, usable to draw with
 * @returns {String|Number} value to be drawn inside the variable or function
 */
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
 * Updates the memory model. Redraws the entire memory model and the relations
 * @param data Data containing the memory model that has to be drawn
 */
function updateMemoryModel(data){
    console.log(data);
    console.log("update memory model called " + data.data);

    if(data.data.new_val){
        console.log(data.data.new_val.memoryModel);
        drawMemoryModel(data.data.new_val.memoryModel).then(function(){
            redrawPlumbing()
        });
    }

}


/**
 * Initializes the JSPlumb script
 */
function initPlumb() {
    jsPlumb.ready(function () {

        jsPlumb.Defaults.Container = $("#diagramContainer");

        $(".frame").draggable({
            drag: function (e) {
                jsPlumb.repaintEverything();
            },
            containment: "parent"
        });

        redrawPlumbing();
    });
}

/**
 * Draws the connections between the frames and variables where needed.
 */
function redrawPlumbing(){

    var common = {
        endpoint: "Blank",
        anchor: ["Left", "Right"],
        overlays: [["Arrow", {width: 40, length: 20}]],
        isSource: true,
        isTarget: true
    };

    relations.forEach(function (relation) {
        jsPlumb.connect({
            source: relation.source.toString(),
            target: relation.target.toString()
        }, common);
    });

    relations = [];
}
