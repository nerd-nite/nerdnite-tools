#!/usr/bin/env nodejs
(function() {
    "use strict";
    var MongoClient = require("mongodb").MongoClient,
        _           = require("lodash"),
        emails      = require("./emails.020214.json"),
        displayInfo = function (doc) {
            console.log(doc);
        },
        saveDoc     = function () {
            console.warn("No DB connection so not saving doc");
        };
        
        MongoClient.connect("mongodb://nerdnite:s4tgd1tw@localhost/nerdnite",
            function(err, db) {
                if(err) {
                    console.error("Failed to connect: ", err);
                }
                else {
                    var forwards = db.collection("forwards");
                    saveDoc = function (doc) {
                        console.log("Saving doc...");
                        forwards.update(
                            { "_id": doc.id },
                            doc,
                            { upsert: true },
                            function (err) {
                                if (err) {
                                    console.error(err.message);
                                }
                                else {
                                    console.log("Saved");
                                }
                            }
                        );
                    };
                }
                //else {
                    
                    _.forEach(emails, function(targets, source) {
                        var id = source.split('@')[0],
                            doc = {
                                _id: id,
                                source: source,
                                targets: targets
                            }
                        displayInfo(doc);
                        saveDoc(doc);
                        if(db) {
                            
                        }
                    })
                    if (db) {
                        db.close();
                    }
                //}
            }
        );
        
        
}());