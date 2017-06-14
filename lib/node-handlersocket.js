var events = require('events');
var net = require('net');
var util = require('util');


exports.connect = connect;
exports.in = inCriteria;
exports.filter = filterCriteria;
exports.while = whileCriteria;


function connect(options, connectListener) {
  if (typeof options === 'function') {
    connectListener = options;
    options = undefined;
  }
  return new Connection(options, connectListener);
}

function inCriteria() {
  var args = Array.prototype.slice.call(arguments);
  return new InCriteria(args);
}

function InCriteria(values) {
  this.values = values;
}

function filterCriteria(column, operator, value) {
  return {
    type: 'F',
    column : column,
    operator : operator,
    value : value
  };
}

function whileCriteria(column, operator, value) {
  return {
    type: 'W',
    column : column,
    operator : operator,
    value : value
  };
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
  var socket = new net.Socket({ allowHalfOpen: true });
  socket.setEncoding('utf8');
  socket.on('connect', function() {
    if (!auth) {
      self.emit('connect');
      return;
    }

    _chain([
      self._execute,
      _handleResponse
    ], function(error) {
      if (error) {
        self.emit('error', error);
        self.close();
        return;
      }
      self.emit('connect');
    }).call(self, ['A', '1', auth]);
  });
  socket.on('data', function(data) {
    if (data) {
      var received = self._received += data;
      var pos;
      while ((pos = received.indexOf('\n')) !== -1) {
        var response = received.substring(0, pos + 1);
        received = received.substring(pos + 1);
        var callback = self._callbacks.shift();
        callback(null, response);
      }
      self._received = received;
    }
  });
  socket.on('end', function() {
    self._emitClose();
  });
  socket.on('close', function(hadError) {
    self._emitClose();
  });
  socket.on('error', function(error) {
    self.emit('error', error);
    self._emitClose(error);
  });
  socket.connect(port, host);

  this._socket = socket;
  this._indexId = 0;
  this._callbacks = [];
  this._received = '';
}
util.inherits(Connection, events.EventEmitter);

Connection.prototype.openIndex =
    function openIndex(database, table, index,
                       columns, filterColumns, callback) {
  if (typeof filterColumns === 'function') {
    callback = filterColumns;
    filterColumns = [];
  }
  columns = _toArray(columns);
  filterColumns = _toArray(filterColumns);

  var self = this;
  var indexId = this._indexId++;
  var request = ['P', indexId, database, table, index, columns.join(',')];
  if (filterColumns.length > 0) {
    request = request.concat(filterColumns.join(','));
  }
  _chain([
    this._execute,
    _handleResponse
  ], function(err, fields) {
    if (err) {
      return callback(err);
    }
    callback(null, new Index(self, indexId, columns, filterColumns));
  }).call(this, request);
};

Connection.prototype.close = function close() {
  this._socket.end();
};

Connection.prototype._execute = function _execute(request, callback) {
  if (!this._socket || this._socket.readyState !== 'open') {
    process.nextTick(function() {
      callback(new Error('connection closed'));
    });
    return;
  }
  var data = _encodeRequest(request);
  this._socket.write(data, 'utf8');
  this._callbacks.push(callback);
};

Connection.prototype._notifyError = function _notifyError(error) {
  if (this._callbacks.length === 0) {
    return;
  }
  error = error || new Error('connection closed');
  var callbacks = this._callbacks;
  this._callbacks = [];
  for (var i = 0, len = callbacks.length; i < len; ++i) {
    callbacks[i](err);
  }
};

Connection.prototype._emitClose = function _emitClose(error) {
  if (!this._socket) {
    return;
  }
  this._notifyError(error);
  this.emit('close');
  this.close();
  this._socket = null;
};


function Index(con, indexId, columns, filterColumns) {
  events.EventEmitter.call(this);
  this._con = con;
  this._indexId = indexId;
  this._columns = columns;
  this._columnCount = columns.length;
  this._filterColumns = filterColumns;
}
util.inherits(Index, events.EventEmitter);

Index.prototype.find = _makeOperation(4, '', _handleResultSet);
Index.prototype.update = _makeOperation(5, 'U', _handleResultRownum);
Index.prototype.delete = _makeOperation(4, 'D', _handleResultRownum);
Index.prototype.increment = _makeOperation(5, '+', _handleResultRownum);
Index.prototype.decrement = _makeOperation(5, '-', _handleResultRownum);

