function new_svg_elem(elem) {
    return $(document.createElementNS('http://www.w3.org/2000/svg', elem));
}

function relMouseCoords(canvas,event){
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = canvas;

    do{
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    }
    while(currentElement = currentElement.offsetParent)

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return {x:canvasX, y:canvasY}
}

function Axes(x0,y0,scale,doNegativeX) {
    this.x0 = x0;
    this.y0 = y0;
    this.scale = scale;
    this.doNegativeX = doNegativeX;
}

Axes.prototype.show = function(ctx) {
    var w=ctx.canvas.width;
    var h=ctx.canvas.height;
    var xmin = this.doNegativeX ? 0 : this.x0;
    ctx.beginPath();
    ctx.strokeStyle = "rgb(128,128,128)"; 
    ctx.moveTo(xmin,this.y0); ctx.lineTo(w,this.y0);  // X axis
    ctx.moveTo(this.x0,0);    ctx.lineTo(this.x0,h);  // Y axis
    ctx.stroke();
};

Axes.prototype.update_svg = function(svg) {
    var w = svg.attr("width");
    var h = svg.attr("height");
    var xmin = this.doNegativeX ? 0 : this.x0;
    var axes = svg.find("#axes");
    if (axes.length == 0) {
	axes = new_svg_elem("g");
	axes.attr("id", "axes");
	axes.attr("style", "stroke:black");
	var xaxis = new_svg_elem("line");
	xaxis.attr("id", "xaxis");
	xaxis.attr("x1", xmin);
	xaxis.attr("y1", this.y0);
	xaxis.attr("x2", w);
	xaxis.attr("y2", this.y0);
	var yaxis = new_svg_elem("line");
	yaxis.attr("id", "yaxis");
	yaxis.attr("x1", this.x0);
	yaxis.attr("y1", 0);
	yaxis.attr("x2", this.x0);
	yaxis.attr("y2", h);
	axes.append(xaxis);
	axes.append(yaxis);
	svg.append(axes);
    }
    return axes;
};

Axes.prototype.pixel_x = function(x) {
    return this.x0 + x*this.scale;
}

Axes.prototype.pixel_y = function(y) {
    return this.y0 - y*this.scale;
}

Axes.prototype.moveTo = function(ctx, x, y) {
    ctx.moveTo(this.pixel_x(x), this.pixel_y(y));
};

Axes.prototype.lineTo = function(ctx, x, y) {
    ctx.lineTo(this.pixel_x(x), this.pixel_y(y));
};

Axes.prototype.drawPoint = function(ctx, x, y) {
    ctx.beginPath();
    ctx.arc(this.pixel_x(x), this.pixel_y(y), 2.0, 0, 2 * Math.PI, false);
    ctx.stroke();
};

Axes.prototype.drawText = function(ctx, x, y, text) {
    ctx.fillText(text, this.pixel_x(x)-2, this.pixel_y(y)+10);
}

Axes.prototype.mouse_coords = function(canvas,event) {
    var coords = relMouseCoords(canvas,event);
    return {x:(coords.x - this.x0)/this.scale, y: (coords.y-this.y0)/this.scale};
}

Axes.prototype.eventX = function(event) {
    return (event.offsetX-this.x0)/this.scale;
};

Axes.prototype.eventY = function(event) {
    return (event.offsetY-this.y0)/this.scale;
};
    
