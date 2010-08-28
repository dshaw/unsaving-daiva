
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


var socket = function(){
//  if("WebSocket" in this){
    var ws = new WebSocket("ws://"+document.location.host+"/")
      , c = this;
    
    this.connected = false;
    this.connection = c;
    this.send = function(action, data){
      ws.send(action+":"+c.id+","+data.join(","));
    };
      
    this.onMessage = function(){};
    
    ws.addEventListener("open", function(){
      c.connected = true;
    });
    
    ws.addEventListener("close", function(){
      c.connected = true;
    });
    
    ws.addEventListener("message", function(evt){
      console.log(evt.data);
      c.onMessage.apply(c, evt.data.split(":"));
    });
  //}
};

app = {
  init: function(){
    var w = doc.width()
      , h = doc.height()
    
    this.canvas = Raphael(0, 60, w, h-60);
    
    qevent.add(document, "click", this.hitch("moveEvent"));
    qevent.add(document, "keydown", this.hitch("onkeydown"));
    qevent.add(document, "keyup", this.hitch("onkeyup"));
    qevent.add(window, "resize", this.hitch("onresize"));
    
    this.socket = new socket();
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
    var w = doc.width()-30
      , h = doc.height()-61
      , player = this.player
      , cx = player.attr("cx")
      , cy = player.attr("cy")
      , nx = e.client.x+5
      , ny = e.client.y-50;

    if(nx <= 30) nx = 30;
    if(nx >= w) nx = w;
    
    if(ny <= 30) ny = 30;
    if(ny >= h-30) ny = h-30;
        
    player.stop().animate({
      cx: nx,
      cy: ny
    }, 100, "linear");
  },
  
  addPlayer: function(id){
    this.players.push(this.createPlayer(doc.width()/2, doc.height()/2, id));
    
  },
  
  getPlayer: function(id){
    
  },
  
  onresize: function(){
    var w = doc.width()
      , h = doc.height()
    this.canvas.setSize(w, h-60);
  },
  
  onMessage: function(action, data){
    var center_x = 0.5*doc.width()
      , center_y = 0.5*doc.height();
      
    switch(action.toUpperCase()){
      case "HELO":
        this.player = this.createPlayer(center_x, center_y, "player-"+data);
        this.socket.id = "player-"+data;
        break;
      case "JOIN":
        this.players.push(this.createPlayer(center_x, center_y, data));
      default: 
        console.log(action,data);
        break;
    }
  }
};
