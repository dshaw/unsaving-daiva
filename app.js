var nws = require("websocket-server")
  , connect = require('connect')
  , express = require('express');

var app, wss;

app = express.createServer(
  express.compiler({ src: __dirname+"/public", enable: ['sass'] }),
  express.staticProvider(__dirname+"/public")
);

wss = nws.createServer({
  server: app,
  debug: true
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
  var color = (Math.round(0xffffff * Math.random())+0x222222)
  if(color < 0) color = color*-1;
  color = color.toString(16).substr(-6);
  
  connection.send("hello:player-"+connection.id+","+color);
  connection.storage.set("color", color)
  connection.storage.set("id", "player-"+connection.id);

  wss.manager.forEach(function(mc){
    var id = mc.storage.get("id")
      , x = mc.storage.get("x")
      , y = mc.storage.get("y")
      , color = mc.storage.get("color");
    wss.broadcast("move:"+[id, x, y, color].join(","));
  });
    
  connection.on("message", function(data){
    parts = data.split(":");
    action = parts[0];
    args = parts[1].split(",");

    switch(action.toLowerCase()){
    case "move":
      connection.broadcast(data)
      connection.storage.set("x", args[0]);
      connection.storage.set("y", args[1]);
      connection.storage.set("color", args[2]);
      break;
    case "color":
      connection.broadcast(data);
      connection.storage.set("color", args[0])
    case "close":
      connection.broadcast(data);
      break;
    }
  });
});