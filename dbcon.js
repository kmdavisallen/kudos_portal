var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit : 10,
  host            : 'den1.mysql2.gear.host',
  user            : 'tabitcapstone',
  password        : 'Px96A20T_e_9',
  database        : 'tabitcapstone'
});

module.exports.pool = pool;
