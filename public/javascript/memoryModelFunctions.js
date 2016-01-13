/**
 *  Holds the current memory model which is displayed on the webpage
 */
var currentMemoryModel;

/**
 *  Holds the highest version available of the current memory model
 *  @type (number)
 */
var highestVersion;

/**
 * Contains a boolean with a check if its the first time the memory model is loaded
 * @type {boolean}
 */
var firstTime = false;

/**
 * Contains all the relations to be drawn on the screen. Gets emptied after done drawing the relations on the screen.
 * @type {Array}
 */
var relations = [];

/**
 * Contains a check to make sure JsPlumb is only initialized once
 * @type {Boolean}
 */
var plumbInitialized = false;

/**
 * Contains the highest ID used in the memory model.
 * Is used for determining new id's by adding them using the diagram view
 * @type {number}
 */
var highestID = 0;

/**
 * Contains the last edited div, used by the edit fields
 * @type {*|jQuery|HTMLElement}
 */
var lastEditedDiv;

/**
 * Contains a check if a user selected a memory model
 * @type {Boolean}
 */
var memoryModelLoaded = false;

/**
 * Contains a check if editing mode is reference or variable editing
 * @type {Boolean}
 */
var toggleEditingMode = false;

/**
 * Main div where the memory model should be drawn
 * @type {string}
 */
var diagramContainer = '#diagramContainer';

/**
 * Adds a variable to the given frame
 * @param frame the frame where the new var is added to
 */
function addVarToFrame(frame) {
    highestID++;

    var newVariableName = "myVar";
    var newVariableValue = "myValue";
    var newVariableType = "string";
    var oldMmModel = currentMemoryModel;

    $(frame).append(
        "<div class='variable'>" +
        "<div class='variableLabel'>" + newVariableName + "</div>" +
        "<div id='" + highestID + "' class='variableValue'>" + newVariableValue + "</div>" +
        "</div>");

    console.log(frame);

    attachEventListeners();

    var newVariable = {
        id: highestID,
        name: newVariableName,
        value: newVariableValue,
        type: newVariableType
    };

    lookForFrameOrVar(frame[0].id, function (indexList) {
        if (indexList.location == "heap")
            currentMemoryModel.memoryModel.heaps[indexList.heapIndex][indexList.frameIndex].vars.push(newVariable);
        else currentMemoryModel.memoryModel.stacks[indexList.stackIndex][indexList.frameIndex].vars.push(newVariable);
    });

    percolatorSend({
        msgType: 'updateMemoryModel',
        data: {newMemoryModel: currentMemoryModel, oldMemoryModel: oldMmModel}
    });
}

/**
 * Opens the editfield with information
 * @param me the frame where the information will be extracted from
 */
function openEditField(me) {
    assignValuesToEditFields(me);

    var divName = "#editWrapper";
    if ($(divName).css("display", "none")) $(divName).slideToggle();
    lastEditedDiv = $(me);
}

/**
 * extracs data from the origin field and assigns it to the required fields
 * @param origin
 */
function assignValuesToEditFields(origin) {

    var value = $(origin).children()[1].innerText;
    $("#selectedInputField").val(value);

    var name = $(origin).children()[0].innerText;
    $("#selectedNameField").val(name);

    var activeType = ($(origin).hasClass("_jsPlumb_endpoint_anchor_")) ?
        "#typeReference" :
        (parseInt(value)) ? "#typeNumber" : "#typeString";
    $(activeType).prop("checked", true);
}

/**
 * Updates the value of the last edited div and notifies the server of a change in the memorymodel
 */