Index.prototype.updateAndGet = _makeOperation(5, 'U?', _handleResultSet);
Index.prototype.deleteAndGet = _makeOperation(4, 'D?', _handleResultSet);
Index.prototype.incrementAndGet = _makeOperation(5, '+?', _handleResultSet);
Index.prototype.decrementAndGet = _makeOperation(5, '-?', _handleResultSet);

Index.prototype.insert = function insert(values, callback) {
  values = _toArray(values);
  var request = [this._indexId, '+', values.length].concat(values);

  _chain([
    _executeRequest,
    _handleResponse,
    _handleResultRownum
  ], callback).call(this, request);
};


function _makeOperation(argc, modifier, resultHandler) {
  return function _operation(operator, keys, options, values, callback) {
    if (arguments.length < argc) {
      // no options
      callback = values;
      values = options;
      options = {};
    }
    if (argc === 4) {
      // no values
      callback = values;
      values = undefined;
    }

    _chain([
      _createRequest,
      _addFilters.bind(this, options, this._filterColumns),
      _addModifier.bind(this, modifier),
      _addValues.bind(this, values),
      _executeRequest,
      _handleResponse,
      resultHandler
    ], callback).call(this, operator, keys, options);
  };
}


function _createRequest(operator, keys, options, callback) {
  var limit = options.limit || 1;
  var offset = options.offset || 0;

  var keyValues = [];
  var inCriteria = [];
  _toArray(keys).forEach(function(keyValue, i) {
    if (keyValue instanceof InCriteria) {
      keyValues.push(null);
      keyValue.pos = i;
      inCriteria.push(keyValue);
    } else {
      keyValues.push(keyValue);
    }
  });
  var request = [this._indexId, operator, keyValues.length].
                concat(keyValues, limit, offset);
  inCriteria.forEach(function(criteria) {
    var values = criteria.values;
    request = request.concat('@', criteria.pos, values.length, values);
  });
  callback(null, request);
}

function _addFilters(options, filterColumns, request, callback) {
  var filters = _toArray(options.filters || []);

  var noError = filters.every(function(criteria) {
    var column = criteria.column;
    var pos = typeof column === 'number' ? column :
                                           filterColumns.indexOf(column);
    if (pos < 0) {
      process.nextTick(function() {
        callback(new Error('invalid column: ' + column));
      });
      return false;
    }
    var filter = [criteria.type, criteria.operator, pos, criteria.value];
    request = request.concat(filter);
    return true;
  });

  if (noError) {
    callback(null, request);
  }
}

function _addModifier(modifier, request, callback) {
  if (modifier) {
    request.push(modifier);
  }
  callback(null, request);
}

function _addValues(values, request, callback) {
  if (values) {
    request = request.concat(values);
  }
  callback(null, request);
}

function _executeRequest(request, callback) {
  this._con._execute(request, callback);
}

function _handleResponse(response, callback) {
  if (exports._debug) {
    console.error(util.inspect(response));
  }
  response = response.substring(0, response.length - 1); // drop '\n'
  var fields = response.split('\t').map(function(field) {
    return _decodeField(field);
  });
  var error = fields[0];
  if (error !== '0') {
    var message = fields[2];
    return callback(new Error(message ? (error + ' ' + message) : error));
  }
  callback(null, fields);
}

function _handleResultSet(fields, callback) {
  var numColumns = parseInt(fields[1]);
  var results = [];
  for (var i = 2, len = fields.length; i < len; i += numColumns) {
    results.push(fields.slice(i, i + numColumns));
  }
  return callback(null, results);
}

function _handleResultRownum(fields, callback) {
  var rows = parseInt(fields[2]);
  return callback(null, rows);
}


function _encodeRequest(fields) {
  var request = fields.map(function(field) {
    return _encodeField(field);
  }).join('\t') + '\n';
  if (exports._debug) {
    console.error(util.inspect(request));
  }
  return request;
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

function _toArray(o) {
  return Array.isArray(o) ? o : [o];
}

function _chain(functions, callback) {
  return function doFunctions() {
    var self = this;
    var index = 0;
    var args = Array.prototype.slice.call(arguments);
    args.push(_next);
    functions[0].apply(self, args);
    
    function _next(err) {
      ++index;
      if (!err && index < functions.length) {
        var args = Array.prototype.slice.call(arguments, 1);
        args.push(_next);
        functions[index].apply(self, args);
      } else {
        var args = Array.prototype.slice.call(arguments);
        callback.apply(null, args);
      }
    }
  };
}


// for tests
exports._debug = false;
exports._encodeRequest = _encodeRequest;
exports._handleResponse = _handleResponse;
exports._encodeField = _encodeField;
exports._decodeField = _decodeField;
exports._Connection = Connection;
exports._Index = Index;
