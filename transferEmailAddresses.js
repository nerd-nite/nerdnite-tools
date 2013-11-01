(function () {
    "use strict";
    var emailDetails = require('./emails-2013'),
        _ = require('lodash'),
        Handlebars = require('handlebars'),
        fs = require('fs'),
        template = Handlebars.compile("Email {{dest}} goes to {{forward}}"),
        emailMappings = {},
        output = fs.createWriteStream('aliases');

    _.forEach(_.flatten(emailDetails), function (email) {
        if (email.dest) {
            console.log(template(email));
            if (!emailMappings[email.dest]) {
                emailMappings[email.dest] = [];
            }
            emailMappings[email.dest].push(email.forward);
        }
    });
    console.log(emailMappings);

    _.forEach(emailMappings, function (targets, source) {
        output.write(source + ": " + targets.join(" ") + "\n");
    });

    output.end();
}());