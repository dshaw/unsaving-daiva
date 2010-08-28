var nws = require("websocket-server")
  , connect = require('connect')
  , assetManager = require('connect-assetmanager')
  , assetHandler = require('connect-assetmanager-handlers')
  , express = require('express');

var app = exports.app = require('express').createServer();
var ws = exports.ws = nws.createServer({
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
  app.use(connect.logger());
  app.use(require("./assets"));
  app.use(connect.staticProvider(__dirname + '/public'));
});

app.configure('development', function() {
  app.use(connect.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.dynamicHelpers({
  cacheTimeStamps: function(req, res) {
    return assets.cacheTimestamps;
  }
});


require("./routes");

app.listen(80);