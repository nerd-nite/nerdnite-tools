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
        
    
    MongoClient.connect("mongodb://nerdnite:s4tgd1tw@nerdnite2.com/nerdnite",
        function(err, db) {
            var forwards = !db ? null : db.collection("forwards"),
                bosses   = !db ? null : db.collection("bosses");
                
            if(err) {
                console.error("Failed to connect: ", err);
            }
            else {
                console.info("Connected to DB");
                forwards.find({type: "boss"}).toArray(function(err,bossFwds){
                    if(err) {
                        console.error("Failed to get bosses: ", err);
                        db.close();
                        return;
                    }
                    
                    async.each(bossFwds, 
                    function (forward, cb) {
                        delete forward.type;
                        forward.email = forward.targets[0];
                        if(forward.targets.length != 1) {
                            console.warn("*** Unexpected number of targets");
                        }
                        
                        bosses.insert(forward,function(err, result) {
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
