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
    index.find('=', 1, function(err, results) {
      if (err) {
        console.log(err);
        con.close();
        return;
      }
      console.log(results[0]);
      con.close();
    });
  });
});
con.on('error', function(err) {
  console.log(err);
});
