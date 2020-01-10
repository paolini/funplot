function Plot(options) {
    if (options.clone) {
      this.xCenter = options.clone.xCenter;
      this.yCenter = options.clone.yCenter;
      this.radius = options.clone.radius;
    } else {
      this.xCenter = options.xCenter;
      this.yCenter = options.yCenter;
      this.radius = options.radius;
    }
    this.scale = Math.sqrt(320*320 + 240*240) / options.radius;
    this.x0 = 320 - options.xCenter * this.scale;
    this.y0 = 240 + options.yCenter * this.scale;

    // use setCanvas to set these:

    this.width = null;
    this.height = null;
    this.ctx = null;
}

Plot.prototype.get_params = function() {
  return {
    x: this.xCenter,
    y: this.yCenter,
    r: this.radius };
}

Plot.prototype.set_params = function(params) {
  this.xCenter = params.x;
  this.yCenter = params.y;
  this.radius = params.r;
  if (this.canvas) this.setCanvas(this.canvas);
}

Plot.prototype.resize = function(width, height) {
  this.width = width;
  this.height = height;

  var w = this.width/2;
  var h = this.height/2;
  this.scale = Math.sqrt(w*w + h*h) / this.radius;
  this.x0 = w - this.xCenter * this.scale;
  this.y0 = h + this.yCenter * this.scale;
}

Plot.prototype.setCanvas = function(canvas) {
  this.ctx = canvas.getContext("2d");
  this.resize(canvas.width, canvas.height);
}

Plot.prototype.setPdf = function(width, height) {
  this.ctx = new PdfCtx(6*width, 6*height);
  this.resize(6*width, 6*height);
}

Plot.prototype.zoom = function(factor, x, y) {
  this.xCenter = x + (this.xCenter - x) / factor;
  this.yCenter = y + (this.yCenter - y) / factor;
  this.radius /= factor;
  if (this.canvas) this.setCanvas(this.canvas);
}

Plot.prototype.translate = function(dx, dy) {
  this.xCenter += dx;
  this.yCenter += dy;
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

Plot.prototype.clear = function() {
  this.ctx.clearRect (0 ,0 , this.width, this.height);
}

Plot.prototype.drawAxes = function() {
    var w = this.width;
    var h = this.height;
    this.ctx.beginPath();
    this.ctx.strokeStyle = "rgb(128,128,128)";
    this.ctx.moveTo(0,this.y0); this.ctx.lineTo(w,this.y0);  // X axis
    this.ctx.moveTo(this.x0,0); this.ctx.lineTo(this.x0,h);  // Y axis
    this.ctx.stroke();

    // draw rulers
    var k = 2.0; //minimum number of ticks along the semidiagonal
    var pow = Math.floor(Math.log(this.radius/k) / Math.log(10.0));
    var dx = Math.pow(10.0,pow);

    this.ctx.font = "10px Arial"

    function round(x) {
      return math.format(x, {precision: 14});
    }

    var pixel_y
    var pixel_x;
    pixel_y = this.pixel_y(0);
    this.ctx.textAlign = "center"
    for (var i = Math.floor(this.x_pixel(0)/dx*10)+1; i<this.x_pixel(this.width)/dx*10; i++) {
      if (i==0) continue;
      pixel_x = this.pixel_x(i*dx/10);
      this.ctx.beginPath();
      this.ctx.moveTo(pixel_x,pixel_y);
      this.ctx.lineTo(pixel_x,pixel_y - (i%10==0 ? 6 : (i%5 == 0) ? 4:2));
      this.ctx.stroke();
      if (i%10 == 0) {
        this.ctx.fillText(round(i*dx/10), pixel_x, pixel_y+10.0);
      }
    }

    pixel_x = this.pixel_x(0);
    this.ctx.textAlign = "right"
    for (var i = Math.floor(this.y_pixel(this.height)/dx*10)+1; i<this.y_pixel(0)/dx*10; i++) {
      if (i==0) continue;
      pixel_y = this.pixel_y(i*dx/10);
      this.ctx.beginPath();
      this.ctx.moveTo(pixel_x,pixel_y);
      this.ctx.lineTo(pixel_x + (i%10==0 ? 6 : (i%5 == 0) ? 4:2), pixel_y);
      this.ctx.stroke();
      if (i%10 == 0) {
        // ugly hack to get (hopefully!) correct digits
        this.ctx.fillText(round(i*dx/10), pixel_x-2, pixel_y+3);
      }
    }
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

Plot.prototype.drawArrowHead = function(x, y, dx, dy) {
  var s = Math.sqrt(dx*dx+dy*dy);
  dx /= s;
  dy /= -s;
  var r = 7.0;
  x = this.pixel_x(x);
  y = this.pixel_y(y);
  this.ctx.beginPath();
  this.ctx.moveTo(x - r*dx - 0.3*r*dy, y - r*dy + 0.3 * r * dx);
  this.ctx.lineTo(x, y);
  this.ctx.lineTo(x - r*dx + 0.3*r*dy, y - r*dy - 0.3 * r * dx);
  this.ctx.stroke();
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