var updateValue = function () {

    var oldMmModel = copyObject(currentMemoryModel);

    var newValue = $("#selectedInputField")[0].value;
    var newName = $("#selectedNameField")[0].value;
    var newType = $("input:radio[name='type']:checked")[0].value;

    var idToFind = $(lastEditedDiv).children()[1].id;
    lookForFrameOrVar(idToFind, function (indexList) {
        if (indexList.location == "heap") {
            currentMemoryModel.memoryModel.heaps[indexList.heapIndex][indexList.frameIndex].vars[indexList.elementIndex].value = newValue;
            currentMemoryModel.memoryModel.heaps[indexList.heapIndex][indexList.frameIndex].vars[indexList.elementIndex].type = newType;
            currentMemoryModel.memoryModel.heaps[indexList.heapIndex][indexList.frameIndex].vars[indexList.elementIndex].name = newName;
        } else {
            currentMemoryModel.memoryModel.stacks[indexList.stackIndex][indexList.frameIndex].vars[indexList.elementIndex].value = newValue;
            currentMemoryModel.memoryModel.stacks[indexList.stackIndex][indexList.frameIndex].vars[indexList.elementIndex].type = newType;
            currentMemoryModel.memoryModel.stacks[indexList.stackIndex][indexList.frameIndex].vars[indexList.elementIndex].name = newName;
        }
    });

    if (!$.isEmptyObject(location)) {
        console.log(currentMemoryModel);
        percolatorSend({
            msgType: 'updateMemoryModel',
            data: {newMemoryModel: currentMemoryModel, oldMemoryModel: oldMmModel}
        });
    } else {
        alert("NO RESULTS");
    }
};

/**
 * Looks for the id to find in the memorymodel, returns an indexList with the exact locaction where the Id is in the memory model.
 * @param idToFind
 * @param actionWhenFound
 * @returns object
 */
function lookForFrameOrVar(idToFind, actionWhenFound) {

    var found = false;
    var frameIndex = 0;
    var elementIndex = 0;
    var stackIndex = 0;
    var heapIndex = 0;
    var placeInModel;

    var indexList = {};
    function declareIndexList() {
        if (placeInModel == "heap") indexList.heapIndex = heapIndex;
        else indexList.stackIndex = stackIndex;
        indexList.frameIndex = frameIndex;
        indexList.location = placeInModel;
        indexList.elementIndex = elementIndex;
        found = true;

        if (actionWhenFound)actionWhenFound(indexList);
        return indexList;
    }

    currentMemoryModel.memoryModel.stacks.forEach(function (stack) {
        if (!$.isEmptyObject(indexList))return null;
        placeInModel = "stack";
        loop(stack);
        stackIndex++;
    });

    if (!found) currentMemoryModel.memoryModel.heaps.forEach(function (heap) {
        if (!$.isEmptyObject(indexList)) return null;
        placeInModel = "heap";
        loop(heap);
        heapIndex++;
    });

    function loop(location) {
        if (!$.isEmptyObject(indexList)) return null;
        frameIndex = 0;

        location.forEach(function (frame) {
            if (!$.isEmptyObject(indexList)) return null;
            elementIndex = 0;
            if (idToFind == frame.id) {
                console.log("found!");
                return declareIndexList();
            }

            frame.vars.forEach(function (element) {
                if (idToFind == element.id) return declareIndexList();
                elementIndex++;
            });
            frameIndex++;
        });
    }

    return indexList;
}


/**
 * Draws the memory model
 *
 * @param memoryModel contains the data of the memory model
 */
function drawMemoryModel(memoryModel) {

    jsPlumb.reset();
    jsPlumb.Defaults.Container = $("#diagramContainer");

    if (!plumbInitialized) {
        jsPlumb.ready(function () {
            jsPlumb.Defaults.MaxConnections = 5;
        });
        plumbInitialized = true;
    }

    $(diagramContainer).children().remove(); //remove old frames, if they exist
    relations = [];
    if (currentMemoryModel) {
        var owner = currentMemoryModel.owner;
        var language = currentMemoryModel.language;
    }
    currentMemoryModel = memoryModel;
    currentMemoryModel.language = (language) ? language : currentMemoryModel.language;
    currentMemoryModel.owner = (owner) ? owner : currentMemoryModel.owner;

    if (memoryModel.memoryModel.stacks) drawFramesOnLocation("Stack", memoryModel.memoryModel.stacks, memoryModel.frameLocations);
    if (memoryModel.memoryModel.heaps) drawFramesOnLocation("Heap", memoryModel.memoryModel.heaps, memoryModel.frameLocations);
    if (memoryModel.memoryModel.stacks || memoryModel.memoryModel.heaps)setClassStyle(memoryModel.memoryModel.stacks.length, memoryModel.memoryModel.heaps.length);

    setClassStyle(memoryModel.memoryModel.stacks.length, memoryModel.memoryModel.heaps.length);
    memoryModelLoaded = true;
    redrawPlumbing();
    attachEventListeners();
    setStackHeapHeight();
}

