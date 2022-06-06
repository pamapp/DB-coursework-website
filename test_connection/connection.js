var Connection = require('tedious').Connection;
var response = {};
var counter = 1;

var config = {  
    server: 'DESKTOP-5PENVSL',  
    authentication: {
        type: 'default',
        options: {
            userName: 'HEHEH', 
            password: '1'  
        }
    },
    options: {
        database: 'Session'  
    }
}; 



exports.ConnectToDb = function (requestS = 1) {

    var connection = new Connection(config); 
    connection.connect()
    

    return new Promise (function(resolve, reject){
        connection.on('connect', function(err) {  
            if(err) {
                reject(err);
                
            } else {
                console.log("Connected");
                
                if (requestS != 1) {
                var res = {};
                const promise = Execute(requestS);
                promise.then(function(res){
                    resolve(res);
                })

                };
    
            }   
    })
               
    
    }); 


    

    function Execute(requestS) {
        
        return new Promise (function (resolve, reject){
            connection.execSql(requestS);
            // console.log(requestS)

            var response = [];
            var count = 1;

            requestS.on('columnMetadata', function (columns) {
                let response = [];
                let count = 0;
                columns.forEach(function(column){
                    // response[count] = column.colName;
                })
                // console.log(response)
             });

            // requestS.on ('row', function(columns){
            //     // columns.forEach(function(column){
            //     //     response[count] = column;
            //     //     count++;
            //     // })
            //     // console.log(response)
            //     // console.log(columns);
            //     // resolve(columns);   
            //     // console.log(columns)
            //     // resolve(columns)
            //     console.log(`вызов on row`)
            // })

            // requestS.on ('done', function(rowCount, more, rows){
            //     // columns.forEach(function(column){
            //     //     response[count] = column;
            //     //     count++;
            //     // })
            //     // console.log(response)
            //     // console.log(rowCount)

            //     // resolve(rows);   
            //     console.log('вызов on done')            
            // })

            // requestS.on('requestCompleted', function(){
            //     console.log('request completed')
            // })

    
            // console.log(response)
            // resolve(response);

            requestS.on('row', (row) => {
                saveRow(row)
                // console.log(row)
            })
            // const mass = requestS.on('row', row);
            // console.log(mass)
            // requestS.on('done', requestDone);


            async function row (columns){
                
                columns.forEach((column) => {
                    saveRow(column)
                })
                // console.log(values, back)
                // return await values;
            }

            function saveRow(column){
                response[count] = column.value ;
                count++
            }

           resolve(response)


        })
    };






    }

     

