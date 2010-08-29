
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
      , c = this.canvas = Raphael(0, 0, w, h)
      , s = this;

    qevent.add(document, "click", this.hitch("moveEvent"));
    qevent.add(document, "keydown", this.hitch("onKey"));
    qevent.add(window, "resize", this.hitch("onResize"));
    qevent.add(window, "unload", this.hitch("onClose"));

    this.socket = new socket(function(err){
      if(err) c.text(w/2, h/2, "Sorry, but you don't seem to have websockets."); return;
      s["player"] && s.player.remove();
    });
    this.socket.onMessage = this.hitch("onMessage");
    
    this.text = c.text(w/2, h/2, "Unsaving Daiva").attr({
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
      id: id,
      stroke: "#fff",
      "stroke-width": "2px"
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
    this.movePlayer(this.player, Math.floor(e.client.x), Math.floor(e.client.y));
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
    
    console.log(id, x, y);
    
    if(id){
      var color = id.attr("fill").substr(-6)
      app.socket.send("move", [Math.floor(x), Math.floor(y), color]);
      id.stop().animate({
        cx: Math.floor(x),
        cy: Math.floor(y)
      }, 100, "linear");
    }
  },
  
  setPlayerColour: function(id, colour){
    if(!colour) return;
    this.getOrCreatePlayer(id).attr({
      stroke: "#fff",
      fill: "#"+colour
    });
  },

  onClose: function(){
    this.socket.send("close");
    this.socket.close();
  },

  onResize: function(){
    var w = window.innerWidth
      , h = window.innerHeight
    
    this.canvas.setSize(w, h-60);
    this.text.attr({x: w/2, y: h/2});
  },

  onMessage: function(action, data){
    var center_x = doc.width() / 2
      , center_y = doc.height() / 2;
    
    switch(action.toLowerCase()){
      case "hello":
        data = data.split(",")
        this.socket.id = data[0];
        this.player = this.addPlayer(data[0]);
        this.setPlayerColour(data[0], data[1]);
        this.movePlayer(this.player, center_x, center_y);
        break;
      case "move":
        data = data.split(",");
        var id = data[0], x = data[1], y = data[2], color = data[3] || false;
        if(id !== this.socket.id){
          this.getOrCreatePlayer(id).animate({
            cx: x, cy: y
          }, 100);
          if(color)
            this.getOrCreatePlayer(id).attr("fill", "#"+color);
        }
        break;
      case "color":
        data = data.split(",");
        this.setPlayerColour(data[0], data[1]);
        break;
      case "close":
        var player = this.getPlayer(data);
        if(player)
          player.remove();
      default:
        console.log(action,data);
        break;
    }
  },
  
  updateColor: function(){
    this.socket.send("color", this.player.attr("fill").substr(-6));
  },
  
  onKey: function(e){
    var key = e.key;
    this.player.stop();
    var curPos = [Math.floor(this.player.attr("cx")), Math.floor(this.player.attr("cy"))];
    
    console.log(key, curPos);
    
    switch(key){
    case "up":
      this.movePlayer(this.player, curPos[0], curPos[1]-20)
      break;
    case "down":
      this.movePlayer(this.player, curPos[0], curPos[1]+20)
      break;
    case "left":
      this.movePlayer(this.player, curPos[0]-20, curPos[1])
      break;
    case "right":
      this.movePlayer(this.player, curPos[0]+20, curPos[1]);
      break;
    }
  }
};