/**
 * Writes all the stacks and heaps to dropdown fields. Used for adding frames to any stack of heap you want
 * @param current current memory model
 */
function collectStacksHeaps(current) {

    //var options = $("#stackDropDown");
    $(".stackDropDown").empty();
    $(".heapDropDown").empty();
    var options = [];
    var i = 0;
    current.memoryModel.stacks.forEach(function () {
        i++;
        options[i] = 'stack' + i;
        $(".stackDropDown").append($('<option>', {
            value: i - 1,
            text: options[i]
        }));
    });
    i = 0;
    options = [];

    current.memoryModel.heaps.forEach(function () {
        i++;
        options[i] = 'heap' + i;
        $(".heapDropDown").append($('<option>', {
            value: i - 1,
            text: options[i]
        }));
    });
    i = 0;
    options = [];
}

/**
 * Set the stack or heap as high as the highest
 */
function setStackHeapHeight() {

    var stack = $(".Stack");
    var heap = $(".Heap");
    var maxHeap;
    var maxStack;

    for (i = 0; i < stack.length; i++) {
        var stackNodes = stack[i].childNodes;
        for (j = 0; j < stackNodes.length; j++) {
            var stackNodesTop = stackNodes[j].offsetTop;
            var stackNodesHeight = stackNodes[j].offsetHeight;
            var stackNodesBottom = stackNodesTop + stackNodesHeight;

            if (j === 0 && i === 0 || stackNodesBottom > maxStack) maxStack = stackNodesBottom;
        }
    }

    for (i = 0; i < heap.length; i++) {
        var heapNodes = heap[i].childNodes;
        for (j = 0; j < heapNodes.length; j++) {
            var heapNodesTop = heapNodes[j].offsetTop;
            var heapNodesHeight = heapNodes[j].offsetHeight;
            var heapNodesBottom = heapNodesTop + heapNodesHeight;

            if (j === 0 && i === 0 || heapNodesBottom > maxHeap) maxHeap = heapNodesBottom;
        }
    }

    if (maxHeap > maxStack) {
        $(".Stack").css("height", maxHeap + "px");
        $(".Heap").css("height", maxHeap + "px");
    }
    else if (maxStack > maxHeap) {
        $(".Stack").css("height", maxStack + "px");
        $(".Heap").css("height", maxStack + "px");
    }
}

/**
 * adds a new memorymodel and sends it to the server
 */
function addNewMemoryModel(){

    var user = prompt("Please enter your name");
    var memorymodelName = prompt("Please enter memorymodel name");

    if(!user || !memorymodelName){
        return console.log("Geannuleerd");
    }

    highestID ++;
    var newMemoryModel = {
        'language': 'Javascript',
        'owner': user,
        'mmid': 6666,
        'modelName': memorymodelName,
        'version': 0,
        "memoryModel": {
            "stacks": [
                [
                    {
                        "id": highestID,
                        "name": "Global",
                        "vars": []
                    }
                ]
            ],
            "heaps": [
                [
                    {
                        "id": highestID,
                        "name": "Global",
                        "vars": []
                    }
                ]
            ]
        }
    };
    percolatorSend({
        msgType: 'makeNewModel',
        data: newMemoryModel
    });
}


/**
 * create new stack or heap
 */

function addStackOrHeap(type) {
    var oldMem = currentMemoryModel;

    if (type == "stack") {
        currentMemoryModel.memoryModel.stacks.push([])
        console.log('dit is een test met stacks', currentMemoryModel.memoryModel.stacks)
    } else {
        currentMemoryModel.memoryModel.heaps.push([])
        console.log('dit is een test met stacks', currentMemoryModel.memoryModel.heaps)
    }

    percolatorSend({
        msgType: 'updateMemoryModel',
        data: {newMemoryModel: currentMemoryModel, oldMemoryModel: oldMem}
    });
}

/**
 * Attaches all the eventlisteners to their corresponding divs or attributes
 */
