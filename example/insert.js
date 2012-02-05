var hs = require('../index');

//hs._debug = true;
var con = hs.connect({port: 9999, auth: 'node'});
con.on('connect', function() {
  con.openIndex('test', 'EMPLOYEE', 'PRIMARY',
                ['EMPLOYEE_ID', 'EMPLOYEE_NO'], function(err, index) {
    if (err) {
      console.log(err);
      con.close();
      return;
    }
    index.insert([100, 9990], function(err) {
      if (err) {
        console.log(err);
        con.close();
        return;
      }
      console.log('1 row inserted');
      con.close();
    });
  });
});
con.on('error', function(err) {
  console.log(err);
});
