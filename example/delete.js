var hs = require('../index');

//hs._debug = true;
var con = hs.connect({port: 9999, auth: 'node'});
con.on('connect', function() {
  con.openIndex('test', 'EMPLOYEE', 'PRIMARY',
                ['EMPLOYEE_ID', 'EMPLOYEE_NO', 'EMPLOYEE_NAME'],
                function(err, index) {
    if (err) {
      console.log(err);
      con.clode();
      return;
    }
    index.delete('>=', 100, {limit: 100}, function(err, rows) {
      if (err) {
        console.log(err);
        con.clode();
        return;
      }
      console.log(rows + ' row(s) deleted');
      con.close();
    });
  });
});
con.on('error', function(err) {
  console.log(err);
});
