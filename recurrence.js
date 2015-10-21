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

Axes.prototype.moveTo = function(ctx, x, y) {
    ctx.moveTo(this.x0+x*this.scale,this.y0-y*this.scale);
};

Axes.prototype.lineTo = function(ctx, x, y) {
    ctx.lineTo(this.x0+x*this.scale,this.y0-y*this.scale);
};

Axes.prototype.drawPoint = function(ctx, x, y) {
    ctx.beginPath();
    ctx.arc(this.x0+x*this.scale, this.y0-y*this.scale, 2.0, 0, 2 * Math.PI, false);
    ctx.stroke();
};

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

function recurrenceWeb (ctx,axes,func,x,n) {
    var x_0 = x;
    ctx.beginPath();
    axes.moveTo(ctx, x, 0);
    for (var i=0; i<n; ++i) {
	var y=func(x);
	if (!isFinite(y) || Math.abs(y)>10E10) break;
	axes.lineTo(ctx, x, y);
	axes.lineTo(ctx, y, y);
	x = y;
    }
    ctx.stroke()
    x = x_0;
    for (var i=0; i<n; ++i) {
	var y=func(x);
	if (!isFinite(y) || Math.abs(y)>10E10) break;
	axes.drawPoint(ctx, x, 0);
	x = y;
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
