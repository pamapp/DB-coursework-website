const express = require('express');
const hash = require("hash.js");

const app = express();
const bodyParser = require('body-parser')
const bd = require('./connection/connection.js');
const e = require('express');
app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({extended: true}))
process.setMaxListeners(20);
const PORT = 3001


//Login And Registration

app.get("/RegOrLoginPage", function(req, res) {  
    res.render(__dirname + '/pages/RegOrLoginPage', {});
});


app.get("/Login", function(req, res) {  
    res.render(__dirname + '/pages/Login', {});
});


app.post('/Login', (req,res) => {
    
    state0 = `EXEC log_in '${req.body.username}', '${hash.sha256().update(req.body.password).digest('hex')}'`

    st = [state0];

    let tables = bd.request(st);
    
    tables.then(table => {
        table.forEach(function(column, index){ 
            if(column[index] == undefined) {
                res.redirect(`http://localhost:3001/Login`)
            } else if(column[index].Role === 0) {
                res.redirect(`http://localhost:3001/ClientMainPage?client_id=${column[index].Id}`)
            } else if (column[index].Role === 1) {
                res.redirect(`http://localhost:3001/EmployeeMainPage?employee_id=${column[index].Id}`)
            } else if (column[index].Role === 2) {
                res.redirect(`http://localhost:3001/AdminMainPage?admin_id=${column[index].Id}`)
            } 
        })
    })
})



//Admin

app.get("/AdminMainPage", function(req, res) { 
    var admin_id = req.query.admin_id;
    res.render(__dirname + '/pages/Admin/AdminMainPage', {
        admin_id: req.query.admin_id
    });
});


app.get("/RegEmployee", function(req, res) {  
    var admin_id = req.query.admin_id;
    res.render(__dirname + '/pages/Admin/RegEmployee', {
        admin_id: req.query.admin_id
    });
});

app.get("/ErrorRegistration", function(req, res) {  
    var admin_id = req.query.admin_id;
    res.render(__dirname + '/pages/Admin/ErrorRegistration', {
        admin_id: req.query.admin_id
    });
});


app.post('/RegEmployee', (req,res) => {
    req.body.password = hash.sha256().update(req.body.password).digest('hex')

    state0 = `EXEC regEmployee '${req.body.login}', '${req.body.password}', '${req.body.surname}', '${req.body.name}', '${req.body.salary}', '${req.body.position}'`

    st = [state0];

    let tables = bd.request(st);

    tables.then(table => {
        if (table[0] == undefined) {
            res.redirect(`http://localhost:3001/ErrorRegistration`)
        } else {
            res.redirect(`http://localhost:3001/AdminMainPage?admin_id=${req.body.admin_id}`)
        } 
    })
})

app.get("/AdminLK", function(req, res) {  
    var admin_id = req.query.admin_id; 

    state = `SELECT Users.Login, Users.Password, Employees.Surname, Employees.Name, Employees.Salary, Employees.Position FROM Users 
    JOIN Employees ON Employees.UserId = Users.IdUser AND Employees.IdEmployee = ${admin_id}`

    let tables = bd.sqlReq(state);

    tables.then(function(table, admin_id){
        res.render(__dirname+'/pages/Admin/AdminLK', {
            table: table,
            admin_id: req.query.admin_id
         })
    })
});

app.post('/AdminLK', (req,res) => {
    req.body.password = hash.sha256().update(req.body.password).digest('hex')

    state1 = `EXEC changeEmployeeUser '${req.body.admin_id}', '${req.body.login}', '${req.body.password}'`

    st = [state1];

    bd.request(st);
    
    res.redirect(`http://localhost:3001/AdminLK?admin_id=${req.body.admin_id}`)
})


app.get('/AdminOrderList', (req,res) => {
    var status = req.query.status;
    var admin_id = req.query.admin_id; 

    state1 = 'SELECT NameStatus FROM OrderStatus'
    state2 = `EXEC orderListByStatus '${status}'`
    state3 = `SELECT Orders.IdOrder, FORMAT(Orders.CreationTime, 'dd.MM.yyyy HH:mm') AS 'Creation Time', Clients.Name AS 'Client', Clients.Phone, Orders.Price, OrderStatus.NameStatus 
    FROM Orders
    JOIN OrderStatus ON Orders.StatusId = OrderStatus.IdStatus AND Orders.Price != 0
    JOIN Clients ON Orders.ClientId = Clients.IdClient
    ORDER BY Orders.CreationTime DESC`
    
    st = [state1, state2, state3];

    let tables = bd.request(st);

    tables.then(function(table, status, admin_id) {
        res.render(__dirname + '/pages/Admin/AdminOrderList', {
            table: table,
            status: req.query.status,
            admin_id: req.query.admin_id
         })
    })
})