function attachEventListeners() {

    var div = "#addReference";
    $(div).unbind('click');
    $(div).click(function (e) {
        toggleEditingMode = !toggleEditingMode;
        redrawPlumbing();
    });

    div = "#updateButton";
    $(div).unbind('click');
    $(div).click(function () {
        // TODO save the values into the memory model and send to the server
        updateValue();
        closeWrapper();
    });

    div = "#closeButton";
    $(div).unbind('click');
    $(div).click(function () {
        closeWrapper();
    });

    div = ".variable";
    $(div).unbind('dblclick');
    $(div).dblclick(function () {
        openEditField(this);
    });

    div = "#addNewStackFrame";
    $(div).unbind('click');
    $(div).click(function () {
        addNewFrame($("#frameLabel").val(), 'stack');
    });


    div = "#addNewStack";
    $(div).unbind('click');
    $(div).click(function () {
        addStackOrHeap('stack');
    });

    div = "#addNewHeap";
    $(div).unbind('click');
    $(div).click(function () {
        addStackOrHeap('heap');
    });

    div = "#addNewMemoryModel";
    $(div).unbind('click');
    $(div).click(function () {
        addNewMemoryModel();
    });

    div = ".deleteFrame";
    $(div).unbind('click');
    $(div).click(function () {
        deleteFrameOrVar(this, true);
    });

    function closeWrapper() {
        var div = "#editWrapper";
        // TODO fix this one to prevent opening when already closed!
        if (!$(div).is(':hidden')) $(div).slideToggle();
    }
}


/**
 * Sets width of the stack and heap class by the number of stack and heaps
 * @param numberOfStacks the number of stacks
 * @param numberOfHeaps the number of heaps
 * @returns {Promise} Promise to call actions when setting width is done
 */
function setClassStyle(numberOfStacks, numberOfHeaps) {

    var totalNumber = numberOfStacks + numberOfHeaps;
    var stackWidth;
    var heapWidth;
    if (totalNumber == 2) {
        stackWidth = 30;
        heapWidth = 70;
    } else {
        stackWidth = (100 / totalNumber);
        heapWidth = (100 / totalNumber);
    }

    $(".Stack").css("width", "calc(" + stackWidth + "% - 2px)");
    $(".Heap").css("width", "calc(" + heapWidth + "% - 2px)");
}

/**
 * Draws the frames of the memory model.
 *
 * @param location Decides where the frames are drawn. Stack or Heap
 * @param model the data of the memory model
 * @param frameLocations contains the locations of the frames
 * @returns {Promise} Promise to call actions when the drawing is done
 */
function drawFramesOnLocation(location, model, frameLocations) {

    var identifier = 1;
    model.forEach(function (frames) {
        var html = "<div id='" + location + identifier + "' class='" + location + "'>" +
            "<div><a onclick='deleteHeapOrStack($(this))' class='deleteHeapStacks'></a></div>" +
            "<div class='frameLabel'>" + location + "</div>" +
            "<div class='expandDiv'>" +
            "<a onclick='expandDiv($(this).parent().parent())'>+</a>" +
            "</div>" +
            "</div>";

        appendHtmlToLocation(diagramContainer, html);

        frames.forEach(function (item) {
            var top = 0;
            var left = 0;
            var name = (item.name) ? item.name : "";
            var style;

            frameLocations.forEach(function (frameLocation) {
                if (item.id === parseInt(frameLocation.id)) {
                    if (frameLocation.top) top = frameLocation.top;
                    if (frameLocation.left) left = frameLocation.left;
                }
            });

            if (!top && !left) style = "position:relative";
            else style = 'position: absolute; top: ' + top + "px; left: " + left + "%;";

            var html = "<div id='" + item.id + "' class='frame' style='" + style + "'> " +
                "<div class='deleteFrame'></div>" +
                "<div class='frameLabel'>" + name + "</div>" +
                "<div class='addVarToFrame'>" +
                "<a onclick='addVarToFrame($(this).parent().parent())'>+</a>" +
                "</div>" +
                "</div>";
            appendHtmlToLocation('#' + location + identifier, html);

            if (item.vars) drawVars('#' + item.id, item.vars);
        });
        identifier++;
    });
}

/**
 * Increases the size of the div where the memory model can be dragged
 * @param stackOrHeap
 */
function expandDiv(stackOrHeap) {
    stackOrHeap = stackOrHeap[0].id;
    var oldHeight = $('#' + stackOrHeap)[0].clientHeight;
    var newHeight = oldHeight + 100;
    $('#' + stackOrHeap).css("height", newHeight + "px");
    setStackHeapHeight();
}

