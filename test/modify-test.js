var vows = require('vows');
var assert = require('assert');
var events = require('events');
var util = require('util');
var hs = require('../index');

hs._debug = false;
var con;
function openIndex(options, callback) {
  con = hs.connect(options, function() {
    con.openIndex('test', 'EMPLOYEE', 'PRIMARY',
                  ['EMPLOYEE_ID', 'EMPLOYEE_NO', 'EMPLOYEE_NAME'],
                  callback);
  });
}
function find(callback) {
  openIndex({ port : 9998 }, function(err, index) {
    if (err) return callback(err);
    index.find('=', [ 100 ], callback);
  });
}

var suite = vows.describe('Modify')
suite.addBatch({
  'finding before insert' : {
    topic : function() {
      find(this.callback);
    },
    'should pass an empty array' : function(err, results) {
      assert.isNull(err);
      assert.lengthOf(results, 0);
    },
    teardown : function() {
      con.close();
    }
  }
});
suite.addBatch({
  'inserting' : {
    topic : function() {
      var self = this;
      openIndex({ port : 9999, auth : 'node' }, function(err, index) {
        if (err) return self.callback(err);
        index.insert([ '100', '9999', 'KOICHIK' ], self.callback);
      })
    },
    'should not be error' : function() {
    },
    teardown : function() {
      con.close();
    }
  }
});
suite.addBatch({
  'finding after insert' : {
    topic : function() {
      find(this.callback);
    },
    'should pass an array which contains one record' : function(err, results) {
      assert.isNull(err);
      assert.lengthOf(results, 1);
      assert.deepEqual(results[0], [ '100', '9999', 'KOICHIK' ]);
    },
    teardown : function() {
      con.close();
    }
  }
});
suite.addBatch({
  'updating' : {
    topic : function() {
      var self = this;
      openIndex({ port : 9999, auth : 'node' }, function(err, index) {
        if (err) return self.callback(err);
        index.update('=', [100], [ '100', '9999', 'EBIYURI' ], self.callback);
      })
    },
    'should update one row' : function(err, rows) {
      assert.isNull(err);
      assert.equal(rows, 1);
    },
    teardown : function() {
      con.close();
    }
  }
});
suite.addBatch({
  'finding after update' : {
    topic : function() {
      find(this.callback);
    },
    'should pass an array which contains one record' : function(err, results) {
      assert.isNull(err);
      assert.lengthOf(results, 1);
      assert.deepEqual(results[0], [ '100', '9999', 'EBIYURI' ]);
    },
    teardown : function() {
      con.close();
    }
  }
});
suite.addBatch({
  'deleting' : {
    topic : function() {
      var self = this;
      openIndex({ port : 9999, auth : 'node' }, function(err, index) {
        if (err) return self.callback(err);
        index.delete('=', [100], self.callback);
      })
    },
    'should delete one row' : function(err, rows) {
      assert.isNull(err);
      assert.equal(rows, 1);
    },
    teardown : function() {
      con.close();
    }
  }
});
suite.addBatch({
  'finding after delete' : {
    topic : function() {
      find(this.callback);
    },
    'should pass an empty array' : function(err, results) {
      assert.isNull(err);
      assert.lengthOf(results, 0);
    },
    teardown : function() {
      con.close();
    }
  }
});
suite.export(module);
