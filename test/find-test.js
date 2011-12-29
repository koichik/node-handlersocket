var vows = require('vows');
var assert = require('assert');
var events = require('events');
var util = require('util');
var hs = require('../index');

//hs._debug = true;
var con;
vows.describe('Find').addBatch({
  'connect =>' : {
    topic : function() {
      var emitter = new events.EventEmitter();
      con = hs.connect();
      con.on('connect', function() {
        emitter.emit('success', con);
      });
      return emitter;
    },
    'openIndex =>' : {
      topic : function(con) {
        con.openIndex('test', 'EMPLOYEE', 'PRIMARY',
                      ['EMPLOYEE_ID', 'EMPLOYEE_NO', 'EMPLOYEE_NAME'],
                      this.callback);
      },
      'find one record with = operator' : {
        topic : function(index, con) {
          index.find('=', [ 1 ], this.callback);
        },
        'should pass a null to error' : function(err, results) {
          assert.isNull(err);
        },
        'should pass an array with 1 record' : function(err, results) {
          assert.lengthOf(results, 1);
        },
        'should results equal to' : function(err, results) {
          assert.deepEqual(results[0], [ '1', '7369', 'SMITH' ]);
        }
      },
      'find some records with < operator' : {
        topic : function(index, con) {
          index.find('<', [ 3 ], 10, 0, this.callback);
        },
        'should pass null to error' : function(err, results) {
          assert.isNull(err);
        },
        'should pass an array with 2 records' : function(err, results) {
          assert.lengthOf(results, 2);
        },
        'should results equal to' : function(err, results) {
          assert.deepEqual(results[0], [ '2', '7499', 'ALLEN' ]);
          assert.deepEqual(results[1], [ '1', '7369', 'SMITH' ]);
        }
      }
    },
    teardown : function(con) {
      con.close();
    }
  }
}).export(module);
