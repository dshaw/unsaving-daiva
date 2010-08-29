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
  connection.send("helo:player-"+connection.id);
  connection.storage.set("id", "player-"+connection.id);
  
  connection.on("message", function(data){
    console.log(data);
    
    parts = data.split(":");
    action = parts[0];
    args = parts[1].split(",");

    switch(action.toUpperCase()){
    case "MOVE":
      connection.broadcast(data)
      connection.storage.set("x", args[0]);
      connection.storage.set("y", args[1]);
      break;
    case "CLR":
      connection.broadcast(data);
      connection.storage.set("colour", args[0])
    }
  });
});