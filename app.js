var nws = require("websocket-server");

var app = require('express').createServer();
var ws = nws.createServer({
  server: app
});

app.listen(80);

exports.app = app;
exports.ws = ws;

require("./routes");