import { jsPDF, Context2d } from 'jspdf'

import { Axes, ContextWrapper, context } from './plot'

export function pdfContext(axes: Axes, width: number, height: number): ContextWrapper {
  return context(axes, 6*width, 6*height, new PdfCtx(6*width, 6*height))
}

class PdfCtx {
  doc: jsPDF;
  ctx: Context2d;

  constructor (width: number, height: number) {
    var margin = 10;
    var doc = new jsPDF({
      unit: 'pt',
      format: [width+2*margin, height+2*margin],
      orientation: (height > width ? 'p' : 'l')
    });
    doc.setLineJoin('rounded');
  //  doc.line(20, 20, 60, 20) // horizontal line


    //doc.setLineWidth(0.5)
    this.doc = doc;
    this.ctx = doc.context2d;
    this.ctx.autoPaging = false;
    console.log("autopaging: " + this.ctx.autoPaging);
    this.ctx.lineWidth = 2.0;
    this.ctx.translate(margin,margin);
    this.ctx.scale(1.0,1.0);
    // doc.save("test.pdf")
  }

  myx(x: number) {
    return x;
  }

  myy(y: number) {
    return y;
  }

  save(filename: string) {
    this.doc.save(filename);
  }

  set strokeStyle(x: string) {this.ctx.strokeStyle = x;}

  set font(x: string) {this.ctx.font = x;}

  set textAlign(x: "right" | "left" | "center" | "end" | "start") {this.ctx.textAlign = x;}

  set lineWidth(x: number) {this.ctx.lineWidth = x;}

  clearRect(x0: number, y0: number, x1: number, y1: number) {
  }

  beginPath() {
    this.ctx.beginPath();
  }

  moveTo(x: number, y: number) {
    this.ctx.moveTo(this.myx(x), this.myy(y));
  }

  lineTo(x: number, y: number) {
    this.ctx.lineTo(this.myx(x), this.myy(y));
  }

  stroke() {
    this.ctx.stroke();
  }

  fillText(text: string, x: number, y: number) {
    this.ctx.fillText(text, this.myx(x), this.myy(y));
  }

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise: boolean) {
    console.log('arc not yet implemented in PDF context')
  }
}
