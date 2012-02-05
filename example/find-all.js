var hs = require('../index');

//hs._debug = true;
var con = hs.connect();
con.on('connect', function() {
  con.openIndex('test', 'EMPLOYEE', 'PRIMARY',
                ['EMPLOYEE_ID', 'EMPLOYEE_NO', 'EMPLOYEE_NAME'],
                function(err, index) {
    if (err) {
      console.log(err);
      con.close();
      return;
    }
    index.find('>=', 0, {limit:1000}, function(err, results) {
      if (err) {
        console.log(err);
        con.close();
        return;
      }
      results.forEach(function(row) {
        console.log(row);
      });
      con.close();
    });
  });
});
con.on('error', function(err) {
  console.log(err);
});
