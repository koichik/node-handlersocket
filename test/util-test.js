var vows = require('vows');
var assert = require('assert');
var hs = require('../index');

vows.describe('Utilities').addBatch({
  'encodeField' : {
    'with undefined' : {
      topic : function() {
        return hs._encodeField(undefined);
      },
      'should return encoded nul string' : function topic(topic) {
        assert.equal(topic, '\u0000');
      }
    },
    'with null' : {
      topic : function() {
        return hs._encodeField(null);
      },
      'should return encoded nul string' : function topic(topic) {
        assert.equal(topic, '\u0000');
      }
    },
    'with empty string' : {
      topic : function() {
        return hs._encodeField('');
      },
      'should return empty string' : function(topic) {
        assert.equal(topic, '');
      }
    },
    'with basic string' : {
      topic : function() {
        return hs._encodeField('abcdef0123+-*/');
      },
      'shoud return same string' : function(topic) {
        assert.equal(topic, 'abcdef0123+-*/');
      }
    },
    'with control character' : {
      topic : function() {
        return hs._encodeField('\u0000\u0001\u0009\u000A\u000D\u0010');
      },
      'shoud return encoded string' : function(topic) {
        assert.equal(topic, '\u0001\u0040\u0001\u0041\u0001\u0049\u0001\u004A\u0001\u004D\u0010');
      }
    }
  },
  'decodeField' : {
    'with nul string' : {
      topic : function() {
        return hs._decodeField('\u0000');
      },
      'should return null' : function(topic) {
        assert.isNull(topic);
      }
    },
    'with empty string' : {
      topic : function() {
        return hs._decodeField('');
      },
      'should return empty string' : function(topic) {
        assert.equal(topic, '');
      }
    },
    'with basic string' : {
      topic : function() {
        return hs._decodeField('abcdef0123+-*/');
      },
      'shoud be same string' : function(topic) {
        assert.equal(topic, 'abcdef0123+-*/');
      }
    },
    'with encoded control character' : {
      topic : function() {
        return hs._decodeField('\u0001\u0040\u0001\u0041\u0001\u0049\u0001\u004A\u0001\u004D\u0010');
      },
      'shoud return encoded control character' : function(topic) {
        assert.equal(topic, '\u0000\u0001\u0009\u000A\u000D\u0010');
      }
    }
  },
  'createRequest' : {
    'with basic string' : {
      topic : function() {
        return hs._createRequest([ 'P', '1', 'database', 'table', 'PRIMARY', 'aaa,bbb,ccc' ]);
      },
      'should return tab separated strings' : function(topic) {
        assert.equal(topic, 'P\t1\tdatabase\ttable\tPRIMARY\taaa,bbb,ccc\n');
      }
    },
    'indludes control character' : {
      topic : function() {
        return hs._createRequest([ '1', '=', '2', 'a\ta', 'b\nb', 1, 0 ]);
      },
      'should return tab separated strings with encoded fields' : function(topic) {
        assert.equal(topic, '1\t=\t2\ta\u0001\u0049a\tb\u0001\u004Ab\t1\t0\n');
      }
    },
    'includes empty fields' : {
      topic : function() {
        return hs._createRequest([ '1', '=', '2', '', '', 1, 0 ]);
      },
      'should return tab separated string with empty fields' : function(topic) {
        assert.equal(topic, '1\t=\t2\t\t\t1\t0\n');
      }
    },
    'includes null fields' : {
      topic : function() {
        return hs._createRequest([ '1', '=', '2', null, null, 1, 0 ]);
      },
      'should return tab separated string with nul fields' : function(topic) {
        assert.equal(topic, '1\t=\t2\t\u0000\t\u0000\t1\t0\n');
      }
    }
  },
  'handleResponse' : {
    'gets sucess' : {
      topic : function() {
        return hs._handleResponse(this.callback)('0\t1\t\t\u0000\n');
      },
      'should pass a null to error' : function(err, response) {
        assert.isNull(err);
      },
      'shoud pass an array which contains 1 record with 2 fields' : function(err, response) {
        assert.deepEqual(response, ['0', '1', '', null]);
      }
    },
    'gets error with no message' : {
      topic : function() {
        return hs._handleResponse(this.callback)('1\t1\n');
      },
      'should pass an Error object to error' : function(err, response) {
        assert.instanceOf(err, Error);
      },
      'should have error code' : function(err, response) {
        assert.equal(err.message, '1');
      }
    },
    'gets error with message' : {
      topic : function() {
        return hs._handleResponse(this.callback)('1\t1\thoge\n');
      },
      'should pass an Error object to error' : function(err, response) {
        assert.instanceOf(err, Error);
      },
      'should have error code and message' : function(err, response) {
        assert.equal(err.message, '1 hoge');
      }
    }
  }
}).export(module);
