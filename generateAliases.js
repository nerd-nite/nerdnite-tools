(function () {
    "use strict";
    var nnDetails = require('./bosses'),
        _ = require('lodash');

    function generateBossesAlias(bossesInfo) {
        return "bosses@nerdnite.com " + _.map(bossesInfo, function (bossInfo) {
            return bossInfo.email;
        }).join(", \n\t");
    }

    function generateCityAliases(nnDetails) {
        var cityAliasStrings = [];
        _.forEach(nnDetails.cities, function (cityDetails, cityName) {
            var aliasString = cityName + "@nerdnite.com " + _.map(cityDetails.bosses, function (boss) {
                var bossInfo = nnDetails.bosses[boss];
                if (!bossInfo) {
                    throw "No bossInfo found for " + boss;
                }
                return bossInfo.email;
            }).join(",\n\t");
            cityAliasStrings.push(aliasString);
        });
        return cityAliasStrings;
    }

    function generateBossAliases(bossesInfo) {
        var bossAliases = [];
        _.forEach(bossesInfo, function (bossInfo, bossName) {
            bossAliases.push(bossName + "@nerdnite.com " + bossInfo.email);
            _.forEach(bossInfo.aliases, function(alias) {
                bossAliases.push(alias + "@nerdnite.com " + bossInfo.email);
            });
        });
        return bossAliases;
    }

    console.log(generateBossesAlias(nnDetails.bosses));
    console.log(generateCityAliases(nnDetails).join("\n"));
    console.log(generateBossAliases(nnDetails.bosses).join("\n"));
}());