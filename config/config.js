'use strict';
module.exports = {
  port: 3000,
  database: {
    client: 'pg',
    connection: {
      host     : '127.0.0.1',
      user     : 'root',
      password : '',
      database : 'db_dev'
    }
  }
};