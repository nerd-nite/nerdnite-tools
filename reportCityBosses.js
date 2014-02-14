#!/usr/bin/env node
/**
 * Report the Bosses associated with a city
 *
 */
(function (){
    "use strict";
    var MongoClient     = require("mongodb").MongoClient,
        Handlebars      = require("handlebars"),
        templates       = require("./templates"),
        _               = require("lodash"),
        Mandrill        = require('mandrill-api/mandrill').Mandrill,
        
        mandrillClient  = new Mandrill('16rUK74RBFiacFNfmu_2sA');
        
    
    MongoClient.connect("mongodb://nerdnite:s4tgd1tw@nerdnite2.com/nerdnite",
        function(err, db) {
            var forwards,
                errorOut = function () {
                        console.error.apply(console, arguments);
                        db.close();
                        process.exit(1);
                };
                
            if(err) {
                console.error("Failed to connect: ", err);
            }
            else {
                console.info("Connected to DB");
                forwards = db.collection("forwards");
                forwards.find({type: "city"}).each(function(err,city){
                    if(!city) {
                        db.close();
                        return;
                    }
                    
                    var message = {
                        text: Handlebars.templates.cityReport(city),
                        subject: "Nerd Nite City Report",
                        from_email: "web@nerdnite.com",
                        to: _.map(city.targets, function(target){
                            return {
                                email: target,
                                type: "to"
                            };
                        })
                    }
                    mandrillClient.messages.send({ message: message, async: true});
                    console.log("Sent message about " + city.source);
                });
            }
        }
    );
}());