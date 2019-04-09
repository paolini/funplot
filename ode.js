var expr = "y^2 - x";
var compiled_expr;
var plot;
var draw_slope;

var points = [];

/*
var scale = 80.0;                 // 40 pixels from x=0 to x=1
var xoff = 0.0; // offset x
var yoff = 0.0; // offset y
*/

function slopeGraph(plot, fun) {
  var xmin = plot.x_pixel(0);
  var ymin = plot.y_pixel(plot.height);
  var xmax = plot.x_pixel(plot.width);
  var ymax = plot.y_pixel(0);
  var dx = (xmax - xmin)/20;
  var dy = dx;
  var h = 0.3 * dx;

  for (var x=xmin; x < xmax; x+=dx) {
    for (var y=ymin; y < ymax; y+=dy) {
        var m = fun(x,y);
        var s = h/Math.sqrt(1.0 + m*m) ;
        plot.ctx.beginPath();
        plot.moveTo(x, y);
        plot.lineTo(x + s, y + s*m);
        plot.ctx.stroke();
    }
  }
}

function odePlot(plot, fun, x0, y0) {
  var xmin = plot.x_pixel(0);
  var ymin = plot.y_pixel(plot.height);
  var xmax = plot.x_pixel(plot.width);
  var ymax = plot.y_pixel(0);

  for (dir=1;dir>=-1;dir-=2) {
    var dt = (xmax-xmin)/1000.0;
    var x = x0;
    var y = y0;
    plot.ctx.beginPath();
    plot.moveTo(x, y);
    for (;x<=xmax && x>=xmin && y<=ymax && y>=ymin;) {
      var m = fun(x,y);
      var r = dir * Math.sqrt(1.0 + m*m);
      var dx = dt / r;
      var dy = dt * m / r;
      x += dx;
      y += dy;
      plot.lineTo(x, y);
    }
    plot.ctx.stroke();
  }
}

function draw() {
    var canvas = $("#canvas")[0];
    if (null==canvas || !canvas.getContext) return;

    plot.setCanvas(canvas);

    /*
    var x0 = .5 + .5*canvas.width;  // x0 pixels from left to x=0
    var y0 = .5 + .5*canvas.height; // y0 pixels from top to y=0
    x0 -= xoff*scale;
    y0 += yoff*scale;
    plot = new Plot(x0-xoff*scale, y0+yoff*scale, scale, doNegativeX);

    (x - x0)/this.scale   // logical coord

    var xCenter = x0-xoff*scale + canvas.width / scale;
    var yCenter = yoff + canvas.height / scale;
    canvas.height = $("#bottom").offset().top - $("#canvas").offset().top;
    scale *= window.innerWidth / canvas.width;
    canvas.width = window.innerWidth;
    xoff = xCenter - canvas.width / scale;
    yoff = yCenter - canvas.height / scale;
    */

    /*
    x0 = .5 + .5*canvas.width;  // x0 pixels from left to x=0
    y0 = .5 + .5*canvas.height; // y0 pixels from top to y=0
    plot = new Plot(x0-xoff*scale, y0+yoff*scale, scale, doNegativeX);
    */

    plot.ctx.clearRect (0 ,0 , canvas.width, canvas.height);
    plot.show();
    plot.ctx.lineWidth = 2;
    plot.ctx.strokeStyle = "rgb(200,200,0)";
    if (draw_slope) slopeGraph(plot, expr_f);
    plot.ctx.lineWidth = 1;
    plot.ctx.strokeStyle = "rgb(66,44,255)";
    for (var i=0; i<points.length; ++i) {
        odePlot(plot, expr_f, points[i].x, points[i].y);
    }
}

function expr_f(x, y) {
    return compiled_expr.eval({"x": x, "y": y});
}

function update() {
    expr = $("#expr").val();
    try {
      compiled_expr = math.compile(expr);
    } catch(e) {
      alert(e);
      return;
    }
    $("#formula").html('$$y\' = ' + math.parse(expr.replace(/y/g,'y')).toTex() + '$$');
    MathJax.Hub.Queue(["Typeset",MathJax.Hub]);

    draw();
    point_string = "";
    for (var i=0; i<points.length; ++i) {
      if (i>0) point_string += " ";
      point_string += points[i].x.toFixed(4) + " " + points[i].y.toFixed(4);
    }

    var reference = plot.getReference();
    var params = {
    	"expr": expr,
    	"r": reference.radius.toFixed(3),
      "x": reference.xCenter.toFixed(3),
      "y": reference.yCenter.toFixed(3),
      "points": point_string
    }
    setLocationHash(params);
}

$(function() {
    console.log("ode plot, manu-fatto, https://github.com/paolini/recurrence/")

    params = get_querystring_params();

    if (params['expr']) {
        $("#expr").val(params['expr']);
    }

    plot = newPlotFromParams(params);

    if (params['points'] != undefined && params['points'].length>0) {
      var l = params['points'].split(' ');
      points = [];
      for (var i=0; i<l.length/2; ++i) {
        points.push({
          x: parseFloat(l[i*2]),
          y: parseFloat(l[i*2+1])
        });
      }
    }

    $("#expr").keyup(function(event) {
        if (event.keyCode == 13)
            update();
    });

    $("#draw").click(function() {
        update();
    });

    $("#clear_button").click(function() {
      points = [];
      update();
    });

    draw_slope = $("#draw_slope").is(":checked");
    $("#draw_slope").change(function() {
      draw_slope = $("#draw_slope").is(":checked");
      update();
    });

    $("#canvas").on("mousemove",function(event) {
      if (plot) {
      	var coords = plot.mouse_coords(event);
      	$("#x").html(""+coords.x.toFixed(4));
      	$("#y").html(""+coords.y.toFixed(4));
      }
    });

    $("#canvas").on("mousedown",function(event) {
      if (plot) {
       var coords = plot.mouse_coords(event);
       points.push(coords);
    	 update();
     }
    });

    // if mousewheel is moved
    $("#canvas").mousewheel(function(e, delta) {
      if (!plot) return;
    	var coords = plot.mouse_coords(e);
    	// determine the new scale
    	var factor = 1.04
    	if (delta < 0) factor = 1.0/factor
      plot.zoom(factor, coords.x, coords.y);
    	update();
    	return false;
    });

    // $(window).resize(update);

    update();
});
