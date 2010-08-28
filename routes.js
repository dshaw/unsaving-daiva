var ar = require("./app")
  , app = ar.app
  , ws = ar.ws;


app.get('/', function(req, res) {
  res.render('index', {
    locals: {
      'date': new Date().toString()
    }
  });
});
