# Что нужно сделать?

Первым делом скачать node.js, качается очень просто
https://nodejs.org/en/download/


## После того как репозиторий будет скопирован прописать в терминале

`npm install`

по идее) если не получится, разберёмся


## для подключения к бд нужно изменить 

```javascript
var config = {  
    server: 'DESKTOP-5PENVSL',   \\ Название сервера
    authentication: {
        type: 'default',
        options: {
            userName: 'HEHEH', 
            password: '1'  
        }
    },
    options: {
        database: 'Session'  \\ Название БД
    }
};
```

Название своего сервера можно посмотреть в sql server profiler (Я скопировал оттуда и всё заработало)


## Для запуска проекта нужно прописать в терминале
` node index.js `
