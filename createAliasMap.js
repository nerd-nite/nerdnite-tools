#!/usr/bin/env node
/**
 * Creates a postfix alias map, based on the contents of the DB
 *
 */
(function (){
    "use strict";
    var MongoClient     = require("mongodb").MongoClient,
        Handlebars      = require("handlebars"),
        templates       = require("./templates");

    MongoClient.connect("mongodb://nerdnite:s4tgd1tw@nerdnite2.com/nerdnite",
        function(err, db) {
            var forwards,
                bosses = [],
                errorOut = function () {
                    console.error.apply(console, arguments);
                    db.close();
                    process.exit(1);
                };

            if(err) {
                console.error("Failed to connect: ", err);
            }
            else {
                forwards = db.collection("forwards");
                forwards.find({}).each( function (err, emailMap) {
                    if(!emailMap) {
                        db.close();
                        console.log(Handlebars.templates.alias({
                            targets: bosses,
                            source: "bosses@nerdnite.com"
                        }));
                    }
                    else {
                        if(emailMap.type === "boss") {
                            bosses.push(emailMap.targets[0]);
                        }
                        console.log(Handlebars.templates.alias(emailMap));
                    }
                });
            }
        }
    );
}());