app.get('/AdminOrderDetail', (req,res) => {
    var order_id = req.query.order_id;
    var status = req.query.status;
    var admin_id = req.query.admin_id; 

    state0 = 'SELECT NameStatus FROM OrderStatus'

    state1 = `SELECT OrderStatus.NameStatus, Clients.Name, Clients.Phone,
    FORMAT(Orders.CreationTime, 'dd.MM.yyyy HH:mm'), Orders.Price, Orders.EmployeeId FROM Orders
    JOIN OrderStatus ON Orders.StatusId = OrderStatus.IdStatus AND Orders.IdOrder = '${order_id}'
    JOIN Clients ON Orders.ClientId = Clients.IdClient`

    state2 = `SELECT Dishes.Title, DishList.Number, DishList.IsDone FROM Dishes 
    JOIN DishList ON DishList.DishId = Dishes.IdDish 
    JOIN Orders ON Orders.IdOrder = DishList.OrderId AND Orders.IdOrder = ${order_id}
    JOIN OrderStatus ON Orders.StatusId = OrderStatus.IdStatus`

    state3 = `SELECT OrderStatus.NameStatus, Clients.Name, Clients.Phone,
    FORMAT(Orders.CreationTime, 'dd.MM.yyyy HH:mm'), Orders.Price, Employees.Surname FROM Orders
    JOIN OrderStatus ON Orders.StatusId = OrderStatus.IdStatus AND Orders.IdOrder = '${order_id}'
    JOIN Employees ON Employees.IdEmployee = Orders.EmployeeId
    JOIN Clients ON Orders.ClientId = Clients.IdClient`

    st = [state0, state1, state2, state3];

    let tables = bd.request(st);
    
    tables.then(function(table, order_id, status, admin_id){ 
        res.render(__dirname+'/pages/Admin/AdminOrderDetail', {
            table: table,
            order_id: req.query.order_id,
            status: req.query.status,
            admin_id: req.query.admin_id
         })
    })
})

//редактирование статуса заказа

app.post('/AdminOrderDetail', (req,res) => {
    
    state0 = `UPDATE Orders SET Orders.StatusId = (SELECT IdStatus FROM OrderStatus WHERE NameStatus = '${req.body.status}') 
    WHERE Orders.IdOrder = ${req.body.order_id}`

    st = [state0];

    bd.request(st);
    
    res.redirect(`http://localhost:3001/AdminOrderList?admin_id=${req.body.admin_id}`)
})


app.get('/AdminClientsList', (req,res) => {
    var popular = req.query.popular;
    var admin_id = req.query.admin_id;

    state0 = `SELECT Name, Phone, COUNT(Orders.IdOrder) AS OrderCount FROM Clients
    JOIN Orders ON Orders.ClientId = Clients.IdClient GROUP BY Name, Phone`
    state1 = `SELECT * FROM TopClients`

    st = [state0, state1];

    let tables = bd.request(st);

    tables.then(function(table, popular, admin_id){
        res.render(__dirname + '/pages/Admin/AdminClientsList', {
            table: table,
            popular: req.query.popular,
            admin_id: req.query.admin_id
         })
    })
}) 

app.get('/AdminEmployeesList', (req,res) => {
    var admin_id = req.query.admin_id;

    state0 = `SELECT Surname, Name, Salary, Position, IdEmployee FROM Employees ORDER BY Surname`

    let tables = bd.sqlReq(state0);

    tables.then(function(table, admin_id){
        res.render(__dirname+'/pages/Admin/AdminEmployeesList', {
            table: table,
            admin_id: req.query.admin_id
         })
    })
}) 

app.get('/AdminMenuList', (req,res) => {
    var title = req.query.title;
    var admin_id = req.query.admin_id;

    state0 = 'SELECT IdDish, Title, Weight, Price FROM Dishes ORDER BY Title'
    state1 = `SELECT IdDish, Title, Weight, Price FROM Dishes WHERE Title LIKE '%${title}%'`

    st = [state0, state1];

    let tables = bd.request(st);
    
    tables.then(function(table, title, admin_id){
        res.render(__dirname + '/pages/Admin/AdminMenuList', {
            table: table,
            title: req.query.title,
            admin_id: req.query.admin_id
         })
    })
}) 

app.get('/AdminMenuDishDetail', (req,res) => {
    var dish_id = req.query.dish_id;
    var admin_id = req.query.admin_id;

    state0 = `SELECT Dishes.IdDish, Dishes.Title FROM Dishes WHERE Dishes.IdDish = ${dish_id}`

    state1 = `SELECT Ingredients.Title, IngredientList.Amount, IngredientList.Unit FROM Ingredients 
    JOIN IngredientList ON IngredientList.IngredientId = Ingredients.IdIngredient
    JOIN Dishes ON Dishes.IdDish = ${dish_id} AND Dishes.IdDish = IngredientList.DishId`

    st = [state0, state1];

    let tables = bd.request(st);

    tables.then(function(table, dish_id, admin_id){
        res.render(__dirname+'/pages/Admin/AdminMenuDishDetail', {
            table: table,
            dish_id: req.query.dish_id,
            admin_id: req.query.admin_id
         })
    })
})


