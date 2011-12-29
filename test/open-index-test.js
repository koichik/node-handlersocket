var vows = require('vows');
var assert = require('assert');
var events = require('events');
var util = require('util');
var hs = require('../index');

//hs._debug = true;
var con;
vows.describe('OpenIndex').addBatch({
  'connect =>' : {
    topic : function() {
      var emitter = new events.EventEmitter();
      con = hs.connect();
      con.on('connect', function() {
        emitter.emit('success', con);
      });
      return emitter;
    },
    'open index to primary key of EMPOYEE table' : {
      topic : function(con) {
        con.openIndex('test', 'EMPLOYEE', 'PRIMARY', [ 'EMPLOYEE_ID', 'EMPLOYEE_NO',
          'EMPLOYEE_NAME' ], this.callback);
      },
      'should pass null to error' : function(err, index) {
        assert.isNull(err);
      },
      'should create a new Index object' : function(err, index) {
        assert.instanceOf(index, hs.Index);
      },
      'shoud have 3 columns' : function(err, index) {
        assert.equal(index._columnCount, 3);
      }
    },
    teardown : function(con) {
      con.close();
    }
  }
}).export(module);
