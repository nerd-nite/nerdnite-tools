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
        async           = require("async"),

        mongoHost       = process.env.MONGO_HOST,

        mandrillClient  = new Mandrill('16rUK74RBFiacFNfmu_2sA');

    if(!mongoHost) {
        console.error("No MONGO_HOST set");
        process.exit();
    }
        
    
    MongoClient.connect("mongodb://nerdnite:s4tgd1tw@"+mongoHost+"/nerdnite",
        function(err, db) {
            var cities = db ? db.collection("cities") : null,
                bosses = db ? db.collection("bosses") : null,
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
                async.parallel( {
                    cities: function(cb) {
                        cities.find({}).toArray(cb);
                    },
                    bosses: function(cb) {
                        bosses.find({}).toArray(cb);
                    }
                }, function(err,results){
                    if(err) {
                        errorOut(err);
                        return;
                    }

                    _.forEach(results.bosses, function(boss) {
                        boss.cities = _(results.cities).filter( function (city) {
                            return _.contains(city.bosses, boss._id);
                        }).map(function (city) {
                            return _.compact([city._id].concat(city.aliases));
                        }).flatten().value();

                        console.log(boss);
                        var message = {
                            text: Handlebars.templates.bossReport(boss),
                            subject: "Nerd Nite Boss Report",
                            from_email: "web@nerdnite.com",
                            to: [{
                                    email: boss._id+"@nerdnite.com",
                                    type: "to"

                            }]
                        };
                        mandrillClient.messages.send({ message: message, async: true});
                        console.log("Sent message about " + boss.name);
                    }, this);
                    db.close();
                });
            }
        }
    );
}());