//удаление блюда

app.post('/AdminMenuDishDetail', (req,res) => {
    state = `DELETE FROM Dishes WHERE Dishes.Title = '${req.body.d_title}'`;

    st1 = [state];

    bd.request(st1);
    
    res.redirect(`http://localhost:3001/AdminMenuList?admin_id=${req.body.admin_id}`)
}) 



app.get('/AdminIngredientList', (req,res) => {
    var title = req.query.title;
    var admin_id = req.query.admin_id;

    state0 = 'SELECT IdIngredient, Title FROM Ingredients'
    state1 = `SELECT IdIngredient, Title FROM Ingredients WHERE Title LIKE '%${title}%'`

    st = [state0, state1];

    let tables = bd.request(st);
    
    tables.then(function(table, title, admin_id){
        res.render(__dirname + '/pages/Admin/AdminIngredientList', {
            table: table,
            title: req.query.title,
            admin_id: req.query.admin_id
         })
    })
}) 


app.get('/AdminEmployeeDetail', (req,res) => {
    var employee_id = req.query.employee_id;
    var admin_id = req.query.admin_id;

    state0 = `SELECT Surname, Name, Salary, Position, IdEmployee FROM Employees WHERE IdEmployee = '${employee_id}'`;

    st = [state0];

    let tables = bd.request(st);
    
    tables.then(function(table, employee_id, admin_id){
        res.render(__dirname + '/pages/Admin/AdminEmployeeDetail', {
            table: table,
            employee_id: req.query.employee_id,
            admin_id: req.query.admin_id
         })
    })
}) 

app.post('/AdminEmployeeDetail', (req,res) => {
    stat = `UPDATE Employees
    SET Surname = '${req.body.surname}', Name = '${req.body.name}', Salary = '${req.body.salary}', Position = '${req.body.position}'
    WHERE IdEmployee = '${req.body.employee_id}'`;
   
    st2 = [stat];

    bd.request(st2);

    res.redirect(`http://localhost:3001/AdminEmployeesList?admin_id=${req.body.admin_id}`)   
}) 


//удаление ингредиента
app.get('/AdminIngredientDetail', (req,res) => {
    var ingredient_id = req.query.ingredient_id;
    var ingredient_title = req.query.ingredient_title;
    var admin_id = req.query.admin_id;

    res.render(__dirname + '/pages/Admin/AdminIngredientDetail', {
        ingredient_id: req.query.ingredient_id,
        ingredient_title: req.query.ingredient_title,
        admin_id: req.query.admin_id
    })
}) 

app.post('/AdminIngredientDetail', (req,res) => {
    stat = `DELETE FROM Ingredients WHERE Ingredients.IdIngredient = '${req.body.ingredient_id}'`;
   
    st2 = [stat];

    bd.request(st2);

    res.redirect(`http://localhost:3001/AdminIngredientList?admin_id=${req.body.admin_id}`)   
}) 

app.get('/AdminIngredientDetail2', (req,res) => {
    var ingredient_id = req.query.ingredient_id;
    var ingredient_title = req.query.ingredient_title;
    var admin_id = req.query.admin_id;

    res.render(__dirname + '/pages/Admin/AdminIngredientDetail2', {
        ingredient_id: req.query.ingredient_id,
        ingredient_title: req.query.ingredient_title,
        admin_id: req.query.admin_id
    })
}) 

app.post('/AdminIngredientDetail2', (req,res) => {
    stat = `UPDATE Ingredients SET Title = '${req.body.ingredient_title}' WHERE IdIngredient = '${req.body.ingredient_id}'`;
   
    st2 = [stat];

    bd.request(st2);

    res.redirect(`http://localhost:3001/AdminIngredientList?admin_id=${req.body.admin_id}`)   
}) 

app.get("/AdminDeleteEmployee", function(req, res) {  
    var admin_id = req.query.admin_id;
    res.render(__dirname + '/pages/Admin/AdminDeleteEmployee', {
        admin_id: req.query.admin_id
    });
});


app.post('/AdminDeleteEmployee', (req,res) => {
    state = `DELETE FROM Users 
    WHERE Users.IdUser = (SELECT UserId FROM Employees 
    WHERE Employees.Name = '${req.body.name}' AND Employees.Surname = '${req.body.surname}')`

    st = [state];

    bd.request(st);
    
    res.redirect(`http://localhost:3001/AdminEmployeesList?admin_id=${req.body.admin_id}`)
})



//добавление ингредиента

