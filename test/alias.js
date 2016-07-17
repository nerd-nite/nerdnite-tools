/**
 * Created by danrumney on 7/17/16.
 */
var chai = require('chai'),
  expect = chai.expect,
  chaiAsPromised = require("chai-as-promised"),

  pool = require('../dbPool'),
  Promise = require("bluebird"),
  AliasAdder = require('../AliasAdder');

chai.use(chaiAsPromised);

describe('Alias', function () {

  beforeEach('Reset the DB', function (done) {
    pool.query('SHOW TABLES').then(function (tableRows) {
      Promise.all(tableRows.map(function (row) {
        return pool.query('SET FOREIGN_KEY_CHECKS = 0;TRUNCATE ' + row.Tables_in_nerdnite + '; SET FOREIGN_KEY_CHECKS = 1;');
      })).then(function() {
        console.log('DB Reset');
        return Promise.all([
          pool.query('INSERT INTO boss SET ?', { _id: 'testuser', name: 'Test User', email: 'test@example.com'}),
          pool.query('INSERT INTO boss SET ?', { _id: 'testuser2', name: 'Test User2', email: 'test@example.com'})
            ])
          .then(function() {
            done();
          });
      }, done);
    });
  });

  it('can add an alias', function () {
    var aliasAdder = new AliasAdder();

    return aliasAdder.run({name: "Test User", alias: "test1"})
      .then(function () {
        return pool.query('SELECT * FROM boss_alias');
      })
      .then(function (rows) {
        expect(rows.length).to.equal(1);

        var boss = rows[0];
        expect(boss).to.have.property('boss_id', 'testuser');
        expect(boss).to.have.property('alias', 'test1');
      });
  });

  it('only adds aliases to bosses that exist', function () {
    var aliasAdder = new AliasAdder();

    return expect(aliasAdder.run({name: "Test User 3", alias: "test2"})).to.be.rejected;
  });

  it('ensures bosses have unique aliases', function() {
    var aliasAdder = new AliasAdder();

    aliasAdder.run({name: "Test User 2", alias: "test2"});
    return Promise.all([
      expect(aliasAdder.run({name: "Test User", alias: "testuser"})).to.be.rejected,
      expect(aliasAdder.run({name: "Test User", alias: "testuser2"})).to.be.rejected,
      expect(aliasAdder.run({name: "Test User", alias: "test2"})).to.be.rejected
    ]);

  });

});
