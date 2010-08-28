var nws = require("websocket-server")
  , connect = require('connect')
  , express = require('express');

var app, wss;

app = express.createServer(
  express.compiler({ src: __dirname+"/public", enable: ['sass'] }),
  express.staticProvider(__dirname+"/public")
);

wss = nws.createServer({
  server: app
});

app.configure(function() {
  app.set('view engine', 'jade');
  app.set('views', __dirname + '/views');
});

app.configure(function() {
  app.use(connect.conditionalGet());
  app.use(connect.gzip());
  app.use(connect.bodyDecoder());
//  app.use(connect.logger());
});

app.configure('development', function() {
  app.use(connect.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.listen(parseInt(process.env.PORT) || 8000);

app.get('/', function(req, res) {
  res.render('index');
});


wss.on("connection", function(connection){
  connection.send("helo:"+connection.id);
  
  connection.on("message", function(data){
    console.log(data);
    
    var action, x, y, id;
    data = data.split(":");
    if(data.length >= 2){
      action = data[0];
      switch(action.toUpperCase()){
        case "HELO":
          connection.broadcast("join:"+data[1]);
          
          var connections = [];
          wss.manager.forEach(function(c){
            if(c && c._state === 4 && c.id != connection.id){
              connections.push([c.id, c.storage.get("x"), c.storage.get("y")].join(","));
            }
          });
          
          connection.send("users:"+connections.join(";"));
          
          break;
        case "MOVE":
          connection.broadcast("move:"+data[1])
          var xy = data[1].split(",");
          connection.storage.set("x", xy[0]);
          connection.storage.set("y", xy[1]);
          break;
      }
    }
  });
});