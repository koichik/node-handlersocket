var hs = require('../lib/node-handlersocket');

//hs._debug = true;
var con = hs.connect({port: 9999, auth: 'node'});
con.on('connect', function() {
  con.openIndex('test', 'EMPLOYEE', 'PRIMARY',
                ['EMPLOYEE_ID', 'EMPLOYEE_NO', 'EMPLOYEE_NAME'],
                function(err, index) {
    if (err) {
      console.log(err);
      con.close();
      return;
    }
    index.update('=', 100, [100, 9990, 'EBIYURI'], function(err, rows) {
      if (err) {
        console.log(err);
        con.close();
        return;
      }
      console.log(rows + ' row updated');
      con.close();
    });
  });
});
con.on('error', function(err) {
  console.log(err);
});
