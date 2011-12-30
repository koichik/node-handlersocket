# node-handlersocket - Pure JavaScript client for HandlerSocket

node-handlersocket is a pure JavaScript client for HandlerSocket.

[HandlerSocket](https://github.com/ahiguti/HandlerSocket-Plugin-for-MySQL)
is a NoSQL plugin for MySQL.
See [auther's blog](http://yoshinorimatsunobu.blogspot.com/2010/10/using-mysql-as-nosql-story-for.html)
for more information.

# Requirements

- [Node.js](http://nodejs.org/) (>= v0.6.0, tested with v0.6.6)
- [HandlerSocket Plugin for MySQL](https://github.com/ahiguti/HandlerSocket-Plugin-for-MySQL) (>= v1.1.0, tested with v1.1.0)

# Installation

    npm install node-handlersocket

# Examples

## find (select)

```javascript
var hs = require('node-handlersocket');

var con = hs.connect(function() {
  con.openIndex('test', 'EMPLOYEE', 'PRIMARY',
                [ 'EMPLOYEE_ID', 'EMPLOYEE_NO', 'EMPLOYEE_NAME' ],
                function(err, index) {
    index.find('=', [ 1 ], function(err, results) {
      console.log(results[0]);
      con.end();
    });
  });
});
```

## find (select) with limit and offset

```javascript
var hs = require('node-handlersocket');

var con = hs.connect(function() {
  con.openIndex('test', 'EMPLOYEE', 'PRIMARY',
                [ 'EMPLOYEE_ID', 'EMPLOYEE_NO', 'EMPLOYEE_NAME' ],
                function(err, index) {
    index.find('>=', [ 1 ], { limit: 10, offset: 0 }, function(err, results) {
      results.forEach(function(row) {
        console.log(row);
      });
      con.end();
    });
  });
});
```

## find (select) with IN

```javascript
var hs = require('node-handlersocket');

var con = hs.connect(function() {
  con.openIndex('test', 'EMPLOYEE', 'PRIMARY',
                [ 'EMPLOYEE_ID', 'EMPLOYEE_NO', 'EMPLOYEE_NAME' ],
                function(err, index) {
    index.find('=', [ hs.in(1, 2, 3) ],
               { limit: 10 },
               function(err, results) {
      results.forEach(function(row) {
        console.log(row);
      });
      con.end();
    });
  });
});
```

## find (select) with filter

```javascript
var hs = require('node-handlersocket');

var con = hs.connect(function() {
  con.openIndex('test', 'EMPLOYEE', 'PRIMARY',
                [ 'EMPLOYEE_ID', 'EMPLOYEE_NO', 'EMPLOYEE_NAME' ],
                [ 'EMPLOYEE_NO' ],
                function(err, index) {
    index.find('>=', [ 1 ], {
                 filters: [ hs.filter('EMPLOYEE_NO', '<', 7800) ],
                 limit: 10
               },
               function(err, results) {
      results.forEach(function(row) {
        console.log(row);
      });
      con.end();
    });
  });
});
```

## insert

    var hs = require('node-handlersocket');

    var con = hs.connect({port : 9999});
    con.on('connect', function() {
      con.openIndex('test', 'EMPLOYEE', 'PRIMARY',
                    [ 'EMPLOYEE_ID', 'EMPLOYEE_NO', 'EMPLOYEE_NAME' ],
                    function(err, index) {
        index.insert([100, 9999, 'KOICHIK'], function(err) {
          con.end();
        });
      });
    });

## update

    var hs = require('node-handlersocket');

    var con = hs.connect({port : 9999});
    con.on('connect', function() {
      con.openIndex('test', 'EMPLOYEE', 'PRIMARY', [ 'EMPLOYEE_ID', 'EMPLOYEE_NO',
        'EMPLOYEE_NAME' ], function(err, index) {
        index.update('=', 100, [100, 9999, 'EBIYURI'], function(err, rows) {
          console.log(rows);
          con.end();
        });
      });
    });

## delete

    var hs = require('node-handlersocket');

    var con = hs.connect({port : 9999});
    con.on('connect', function() {
      con.openIndex('test', 'EMPLOYEE', 'PRIMARY', [ 'EMPLOYEE_ID', 'EMPLOYEE_NO',
        'EMPLOYEE_NAME' ], function(err, index) {
        index.delete('=', 100, function(err, rows) {
          console.log(rows);
          con.end();
        });
      });
    });

# API

## hs.connect([ options ], [ connectListener ])

Open a connection to HandlerSocket server.

* Parameters
    * `options` (optional) : an object with the following properties:
        * `host` : a host name or address (default is `'localhost'`).
        * `port` : a port number (default is `9998`).
        * `auth` : an authentication key.

        **Note, the port 9998 only allows read operations, and the port 9999 allows write operations also.**
        See [HandlerSocket installation document](https://github.com/ahiguti/HandlerSocket-Plugin-for-MySQL/blob/master/docs-en/installation.en.txt) for more information.
    * `connectListener` (optional) : It is automatically set as a listener for
      the `'connect'` event.
* Returns
    * a new `Connection` object.

### hs.in(values...)

Creates and returns an IN criterion object.

* Parameters
    * `values` : a values of index.
* Returns
    * a new IN criterion object.

### hs.filter(column, op, value)

Creates and returns a filter criterion object.

* Parameters
    * `column` : a column name used by this filter. It must be included in
      `filterColumns` specified `Connection.openIndex()`.
    * `op` : a filter operation, one of `'='`, `'>'`, `'>='`, `'<'` and `'<='`.
    * `value` : a value.
* Returns
    * a new filter object.

### Function : hs.while(column, op, value)

Creates and returns a filter criterion object.

* Parameters
    * `column` : a column name used by this filter. It must be included in
      `filterColumns` specified `Connection.openIndex()`.
    * `op` : a filter operation, one of `'='`, `'>'`, `'>='`, `'<'` and `'<='`.
    * `value` : a value.
* Returns
    * a new filter object.

## Connection

An object representing connection to HandlerSocket.
It is an instance of `EventEmitter`.

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
        * `err` : an error that occurred.

### Connection.prototype.openIndex(database, table, index, columns, filterColumns, callback)

Open an index.

* Parameters
    * `database` : a database name.
    * `table` : a table name.
    * `index` : an index name. If 'PRIMARY' is specified, the primary index is open.
    * `columns` : an array of columns names.
    * `filterColumns` : an array of column names used by a filter.
    * `callback` : a function to be called when the response received.
* Callback function : `function(err, index)`
    * Parameters
        * `err` : an `Error` object when the request failed, otherwise `null`.
        * `index` : a new `Index` object.

### Connection.prototype.close()

Half-closes the connection.

## Index

An object representing MySQL's index.

### Index.prototype.find(op, keys, [ options ], callback)

To read a records from a table using the index.

* Parameters
    * `op` : a search operation, one of `'='`, `'>'`, `'>='`, `'<'` and `'<='`.
    * `keys` : an array of index values. It can include an IN criterion
      returned from `hs.in()`.
    * `options` : an object which specifies several options.
        * `filters` : an array of filter returned from `hs.filter()`
          and/or `hs.while()`.
        * `limit` : a maximum number of records to be retrieved (defaults to 1).
        * `offset` : a number of records skipped before retrieving records
          (defaults to 0)．
    * `callback` : a function to be called when the response received.
* Callback Function : `function(err, results)`
    * Parameters
        * `err` : an `Error` object when the request failed, otherwise `null`.
        * `results` : an array of records.
        Each recored is array of column values which correspond to `columns` parameter of `Connection.openIndex()`.

### Index.prototype.insert(values, callback)

To add a records.

* Parametes
    * values : an array of new column values which correspond to `columns` parameter of `Connection.openIndex()`.
    * `callback` : a function to be called when the response received.
* Callback Function : `function(err)`
    * Parameters
        * `err` : an `Error` object when the request failed, otherwise `null`.

### Index.prototype.update(op, keys, [ options ], values, callback)

To update a records.

* Parametes
    * `op` : a search operation, one of `'='`, `'>'`, `'>='`, `'<'` and `'<='`.
    * `keys` : an array of index values. It can include an IN criterion
      returned from `hs.in()`.
    * `options` : an object which specifies several options.
        * `filters` : an array of filter returned from `hs.filter()`
          and/or `hs.while()`.
        * `limit` : a maximum number of records to be retrieved (defaults to 1).
        * `offset` : a number of records skipped before retrieving records
          (defaults to 0)．
    * values : an array of new column values which correspond to `columns` parameter of `Connection.openIndex()`.
    * `callback` : a function to be called when the response received.
* Callback Function : `function(err, rows)`
    * Parameters
        * `err` : an `Error` object when the request failed, otherwise `null`.
        * `rows` : a number of updated rows.

### Index.prototype.updateAndGet(op, keys, [ options ], values, callback)

To update a records.

* Parametes
    * `op` : a search operation, one of `'='`, `'>'`, `'>='`, `'<'` and `'<='`.
    * `keys` : an array of index values. It can include an IN criterion
      returned from `hs.in()`.
    * `options` : an object which specifies several options.
        * `filters` : an array of filter returned from `hs.filter()`
          and/or `hs.while()`.
        * `limit` : a maximum number of records to be retrieved (defaults to 1).
        * `offset` : a number of records skipped before retrieving records
          (defaults to 0)．
    * values : an array of new column values which correspond to `columns` parameter of `Connection.openIndex()`.
    * `callback` : a function to be called when the response received.
* Callback Function : `function(err, results)`
    * Parameters
        * `err` : an `Error` object when the request failed, otherwise `null`.
        * `results` : an array of records before modification.
          Each recored is an array of column values which correspond to
          `columns` parameter of `Connection.openIndex()`.

### Index.prototype.increment(op, keys, [ options ], values, callback)

To increment a records.

* Parametes
    * `op` : a search operation, one of `'='`, `'>'`, `'>='`, `'<'` and `'<='`.
    * `keys` : an array of index values. It can include an IN criterion
      returned from `hs.in()`.
    * `options` : an object which specifies several options.
        * `filters` : an array of filter returned from `hs.filter()`
          and/or `hs.while()`.
        * `limit` : a maximum number of records to be retrieved (defaults to 1).
        * `offset` : a number of records skipped before retrieving records
          (defaults to 0)．
    * values : an array of incremental values which correspond to `columns` parameter of `Connection.openIndex()`.
    * `callback` : a function to be called when the response received.
* Callback Function : `function(err, rows)`
    * Parameters
        * `err` : an `Error` object when the request failed, otherwise `null`.
        * `rows` : a number of updated rows.

### Index.prototype.incrementAndGet(op, keys, [ options ], values, callback)

To increment a records.

* Parametes
    * `op` : a search operation, one of `'='`, `'>'`, `'>='`, `'<'` and `'<='`.
    * `keys` : an array of index values. It can include an IN criterion
      returned from `hs.in()`.
    * `options` : an object which specifies several options.
        * `filters` : an array of filter returned from `hs.filter()`
          and/or `hs.while()`.
        * `limit` : a maximum number of records to be retrieved (defaults to 1).
        * `offset` : a number of records skipped before retrieving records
          (defaults to 0)．
    * values : an array of incremental values which correspond to `columns` parameter of `Connection.openIndex()`.
    * `callback` : a function to be called when the response received.
* Callback Function : `function(err, results)`
    * Parameters
        * `err` : an `Error` object when the request failed, otherwise `null`.
        * `results` : an array of records before modification.
          Each recored is an array of column values which correspond to
          `columns` parameter of `Connection.openIndex()`.

### Index.prototype.decrement(op, keys, [ options ], values, callback)

To deirement a records.

* Parametes
    * `op` : a search operation, one of `'='`, `'>'`, `'>='`, `'<'` and `'<='`.
    * `keys` : an array of index values. It can include an IN criterion
      returned from `hs.in()`.
    * `options` : an object which specifies several options.
        * `filters` : an array of filter returned from `hs.filter()`
          and/or `hs.while()`.
        * `limit` : a maximum number of records to be retrieved (defaults to 1).
        * `offset` : a number of records skipped before retrieving records
          (defaults to 0)．
    * values : an array of decremental values which correspond to `columns` parameter of `Connection.openIndex()`.
    * `callback` : a function to be called when the response received.
* Callback Function : `function(err, rows)`
    * Parameters
        * `err` : an `Error` object when the request failed, otherwise `null`.
        * `rows` : a number of updated rows.

### Index.prototype.decrementAndGet(op, keys, [ options ], values, callback)

To deirement a records.

* Parametes
    * `op` : a search operation, one of `'='`, `'>'`, `'>='`, `'<'` and `'<='`.
    * `keys` : an array of index values. It can include an IN criterion
      returned from `hs.in()`.
    * `options` : an object which specifies several options.
        * `filters` : an array of filter returned from `hs.filter()`
          and/or `hs.while()`.
        * `limit` : a maximum number of records to be retrieved (defaults to 1).
        * `offset` : a number of records skipped before retrieving records
          (defaults to 0)．
    * values : an array of decremental values which correspond to `columns` parameter of `Connection.openIndex()`.
    * `callback` : a function to be called when the response received.
* Callback Function : `function(err, results)`
    * Parameters
        * `err` : an `Error` object when the request failed, otherwise `null`.
        * `results` : an array of records before modification.
          Each recored is an array of column values which correspond to
          `columns` parameter of `Connection.openIndex()`.

### Index.prototype.delete(op, keys, [ limit, [ offset ] ], callback)

To delete a records.

* Parametes
    * `op` : a search operation, one of `'='`, `'>'`, `'>='`, `'<'` and `'<='`.
    * `keys` : an array of index values. It can include an IN criterion
      returned from `hs.in()`.
    * `options` : an object which specifies several options.
        * `filters` : an array of filter returned from `hs.filter()`
          and/or `hs.while()`.
        * `limit` : a maximum number of records to be retrieved (defaults to 1).
        * `offset` : a number of records skipped before retrieving records
          (defaults to 0)．
    * `callback` : a function to be called when the response received.
* Callback Function : `function(err, rows)`
    * Parameters
        * `err` : an `Error` object when the request failed, otherwise `null`.
        * `rows` : a number of deleted rows.

### Index.prototype.deleteAndGet(op, keys, [ limit, [ offset ] ], callback)

To delete a records.

* Parametes
    * `op` : a search operation, one of `'='`, `'>'`, `'>='`, `'<'` and `'<='`.
    * `keys` : an array of index values. It can include an IN criterion
      returned from `hs.in()`.
    * `options` : an object which specifies several options.
        * `filters` : an array of filter returned from `hs.filter()`
          and/or `hs.while()`.
        * `limit` : a maximum number of records to be retrieved (defaults to 1).
        * `offset` : a number of records skipped before retrieving records
          (defaults to 0)．
    * `callback` : a function to be called when the response received.
* Callback Function : `function(err, results)`
    * Parameters
        * `err` : an `Error` object when the request failed, otherwise `null`.
        * `results` : an array of records before deletion.
          Each recored is an array of column values which correspond to
          `columns` parameter of `Connection.openIndex()`.

# Test

node-handlersocket depends on [Vows](http://vowsjs.org/) for testing.

    npm test

or

    mysql -u root -p test < sql/create.sql
    vows test/*.js
    mysql -u root -p test < sql/drop.sql

# Limitations

The encoding of MySQL server (`default-character-set` parameter in `[mysqld]` section)
which node-handlersocket supports is **only UTF-8**.

Binary data types are not supported.

# License

node-handlersocket is licensed under the [MIT license](http://www.opensource.org/licenses/mit-license.php).
