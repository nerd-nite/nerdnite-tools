#!/usr/bin/env node
/**
 * Add Nerd Nite Boss
 * 
 * Creates a boss, adds it to a city and add it to the bosses list
 * 
 * Input: Boss's name, personal email address and city
 * 
 * Outcomes:
 *  Boss's NN email already exists  - REJECT
 *  Bosses personal email exists    - REJECT
 *  City does not exists            - CREATE BOSS, CREATE CITY
 *  City exists                     - CREATE BOSS, ADD TO CITY
 *
 */
(function (){
    "use strict";
    var MongoClient     = require("mongodb").MongoClient,
        Handlebars      = require("handlebars"),
        templates       = require("./templates"),
        _               = require("lodash"),
        Getopt          = require("node-getopt"),
        async           = require("async"),
        Mandrill        = require('mandrill-api/mandrill').Mandrill,
        fs              = require("fs"),
        createSlug      = require("./slugger"),
        timestamp       = require("./timestamp"),
        
        mandrillClient  = new Mandrill('nvspEmFm9L67h97o_-covg'),
        getopt          = new Getopt([
                            [ "n", "name=ARG",  "Name of the boss"],
                            [ "e", "email=ARG", "External email address"],
                            [ "c", "city=ARG",  "City that the boss runs"],
                            [ "r", "reuseBoss", "Reuse a pre-existing boss" ],
                            [ "h", "help"]
                        ]),
        cliArgs         = process.argv.slice(2),
        updatesFileName = timestamp()+".updates.sh",
        mongoHost       = process.env.MONGO_HOST,
        options;
        
    if(!mongoHost) {
        console.error("No MONGO_HOST set");
        process.exit();
    }

    function usage(messages) {
        var rc = 0;
        if(messages) {
            _.forEach(messages, function (message) {
                console.error("ERROR: " +message);
            });
            rc = 1;
        }
        getopt.showHelp();
        process.exit(rc);
    }

    function getOptions(args) {
        var input           = getopt.parse(args),
            options         = input.options,
            messages = [];
        if(options.help) {
            usage();
        }
        if(!options.name) {
            messages.push("Please provide a name for the boss. It will need to be in quotes");
        }
        if(!options.city) {
            messages.push("Please provide the name of the city. If it is more than one word, it will need to be in quotes");
        }
        if(!options.email && !options.reuseBoss) {
            messages.push("Please provide an external email address for the boss or indicate that you want to reuse a pre-existing boss");
        }
        if(options.email && options.reuseBoss) {
            messages.push("You should not provide an external email address if you wish to reuse a boss");
        }

        if(messages.length > 0) {
            usage(messages);
        }

        return options;
    }

    function confirmOptions(options) {
        console.log(Handlebars.templates.confirm(options));
    }
    
    function slugInUse(slug, collection, callback) {
        return collection.find({ $or : [
                { _id: slug},
                { aliases: slug}
            ]}).toArray(function (err, items) {
                if(err) {
                    console.error("Problem searching for items: ", err);
                    callback(err);
                }
                else {
                    callback(null, items.length > 0); 
                }
            }
        );
    }
    
    function externalEmailInUse(email, forwards, callback) {
        return forwards.find({"targets": email}).toArray(function (err, items) {
            if(err) {
                console.error("Problem searching for items: ", err);
                callback(err);
            }
            else {
                callback(null, items.length > 0);
            }
        });
    }
    
    function cityExists(city, cities, callback) {
        return slugInUse(createSlug(city), cities, callback);
    }
    
    function createBoss(bosses, name, email, reuseBoss, callback) {
        var bossSlug     = createSlug(name),
            boss = {
                _id: bossSlug,
                name: name,
                email: email
            },
            message = {
                text: Handlebars.templates.newBoss(boss),
                subject: "Created Nerd Nite Boss",
                from_email: "web@nerdnite.com",
                to: [{
                        email: boss.email,
                        name:  boss.name,
                        type: "to"
                }]
            };

        if(reuseBoss) {

            bosses.find({ _id: boss._id }).toArray(function(err, bosses) {
                if(err) {
                    callback(err);
                } else if(bosses.length !== 1) {
                    console.log(boss);
                    callback("Not able to find one boss with that name");
                } else {
                    callback(null, bosses[0]);
                }
            });

        } else {
            bosses.insert(boss, function(err, result) {
                if(err) {
                    callback(err);
                }
                else {
                    mandrillClient.messages.send({ message: message, async: true});
                    callback(null,result);
                }
            });
        }
        
        return boss;
          
    }
    
    function createCity(cities, cityName, boss, callback) {
        var citySlug = createSlug(cityName),
            city      = {
                _id: citySlug,
                name: cityName,
                bosses: [ boss._id ]
            },
            message = {
                text: Handlebars.templates.newCity({ city: city, boss: boss}),
                subject: "Created Nerd Nite City",
                from_email: "web@nerdnite.com",
                to: [{
                        email: boss.email,
                        name: boss.name,
                        type: "to"
                }]
            };

        cities.insert(city, function(err) {
            if(err) {
                callback(err);
            }
            else {
                fs.appendFileSync(updatesFileName, Handlebars.templates.newWPCity(city));
                fs.appendFileSync(updatesFileName, Handlebars.templates.newWPBoss({boss: boss, city: city}));
                mandrillClient.messages.send({ message: message, async: true}, function(result) {
                        callback(null, result);
                    },
                    function(error) {
                        callback(error);
                    });
            }
        });
    }
    
    function addBossToCity(cities, cityName, boss, callback){
        var citySlug = createSlug(cityName),
            city      = {
                _id: citySlug,
                name: city
            },
            message = {
                text: Handlebars.templates.updateCity({ city: city, boss: boss}),
                subject: "Updated Nerd Nite City",
                from_email: "web@nerdnite.com",
                to: [{
                        email: boss.email,
                        name: boss.name,
                        type: "to"
                }]
            };

        cities.update(
            {_id: city._id },
            { $push: { bosses: boss._id } },
            function(err, result) {
                if(err) {
                    callback(err);
                }
                else {
                    fs.appendFileSync(updatesFileName, Handlebars.templates.newWPBoss({boss: boss, city: city}));
                    mandrillClient.messages.send({ message: message, async: true});
                    callback(null,result);
                }
            }
        );
    }

    options = getOptions(cliArgs);
    confirmOptions(options);
    
    MongoClient.connect("mongodb://nerdnite:s4tgd1tw@"+mongoHost+"/nerdnite",
        function(err, db) {
            var bosses = !db ? null : db.collection("bosses"),
                cities = !db ? null : db.collection("cities"),
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
                
                var slug = createSlug(options.name);
                async.parallel({
                    internalEmailInUse: function(callback) {
                        async.parallel({
                            usedByCity: _.partial(slugInUse, slug, cities),
                            usedByBoss: _.partial(slugInUse, slug, bosses)
                            },
                            function (err, results) {
                                callback(null, results.usedByCity || (results.usedByBoss && !options.reuseBoss));
                            }
                        );
                    },
                    externalEmailInUse: function(callback) {
                        if(options.reuseBoss) {
                            callback(null, true);
                        } else {
                            externalEmailInUse(options.email, bosses, callback);
                        }
                    },
                    cityExists: function(callback) {
                        cityExists(options.city, cities, callback);
                    }
                },
                function(err, results) {
                    var newBoss,
                        city = options.city;
                        console.log(results);
                    if(err) {
                        errorOut("Unexpected error: ", err);
                    }
                    if(results.internalEmailInUse && !options.reuseBoss) {
                        errorOut("'"+slug+"' is already in use");
                    }
                    if(results.externalEmailInUse && !options.reuseBoss) {
                        errorOut("'"+options.email+"' is already a target email");
                    }
                    newBoss = createBoss(bosses, options.name, options.email, options.reuseBoss, function(err) {
                        if(err) {
                            errorOut("Could not create boss: ", err);
                        }
                        var callback = function (err) {
                            if(err) {
                                errorOut("Failed to update/create city: ", err);
                            }
                            else {
                                console.log("Success");
                            }

                            db.close();
                        };
                        if(results.cityExists) {
                            addBossToCity(cities, city, newBoss, callback);
                        }
                        else {
                            createCity(cities, city, newBoss, callback);
                        }
                    });
                });
            }
        }
    );
}());
