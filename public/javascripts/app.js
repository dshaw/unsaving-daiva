
var qevent = QEvent, app;

qevent.add(document, "domready", function(){
  app.init();
});


// Raphael.fn.circlePath = function(x , y, r) {
//   return this.path("M" + x + "," + (y-r) + "A"+r+","+r+",0,1,1,"+(x-0.1)+","+(y-r)+" z");
// };

var doc = {
  height: function(){
    var D = document;
    return Math.max(
        Math.max(D.body.scrollHeight, D.documentElement.scrollHeight),
        Math.max(D.body.offsetHeight, D.documentElement.offsetHeight),
        Math.max(D.body.clientHeight, D.documentElement.clientHeight)
    );
  },

  width: function(){
    var D = document;
    return Math.max(
        Math.max(D.body.scrollWidth, D.documentElement.scrollWidth),
        Math.max(D.body.offsetWidth, D.documentElement.offsetWidth),
        Math.max(D.body.clientWidth, D.documentElement.clientWidth)
    );
  }
};

var easing = {
  bounceIn: function(/* Decimal? */n){
    // summary:
    //    An easing function that 'bounces' near the beginning of an Animation
    return (1 - dojo.fx.easing.bounceOut(1 - n)); // Decimal
  },

  bounceOut: function(/* Decimal? */n){
    // summary:
    //    An easing function that 'bounces' near the end of an Animation
    var s = 7.5625;
    var p = 2.75;
    var l;
    if(n < (1 / p)){
      l = s * Math.pow(n, 2);
    }else if(n < (2 / p)){
      n -= (1.5 / p);
      l = s * Math.pow(n, 2) + .75;
    }else if(n < (2.5 / p)){
      n -= (2.25 / p);
      l = s * Math.pow(n, 2) + .9375;
    }else{
      n -= (2.625 / p);
      l = s * Math.pow(n, 2) + .984375;
    }
    return l;
  },

  bounceInOut: function(/* Decimal? */n){
    // summary:
    //    An easing function that 'bounces' at the beginning and end of the Animation
    if(n < 10){ return this.bounceIn(n * 2) / 2; }
    return (this.bounceOut(n * 2 - 1) / 2) + 0.5; // Decimal
  },
  elasticInOut: function(/* Decimal? */n){
    // summary:
    //    An easing function that elasticly snaps around the value, near
    //    the beginning and end of the Animation.
    //
    // description:
    //    An easing function that elasticly snaps around the value, near
    //    the beginning and end of the Animation.
    //
    //    Use caution when the elasticity will cause values to become
    //    negative as some properties cannot be set to negative values.
    if(n == 0) return 0;
    n = n * 2;
    if(n == 2) return 1;
    var p =  1.5;
    var s = p / 4;
    console.log(n);
    if(n < 10){
      n -= 1;
      return -.5 * (Math.pow(2, 10 * n) * Math.sin((n - s) * (2 * Math.PI) / p));
    }
    n -= 1;
    return .5 * (Math.pow(2, -10 * n) * Math.sin((n - s) * (2 * Math.PI) / p)) + 1;
  },
};

var root = this;
var socket = function(callback){
  if("WebSocket" in root){
    var self = this;
    this.tries = 0;
    this.autoreconnect = true;
    this.connected = false;
    this.connection = this;
    
    this.close = function(){
      if(self.connected) self.ws.close();
    };
    
    this.send = function(action, data){
      console.log(">>"+action+":"+self.id+(data ? ","+data.join(",") : ""));
      self.ws.send(action+":"+self.id+(data ? ","+data.join(",") : ""));
    };

    this.onMessage = function(){};

    (function connect(c){
      var ws = c.ws = new WebSocket("ws://"+document.location.host+"/");

      ws.addEventListener("open", function(){
        c.connected = true;
        c.tries = 0;
        callback(false, c);
      });

      ws.addEventListener("close", function(){
        c.connected = true;
        c.tries++;
        if(c.autoreconnect && c.tries < 3){
          setTimeout(function(){
            connect(c);
          }, 2000);
        }
      });

      ws.addEventListener("message", function(evt){
        console.log(evt.data);
        c.onMessage.apply(c, evt.data.split(":"));
      });
    })(this);
  } else {
    callback(true);
  }
};

app = {
  players: {},

  init: function(){
    var w = doc.width()
      , h = doc.height()
      , c = this.canvas = Raphael(0, 60, w, h-60);

    qevent.add(document, "click", this.hitch("moveEvent"));
    qevent.add(document, "keydown", this.hitch("onkeydown"));
    qevent.add(document, "keyup", this.hitch("onkeyup"));
    qevent.add(window, "resize", this.hitch("onResize"));
    qevent.add(window, "unload", this.hitch("onClose"));

    this.socket = new socket(function(err){
      if(err) c.text(w/2, h/2, "Sorry, but you don't seem to have websockets.");
    });
    this.socket.onMessage = this.hitch("onMessage");
  },

  hitch: function(method){
    var self = this;
    return function(){
      return self[method] && self[method].apply(self, arguments)
    };
  },


  createPlayer: function(x, y, id){
    var player = this.canvas.circle(x, y, 30).attr({
      stroke: "#f800ff",
      id: id
    });

    player.onAnimation(function(){
      var cx = player.attr("cx")
        , cy = player.attr("cy");
      
      app.socket.send("move", [cx, cy]);
    });

    // player.onAnimation(function(){
    //   var D = document;
    //   var cx = player.attr("cx")
    //     , cy = player.attr("cy");
    //
    //   var c_el = D.elementFromPoint(cx, cy);
    //
    //   if(c_el !== null && c_el.nodeName == "circle"){
    //     console.log(c_el)
    //     if(c_el != player.node && c_el != player.paper.bottom.node) {
    //       console.log("collid!")
    //       player.stop();
    //       player.attr({
    //         x: cx - 40,
    //         y: cy - 40
    //       });
    //     }
    //   }
    // })

    return player;
  },

  moveEvent: function(e){
    this.movePlayer(this.player, e.client.x+5, e.client.y-50);
  },

  addPlayer: function(id){
    return this.players[id] = this.createPlayer(doc.width()/2, doc.height()/2, id);
  },

  getPlayer: function(id){
    return this.players[id];
  },
  
  movePlayer: function(id, x, y){
    var w = doc.width()-30
      , h = doc.height()-61;
      
    if(x <= 30) x = 30;
    if(x >= w) x = w;

    if(y <= 30) y = 30;
    if(y >= h-30) y = h-30;
    
    if(typeof id == "string") id = this.getPlayer(id);
    
    if(id){
      id.stop().animate({
        cx: x,
        cy: y
      }, 100, "linear");
    }
  },

  onClose: function(){
    this.socket.close();
  },

  onResize: function(){
    var w = doc.width()
      , h = doc.height()
    this.canvas.setSize(w, h-60);
  },

  onMessage: function(action, data){
    var center_x = 0.5*doc.width()
      , center_y = 0.5*doc.height();

    switch(action.toUpperCase()){
      case "HELO":
        var id = "player-"+data;
        this.player = this.addPlayer(id);
        this.movePlayer(this.player, center_x, center_y);
        this.socket.id = id;
        this.socket.send("helo");
        break;
      case "JOIN":
        this.players[data] = this.createPlayer(center_x, center_y, data);
        break;
      case "MOVE":
        data = data.split(",");
        var id = data[0], x = data[1], y = data[2];
        if(id !== this.socket.id){
          this.getPlayer(id).animate({
            cx: x, cy: y
          }, 100);
        }
        break;
      case "USERS":
        
        break;
      default:
        console.log(action,data);
        break;
    }
  }
};