function funGraph (ctx,axes,func) {
    var yy, x, dx=4, x0=axes.x0, y0=axes.y0, scale=axes.scale;
    var iMax = Math.round((ctx.canvas.width-x0)/dx);
    var iMin = axes.doNegativeX ? Math.round(-x0/dx) : 0;
    ctx.beginPath();

    for (var i=iMin;i<=iMax;i++) {
	x = i*dx/scale;
	if (i==iMin) axes.moveTo(ctx, x, func(x));
	else         axes.lineTo(ctx, x, func(x));
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

function recurrenceWeb (ctx, axes, sequence) {
    ctx.strokeStyle = "rgb(0,0,0)";
    ctx.beginPath();
    axes.moveTo(ctx, sequence[0], 0);
    for (var i=0; i<sequence.length-1; ++i) {
	var x = sequence[i];
	var y = sequence[i+1]
	if (Math.abs(y) > 10E4) break;
	axes.lineTo(ctx, x, y);
	axes.lineTo(ctx, y, y);
    }
    ctx.stroke()
    ctx.strokeStyle = "rgb(255,0,0)";
    ctx.fillStyle = "rgb(50,50,50)";
    for (var i=0; i<sequence.length; ++i) {
	axes.drawPoint(ctx, sequence[i], 0);
	if (i<10) {
	    axes.drawText(ctx, sequence[i], 0, i);
	}
    }
}

function svgGraphPath (axes,func) {
    var yy, x, dx=4, x0=axes.x0, y0=axes.y0, scale=axes.scale;
    var iMax = Math.round((ctx.canvas.width-x0)/dx);
    var iMin = axes.doNegativeX ? Math.round(-x0/dx) : 0;
    var d = "";
    for (var i=iMin;i<=iMax;i++) {
	x = i*dx/scale;
	if (i==iMin) axes.moveTo(ctx, x, func(x));
	else         axes.lineTo(ctx, x, func(x));
    }
    ctx.stroke();
}


////////////////////////

function id(x) {return x;}

var expr = "cos(x)";
var axes;
var a_0 = 5.0;

var scale = 80.0;                 // 40 pixels from x=0 to x=1
var xoff = 0.0; // offset x
var yoff = 0.0; // offset y

function expr_f(x) {
    var cos = Math.cos;
    var sin = Math.sin;
    var sqrt = Math.sqrt;
    var pow = Math.pow;
    return eval(expr);
}

function draw() {
    $("#a0").html(""+a_0);
    expr = $("#expr").val();
    $("#expr_an").html(expr.replace("x","a(n)"));
    var canvas = $("#canvas")[0];
    if (null==canvas || !canvas.getContext) return;
    
    var ctx=canvas.getContext("2d");
    var x0 = .5 + .5*canvas.width;  // x0 pixels from left to x=0
    var y0 = .5 + .5*canvas.height; // y0 pixels from top to y=0
    var doNegativeX = true;
    axes = new Axes(x0-xoff*scale, y0+yoff*scale, scale, doNegativeX);
    
    axes.update_svg($("svg"));
    
    ctx.clearRect ( 0 , 0 , canvas.width, canvas.height );
    axes.show(ctx);
    ctx.strokeStyle = "rgb(66,44,255)";
    ctx.lineWidth = 2;
    funGraph(ctx, axes, expr_f);
    ctx.strokeStyle = "rgb(200,200,0)";
    funGraph(ctx, axes, id);
    ctx.strokeStyle = "rgb(0,0,0)";
    ctx.lineWidth = 1;
    var sequence = recurrenceSequence(expr_f, a_0, 100);
    recurrenceWeb(ctx, axes, sequence);
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
    return window.location.origin + window.location.pathname;
}

$(function() {
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
            draw();
    });
    
    $("#draw").click(function() {
        draw();
    });

    $("#share").click(function() {
	var params = {
	    "expr": expr,
	    "x": a_0,
	    "scale": scale
	}
	var url = get_my_url();
	var sep = "?";
	for (key in params) {
	    url += sep + key + "=" + encodeURIComponent(params[key]);
	    sep = "&";
	}
	alert("Shareable URL: " + url);
    });
    
    $("#canvas").on("mousemove",function(event) {
	var coords = axes.mouse_coords(canvas,event);
	$("#x").html(""+coords.x);
	$("#y").html(""+coords.y);
    });
    
    $("#canvas").on("mousedown",function(event) {
       var coords = axes.mouse_coords(canvas,event);
	a_0 = coords.x;
	draw();
    });
    
    draw();
});

