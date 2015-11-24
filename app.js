var express = require('express');
var ws = require('ws');
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');
var r          = require("rethinkdb");

//Database, thinky, express connection settings
var config     = require('./config.js');

//Thinky is getting connected with RethinkDB
var thinky     = require('thinky')(config.thinky);
var type       = thinky.type;

var theExpressApp = express();
var theHttpServer = http.createServer();
theExpressApp.use(bodyParser.json());

var webSocketServer = new ws.Server({
    server: theHttpServer
});
Require
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


//Function to set up HTTP server with settings from config.js
function startExpress(){
    theHttpServer.on('request', theExpressApp).listen(config.express.port, function() {
        console.log("The Server is lisening on port 3000.")
    });
}

startExpress();
