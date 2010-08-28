
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
  inBounce: function (x, t, b, c, d) {
		return c - easing.outBounce (x, d-t, 0, c, d) + b;
	},
	outBounce: function (x, t, b, c, d) {
		if ((t/=d) < (1/2.75)) {
			return c*(7.5625*t*t) + b;
		} else if (t < (2/2.75)) {
			return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
		} else if (t < (2.5/2.75)) {
			return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
		} else {
			return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
		}
	},
}

app = {
  init: function(){
    var w = doc.width()
      , h = doc.height()
    
    this.canvas = Raphael("holder");
    this.canvas.setSize(w, h-61);
    
    qevent.add(document, "mousemove", this.hitch("onmousemove"));
    qevent.add(document, "keydown", this.hitch("onkeydown"));
    qevent.add(document, "keyup", this.hitch("onkeyup"));
    
    this.player = this.createCircle(-1*w, -1*h, "player");
    this.players = [];
    
    this.addPlayer("1")
  },
  
  hitch: function(method){
    var self = this;
    return function(){
      return self[method] && self[method].apply(self, arguments)
    };
  },
  
  
  createCircle: function(x, y, id){
    return this.canvas.circle(x, y, 30).attr({
      stroke: "#f800ff",
      id: id
    });
  },
  
  onmousemove: function(e){
    var w = doc.width()-30
      , h = doc.height()-61
      , cx = this.player.attr("cx")
      , cy = this.player.attr("cy")
      , nx = e.client.x+5
      , ny = e.client.y-50;

    if(nx <= 30) nx = 30;
    if(nx >= w) nx = w;
    
    if(ny <= 30) ny = 30;
    if(ny >= h-30) ny = h-30;
        
    this.player.animate({
      cx: nx,
      cy: ny
    }, 100, function (n) {
      if (t < d/2) return $.easing.easeInBounce (x, t*2, 0, c, d) * .5 + b;
  		return $.easing.easeOutBounce (x, t*2-d, 0, c, d) * .5 + c*.5 + b;
    });
  },
  
  addPlayer: function(id){
    this.players.push(this.createCircle(0, 0, id));
  },
  
  getPlayer: function(id){
    
  }
};
