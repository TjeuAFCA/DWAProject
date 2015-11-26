"use strict";

var r     = require("rethinkdb");
var fs = require('fs');

var config = require(__dirname +'/../config.js');

var thinky     = require('thinky')(config.thinky);

var ModelInfo = require('./models/thinkyModels.js').ModelInfo;
var History = require('./models/thinkyModels.js').History;

var connection = null;

    r.connect(config.rethinkdb).then(function(conn){
        connection = conn;
        return r.dbList().run(connection)
    }).then(function(databases){

        var nrdatabases = databases.length -1;
        var count = 0;
        if(nrdatabases > 0)
        return new Promise(function(resolve, reject){
            databases.forEach(function(db){
                if(db != "rethinkdb"){    //some weird database, used by rethink.
                    r.dbDrop(db).run(connection, function(err){
                        if (err) reject(err);
                        count++;
                        if(count >= nrdatabases)resolve("hoi");
                    });
                }
            });
        })


    }).then(function(){
        return new Promise(function(resolve, reject){
            r.dbCreate(config.rethinkdb.database).run(connection, function(err) {
                if (err) reject(err);
                resolve();
            });
        });

    }).then(function(){

        var nrdatabases = config.rethinkdb.tables.length;
        var count = 0;

        return new Promise(function(resolve, reject){
            config.rethinkdb.tables.forEach(function(db){
                r.db(config.rethinkdb.database)
                    .tableCreate(db).run(connection, function(err){
                        if (err) reject(err);
                        count++;
                        if(count >= nrdatabases)resolve();
                    })
            })
        });

    }).then(function(){
        return new Promise(function(resolve, reject) {
            fs.readFile(__dirname + "/data/modelInfo.json", 'utf8', function (err, data) {
                if (err) reject(err);
                resolve(JSON.parse(data));
            })
        })
    }).then(function(seedData){
        return new Promise(function(resolve, reject) {
            //r.db(config.rethinkdb.database).table("modelInfo").insert(seedData).run(connection, function(err){
            //    if (err) reject(err);
            //    resolve();
            //});
            var mi = new ModelInfo(seedData);
            mi.save().then(function(result) {
                resolve(result)
            }).error(function(error) {
                console.log(error);
                reject(error);
            });
        })
    }).then(function(){
        return new Promise(function(resolve, reject) {
            fs.readFile(__dirname + "/data/history.json", 'utf8', function (err, data) {
                if (err) reject(err);
                resolve(JSON.parse(data));
            })
        })
    }).then(function(seedData){
        return new Promise(function(resolve, reject) {
            //r.db(config.rethinkdb.database).table("history").insert(seedData).run(connection, function(err){
            //    if (err) reject(err);
            //    resolve();
            //})
            var hi = new History(seedData);

            hi.save().then(function(result) {
                resolve(result)
            }).error(function(error) {
                console.log(error);
                reject(error);
            });
        })
    }).finally(function(){
        console.log("database seeded");
    }).error(function (err) {
        throw new Error("Something went wrong! "+ err);
    });