app.get('/AdminAddIngredient', (req,res) => {
    var admin_id = req.query.admin_id;
    res.render(__dirname + '/pages/Admin/AdminAddIngredient', {
        admin_id: req.query.admin_id
    })
 }) 

 app.get('/ErrorAddIngredient', (req,res) => {
    var admin_id = req.query.admin_id;
    res.render(__dirname + '/pages/Admin/ErrorAddIngredient', {
        admin_id: req.query.admin_id
    })
 }) 

 app.post('/AdminAddIngredient', (req,res) => {
    state0 = `EXEC addIngredient '${req.body.title}'`;

    st = [state0];

    let tables = bd.request(st);

    tables.then(table => {
        if (table[0] == undefined) {
            res.redirect(`http://localhost:3001/ErrorAddIngredient?admin_id=${req.body.admin_id}`)
        } else {
            res.redirect(`http://localhost:3001/AdminIngredientList?admin_id=${req.body.admin_id}`)
        } 
    })
}) 


//добавление блюда

app.get('/AdminAddDish', (req,res) => {
    var admin_id = req.query.admin_id;
    res.render(__dirname + '/pages/Admin/AdminAddDish', {
        admin_id: req.query.admin_id
    })
}) 

app.get('/ErrorAddDish', (req,res) => {
    var admin_id = req.query.admin_id;
    res.render(__dirname + '/pages/Admin/ErrorAddDish', {
        admin_id: req.query.admin_id
    })
}) 


app.post('/AdminAddDish', (req,res) => {
    state0 = `EXEC addDish '${req.body.title}', '${req.body.money}', '${req.body.weight}'`;

    st = [state0];

    let tables = bd.request(st);

    tables.then(table => {
        if (table[0] == undefined) {
            res.redirect(`http://localhost:3001/ErrorAddDish?admin_id=${req.body.admin_id}`)
        } else {
            res.redirect(`http://localhost:3001/AdminMenuList?admin_id=${req.body.admin_id}`)
        } 
    })

}) 
 
//ингредиенты блюда
app.get('/AdminClientsList', (req,res) => {
    var popular = req.query.popular;
    var admin_id = req.query.admin_id;

    state0 = `SELECT Name, Phone, COUNT(Orders.IdOrder) AS OrderCount FROM Clients
    JOIN Orders ON Orders.ClientId = Clients.IdClient GROUP BY Name, Phone`
    state1 = `SELECT * FROM TopClients`

    st = [state0, state1];

    let tables = bd.request(st);

    tables.then(function(table, popular, admin_id){
        res.render(__dirname + '/pages/Admin/AdminClientsList', {
            table: table,
            popular: req.query.popular,
            admin_id: req.query.admin_id
         })
    })
}) 

app.get('/AdminAddDishIngredient', (req,res) => {
    var dish_id = req.query.dish_id;
    var admin_id = req.query.admin_id;

    state = `SELECT * FROM Ingredients`

    st = [state];
    
    let table = bd.request(st);

    table.then(function(table, dish_id, admin_id){
        res.render(__dirname+'/pages/Admin/AdminAddDishIngredient', {
            table: table,
            dish_id: req.query.dish_id,
            admin_id: req.query.admin_id
         })
    })
 }) 

app.post('/AdminAddDishIngredient', (req,res) => {
    state0 = `EXEC addDishIngredient '${req.body.dish_id}', '${req.body.ingr_title}', '${req.body.amount}', '${req.body.unit}'`;
    console.log(req.body.ingr_title);
    st = [state0];

    let table = bd.request(st);
    
    table.then(table => {
        res.redirect(`http://localhost:3001/AdminAddDishIngredient?dish_id=${req.body.dish_id}&admin_id=${req.body.admin_id}`)
    })
    
}) 


app.get('/AdminSetEmployee', (req,res) => {
    var order_id = req.query.order_id;
    var status = req.query.status;
    var admin_id = req.query.admin_id;

    state = `SELECT Employees.IdEmployee, Employees.Surname, Employees.Name FROM Employees WHERE Employees.Position != 'Администратор'`

    st = [state];
    
    let table = bd.request(st);

    table.then(function(table, order_id, status, admin_id){
        res.render(__dirname+'/pages/Admin/AdminSetEmployee', {
            table: table,
            order_id: req.query.order_id,
            status: req.query.status,
            admin_id: req.query.admin_id
         })
    })
 }) 

app.post('/AdminSetEmployee', (req,res) => {
    state0 = `UPDATE Orders
    SET EmployeeId = '${req.body.employee_id}'
    WHERE IdOrder = '${req.body.order_id}'`
    st = [state0];

    bd.request(st);
    
    res.redirect(`http://localhost:3001/AdminOrderDetail?order_id=${req.body.order_id}&status=${req.body.status}&admin_id=${req.body.admin_id}`)
}) 


