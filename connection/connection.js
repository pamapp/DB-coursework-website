const { request } = require('express')
const sql = require('mssql')

  
const config = {
  user: "HEHEH",
  password: "1",
  database: "restaurant",
  server: 'DESKTOP-HNHRFMH',
  pool: {
    max: 50,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: false, // for azure
    trustServerCertificate: true // change to true for local dev / self-signed certs
  }
}

var sqlReq = exports.sqlReq  = function (req = 'SELECT * FROM Students') {
    return new Promise (function (resolve, reject) {
        sql.on('error', err => {
          console.log(err)
        })
        
        sql.connect(config).then(pool => {
         
            return pool.request().query(req)

        }).then(result => {
            resolve(result.recordset);
        })
        // .catch(err => {
        //     console.log(err)
        // });
    })

}

exports.request = function (req) {
  return new Promise (function (resolve, reject) {
    let output = [];

    let testa = req.length - 1;
    // console.log(testa)
  
    req.forEach ( (state, index) => {
      let promise = sqlReq(state);
  
      promise.then(function (columns) {
        output[index] = columns;
  
        if (testa == index) {
          resolve(output)
        }
      })
  
      
  
    })
  
  
    
  })

}