/**
 * Sends a JSON message to the server
 * @param data The data to send
 */
function sendMessage(socket, data){
    socket.send(JSON.stringify(data));
}

/**
 * MessageListener for the client, runs when a new message is received.
 * @param message Contains the received message
 */

function messageHandlerClient(message){
    var data = JSON.parse(message.data);
    console.log(data);
    switch(data.msgType){
        case "newData":
            updateMemoryModel(data);
            break;
        case "getAllModels":
            getMemoryModels(data.data);
            break;
        case "getModelById":
            getMemmoryModelById(data.data);
            break;
        case "positionsUpdated":
            console.log(data.data);
            break;
        case "updateMemoryModel":
            getMemoryModels(data.data);
            break;
        case "removeLatestVersion":
            getVersionList(true);
            break;
        case "errorMsg":
            console.log(data.data);
            break;
        default :
            console.log('client messagehandler: unknown message received ' + data.msgType);
            break;
    }
}