app.get('/AdminMenuDishDetail2', (req,res) => {
    var dish_id = req.query.dish_id;
    var admin_id = req.query.admin_id;
    state0 = `SELECT * FROM Dishes WHERE IdDish = '${dish_id}'`
   
    st = [state0];
    
    let table = bd.request(st);

    table.then(function(table, dish_id, admin_id){
        res.render(__dirname+'/pages/Admin/AdminMenuDishDetail2', {
            table: table,
            dish_id: req.query.dish_id,
            admin_id: req.query.admin_id
         })
    })
})


app.post('/AdminMenuDishDetail2', (req,res) => {
    var admin_id = req.query.admin_id;
    state = `UPDATE Dishes
    SET Title = '${req.body.title}', Price = '${req.body.money}', Weight = '${req.body.weight}'
    WHERE IdDish = '${req.body.dish_id}'`;

    st1 = [state];

    bd.request(st1);
    
    res.redirect(`http://localhost:3001/AdminMenuDishDetail?dish_id=${req.body.dish_id}&admin_id=${req.body.admin_id}`)
}) 



//Employee

app.get("/EmployeeMainPage", function(req, res) { 
    var employee_id = req.query.employee_id; 

    res.render(__dirname + '/pages/Employee/EmployeeMainPage', {
        employee_id: req.query.employee_id
    });
});

app.get("/EmployeeLK", function(req, res) {  
    var employee_id = req.query.employee_id; 

    state = `SELECT Users.Login, Users.Password, Employees.Surname, Employees.Name, Employees.Salary, Employees.Position FROM Users 
    JOIN Employees ON Employees.UserId = Users.IdUser AND Employees.IdEmployee = ${employee_id}`

    let tables = bd.sqlReq(state);

    tables.then(function(table, employee_id){
        res.render(__dirname+'/pages/Employee/EmployeeLK', {
            table: table,
            employee_id: req.query.employee_id
         })
    })
});

app.post('/EmployeeLK', (req,res) => {
    req.body.password = hash.sha256().update(req.body.password).digest('hex')
    state1 = `EXEC changeEmployeeUser '${req.body.employee_id}', '${req.body.login}', '${req.body.password}'`

    st = [state1];

    bd.request(st);
    
    res.redirect(`http://localhost:3001/EmployeeLK?employee_id=${req.body.employee_id}`)
})

app.get('/EmployeeDishList', (req,res) => {
    var is_done = req.query.is_done;
    var employee_id = req.query.employee_id;

    state1 = `SELECT Dishes.IdDish, Dishes.Title, DishList.Number, DishList.IsDone, DishList.OrderId FROM Dishes
    JOIN Dishlist ON DishList.DishId = Dishes.IdDish
	JOIN Orders On Orders.IdOrder = DishList.OrderId 
	JOIN Employees ON Employees.IdEmployee = Orders.EmployeeId AND Employees.IdEmployee = ${employee_id}`

    state2 = `SELECT Dishes.IdDish, Dishes.Title, DishList.Number, DishList.IsDone, DishList.OrderId FROM Dishes
    JOIN Dishlist ON DishList.IsDone = ${is_done} AND DishList.DishId = Dishes.IdDish
    JOIN Orders On Orders.IdOrder = DishList.OrderId 
	JOIN Employees ON Employees.IdEmployee = Orders.EmployeeId AND Employees.IdEmployee = ${employee_id}`

    st = [state1, state2];

    let tables = bd.request(st);
    tables.then(function(table, is_done, employee_id){
        res.render(__dirname + '/pages/Employee/EmployeeDishList', {
            table: table,
            is_done: req.query.is_done,
            employee_id: req.query.employee_id
         })
    })
}) 


app.get('/EmployeeDishDetail', (req,res) => {
    var dish_id = req.query.dish_id;
    var is_done = req.query.is_done;
    var order_id = req.query.order_id;
    var employee_id = req.query.employee_id;

    state1 = `SELECT Ingredients.Title, IngredientList.Amount, IngredientList.Unit FROM Ingredients 
    JOIN IngredientList ON IngredientList.IngredientId = Ingredients.IdIngredient
    JOIN Dishes ON Dishes.IdDish = ${dish_id} AND Dishes.IdDish = IngredientList.DishId`

    let tables = bd.sqlReq(state1);

    tables.then(function(table, dish_id, is_done, order_id, employee_id){
        res.render(__dirname+'/pages/Employee/EmployeeDishDetail', {
            table: table,
            dish_id: req.query.dish_id,
            is_done: req.query.is_done,
            order_id: req.query.order_id,
            employee_id: req.query.employee_id
         })
    })
})


