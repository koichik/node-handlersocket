# node-handlersocket - Pure JavaScript client for HandlerSocket

node-handlersocket is a pure JavaScript client for HandlerSocket.

[HandlerSocket](https://github.com/DeNADev/HandlerSocket-Plugin-for-MySQL) is a NoSQL plugin for MySQL. See [Matsunobu's blog](http://yoshinorimatsunobu.blogspot.com/2010/10/using-mysql-as-nosql-story-for.html) for more information.

# Requirements

- [Node.js](http://nodejs.org/) (>= v0.6.0, tested with v0.6.10)
- [HandlerSocket Plugin for MySQL](https://github.com/DeNA/HandlerSocket-Plugin-for-MySQL) (>= v1.1.0, tested with v1.1.0)

# Installation

    npm install node-handlersocket

# Examples

## find (select)

```javascript
var hs = require('node-handlersocket');

var con = hs.connect(function() {
  con.openIndex('test', 'EMPLOYEE', 'PRIMARY',
                ['EMPLOYEE_ID', 'EMPLOYEE_NO', 'EMPLOYEE_NAME'],
                function(err, index) {
    index.find('=', [1], function(err, records) {
      console.log(records[0]);
      con.close();
    });
  });
});
```

## find (select) with limit and offset

```javascript
var hs = require('node-handlersocket');

var con = hs.connect(function() {
  con.openIndex('test', 'EMPLOYEE', 'PRIMARY',
                ['EMPLOYEE_ID', 'EMPLOYEE_NO', 'EMPLOYEE_NAME'],
                function(err, index) {
    index.find('>=', [1], {limit: 10, offset: 0}, function(err, records) {
      records.forEach(function(record) {
        console.log(record);
      });
      con.close();
    });
  });
});
```

## find (select) with IN

```javascript
var hs = require('node-handlersocket');

var con = hs.connect(function() {
  con.openIndex('test', 'EMPLOYEE', 'PRIMARY',
                ['EMPLOYEE_ID', 'EMPLOYEE_NO', 'EMPLOYEE_NAME'],
                function(err, index) {
    index.find('=', [hs.in(1, 2, 3)], {limit: 10}, function(err, records) {
      records.forEach(function(record) {
        console.log(record);
      });
      con.close();
    });
  });
});
```

## find (select) with filter

```javascript
var hs = require('node-handlersocket');

var con = hs.connect(function() {
  con.openIndex('test', 'EMPLOYEE', 'PRIMARY',
                ['EMPLOYEE_ID', 'EMPLOYEE_NO', 'EMPLOYEE_NAME'],
                ['EMPLOYEE_NO'],
                function(err, index) {
    index.find('>=', [1], {
                 filters: [hs.filter('EMPLOYEE_NO', '<', 7800)],
                 limit: 10
               },
               function(err, records) {
      records.forEach(function(record) {
        console.log(record);
      });
      con.close();
    });
  });
});
```

## insert

    var hs = require('node-handlersocket');

    var con = hs.connect({port: 9999});
    con.on('connect', function() {
      con.openIndex('test', 'EMPLOYEE', 'PRIMARY',
                    ['EMPLOYEE_ID', 'EMPLOYEE_NO', 'EMPLOYEE_NAME'],
                    function(err, index) {
        index.insert([100, 9999, 'KOICHIK'], function(err) {
          con.close();
        });
      });
    });

## update

    var hs = require('node-handlersocket');

    var con = hs.connect({port: 9999});
    con.on('connect', function() {
      con.openIndex('test', 'EMPLOYEE', 'PRIMARY',
                    ['EMPLOYEE_ID', 'EMPLOYEE_NO', 'EMPLOYEE_NAME'],
                    function(err, index) {
        index.update('=', 100, [100, 9999, 'EBIYURI'], function(err, numRecords) {
          console.log(numRecords);
          con.close();
        });
      });
    });

## delete

    var hs = require('node-handlersocket');

    var con = hs.connect({port: 9999});
    con.on('connect', function() {
      con.openIndex('test', 'EMPLOYEE', 'PRIMARY', 
                    ['EMPLOYEE_ID', 'EMPLOYEE_NO', 'EMPLOYEE_NAME'],
                    function(err, index) {
        index.delete('=', 100, function(err, numRecords) {
          console.log(numRecords);
          con.close();
        });
      });
    });

# API

### hs.connect([options], [connectListener])

Open a connection to HandlerSocket server.

 * Parameters
   * `options`: (optional) an object with the following properties:
     * `host`: a host name or address (default is `'localhost'`).
     * `port`: a port number (default is `9998`).
     * `auth`: an authentication key.

        **Note, the port 9998 only allows read operations, and the port 9999 allows write operations also.** See [HandlerSocket installation document](https://github.com/ahiguti/HandlerSocket-Plugin-for-MySQL/blob/master/docs-en/installation.en.txt) for more information.

   * `connectListener`: (optional) It is automatically set as a listener for the `'connect'` event.
 * Returns
   * a new `Connection` object.

### hs.in(values...)

Creates and returns an IN criterion object.

 * Parameters
   * `values`: values of index.
 * Returns
   * a new IN criterion object.

### hs.filter(column, op, value)

Creates and returns a filter criterion object.

 * Parameters
   * `column`: a column name used by this filter. It must be included in `filterColumns` specified `Connection.openIndex()`.
   * `op`: a filter operation, one of `'='`, `'>'`, `'>='`, `'<'` and `'<='`.
   * `value`: a value.
 * Returns
   * a new filter object.

### hs.while(column, op, value)

Creates and returns a *while* filter criterion object.

 * Parameters
   * `column`: a column name used by this filter. It must be included in `filterColumns` specified `Connection.openIndex()`.
   * `op`: a filter operation, one of `'='`, `'>'`, `'>='`, `'<'` and `'<='`.
   * `value`: a value.
 * Returns
   * a new *while* filter object.

## Connection

An object representing connection to the HandlerSocket server. It is an instance of `EventEmitter`.

### 'connect' event

Emitted when a connection is established.

* Callback function: ` function()`

### 'close' event

Emitted once the connection is fully closed.

* Callback function: ` function()`

### 'error' event

Emitted when an error occurs.

 * Callback function: ` function(err)`
   * Parameters
     * `err`: an error that occurred.

### Connection.prototype.openIndex(database, table, index, columns, [filterColumns], callback)

Open an index.

 * Parameters
   * `database`: a database name.
   * `table`: a table name.
   * `index`: an index name. If 'PRIMARY' is specified, the primary index is open.
   * `columns`: an array of column names.
   * `filterColumns`: (optional) an array of column names used by a filter.
   * `callback`: a function to be called when the response received.
 * Callback function: `function(err, index)`
   * Parameters
     * `err`: an `Error` object when the request failed, otherwise `null`.
     * `index`: a new `Index` object.

### Connection.prototype.close()

Close the connection.

## Index

An object representing MySQL's index.

### Index.prototype.find(op, keys, [options], callback)

To read records from a table using the index.

 * Parameters
   * `op`: a search operation, one of `'='`, `'>'`, `'>='`, `'<'` and `'<='`.
   * `keys`: an array of index values. It can include an IN criterion returned from `hs.in()`.
   * `options`: (optional) an object which specifies several options.
     * `filters`: an array of filters returned from `hs.filter()` and/or `hs.while()`.
     * `limit`: a maximum number of records to be retrieved (defaults to 1).
     * `offset`: a number of records skipped before retrieving records (defaults to 0)．
   * `callback`: a function to be called when the response received.
 * Callback Function: `function(err, records)`
   * Parameters
     * `err`: an `Error` object when the request failed, otherwise `null`.
     * `records`: an array of records. Each record is array of column values which corresponds to `columns` parameter of `Connection.openIndex()`.

### Index.prototype.insert(values, callback)

To add records.

 * Parametes
   * values: an array of new column values which corresponds to `columns` parameter of `Connection.openIndex()`.
   * `callback`: a function to be called when the response received.
 * Callback Function: `function(err)`
   * Parameters
     * `err`: an `Error` object when the request failed, otherwise `null`.

### Index.prototype.update(op, keys, [options], values, callback)

To update records.

 * Parametes
   * `op`: a search operation, one of `'='`, `'>'`, `'>='`, `'<'` and `'<='`.
   * `keys`: an array of index values. It can include an IN criterion returned from `hs.in()`.
   * `options`: (optional) an object which specifies several options.
     * `filters`: an array of filter returned from `hs.filter()` and/or `hs.while()`.
     * `limit`: a maximum number of records to be retrieved (defaults to 1).
     * `offset`: a number of records skipped before retrieving records (defaults to 0)．
   * values: an array of new column values which corresponds to `columns` parameter of `Connection.openIndex()`.
   * `callback`: a function to be called when the response received.
 * Callback Function: `function(err, numRecords)`
   * Parameters
     * `err`: an `Error` object when the request failed, otherwise `null`.
     * `numRecords`: a number of updated records.

### Index.prototype.updateAndGet(op, keys, [options], values, callback)

To update records and get values before they are updated.

 * Parametes
   * `op`: a search operation, one of `'='`, `'>'`, `'>='`, `'<'` and `'<='`.
   * `keys`: an array of index values. It can include an IN criterion returned from `hs.in()`.
   * `options`: (optional) an object which specifies several options.
     * `filters`: an array of filter returned from `hs.filter()` and/or `hs.while()`.
     * `limit`: a maximum number of records to be retrieved (defaults to 1).
     * `offset`: a number of records skipped before retrieving records (defaults to 0)．
   * values: an array of new column values which corresponds to `columns` parameter of `Connection.openIndex()`.
   * `callback`: a function to be called when the response received.
 * Callback Function: `function(err, records)`
   * Parameters
     * `err`: an `Error` object when the request failed, otherwise `null`.
     * `records`: an array of records before modification. Each record is an array of column values which corresponds to `columns` parameter of `Connection.openIndex()`.

### Index.prototype.increment(op, keys, [options], values, callback)

To increment records.

 * Parametes
   * `op`: a search operation, one of `'='`, `'>'`, `'>='`, `'<'` and `'<='`.
   * `keys`: an array of index values. It can include an IN criterion returned from `hs.in()`.
   * `options`: (optional) an object which specifies several options.
     * `filters`: an array of filter returned from `hs.filter()` and/or `hs.while()`.
     * `limit`: a maximum number of records to be retrieved (defaults to 1).
     * `offset`: a number of records skipped before retrieving records (defaults to 0)．
   * values: an array of incremental values which corresponds to `columns` parameter of `Connection.openIndex()`.
   * `callback`: a function to be called when the response received.
 * Callback Function: `function(err, numRecords)`
   * Parameters
     * `err`: an `Error` object when the request failed, otherwise `null`.
     * `numRecords`: a number of updated records.

### Index.prototype.incrementAndGet(op, keys, [options], values, callback)

To increment records and get values before they are updated.

 * Parametes
   * `op`: a search operation, one of `'='`, `'>'`, `'>='`, `'<'` and `'<='`.
   * `keys`: an array of index values. It can include an IN criterion returned from `hs.in()`.
   * `options`: (optional) an object which specifies several options.
     * `filters`: an array of filter returned from `hs.filter()` and/or `hs.while()`.
     * `limit`: a maximum number of records to be retrieved (defaults to 1).
     * `offset`: a number of records skipped before retrieving records (defaults to 0)．
   * values: an array of incremental values which corresponds to `columns` parameter of `Connection.openIndex()`.
   * `callback`: a function to be called when the response received.
 * Callback Function: `function(err, records)`
   * Parameters
     * `err`: an `Error` object when the request failed, otherwise `null`.
     * `records`: an array of records before modification. Each record is an array of column values which corresponds to `columns` parameter of `Connection.openIndex()`.

### Index.prototype.decrement(op, keys, [options], values, callback)

To decrement records.

 * Parametes
   * `op`: a search operation, one of `'='`, `'>'`, `'>='`, `'<'` and `'<='`.
   * `keys`: an array of index values. It can include an IN criterion returned from `hs.in()`.
   * `options`: (optional) an object which specifies several options.
     * `filters`: an array of filter returned from `hs.filter()` and/or `hs.while()`.
     * `limit`: a maximum number of records to be retrieved (defaults to 1).
     * `offset`: a number of records skipped before retrieving records (defaults to 0)．
   * values: an array of decremental values which corresponds to `columns` parameter of `Connection.openIndex()`.
   * `callback`: a function to be called when the response received.
 * Callback Function: `function(err, numRecords)`
   * Parameters
     * `err`: an `Error` object when the request failed, otherwise `null`.
     * `numRecords`: a number of updated records.

### Index.prototype.decrementAndGet(op, keys, [options], values, callback)

To decrement records and get values before they are updated.

 * Parametes
   * `op`: a search operation, one of `'='`, `'>'`, `'>='`, `'<'` and `'<='`.
   * `keys`: an array of index values. It can include an IN criterion returned from `hs.in()`.
   * `options`: (optional) an object which specifies several options.
     * `filters`: an array of filter returned from `hs.filter()` and/or `hs.while()`.
     * `limit`: a maximum number of records to be retrieved (defaults to 1).
     * `offset`: a number of records skipped before retrieving records (defaults to 0)．
   * values: an array of decremental values which corresponds to `columns` parameter of `Connection.openIndex()`.
   * `callback`: a function to be called when the response received.
 * Callback Function: `function(err, records)`
   * Parameters
     * `err`: an `Error` object when the request failed, otherwise `null`.
     * `records`: an array of records before modification. Each record is an array of column values which corresponds to `columns` parameter of `Connection.openIndex()`.

### Index.prototype.delete(op, keys, [options], callback)

To delete records.

 * Parametes
   * `op`: a search operation, one of `'='`, `'>'`, `'>='`, `'<'` and `'<='`.
   * `keys`: an array of index values. It can include an IN criterion returned from `hs.in()`.
   * `options`: (optionaal) an object which specifies several options.
     * `filters`: an array of filter returned from `hs.filter()` and/or `hs.while()`.
     * `limit`: a maximum number of records to be retrieved (defaults to 1).
     * `offset`: a number of records skipped before retrieving records (defaults to 0)．
   * `callback`: a function to be called when the response received.
 * Callback Function: `function(err, numRecords)`
   * Parameters
     * `err`: an `Error` object when the request failed, otherwise `null`.
     * `numRecords`: a number of deleted records.

### Index.prototype.deleteAndGet(op, keys, [options], callback)

To delete records and get values before they are deleted.

 * Parametes
   * `op`: a search operation, one of `'='`, `'>'`, `'>='`, `'<'` and `'<='`.
   * `keys`: an array of index values. It can include an IN criterion returned from `hs.in()`.
   * `options`: (optional) an object which specifies several options.
     * `filters`: an array of filter returned from `hs.filter()` and/or `hs.while()`.
     * `limit`: a maximum number of records to be retrieved (defaults to 1).
     * `offset`: a number of records skipped before retrieving records (defaults to 0)．
   * `callback`: a function to be called when the response received.
 * Callback Function: `function(err, records)`
   * Parameters
     * `err`: an `Error` object when the request failed, otherwise `null`.
     * `records`: an array of records before deletion. Each  is an array of column values which corresponds to `columns` parameter of `Connection.openIndex()`.

# Test

node-handlersocket depends on [Vows](http://vowsjs.org/) for unit testing.

    npm test

# Limitations

The encoding of MySQL server (`default-character-set` parameter in `[mysqld]` section)
which node-handlersocket supports is **only UTF-8**.

Binary data types are not supported.

# License

node-handlersocket is licensed under the [MIT license](http://www.opensource.org/licenses/mit-license.php).
