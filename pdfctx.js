function PdfCtx(width, height) {
  var doc = new jsPDF({unit: 'pt', format: [width+10, height+10], orientation: (height > width ? 'p' : 'l') });

//  doc.line(20, 20, 60, 20) // horizontal line


  //doc.setLineWidth(0.5)
  this.doc = doc;
  this.ctx = doc.context2d;
  this.ctx.autoPaging = false;
  this.ctx.lineWidth = 0.1;
  this.ctx.translate(5,5);
  this.ctx.scale(1.0,1.0);
  // doc.save("test.pdf")
}

PdfCtx.prototype.myx = function(x) {
  return x;
}

PdfCtx.prototype.myy = function(y) {
  return y;
}

PdfCtx.prototype.save = function(filename) {
  this.doc.save(filename);
}

Object.defineProperty(PdfCtx.prototype, "strokeStyle", {set: function(x) {this.ctx.strokeStyle = x;}});

Object.defineProperty(PdfCtx.prototype, "font", {set: function(x) {this.ctx.font = x;}});

Object.defineProperty(PdfCtx.prototype, "textAlign", {set: function(x) {this.ctx.textAlign = x;}});

PdfCtx.prototype.clearRect = function(x0, y0, x1, y1) {
}

PdfCtx.prototype.beginPath = function() {
  this.ctx.beginPath();
}

PdfCtx.prototype.moveTo = function(x, y) {
  this.ctx.moveTo(this.myx(x), this.myy(y));
}

PdfCtx.prototype.lineTo = function(x, y) {
  this.ctx.lineTo(this.myx(x), this.myy(y));
}

PdfCtx.prototype.stroke = function() {
  this.ctx.stroke();
}

PdfCtx.prototype.fillText = function(text, x, y) {
  this.ctx.fillText(text, this.myx(x), this.myy(y));
}