//статус блюда
app.post('/EmployeeDishDetail', (req,res) => {

    state = `UPDATE DishList SET DishList.IsDone = '${req.body.status}'
    WHERE DishList.OrderId = '${req.body.order_id}' AND DishList.DishId = '${req.body.dish_id}'`

    st = [state];

    bd.request(st);
    
    res.redirect(`http://localhost:3001/EmployeeDishList?is_done=2&employee_id=${req.body.employee_id}`)
})


app.get('/EmployeeOrderList', (req,res) => {
    var status = req.query.status;
    var employee_id = req.query.employee_id;

    state1 = 'SELECT NameStatus FROM OrderStatus'
    state2 = `EXEC orderListByStatus '${status}'`
    state3 = `SELECT Orders.IdOrder, FORMAT(Orders.CreationTime, 'dd.MM.yyyy HH:mm') AS 'Creation Time', Clients.Name AS 'Client', Clients.Phone, Orders.Price, OrderStatus.NameStatus 
    FROM Orders
    JOIN OrderStatus ON Orders.StatusId = OrderStatus.IdStatus
    JOIN Employees ON Employees.IdEmployee = Orders.EmployeeId AND Employees.IdEmployee = ${employee_id}
    JOIN Clients ON Orders.ClientId = Clients.IdClient
    ORDER BY Orders.CreationTime DESC`
    
    st = [state1, state2, state3];

    let tables = bd.request(st);

    tables.then(function(table, status, employee_id) {
        res.render(__dirname + '/pages/Employee/EmployeeOrderList', {
            table: table,
            status: req.query.status,
            employee_id: req.query.employee_id
         })
    })
})


app.get('/EmployeeOrderDetail', (req,res) => {
    var order_id = req.query.order_id;
    var order_status = req.query.order_status;
    var employee_id = req.query.employee_id;

    state0 = 'SELECT NameStatus FROM OrderStatus'

    state1 = `SELECT OrderStatus.NameStatus, Clients.Name, Clients.Phone,
    FORMAT(Orders.CreationTime, 'dd.MM.yyyy HH:mm'), Orders.Price FROM Orders
    JOIN OrderStatus ON Orders.StatusId = OrderStatus.IdStatus AND Orders.IdOrder = '${order_id}'
    JOIN Clients ON Orders.ClientId = Clients.IdClient`

    state2 = `SELECT Dishes.Title, DishList.Number, DishList.IsDone FROM Dishes 
    JOIN DishList ON DishList.DishId = Dishes.IdDish 
    JOIN Orders ON Orders.IdOrder = DishList.OrderId AND Orders.IdOrder = ${order_id}
    JOIN OrderStatus ON Orders.StatusId = OrderStatus.IdStatus`
    

    st = [state0, state1, state2];

    let tables = bd.request(st);
    
    tables.then(function(table, order_id, order_status, employee_id){     
        res.render(__dirname+'/pages/Employee/EmployeeOrderDetail', {
            table: table,
            order_id: req.query.order_id,
            order_status: req.query.order_status,
            employee_id: req.query.employee_id
         })
    })
})

app.post('/EmployeeOrderDetail', (req,res) => {
    state = `UPDATE Orders SET Orders.StatusId = (SELECT IdStatus FROM OrderStatus WHERE NameStatus = '${req.body.status}') 
    WHERE Orders.IdOrder = ${req.body.order_id}`

    st = [state];

    bd.request(st);
    
    res.redirect(`http://localhost:3001/EmployeeOrderList?employee_id=${req.body.employee_id}`)
})

app.get('/EmployeeMenuList', (req,res) => {
    var title = req.query.title;
    var employee_id = req.query.employee_id;

    state0 = 'SELECT IdDish, Title FROM Dishes'
    state1 = `SELECT IdDish, Title FROM Dishes WHERE Title LIKE '%${title}%'`

    st = [state0, state1];

    let tables = bd.request(st);
    
    tables.then(function(table, title, employee_id){
        res.render(__dirname + '/pages/Employee/EmployeeMenuList', {
            table: table,
            title: req.query.title,
            employee_id: req.query.employee_id
         })
    })
}) 



app.get('/EmployeeMenuDishDetail', (req,res) => {
    var dish_id = req.query.dish_id;
    var employee_id = req.query.employee_id;

    state1 = `SELECT Ingredients.Title, IngredientList.Amount, IngredientList.Unit FROM Ingredients 
    JOIN IngredientList ON IngredientList.IngredientId = Ingredients.IdIngredient
    JOIN Dishes ON Dishes.IdDish = ${dish_id} AND Dishes.IdDish = IngredientList.DishId`

    let tables = bd.sqlReq(state1);

    tables.then(function(table, dish_id, employee_id){
        res.render(__dirname+'/pages/Employee/EmployeeMenuDishDetail', {
            table: table,
            dish_id: req.query.dish_id,
            employee_id: req.query.employee_id
         })
    })
})



