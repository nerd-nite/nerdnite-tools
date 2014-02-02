(function() {
    var MongoClient = require("mongodb").MongoClient,
        emails      = require("./emails.020214.json");
        
        MongoClient.connect("mongodb://nerdnite:s4tgd1tw@localhost/nerdnite",
            function(err, db) {
                if(err) {
                    console.error("Failed to connect: ", err);
                }
                else {
                    console.log("Connected to db");
                }
            }
        );
        
        
}());