var vows = require('vows');
var assert = require('assert');
var events = require('events');
var util = require('util');
var hs = require('../index');

//hs._debug = true;
var con;

function openIndex(options, callback) {
  con = hs.connect(options, function() {
    con.openIndex('test', 'EMPLOYEE', 'PRIMARY',
                  ['EMPLOYEE_ID', 'EMPLOYEE_NO', 'EMPLOYEE_NAME', 'VERSION'],
                  callback);
  });
}

function find(callback) {
  openIndex({}, function(err, index) {
    if (err) return callback(err);
    index.find('>=', 100, {limit: 10}, callback);
  });
}

function openIndexNameAndVersion(options, callback) {
  con = hs.connect(options, function() {
    con.openIndex('test', 'EMPLOYEE', 'PRIMARY',
                  ['EMPLOYEE_NAME', 'VERSION'],
                  ['EMPLOYEE_NO', 'EMPLOYEE_NAME'], callback);
  });
}

function openIndexVersion(options, callback) {
  con = hs.connect(options, function() {
    con.openIndex('test', 'EMPLOYEE', 'PRIMARY',
                  ['VERSION'],
                  ['EMPLOYEE_NO', 'EMPLOYEE_NAME'], callback);
  });
}

var suite = vows.describe('Modify')
suite.addBatch({
  'finding before insert': {
    topic: function() {
      find(this.callback);
    },
    'should pass an empty array': function(err, results) {
      assert.isNull(err);
      assert.lengthOf(results, 0);
    },
    teardown: function() {
      con.close();
    }
  }
});

suite.addBatch({
  'first inserting': {
    topic: function() {
      var self = this;
      openIndex({port: 9999, auth: 'node'}, function(err, index) {
        if (err) return self.callback(err);
        index.insert(['100', '9999', 'KOICHIK', 1], self.callback);
      })
    },
    'should not be error': function() {
    },
    teardown: function() {
      con.close();
    }
  }
});

suite.addBatch({
  'finding after first insert': {
    topic: function() {
      find(this.callback);
    },
    'should pass an array which contains one record': function(err, results) {
      assert.isNull(err);
      assert.lengthOf(results, 1);
      assert.deepEqual(results[0], ['100', '9999', 'KOICHIK', '1']);
    },
    teardown: function() {
      con.close();
    }
  }
});

suite.addBatch({
  'second inserting': {
    topic: function() {
      var self = this;
      openIndex({port: 9999, auth: 'node'}, function(err, index) {
        if (err) return self.callback(err);
        index.insert(['101', '9998', 'EBIYURI', 1], self.callback);
      })
    },
    'should not be error': function() {
    },
    teardown: function() {
      con.close();
    }
  }
});

suite.addBatch({
  'finding after second insert': {
    topic: function() {
      find(this.callback);
    },
    'should pass an array which contains two records': function(err, results) {
      assert.isNull(err);
      assert.lengthOf(results, 2);
      assert.deepEqual(results[0], ['100', '9999', 'KOICHIK', '1']);
      assert.deepEqual(results[1], ['101', '9998', 'EBIYURI', '1']);
    },
    teardown: function() {
      con.close();
    }
  }
});

suite.addBatch({
  'updating': {
    topic: function() {
      var self = this;
      openIndex({port: 9999, auth: 'node'}, function(err, index) {
        if (err) return self.callback(err);
        index.update('=', 100, [100, '8888', 'KOICHIK2', 2], self.callback);
      })
    },
    'should update one row': function(err, rows) {
      assert.isNull(err);
      assert.equal(rows, 1);
    },
    teardown: function() {
      con.close();
    }
  }
});

suite.addBatch({
  'finding after update': {
    topic: function() {
      find(this.callback);
    },
    'should pass an array which contains two records': function(err, results) {
      assert.isNull(err);
      assert.lengthOf(results, 2);
      assert.deepEqual(results[0], ['100', '8888', 'KOICHIK2', '2']);
      assert.deepEqual(results[1], ['101', '9998', 'EBIYURI', '1']);
    },
    teardown: function() {
      con.close();
    }
  }
});