/**
 * Draws the variables of the memory model.
 * @param location Location where the vars to be drawn in
 * @param vars Data containing the vars to be drawn
 */
function drawVars(location, vars) {
    vars.forEach(function (variable) {
        var value = determineVar(variable);

        var html = "<div class='variable'>" +
            "<div class='variableLabel'>" + variable.name + "</div>" +
            "<div id='" + variable.id + "' class='variableValue'>" + value + "</div>" +
            "<div class='deleteVar'><a onclick='deleteFrameOrVar($(this))' class='deleteVariable'></a></div>" +
            "</div>"
        appendHtmlToLocation(location, html);

    });
};

/**
 * Looks of the variable is a pointer or a variable
 * @param variable Value to be converted to a variable, usable to draw with
 * @returns {String|Number} value to be drawn inside the variable or function
 */
function determineVar(variable) {

    if (highestID < variable.id) highestID = variable.id;

    switch (variable.type) {
        case "reference":
            relations.push({source: variable.id, target: variable.value});
            return "";
            break;
        case "undefined":
            return "undefined";
            break;
        case "string":
            return '"' + variable.value + '"';
            break;
        case "number":
            return variable.value;
            break;
        default:
            return "null";
            break;
    }
}

/**
 * Updates the memory model. Redraws the entire memory model and the relations
 * @param data Data containing the memory model that has to be drawn
 */
function updateMemoryModel(data) {
    if (data.data.new_val) {
        if (data.data.new_val.version > currentMemoryModel.version) {

            var owner = currentMemoryModel.owner;
            var language = currentMemoryModel.language;
            currentMemoryModel = data.data.new_val;
            currentMemoryModel.owner = owner;
            currentMemoryModel.language = language;

            drawMemoryModel(currentMemoryModel);
            getVersionList(false, true);
            setModelInfo();
            updateJSONEditor();

        }
        else drawMemoryModel(currentMemoryModel);
    }
}

/**
 * When frames are dragged, the posistions of the frames wil be updated en send to the server by websocket.
 * @param frameId id of the frame what needs to be updated
 */
var updatePositionFrames = function (frameId) {
    var id = $('#' + frameId);
    var parent = $(id).parent();
    var top = (id.offset().top - id.parent().offset().top);
    var left = (100 / parent.outerWidth()) * (id.offset().left - id.parent().offset().left);

    var found = false;
    currentMemoryModel.frameLocations.forEach(function (location) {
        if (location.id == frameId) {
            found = true;
            location.top = top;
            location.left = left;
            return null;
        }
    });

    if (!found) currentMemoryModel.frameLocations.push({id: frameId, top: top, left: left});

    percolatorSend({
        msgType: 'updateFrameLocations',
        data: {
            frameLocations: currentMemoryModel.frameLocations,
            mmid: currentMemoryModel.mmid,
            version: currentMemoryModel.version
        }
    });
};

/**
 * returns another instance of the object. Used for copying an object.
 * @param object
 */
function copyObject(object){
    return JSON.parse(JSON.stringify(object));
}

/**
 * Appends the given HTML to the location
 * @param location Location where the HTML should be appended to
 * @param html Desired HTML to be added to the location
 */
function appendHtmlToLocation(location, html) {
    $(location).append(html);
}

/**
 * When a memort model is selected en a new frame is added (heap or stack), a message wil be send to the server by websocket.
 * @param frameName is the Name of the frame
 * @param frameType is the type of the container it needs to be put in (heap, stack)
 */
function addNewFrame(frameName, frameType) {
    highestID++;
    var selectedStack = $(".stackDropDown option:selected").val();
    var selectedHeap = $(".heapDropDown option:selected").val();

    var oldMemoryModel = copyObject(currentMemoryModel);

    var newFrame = {
        "id": highestID,
        "name": frameName,
        "vars": []
    };

    if (memoryModelLoaded) {
        if (frameType == 'stack') {
            var postitionStackFrame = currentMemoryModel.memoryModel.stacks[0].length;
            if (selectedStack != null) {
                currentMemoryModel.memoryModel.stacks[selectedStack][postitionStackFrame] = newFrame;
            } else {
                console.log('select a stack first');
            }
        }

        if (frameType == 'heap') {
            var postitionHeapsFrame = currentMemoryModel.memoryModel.heaps[0].length;
            if (selectedHeap != null) {
                currentMemoryModel.memoryModel.heaps[selectedHeap][postitionHeapsFrame] = newFrame;
            } else {
                console.log('select a heap first');
            }
        }

        console.log("data:", {newMemoryModel: currentMemoryModel, oldMemoryModel: currentMemoryModel});

        percolatorSend({
            msgType: 'updateMemoryModel',
            data: {newMemoryModel: currentMemoryModel, oldMemoryModel: oldMemoryModel}
        });
    }
    else {
        alert('select a memory model first so you can add frames or variables to it')
    }
}

