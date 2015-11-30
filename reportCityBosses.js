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
                    
                    var bossMap = _.object(_.pluck(results.bosses, '_id'), results.bosses);

                    _.forEach(results.cities, function(city) {
                        city.bosses = _.map(city.bosses, function (bossId) {
                            var bossDetails = bossMap[bossId];
                            return bossDetails ? bossDetails.email : bossId;
                        });
                        console.log(city);
                        var message = {
                            text: Handlebars.templates.cityReport(city),
                            subject: "Nerd Nite City Report",
                            from_email: "web@nerdnite.com",
                            to: _.map(city.bosses, function(boss){
                                return {
                                    email: boss,
                                    type: "to"
                                };
                            })
                        };
                        mandrillClient.messages.send({ message: message, async: true});
                        console.log("Sent message about " + city.name);
                    }, this);
                    db.close();
                });
            }
        }
    );
}());