suite.addBatch({
  'updating with IN': {
    topic: function() {
      var self = this;
      openIndexNameAndVersion({port: 9999, auth: 'node'},
                              function(err, index) {
        if (err) return self.callback(err);
        index.update('=', hs.in(100, 101),
                     {limit: 10},
                     ['KOICHIK', 3], self.callback);
      })
    },
    'should update two rows': function(err, rows) {
      assert.isNull(err);
      assert.equal(rows, 2);
    },
    teardown: function() {
      con.close();
    }
  }
});

suite.addBatch({
  'finding after update with IN': {
    topic: function() {
      find(this.callback);
    },
    'should pass an array which contains two records': function(err, results) {
      assert.isNull(err);
      assert.lengthOf(results, 2);
      assert.deepEqual(results[0], ['100', '8888', 'KOICHIK', '3']);
      assert.deepEqual(results[1], ['101', '9998', 'KOICHIK', '3']);
    },
    teardown: function() {
      con.close();
    }
  }
});

suite.addBatch({
  'updating with filter': {
    topic: function() {
      var self = this;
      openIndexNameAndVersion({port: 9999, auth: 'node'},
                              function(err, index) {
        if (err) return self.callback(err);
        index.update('>=', 100, {
                       filters: hs.filter('EMPLOYEE_NO', '>', 9000),
                       limit: 10
                     },
                     ['EBIYURI', 4], self.callback);
      })
    },
    'should update one row': function(err, rows) {
      assert.isNull(err);
      assert.equal(rows, 1);
    },
    teardown: function() {
      con.close();
    }
  }
});

suite.addBatch({
  'finding after update with select': {
    topic: function() {
      find(this.callback);
    },
    'should pass an array which contains two records': function(err, results) {
      assert.isNull(err);
      assert.lengthOf(results, 2);
      assert.deepEqual(results[0], ['100', '8888', 'KOICHIK', '3']);
      assert.deepEqual(results[1], ['101', '9998', 'EBIYURI', '4']);
    },
    teardown: function() {
      con.close();
    }
  }
});

suite.addBatch({
  'increment': {
    topic: function() {
      var self = this;
      openIndexVersion({port: 9999, auth: 'node'}, function(err, index) {
        if (err) return self.callback(err);
        index.increment('=', 100, 1, self.callback);
      })
    },
    'should update one row': function(err, rows) {
      assert.isNull(err);
      assert.equal(rows, 1);
    },
    teardown: function() {
      con.close();
    }
  }
});

suite.addBatch({
  'finding after increment': {
    topic: function() {
      find(this.callback);
    },
    'should pass an array which contains two records': function(err, results) {
      assert.isNull(err);
      assert.lengthOf(results, 2);
      assert.deepEqual(results[0], ['100', '8888', 'KOICHIK', '4']);
      assert.deepEqual(results[1], ['101', '9998', 'EBIYURI', '4']);
    },
    teardown: function() {
      con.close();
    }
  }
});

suite.addBatch({
  'decrement': {
    topic: function() {
      var self = this;
      openIndexVersion({port: 9999, auth: 'node'}, function(err, index) {
        if (err) return self.callback(err);
        index.decrement('=', 101, 1, self.callback);
      })
    },
    'should update one row': function(err, rows) {
      assert.isNull(err);
      assert.equal(rows, 1);
    },
    teardown: function() {
      con.close();
    }
  }
});

suite.addBatch({
  'finding after decrement': {
    topic: function() {
      find(this.callback);
    },
    'should pass an array which contains two records': function(err, results) {
      assert.isNull(err);
      assert.lengthOf(results, 2);
      assert.deepEqual(results[0], ['100', '8888', 'KOICHIK', '4']);
      assert.deepEqual(results[1], ['101', '9998', 'EBIYURI', '3']);
    },
    teardown: function() {
      con.close();
    }
  }
});

suite.addBatch({
  'deleting': {
    topic: function() {
      var self = this;
      openIndex({port: 9999, auth: 'node'}, function(err, index) {
        if (err) return self.callback(err);
        index.delete('>=', 100, {limit: 10}, self.callback);
      })
    },
    'should delete two rows': function(err, rows) {
      assert.isNull(err);
      assert.equal(rows, 2);
    },
    teardown: function() {
      con.close();
    }
  }
});

suite.addBatch({
  'finding after delete': {
    topic: function() {
      find(this.callback);
    },
    'should pass an empty array': function(err, results) {
      assert.isNull(err);
      assert.lengthOf(results, 0);
    },
    teardown: function() {
      con.close();
    }
  }
});
suite.export(module);
