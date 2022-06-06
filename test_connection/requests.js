var Request = require('tedious').Request;
var connect = require('./connection.js');

var request = new Request ("SELECT * FROM Students", function(err, rowCount, rows){
    if(err){
        console.log(err)
        console.log("DUDE")
    } else {
        console.log(rows)
    }
    
})



exports.startRequest = function (){

    return new Promise (function(resolve, reject){
        let promise = connect.ConnectToDb(request);
        
        promise.then (function(result){
            // console.log(result)
            resolve(result);
        })
    })

}