/**
 * deletes a frame or variable based on the id of the object and sends a notification to the server
 * @param id
 * @param isFrame
 */
function deleteFrameOrVar(id, isFrame) {
    var obj = copyObject(currentMemoryModel);
    if (!isFrame) {
        id = $(id).parent().parent().children()[1];
    }
    else {
        id = $(id).parent()[0];
    }
    id = $(id)[0].id;

    console.log($("#" + id));


    lookForFrameOrVar(id, function (indexList) {

        if (indexList.location == "heap") {
            if (currentMemoryModel.memoryModel.heaps[indexList.heapIndex][indexList.frameIndex].vars.length != 0 && isFrame) return null;

            if (!isFrame) currentMemoryModel.memoryModel.heaps[indexList.heapIndex][indexList.frameIndex].vars[indexList.elementIndex];
            if (!isFrame) currentMemoryModel.memoryModel.heaps[indexList.heapIndex][indexList.frameIndex].vars.splice(indexList.elementIndex, 1);
            else currentMemoryModel.memoryModel.heaps[indexList.heapIndex].splice(indexList.frameIndex, 1);
        }
        else {
            if (currentMemoryModel.memoryModel.stacks[indexList.stackIndex][indexList.frameIndex].vars.length != 0 && isFrame) return null;

            if (!isFrame) currentMemoryModel.memoryModel.stacks[indexList.stackIndex][indexList.frameIndex].vars.splice(indexList.elementIndex, 1);
            else currentMemoryModel.memoryModel.stacks[indexList.stackIndex].splice(indexList.frameIndex, 1);
        }
    });

    percolatorSend({
        msgType: 'updateMemoryModel',
        data: {newMemoryModel: currentMemoryModel, oldMemoryModel: obj}
    });
}

/**
 * Adds a new reference to the memory model
 * TODO SAVE TO THE SERVER
 * @param source
 * @param target
 */
function newReference(source, target) {
    if (toggleEditingMode === true) {
        relations.push({source: source, target: target});
        redrawPlumbing();
    }
}

/**
 * Draws the connections between the frames and variables where needed.
 */
function redrawPlumbing() {
    $(".frame").draggable({
        drag: function (e) {
            jsPlumb.repaintEverything();
        },
        containment: "parent",
        stop: function (event) {
            if ($(event.target).find('select').length == 0) {
                updatePositionFrames(event.target.id);
                setStackHeapHeight();
            }
        }
    });
    jsPlumb.bind("connection", function (info) {
        var exists = false;
        relations.forEach(function (relation) {
            if (info.sourceId == relation.source && info.targetId == relation.target) {
                exists = true;
                return null;
            }
        });
        if (!exists)newReference(info.sourceId, info.targetId)
    });

    var common = {
        anchor: ["Left", "Right"],
        overlays: [["Arrow", {width: 40, length: 20, location: 1}]],
        paintStyle: {strokeStyle: 'grey', lineWidth: 5},
        connectorStyle: {strokeStyle: 'grey', lineWidth: 5},
        hoverPaintStyle: {strokeStyle: "#752921"},
        isSource: true,
        isTarget: true
    };

    if (toggleEditingMode) common.endpoint = "Dot";
    else common.endpoint = "Blank";

    jsPlumb.deleteEveryEndpoint();
    jsPlumb.removeAllEndpoints();
    jsPlumb.addEndpoint($('.Heap .frame'), common);
    jsPlumb.addEndpoint($('.variableValue'), common);
    relations.forEach(function (relation) {

        var source = $("#" + relation.source);
        var target = $("#" + relation.target);

        if (source.length && target.length) {
            var sourceTarget = {
                source: relation.source.toString(),
                target: relation.target.toString()
            };
            jsPlumb.connect(sourceTarget, common);
        }
    });
}