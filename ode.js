var expr = "y^2 - x";
var compiled_expr;
var plot;
var draw_slope;

var points = [];

var scale = 80.0;                 // 40 pixels from x=0 to x=1
var xoff = 0.0; // offset x
var yoff = 0.0; // offset y

function slopeGraph(ctx, plot, fun) {
  var xmin = plot.x_pixel(0);
  var ymin = plot.y_pixel(ctx.canvas.height);
  var xmax = plot.x_pixel(ctx.canvas.width);
  var ymax = plot.y_pixel(0);
  var dx = (xmax - xmin)/20;
  var dy = dx;
  var h = 0.3 * dx;

  for (var x=xmin; x < xmax; x+=dx) {
    for (var y=ymin; y < ymax; y+=dy) {
        var m = fun(x,y);
        var s = h/Math.sqrt(1.0 + m*m) ;
        ctx.beginPath();
        plot.moveTo(ctx, x, y);
        plot.lineTo(ctx, x + s, y + s*m);
        ctx.stroke();
    }
  }
}

function odePlot(ctx, plot, fun, x0, y0) {
  var xmin = plot.x_pixel(0);
  var ymin = plot.y_pixel(ctx.canvas.height);
  var xmax = plot.x_pixel(ctx.canvas.width);
  var ymax = plot.y_pixel(0);

  for (dir=1;dir>=-1;dir-=2) {
    var dt = (xmax-xmin)/1000.0;
    var x = x0;
    var y = y0;
    ctx.beginPath();
    plot.moveTo(ctx, x, y);
    for (;x<=xmax && x>=xmin && y<=ymax && y>=ymin;) {
      var m = fun(x,y);
      var r = dir * Math.sqrt(1.0 + m*m);
      var dx = dt / r;
      var dy = dt * m / r;
      x += dx;
      y += dy;
      plot.lineTo(ctx, x, y);
    }
    ctx.stroke();
  }
}

function draw() {
    var canvas = $("#canvas")[0];
    if (null==canvas || !canvas.getContext) return;

    var ctx=canvas.getContext("2d");
    var x0 = .5 + .5*canvas.width;  // x0 pixels from left to x=0
    var y0 = .5 + .5*canvas.height; // y0 pixels from top to y=0
    var doNegativeX = true;
    plot = new Plot(x0-xoff*scale, y0+yoff*scale, scale, doNegativeX);

    plot.update_svg($("svg"));

    ctx.clearRect ( 0 , 0 , canvas.width, canvas.height );
    plot.show(ctx);
    ctx.strokeStyle = "rgb(66,44,255)";
    ctx.lineWidth = 2;

    // funGraph(ctx, plot, expr_f);
    ctx.strokeStyle = "rgb(200,200,0)";
    if (draw_slope) slopeGraph(ctx, plot, expr_f);
    ctx.strokeStyle = "rgb(0,0,0)";
    ctx.lineWidth = 1;
    for (var i=0; i<points.length; ++i) {
        odePlot(ctx, plot, expr_f, points[i].x, points[i].y);
    }
}


function expr_f(x, y) {
    return compiled_expr.eval({"x": x, "y": y});
}


function update() {
    expr = $("#expr").val();
    compiled_expr = math.compile(expr);
    $("#formula").html('$$y\' = ' + math.parse(expr.replace(/y/g,'y')).toTex() + '$$');
    MathJax.Hub.Queue(["Typeset",MathJax.Hub]);

    // var sequence = recurrenceSequence(expr_f, a_0, 100);
    draw();
    point_string = "";
    for (var i=0; i<points.length; ++i) {
      if (i>0) point_string += " ";
      point_string += points[i].x.toFixed(4) + " " + points[i].y.toFixed(4);
    }
    var params = {
    	"expr": expr,
    	"scale": scale.toFixed(3),
      "xoff": xoff.toFixed(3),
      "yoff": yoff.toFixed(3),
      "points": point_string
    }
    var querystring = "";
    var sep = "";
    for (key in params) {
    	querystring += sep + key + "=" + encodeURIComponent(params[key]);
    	sep = "&";
    }
    window.location.hash = querystring
}


$(function() {
    console.log("ode plot, manu-fatto, https://github.com/paolini/recurrence/")

    params = get_querystring_params();

    if (params['expr']) {
        $("#expr").val(params['expr']);
    }

    if (params['scale'] != undefined) {
	     scale = parseFloat(params['scale']);
    }

    if (params['xoff'] != undefined) {
	     xoff = parseFloat(params['xoff']);
    }

    if (params['yoff'] != undefined) {
	     yoff = parseFloat(params['yoff']);
    }

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
      	var coords = plot.mouse_coords(canvas,event);
      	$("#x").html(""+coords.x);
      	$("#y").html(""+coords.y);
      }
    });

    $("#canvas").on("mousedown",function(event) {
      if (plot) {
       var coords = plot.mouse_coords(canvas,event);
       points.push(coords);
    	 update();
     }
    });

    // if mousewheel is moved
    $("#canvas").mousewheel(function(e, delta) {
    	var coords = plot.mouse_coords(canvas, e);
    	// determine the new scale
    	var factor = 1.04
    	if (delta < 0) factor = 1.0/factor
    	scale *= factor
    	xoff = coords.x + (xoff-coords.x) / factor;
    	yoff = coords.y + (yoff-coords.y) / factor;
    	update();
    	return false;
    });

    update();
});
