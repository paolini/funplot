function Plot(options) {
    this.xCenter = options.xCenter;
    this.yCenter = options.yCenter;
    this.radius = options.radius;
    this.scale = Math.sqrt(320*320 + 240*240) / options.radius;
    this.x0 = 320 - options.xCenter * this.scale;
    this.y0 = 240 + options.yCenter * this.scale;

    // use setCanvas to set these:

    this.width = null;
    this.height = null;
    this.ctx = null;
}

Plot.prototype.setCanvas = function(canvas) {
  this.width = canvas.width;
  this.height = canvas.height;
  this.ctx = canvas.getContext("2d");

  var w = this.width/2;
  var h = this.height/2;
  this.scale = Math.sqrt(w*w + h*h) / this.radius;
  this.x0 = w - this.xCenter * this.scale;
  this.y0 = h + this.yCenter * this.scale;
}

Plot.prototype.zoom = function(factor, x, y) {
  this.xCenter = x + (this.xCenter - x) / factor;
  this.yCenter = y + (this.yCenter - y) / factor;
  this.radius /= factor;
  if (this.canvas) this.setCanvas(this.canvas);
}

Plot.prototype.getReference = function() {
    return {
      widthPx: this.width,
      heightPx: this.height,
      xMin: this.x_pixel(0),
      xCenter: this.xCenter,
      xMax: this.x_pixel(this.width),
      yMin: this.y_pixel(this.height),
      yCenter: this.yCenter,
      yMax: this.y_pixel(0),
      radius: this.radius,

      x0: this.x0,
      y0: this.y0,
      scale: this.scale,
      xoff: (this.width/2 - this.x0) / this.scale,
      yoff: (this.y0 - this.height/2) / this.scale
    };
}

Plot.prototype.show = function() {
    var w = this.width;
    var h = this.height;
    this.ctx.beginPath();
    this.ctx.strokeStyle = "rgb(128,128,128)";
    this.ctx.moveTo(0,this.y0); plot.ctx.lineTo(w,this.y0);  // X axis
    this.ctx.moveTo(this.x0,0); plot.ctx.lineTo(this.x0,h);  // Y axis
    this.ctx.stroke();
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

Plot.prototype.moveTo = function(x, y) {
    this.ctx.moveTo(this.pixel_x(x), this.pixel_y(y));
};

Plot.prototype.lineTo = function(x, y) {
    this.ctx.lineTo(this.pixel_x(x), this.pixel_y(y));
};

Plot.prototype.drawPoint = function(x, y) {
    this.ctx.beginPath();
    this.ctx.arc(this.pixel_x(x), this.pixel_y(y), 2.0, 0, 2 * Math.PI, false);
    this.ctx.stroke();
};

Plot.prototype.drawText = function(x, y, text) {
    this.ctx.fillText(text, this.pixel_x(x)-2, this.pixel_y(y)+10);
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
    	x: evt.clientX - rect.left,
    	y: evt.clientY - rect.top
    };
}

Plot.prototype.mouse_coords = function(event) {
    var coords = getMousePos(this.ctx.canvas, event);
    return {
      x: this.x_pixel(coords.x),
      y: this.y_pixel(coords.y)
    };
}

Plot.prototype.eventX = function(event) {
    return this.x_pixel(event.offsetX);
};

Plot.prototype.eventY = function(event) {
    return this.y_pixel(event.offsetY);
};
