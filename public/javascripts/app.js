
var qevent = QEvent, app;

qevent.add(document, "domready", function(){
  app.init();
});

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
      if(typeof data == "string" || typeof data == "number") data = [data];
      
      console.log(self.id+">>"+action+":"+self.id+(data ? ","+data.join(",") : ""));
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
      , c = this.canvas = Raphael(0, 0, w, h);

    qevent.add(document, "click", this.hitch("moveEvent"));
    qevent.add(document, "keydown", this.hitch("onkeydown"));
    qevent.add(document, "keyup", this.hitch("onkeyup"));
    qevent.add(window, "resize", this.hitch("onResize"));
    qevent.add(window, "unload", this.hitch("onClose"));

    this.socket = new socket(function(err){
      if(err) c.text(w/2, h/2, "Sorry, but you don't seem to have websockets.");
    });
    this.socket.onMessage = this.hitch("onMessage");
    
    c.text(w/2, h/2, "Unsaving Daiva").attr({
      stroke: "#333",
      fill: "#333",
      "font-size": "70px"
    });
  },

  hitch: function(method){
    var self = this;
    return function(){
      return self[method] && self[method].apply(self, arguments)
    };
  },


  createPlayer: function(x, y, id){
    var player = this.canvas.circle(x, y, 15).attr({
      stroke: "#ff00f8",
      id: id
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
  
  getOrCreatePlayer: function(id){
    return this.players[id] || this.addPlayer(id);
  },
  
  movePlayer: function(id, x, y){
    var w = doc.width()-30
      , h = doc.height();
      
    if(x <= 15) x = 15;
    if(x >= w) x = w;

    if(y <= 15) y = 15;
    if(y >= h-15) y = h;
    
    if(typeof id == "string") id = this.getPlayer(id);
    
    if(id){
      app.socket.send("move", [x, y]);
      id.stop().animate({
        cx: x,
        cy: y
      }, 100, "linear");
    }
  },
  
  setPlayerColour: function(id, colour){
    if(!colour) colour = (Math.round(0xffffff * Math.random())-0x222222).toString(16).substr(-6);
    
    this.getOrCreatePlayer(id).attr({
      stroke: "#fff",
      fill: "#"+colour
    });
  },

  onClose: function(){
    this.socket.close();
  },

  onResize: function(){
    var w = window.innerWidth
      , h = window.innerHeight
    
    this.canvas.setSize(w, h-60);
  },

  onMessage: function(action, data){
    var center_x = 0.5*doc.width()
      , center_y = 0.5*doc.height();
    
    console.log(this.socket.id, action, data);
    
    switch(action.toUpperCase()){
      case "HELO":
        this.socket.id = data;
        this.player = this.addPlayer(data);
        this.setPlayerColour(data)
        this.socket.send("clr", this.player.attr("fill").substr(-6));
        this.movePlayer(this.player, center_x, center_y);
        break;
      case "MOVE":
        data = data.split(",");
        var id = data[0], x = data[1], y = data[2];
        if(id !== this.socket.id){
          this.getOrCreatePlayer(id).animate({
            cx: x, cy: y
          }, 100);
        }
        break;
      case "CLR":
        data = data.split(",");
        this.setPlayerColour(data[0], data[1]);
      default:
        console.log(action,data);
        break;
    }
  }
};
