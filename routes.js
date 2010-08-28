var app = require("./app").app;

app.get('/', function(req, res){
    res.send('hello world');
});
