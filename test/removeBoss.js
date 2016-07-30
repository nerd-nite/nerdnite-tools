/**
 * Created by danrumney on 7/17/16.
 */
'use strict';
var chai = require('chai')
  , expect = chai.expect
  , chaiAsPromised = require('chai-as-promised')
  , fixtures = require('./fixtures/removeBoss.fixtures.json')

  , pool = require('../dbPool')
  , BossRemover = require('../BossRemover');

chai.use(chaiAsPromised);

describe('removeBoss', function () {

  beforeEach('Reset the DB', function () {
    return pool.purge().then(function() {
      console.log('DB Reset');
      return pool.loadFixtures(fixtures);
    });
  });

  it('can remove a boss from the system', function () {
    var bossRemover = new BossRemover();

    return bossRemover.run({name: 'Test User2', city: 'system'})
      .then(function () {
        return pool.getAllBosses({ reset: true });
      })
      .then(function (rows) {
        expect(rows.length).to.equal(3);

        return pool.getBossPerCityCount({reset: true});
      })
      .then(function (rows) {
        expect(rows.length).to.equal(4);
        var bossCounts = rows.reduce(function (o, row) {
          o[row._id] = row.bossCount;
          return o;
        }, {});
        expect(bossCounts).to.deep.equal({
          'testcity1': 2
          , 'testcity2': 1
          , 'testcity3': 1
          , 'testcity4': 1
        })
      });
  });

  it('can remove a boss from a single city', function() {
    var bossRemover = new BossRemover();
    return bossRemover.run({name: 'Test User 4', city: 'Test City1'})
      .then(function () {
        return pool.getAllBosses({ reset: true });
      })
      .then(function (rows) {
        expect(rows.length).to.equal(4);

        return pool.getBossPerCityCount({reset: true});
      })
      .then(function (rows) {
        expect(rows.length).to.equal(4);
        var bossCounts = rows.reduce(function (o, row) {
          o[row._id] = row.bossCount;
          return o;
        }, {});
        expect(bossCounts).to.deep.equal({
            'testcity1': 2
          , 'testcity2': 1
          , 'testcity3': 1
          , 'testcity4': 1
        })
      });
  });

  it('will alert if trying to remove a non-existent boss', function () {
    var bossRemover = new BossRemover();
    return expect(bossRemover.run({name: 'Fake User', city: 'system'})).to.be.rejected;
  });

  it('will alert if trying to remove a boss from a non-existent city', function () {
    var bossRemover = new BossRemover();
    return expect(bossRemover.run({name: 'Test User1', city: 'Fake City'})).to.be.rejected;
  });

  it('will alert the user if a city no longer has bosses', function() {
    var bossRemover = new BossRemover();

    return bossRemover.run({name: 'Test User3', city: 'system'})
      .then(function () {
        expect.fail('Removing Test User3 should raise an exception');
      })
      .catch(function (e) {
        expect(e.type).to.equal('ZOMBIES');
        expect(e.errors).to.contain('Test City2 has no bosses');
      });
  });
});
