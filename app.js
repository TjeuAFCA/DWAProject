var express = require('express');
var ws = require('ws');
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');
var   config     = require('./config.js');

var   thinky     = require('thinky')(config.thinky);
var   type       = thinky.type;



var theExpressApp = express();
var theHttpServer = http.createServer();
theExpressApp.use(bodyParser.json());

var webSocketServer = new ws.Server({
    server: theHttpServer
});

webSocketServer.on('connection', function connection(websocket) {
    websocket.on('message', function incoming(msg) {

    });

    websocket.on('close', function incoming(msg) {

    });

});

//Get a list of all memory models.
theExpressApp.get('/api/MemoryModels', function (req, res) {
    res.send('Route GET All MemoryModels');
});

//Get a memory model with a given ID.
theExpressApp.get('/api/MemoryModels/:id', function (req, res) {
    res.send('Route GET MemoryModel with ID');
});

//Get a memory model with a given ID.
theExpressApp.post('/api/MemoryModels/', function (req, res) {
    res.send('Route POST MemoryModel');
});


function startExpress(){
    http.createServer(theExpressApp).listen(config.express.port, function () {
        console.log('Server started at port: ' + config.express.port);

    });
}
startExpress();
//
//theHttpServer.on('request', theExpressApp);
//theHttpServer.listen(3000, function() {
//    console.log("The Server is lisening on port 3000.")
//});