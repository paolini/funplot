function Plot(x0, y0, scale, doNegativeX) {
    this.x0 = x0;
    this.y0 = y0;
    this.scale = scale;
    this.doNegativeX = doNegativeX;
}

Plot.prototype.zoom = function(factor, x, y) {
  var xoff = (320.5 - this.x0) / this.scale;
  var yoff = (this.y0 - 240.5) / this.scale;
  xoff = x + (xoff-x) / factor;
  yoff = y + (yoff-y) / factor;
  this.scale *= factor;
  this.x0 = 320.5 - xoff * this.scale;
  this.y0 = 240.5 + yoff * this.scale;
}

Plot.prototype.setReference = function(reference) {
  this.scale = Math.sqrt(320*320 + 240*240) / reference.radius;
  this.x0 = 320 - reference.xCenter * this.scale;
  this.y0 = 240 + reference.yCenter * this.scale;
}

Plot.prototype.getReference = function() {
    return {
      widthPx: 640,
      heightPx: 480,
      xMin: (0 - this.x0) / this.scale,
      xCenter: (320 - this.x0) / this.scale,
      xMax: (640 - this.x0) / this.scale,
      yMin: (this.y0 - 480) / this.scale,
      yCenter: (this.y0 - 240) / this.scale,
      yMax: (this.y0 - 0) / this.scale,
      radius: Math.sqrt(320*320 + 240*240) / this.scale,

      x0: this.x0,
      y0: this.y0,
      scale: this.scale,
      xoff: (320.5 - this.x0) / this.scale,
      yoff: (this.y0 - 240.5) / this.scale
    };
}

Plot.prototype.show = function(ctx) {
    var w=ctx.canvas.width;
    var h=ctx.canvas.height;
    var xmin = this.doNegativeX ? 0 : this.x0;
    ctx.beginPath();
    ctx.strokeStyle = "rgb(128,128,128)";
    ctx.moveTo(xmin,this.y0); ctx.lineTo(w,this.y0);  // X axis
    ctx.moveTo(this.x0,0);    ctx.lineTo(this.x0,h);  // Y axis
    ctx.stroke();
};

Plot.prototype.update_svg = function(svg) {
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

Plot.prototype.pixel_x = function(x) {
    return this.x0 + x*this.scale;
}

Plot.prototype.pixel_y = function(y) {
    return this.y0 - y*this.scale;
}

Plot.prototype.x_pixel = function(x) {
    return (x - this.x0)/this.scale;
}

Plot.prototype.y_pixel = function(y) {
    return (this.y0 - y)/this.scale;
}

Plot.prototype.moveTo = function(ctx, x, y) {
    ctx.moveTo(this.pixel_x(x), this.pixel_y(y));
};

Plot.prototype.lineTo = function(ctx, x, y) {
    ctx.lineTo(this.pixel_x(x), this.pixel_y(y));
};

Plot.prototype.drawPoint = function(ctx, x, y) {
    ctx.beginPath();
    ctx.arc(this.pixel_x(x), this.pixel_y(y), 2.0, 0, 2 * Math.PI, false);
    ctx.stroke();
};

Plot.prototype.drawText = function(ctx, x, y, text) {
    ctx.fillText(text, this.pixel_x(x)-2, this.pixel_y(y)+10);
}

Plot.prototype.mouse_coords = function(canvas,event) {
    var coords = getMousePos(canvas, event);
    return {x:this.x_pixel(coords.x), y: this.y_pixel(coords.y)};
}

Plot.prototype.eventX = function(event) {
    return this.x_pixel(event.offsetX);
};

Plot.prototype.eventY = function(event) {
    return this.y_pixel(event.offsetY);
};
