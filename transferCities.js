#!/usr/bin/env node 
/*
 * Report the Bosses associated with a city
 *
 */
(function (){
    "use strict";
    var MongoClient     = require("mongodb").MongoClient,
        _               = require("lodash"),
        async           = require("async");
        
    
    MongoClient.connect("mongodb://nerdnite:s4tgd1tw@mail.nerdnite2.com/nerdnite",
        function(err, db) {
            var forwards = !db ? null : db.collection("forwards"),
                cities   = !db ? null : db.collection("cities");
                
            if(err) {
                console.error("Failed to connect: ", err);
            }
            else {
                console.info("Connected to DB");
                forwards.find({type: "city"}).toArray(function(err,cityFwds){
                    if(err) {
                        console.error("Failed to get bosses: ", err);
                        db.close();
                        return;
                    }
                    
                    async.each(cityFwds, 
                    function (forward, cb) {
                        delete forward.type;
                        forward.bosses = forward.targets;
                        delete forward.targets;
                        
                        cities.insert(forward,function(err, result) {
                            if(result) {
                                console.log("Inserted: ", forward);
                            }
                            cb(err);
                        });
                    },
                    function(err) {
                        if(err) {
                            console.error("Error: ", err);
                        }
                        db.close();
                    });
                });
            }
        }
    );
}());
