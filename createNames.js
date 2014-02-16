#!/usr/bin/env node 
/*
 * Report the Bosses associated with a city
 *
 */
(function (){
    "use strict";
    var MongoClient     = require("mongodb").MongoClient,
        _               = require("lodash");
        
    
    MongoClient.connect("mongodb://nerdnite:s4tgd1tw@nerdnite2.com/nerdnite",
        function(err, db) {
            var forwards;
                
            if(err) {
                console.error("Failed to connect: ", err);
            }
            else {
                console.info("Connected to DB");
                forwards = db.collection("forwards");
                forwards.find().each(function(err,fwd){
                    if(!fwd) {
                        db.close();
                        return;
                    }
                    if(fwd.name) {
                        console.log("Already have a name for "+fwd.name);
                    }
                    else {
                        var newName = fwd._id.split(".").join(" ");
                        forwards.update(fwd, { $set: { name: newName } }, function (err,result){
                            if(err) {
                                console.error("ERR:", err);
                            }
                            else {
                                console.log("Success:", result);
                            }
                        }
                        );
                    }
                });
            }
        }
    );
}());
