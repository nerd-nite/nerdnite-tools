#!/usr/bin/env nodejs
(function() {
    var MongoClient = require("mongodb").MongoClient,
        _           = require("lodash"),
        emails      = require("./emails.020214.json");
        
        MongoClient.connect("mongodb://nerdnite:s4tgd1tw@localhost/nerdnite",
            function(err, db) {
                if(err) {
                    console.error("Failed to connect: ", err);
                }
                else {
                    console.log("Connected to db");
                    _.forEach(emails, function(targets, source) {
                        console.log(source + " redirects to ", targets);
                    })
                    
                    db.close();
                }
            }
        );
        
        
}());