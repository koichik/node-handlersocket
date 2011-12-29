var events = require('events')
var net = require('net')
var util = require('util');

exports.connect = connect;

function connect(options, connectListener) {
  if (typeof options === 'function') {
    connectListener = options;
    options = undefined;
  }
  return new Connection(options, connectListener);
}

function Connection(options, connectListener) {
  events.EventEmitter.call(this);

  options = options || {};
  var host = options.host || 'localhost';
  var port = options.port || 9998;
  var auth = options.auth;

  if (connectListener) {
    this.on('connect', connectListener);
  }

  var self = this;
  var socket = net.connect(port, host);
  socket.setEncoding('utf8');
  socket.on('connect', function() {
    if (!auth) {
      return self.emit('connect');
    }
    var request = ['A', '1', auth];
    self._execute(request, _handleResponse(function(err, fields) {
      if (err) {
        return self.emit('error', err);
      }
      self.emit('connect');
    }));
  });
  socket.on('data', function(data) {
    if (data) {
      var received = self._received += data;
      var pos;
      while ((pos = received.indexOf('\n')) !== -1) {
        var response = received.substring(0, pos + 1);
        received = self._received = received.substring(pos + 1);
        var callback = self._callbacks.shift();
        callback(response);
      }
    }
  });
  socket.on('end', function(error) {
    self._notifyError(error);
    self.emit('close', error);
  });
  socket.on('close', function(hadError) {
    self.emit('close', hadError);
  });
  socket.on('error', function(error) {
    self._notifyError(error);
    self.emit('error', error);
  });

  this._socket = socket;
  this._indexId = 0;
  this._callbacks = [];
  this._received = '';
}
util.inherits(Connection, events.EventEmitter);

Connection.prototype.openIndex =
    function openIndex(database, table, index, columns, callback) {
  columns = Array.isArray(columns) ? columns : [columns];

  var self = this;
  var indexId = this._indexId++;
  var request = ['P', indexId, database, table, index, columns.join(',')];
  this._execute(request, _handleResponse(function(err, fields) {
    if (err) {
      return callback(err);
    }
    return callback(null, new Index(self, indexId, columns.length));
  }));
};

Connection.prototype.close = function close() {
  this._socket.end();
};

Connection.prototype._execute = function _execute(request, callback) {
  if (this._socket.readyState !== 'open') {
    return callback(new Error('connection closed'));
  }
  var data = _createRequest(request);
  this._socket.write(data, 'utf8');
  this._callbacks.push(callback);
};

Connection.prototype._notifyError = function _notifyError(error) {
  error = error || new Error('connection closed');
  var callbacks = this._callbacks;
  this._callback = [];
  for (var i = 0, len = callbacks.length; i < len; ++i) {
    callbacks[i](err);
  }
}

function Index(con, indexId, columnCount) {
  events.EventEmitter.call(this);
  this._con = con;
  this._indexId = indexId;
  this._columnCount = columnCount;
}
util.inherits(Index, events.EventEmitter);

Index.prototype.find = function find(operator, keys, limit, offset, callback) {
  var argc = arguments.length;
  callback = argc >= 5 ? callback : arguments[argc - 1];
  offset = argc > 4 ? offset : 0;
  limit = argc > 3 ? limit : 1;
  keys = Array.isArray(keys) ? keys : [keys];

  var request = [this._indexId, operator, keys.length].
                concat(keys, [limit, offset]);
  this._con._execute(request, _handleResponse(function(error, response) {
    if (error) {
      return callback(error);
    }
    var numColumns = parseInt(response[1]);
    var results = [];
    for (var i = 2, len = response.length; i < len; i += numColumns) {
      results.push(response.slice(i, i + numColumns));
    }
    return callback(null, results);
  }));
};

Index.prototype.insert = function insert(values, callback) {
  values = Array.isArray(values) ? values : [values];

  var request = [this._indexId, '+', values.length].concat(values);
  this._con._execute(request, _handleResponse(function(error, response) {
    if (error) {
      return callback(error);
    }
    return callback(null);
  }));
};

Index.prototype.update =
    function update(operator, keys, limit, offset, values, callback) {
  var argc = arguments.length;
  callback = argc >= 6 ? callback : arguments[argc - 1];
  values = argc >= 5 ? values : arguments[argc - 2];
  values = Array.isArray(values) ? values : [values];
  offset = argc > 5 ? offset : 0;
  limit = argc > 4 ? limit : 1;
  keys = Array.isArray(keys) ? keys : [keys];

  var request = [this._indexId, operator, keys.length ].
                concat(keys, [limit, offset, 'U'], values);
  this._con._execute(request, _handleResponse(function(error, response) {
    if (error) {
      return callback(error);
    }
    var rows = parseInt(response[2]);
    return callback(null, rows);
  }));
};

Index.prototype.delete =
    function remove(operator, keys, limit, offset, callback) {
  var argc = arguments.length;
  callback = argc >= 5 ? callback : arguments[argc - 1];
  offset = argc > 4 ? offset : 0;
  limit = argc > 3 ? limit : 1;
  keys = Array.isArray(keys) ? keys : [keys];

  var request = [this._indexId, operator, keys.length].
                concat(keys, [limit, offset, 'D']);
  this._con._execute(request, _handleResponse(function(error, response) {
    if (error) {
      return callback(error, response[2]);
    }
    var rows = parseInt(response[2]);
    return callback(null, rows);
  }));
};

function _createRequest(fields) {
  var request = fields.map(function(field) {
    return _encodeField(field);
  }).join('\t') + '\n';
  if (exports._debug) {
    console.error(util.inspect(request));
  }
  return request;
}

function _handleResponse(callback) {
  return function(response) {
    if (exports._debug) {
      console.error(util.inspect(response));
    }
    response = response.substring(0, response.length - 1);
    var fields = response.split('\t').map(function(field) {
      return _decodeField(field);
    });
    var error = fields[0];
    if (error === '0') {
      return callback(null, fields);
    }
    var message = fields[2];
    return callback(new Error(message ? error + ' ' + message : error));
  };
}

function _encodeField(field) {
  if (field === undefined || field === null) {
    return '\0';
  }
  if (field === '') {
    return '';
  }
  if (typeof field !== 'string') {
    field = field.toString();
  }
  return field.replace(/[\x00-\x0F]/g, function(ch) {
    return String.fromCharCode(0x01, ch.charCodeAt(0) + 0x40);
  });
}

function _decodeField(field) {
  if (field === '\0') {
    return null;
  }
  return field.replace(/\u0001[\x40-\x4F]/g, function(ch) {
    return String.fromCharCode(ch.charCodeAt(1) - 0x40);
  });
}

// for tests
exports._debug = false;
exports._createRequest = _createRequest;
exports._handleResponse = _handleResponse;
exports._encodeField = _encodeField;
exports._decodeField = _decodeField;
exports.Connection = Connection;
exports.Index = Index;