// Client

app.get("/RegClient", function(req, res) {  
    res.render(__dirname + '/pages/Client/RegClient', {});
});


app.get("/ErrorClientRegistration", function(req, res) {  
    res.render(__dirname + '/pages/Client/ErrorClientRegistration', {});
});


app.post('/RegClient', (req,res) => {
    req.body.password = hash.sha256().update(req.body.password).digest('hex')

    state0 = `EXEC regClient '${req.body.login}', '${req.body.password}', '${req.body.name}', '${req.body.phone}'`

    st = [state0];

    let tables = bd.request(st);

    tables.then(table => {
        if (table[0] == undefined) {
            res.redirect(`http://localhost:3001/ErrorClientRegistration`)
        } else {
            res.redirect('http://localhost:3001/Login')
        } 
    })
})

app.get("/ClientMainPage", function(req, res) { 
    var client_id = req.query.client_id; 

    res.render(__dirname + '/pages/Client/ClientMainPage', {
        client_id: req.query.client_id
    });
});

app.get("/ClientLK", function(req, res) {  
    var client_id = req.query.client_id; 
    
    state = `SELECT Users.Login, Users.Password, Clients.Name, Clients.Phone FROM Users 
    JOIN Clients ON Clients.UserId = Users.IdUser AND Clients.IdClient = ${client_id}`

    let tables = bd.sqlReq(state);

    tables.then(function(table, client_id){
        res.render(__dirname+'/pages/Client/ClientLK', {
            table: table,
            client_id: req.query.client_id
         })
    })
});

app.post('/ClientLK', (req,res) => {
    req.body.password = hash.sha256().update(req.body.password).digest('hex')
    
    state1 = `EXEC changeClientInfo '${req.body.client_id}', '${req.body.login}', '${req.body.password}', '${req.body.name}', '${req.body.phone}'`

    st = [state1];

    bd.request(st);
    
    res.redirect(`http://localhost:3001/ClientLK?client_id=${req.body.client_id}`)
})

app.get('/ClientDishList', (req,res) => {
    var client_id = req.query.client_id; 
    var title = req.query.title;
    var popular = req.query.popular;

    state0 = `SELECT IdDish, Title, Weight, Price FROM Dishes WHERE Title LIKE '%${title}%'`
    state1 = `SELECT IdDish, Title, Weight, Price FROM Dishes ORDER BY Title`
    state2 = `SELECT * FROM TopDishes`

    st = [state0, state1, state2];

    let tables = bd.request(st);

    tables.then(function(table, client_id, title, popular){
        res.render(__dirname + '/pages/Client/ClientDishList', {
            table: table,
            client_id: req.query.client_id,
            title: req.query.title,
            popular: req.query.popular
         })
    })
}) 

app.get('/ClientDishDetail', (req,res) => {
    var client_id = req.query.client_id; 
    var dish_id = req.query.dish_id;
    
    state0 = `SELECT Ingredients.Title FROM Ingredients
    JOIN IngredientList ON IngredientList.IngredientId = Ingredients.IdIngredient
    JOIN Dishes ON Dishes.IdDish = IngredientList.DishId AND Dishes.IdDish = ${dish_id}`

    state1 = `SELECT Title, Weight, Price FROM Dishes WHERE Dishes.IdDish = ${dish_id}`
    
    st = [state0, state1];

    let tables = bd.request(st);

    tables.then(function(table, dish_id, client_id){
        res.render(__dirname + '/pages/Client/ClientDishDetail', {
            table: table,
            dish_id: req.query.dish_id,
            client_id: req.query.client_id
         })
    })
})


app.get('/ClientOrderList', (req,res) => {
    var client_id = req.query.client_id;

    state1 = `SELECT Orders.IdOrder, OrderStatus.NameStatus, FORMAT(Orders.CreationTime, 'dd.MM.yyyy HH:mm') AS 'Creation Time', Orders.Price 
    FROM Orders 
    JOIN OrderStatus ON OrderStatus.IdStatus = Orders.StatusId AND Orders.Price != 0 
    JOIN Clients ON Clients.IdClient = Orders.ClientId AND Clients.IdClient = '${client_id}'`

    let tables = bd.sqlReq(state1);

    tables.then(function(table, client_id) {
        res.render(__dirname + '/pages/Client/ClientOrderList', {
            table: table,
            client_id: req.query.client_id
         })
    })
})


