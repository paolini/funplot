function new_svg_elem(elem) {
    return $(document.createElementNS('http://www.w3.org/2000/svg', elem));
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
    	x: evt.clientX - rect.left,
    	y: evt.clientY - rect.top
    };
}

function funGraph (ctx,plot,func) {
    var yy, x, dx=2, x0=plot.x0, y0=plot.y0, scale=plot.scale;
    var iMax = Math.round((ctx.canvas.width-x0)/dx);
    var iMin = plot.doNegativeX ? Math.round(-x0/dx) : 0;
    ctx.beginPath();

    for (var i=iMin;i<=iMax;i++) {
      	x = i*dx/scale;
      	var y = func(x);
      	if (i==iMin || Math.abs(y-yy)>dx*100) {
      	    plot.moveTo(ctx, x, func(x));
      	} else {
            plot.lineTo(ctx, x, func(x));
	      }
      	yy = y;
    }
    ctx.stroke();
}

function recurrenceSequence(func, x, n) {
    r = [];
    r.push(x);
    for (var i=0; i<n-1; ++i) {
    	var y=func(x);
    	if (!isFinite(y) || Math.abs(y)>10E10) break;
    	x = y;
    	r.push(x);
    }
    return r;
}

function recurrenceWeb (ctx, plot, sequence) {
    ctx.strokeStyle = "rgb(0,0,0)";
    ctx.beginPath();
    plot.moveTo(ctx, sequence[0], 0);
    for (var i=0; i<sequence.length-1; ++i) {
    	var x = sequence[i];
    	var y = sequence[i+1]
    	if (Math.abs(y) > 10E4) break;
    	plot.lineTo(ctx, x, y);
    	plot.lineTo(ctx, y, y);
        }
        ctx.stroke()
        ctx.strokeStyle = "rgb(255,0,0)";
        ctx.fillStyle = "rgb(50,50,50)";
        for (var i=0; i<sequence.length; ++i) {
    	plot.drawPoint(ctx, sequence[i], 0);
    	if (i<10) {
    	    plot.drawText(ctx, sequence[i], 0, i+1);
    	}
    }
}

function svgGraphPath (plot,func) {
    var yy, x, dx=4, x0=plot.x0, y0=plot.y0, scale=plot.scale;
    var iMax = Math.round((ctx.canvas.width-x0)/dx);
    var iMin = plot.doNegativeX ? Math.round(-x0/dx) : 0;
    var d = "";
    for (var i=iMin;i<=iMax;i++) {
    	x = i*dx/scale;
    	if (i==iMin) plot.moveTo(ctx, x, func(x));
    	else         plot.lineTo(ctx, x, func(x));
    }
    ctx.stroke();
}

////////////////////////

function id(x) {return x;}

var expr = "cos(x)";
var compiled_expr;
var plot;
var a_0 = 5.0;

var scale = 80.0;                 // 40 pixels from x=0 to x=1
var xoff = 0.0; // offset x
var yoff = 0.0; // offset y

function expr_f(x) {
    return compiled_expr.eval({"x": x});
}

function fill_table(table_id, sequence) {
    $("#"+table_id+" tr").remove();
    for (var i=0; i<sequence.length; i++) {
	$("#"+table_id).append("<tr><td>a(" + (i+1) + ")</td><td>" + sequence[i] + "</td></tr>");
    }

}

function draw(sequence) {
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
    funGraph(ctx, plot, expr_f);
    ctx.strokeStyle = "rgb(200,200,0)";
    funGraph(ctx, plot, id);
    ctx.strokeStyle = "rgb(0,0,0)";
    ctx.lineWidth = 1;
    recurrenceWeb(ctx, plot, sequence);
}

function get_circle() {
    var circle = new_svg_elem("circle");
    circle.attr("cx",100);
    circle.attr("cy",100);
    circle.attr("r",50);
    circle.attr("style","stroke:blue;fill:none");
    return circle;
  }

function get_querystring_params() {
    // adapted from http://stackoverflow.com/a/2880929/1221660
    var urlParams = {};
    var match,
  	pl = /\+/g,  // Regex for replacing addition symbol with a space
  	search = /([^&=]+)=?([^&]*)/g,
  	decode = function (s) {
  	    return decodeURIComponent(s.replace(pl, " "));
  	};
    var query = window.location.search.substring(1);

    while (match = search.exec(query)) {
    	urlParams[decode(match[1])] = decode(match[2]);
    }
    return urlParams;
}

function get_my_url() {
    var origin = window.location.origin;
    if (origin == "null") { // see https://bugzilla.mozilla.org/show_bug.cgi?id=878297
    	origin = "file://";
    }
    return origin + window.location.pathname;
}

function update() {
    $("#a0").html(""+a_0);
    expr = $("#expr").val();
    compiled_expr = math.compile(expr);
    $("#formula").html('$$\\begin{cases}a_1=' + a_0 + '\\\\a_{n+1}=' + math.parse(expr.replace(/x/g,'a_n')).toTex() + '\\end{cases}$$');
    MathJax.Hub.Queue(["Typeset",MathJax.Hub]);

    var sequence = recurrenceSequence(expr_f, a_0, 100);
    draw(sequence);
    fill_table("table", sequence);
    var params = {
    	"expr": expr,
    	"x": a_0,
    	"scale": scale,
    	"xoff": xoff,
    	"yoff": yoff
    }
    var url = get_my_url();
    var sep = "?";
    for (key in params) {
    	url += sep + key + "=" + encodeURIComponent(params[key]);
    	sep = "&";
    }
    $("#share").attr("href", url);
}

$(function() {
    console.log("recurrence, manu-fatto, https://github.com/paolini/recurrence/")

    params = get_querystring_params();

    if (params['expr']) {
        $("#expr").val(params['expr']);
    }

    if (params['x'] != undefined) {
	      a_0 = parseFloat(params['x']);
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

    $("#expr").keyup(function(event) {
        if (event.keyCode == 13)
            update();
    });

    $("#draw").click(function() {
        update();
    });

    $("#canvas").on("mousemove",function(event) {
      	var coords = plot.mouse_coords(canvas,event);
      	$("#x").html(""+coords.x);
      	$("#y").html(""+coords.y);
    });

    $("#canvas").on("mousedown",function(event) {
       var coords = plot.mouse_coords(canvas,event);
    	a_0 = coords.x;
    	update();
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
