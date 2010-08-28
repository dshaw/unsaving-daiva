
var qevent = QEvent, app;

qevent.add(document, "domready", function(){
  app.init();
});


app = {
  init: function(){
    var r = this.r = Raphael("holder");
    
    var circle = {fill: "#fff", stroke: "none"};
    var x = 100, y = 100;
    
    this.nodes = [
      r.circle(x, y, 20).attr(circle),
      r.circle(x-30, y+20, 5).attr(circle),
      r.circle(x, y-35, 5).attr(circle),
      r.circle(x+30, y+20, 5).attr(circle)
    ];
    
    qevent.add(document, "mousemove", this.hitch("onmousemove"));
  },
  
  hitch: function(method){
    var self = this;
    return function(){
      return self[method].apply(self, arguments)
    };
  },
  
  lastPos: {x: 100, y: 0},
  
  onmousemove: function(e){
    
    var cursor = this.nodes[0].attr();
    var orb1 = this.nodes[1].attr();
    var orb2 = this.nodes[2].attr();
    var orb3 = this.nodes[3].attr();
    
    this.nodes[0].translate(e.client.x-85-cursor.cx, e.client.y-120-cursor.cy);
    this.nodes[1].translate(e.client.x-85-orb1.cx-30, e.client.y-120-orb1.cy+20);
    this.nodes[2].translate(e.client.x-85-orb2.cx, e.client.y-120-orb2.cy-35);
    this.nodes[3].translate(e.client.x-85-orb3.cx+30, e.client.y-120-orb3.cy+20);
    
    this.lastPos = e.client;
  }
};