app.get('/ClientOrderDetail', (req,res) => {
    var order_id = req.query.order_id;
    var status = req.query.status;
    var client_id = req.query.client_id;
    state0 = `SELECT OrderStatus.NameStatus, FORMAT(Orders.CreationTime, 'dd.MM.yyyy HH:mm'), Orders.Price FROM Orders
    JOIN OrderStatus ON Orders.StatusId = OrderStatus.IdStatus AND Orders.IdOrder = '${order_id}'
    JOIN Clients ON Orders.ClientId = Clients.IdClient`

    state1 = `SELECT Dishes.Title, DishList.Number, Dishes.Price * DishList.Number AS 'Total Price' FROM Dishes 
    JOIN DishList ON DishList.DishId = Dishes.IdDish 
    JOIN Orders ON Orders.IdOrder = DishList.OrderId AND Orders.IdOrder = '${order_id}'
    JOIN OrderStatus ON Orders.StatusId = OrderStatus.IdStatus`
    
    state3 = `UPDATE Orders SET Orders.StatusId = (SELECT IdStatus FROM OrderStatus WHERE NameStatus = '${status}') 
    WHERE Orders.IdOrder = '${order_id}'`


    st = [state0, state1, state3];

    let tables = bd.request(st);

    tables.then(function(table, order_id, status, client_id){
       
        res.render(__dirname+'/pages/Client/ClientOrderDetail', {
            table: table,
            order_id: req.query.order_id,
            status: req.query.status,
            client_id: req.query.client_id
         })
    })
})

app.post('/ClientOrderDetail', (req,res) => {
    state4 = `UPDATE Orders SET Orders.StatusId = (SELECT IdStatus FROM OrderStatus WHERE NameStatus = '${req.body.status}') 
    WHERE Orders.IdOrder = ${req.body.order_id}`

    st = [state4];

    bd.request(st);
    
    res.redirect(`http://localhost:3001/ClientMainPage?client_id=${req.body.client_id}`)
})

app.post('/ClientMainPage', (req,res) => {
    state4 = `EXEC addOrder '${req.body.client_id}'`

    st = [state4];

    let tables = bd.request(st);
    
    tables.then(table => {
        table.forEach(function(column, index){ 
            res.redirect(`http://localhost:3001/ClientAddOrder?client_id=${req.body.client_id}&order_id=${column[index].IdOrder}`)
        })
    })
})


app.get('/ClientAddOrder', (req,res) => {
    var client_id = req.query.client_id; 
    var order_id = req.query.order_id;

    state0 = `SELECT Orders.IdOrder, OrderStatus.NameStatus, FORMAT(Orders.CreationTime, 'dd.MM.yyyy HH:mm'), Orders.Price FROM Orders
    JOIN OrderStatus ON Orders.StatusId = OrderStatus.IdStatus AND Orders.IdOrder = '${order_id}'`

    state1 = `SELECT Dishes.Title, DishList.Number, Dishes.Price * DishList.Number AS 'Total Price' FROM Dishes 
    JOIN DishList ON DishList.DishId = Dishes.IdDish 
    JOIN Orders ON Orders.IdOrder = DishList.OrderId AND Orders.IdOrder = '${order_id}'
    JOIN OrderStatus ON Orders.StatusId = OrderStatus.IdStatus`

    state3 = `SELECT Orders.Price FROM Orders WHERE Orders.IdOrder = '${order_id}'`

    st = [state0, state1, state3];

    let tables = bd.request(st);

    tables.then(function(table, client_id, order_id){
        console.log(table[2]);
        res.render(__dirname + '/pages/Client/ClientAddOrder', {
            table: table,
            client_id: req.query.client_id,
            order_id: req.query.order_id
         })
    })
})

app.get("/ClientDeleteOrder", function(req, res) {  
    var client_id = req.query.client_id; 
    var order_id = req.query.order_id;
    res.render(__dirname + '/pages/Client/ClientDeleteOrder', {
        client_id: req.query.client_id,
        order_id: req.query.order_id
    });
});


app.post('/ClientDeleteOrder', (req,res) => {
    state = `EXEC deleteOrder '${req.body.order_id}'`

    st = [state];

    bd.request(st);
    
    res.redirect(`http://localhost:3001/ClientMainPage?client_id=${req.body.client_id}`)
})


app.get("/ClientAddOrderDish", function(req, res) {  
    var client_id = req.query.client_id; 
    var order_id = req.query.order_id;

    state = `SELECT * FROM Dishes`

    st = [state];
    
    let table = bd.request(st);

    table.then(function(table, client_id, order_id){
        res.render(__dirname+'/pages/Client/ClientAddOrderDish', {
            table: table,
            client_id: req.query.client_id,
            order_id: req.query.order_id
         })
    })
});


app.post('/ClientAddOrderDish', (req,res) => {
    state = `EXEC addDishInDishList '${req.body.order_id}', '${req.body.dish_title}', '${req.body.amount}'`

    st = [state];

    bd.request(st);
    
    res.redirect(`http://localhost:3001/ClientAddOrderDish?client_id=${req.body.client_id}&order_id=${req.body.order_id}`)
})


app.listen (PORT, () => console.log(`server running on http://localhost:${PORT}`))