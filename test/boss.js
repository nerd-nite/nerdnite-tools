/**
 * Created by danrumney on 7/17/16.
 */
var chai = require('chai'),
  expect = chai.expect,
  chaiAsPromised = require("chai-as-promised"),
  _ = require('lodash'),

  pool = require('../dbPool'),
  Promise = require("bluebird"),
  BossAdder = require('../BossAdder');

chai.use(chaiAsPromised);

describe('Boss', function () {
  
  beforeEach('Reset the DB', function (done) {
    pool.query('SHOW TABLES').then(function (tableRows) {
      Promise.all(tableRows.map(function (row) {
        return pool.query('SET FOREIGN_KEY_CHECKS = 0;TRUNCATE ' + row.Tables_in_nerdnite + '; SET FOREIGN_KEY_CHECKS = 1;');
      })).then(function() {
        console.log('DB Reset');
        done();
      }, done);
    });
  });

  it('can add a boss', function () {
    var bossAdder = new BossAdder();

    return bossAdder.run({name: "Test User", email: "test@example.com", city: "Test City"})
      .then(function () {
        return pool.query('SELECT * FROM boss');
      })
      .then(function (rows) {
        expect(rows.length).to.equal(1);

        var boss = rows[0];
        expect(boss).to.have.property('_id', 'testuser');
        expect(boss).to.have.property('name', 'Test User');
        expect(boss).to.have.property('email', 'test@example.com');

        return pool.query('SELECT * FROM city');
      })
      .then(function (rows) {
        expect(rows.length).to.equal(1);

        var city = rows[0];
        expect(city).to.have.property('_id', 'testcity');
        expect(city).to.have.property('name', 'Test City');

        return pool.query('SELECT * FROM boss_city');
      })
      .then(function (rows) {
        expect(rows.length).to.equal(1);

        var bossCity = rows[0];
        expect(bossCity).to.have.property('boss_id', 'testuser');
        expect(bossCity).to.have.property('city_id', 'testcity');
      });
  });

  it('prevents bosses from having matching email addresses', function() {
    var bossAdder = new BossAdder();

    return expect(bossAdder.run({name: "Test User", email: "test@example.com", city: "Test City"})
      .then(function () {
        return bossAdder.run({name: "Test User2", email: "test@example.com", city: "Test City"})
      })).to.be.rejected;
  });

  it('ensures bosses have unique ids', function() {
    var bossAdder = new BossAdder();

    return bossAdder.run({name: "Test User", email: "test@example.com", city: "Test City"})
      .then(function () {
        return Promise.all([
          expect(bossAdder.run({name: "Test User", email: "test2@example.com", city: "Test City"})).to.be.rejected,
          expect(bossAdder.run({name: "Test City", email: "test3@example.com", city: "Test City"})).to.be.rejected
        ]);
      });
  });

  it('can assign bosses to multiple cities', function() {
    var bossAdder = new BossAdder();

    return bossAdder.run({name: "Test User", email: "test@example.com", city: "Test City"})
      .then(function () {
        return bossAdder.run({name: "Test User", email: "test@example.com", city: "Test City 2", reuseBoss: true});
      })
      .then(function() {
        return pool.query('SELECT city_id FROM boss_city WHERE boss_id = \'testuser\'');
      })
      .then(function (rows) {
        expect(rows.length).to.equal(2);
        expect(_.pluck(rows, 'city_id')).to.deep.include.members(['testcity', 'testcity2']);
      });
  });

  it('ensures a boss has a name', function () {
    var bossAdder = new BossAdder();

    return expect(bossAdder.run({ email: "test@example.com", city: "Test City"})).to.be.rejected;
  });

  it('ensures a boss has a city', function () {
    var bossAdder = new BossAdder();

    return expect(bossAdder.run({ email: "test@example.com", name: "Test User"})).to.be.rejected;
  });

});
