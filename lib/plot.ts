import { MouseEvent } from 'react'
import { format } from 'mathjs'

export type Axes = {
  x: number,
  y: number,
  r: number
}

/**
 * underlying drawing context
 * in pixel coordinates
 */
export interface DrawingContext {
  clearRect(x: number, y: number, width: number, height: number): void,
  beginPath(): void,
  closePath(): void,
  moveTo(x: number, y: number): void,
  lineTo(x: number, y: number): void,
  stroke(): void,
  fillText(text: string, x: number, y: number): void,
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise: boolean): void,
  strokeStyle: string | CanvasGradient | CanvasPattern,
  lineWidth: number,
  textAlign: string,
  font: string,
}

export interface AxesWrapper {
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  height: number,
  width: number,
  radius: number,
}

/**
 * wrapping to underlying context
 * in axes coordinates
 */
export interface ContextWrapper extends AxesWrapper {
  ctx: DrawingContext,
  scale: number,
  x0: number,
  y0: number,

  x_pixel: (x: number) => number,
  y_pixel: (y: number) => number,  
  pixel_x: (x: number) => number,
  pixel_y: (y: number) => number,
  clear: () => void,
  moveTo: (x: number, y: number) => void,
  lineTo: (x: number, y: number) => void,
  drawPoint: (x: number, y: number) => void,
  drawText: (x: number, y: number, text: string) => void,
  drawArrowHead: (x: number, y: number, dx: number, dy: number) => void,
  drawAxes: () => void,
}

export function context(axes: Axes, width:number, height:number, ctx: DrawingContext): ContextWrapper {
  const w = width/2
  const h = height/2  
  const scale = Math.sqrt(w*w + h*h) / axes.r
  const x0 = w - axes.x * scale
  const y0 = h + axes.y * scale
  const radius = axes.r

  const pixel_x = (x: number): number => (x0 + x*scale)
  const pixel_y = (y: number): number => (y0 - y*scale)   
  const x_pixel = (x: number): number => ((x - x0)/scale)
  const y_pixel = (y: number): number => ((y0 - y)/scale)

  return {
    ctx, 
    width,
    height,
    scale,
    x0,
    y0,
    radius,

    // computed properties:
    xMin: x_pixel(0),
    xMax: x_pixel(width),
    yMin: y_pixel(height),
    yMax: y_pixel(0),

    // functions:
    pixel_x,
    pixel_y,      
    x_pixel,
    y_pixel,
    
    // drawing functions:
    
    clear: () => ctx.clearRect(0, 0, width, height),
    
    moveTo: (x: number, y: number) => ctx.moveTo(pixel_x(x), pixel_y(y)),
    
    lineTo: (x: number, y: number) => ctx.lineTo(pixel_x(x), pixel_y(y)),
    
    drawPoint: (x: number, y: number) => {
      ctx.beginPath()
      ctx.arc(pixel_x(x), pixel_y(y), 2.0, 0, 2 * Math.PI, false)
      ctx.stroke()
    },
    
    drawText: (x, y, text) => ctx.fillText(text, pixel_x(x)-2, pixel_y(y)+10),
    
    drawArrowHead: (x, y, dx, dy) => {
      const s = Math.sqrt(dx*dx+dy*dy)
      dx /= s
      dy /= -s
      const r = 7.0
      x = pixel_x(x)
      y = pixel_y(y)
      ctx.beginPath();
      ctx.moveTo(x - r*dx - 0.3*r*dy, y - r*dy + 0.3 * r * dx);
      ctx.lineTo(x, y);
      ctx.lineTo(x - r*dx + 0.3*r*dy, y - r*dy - 0.3 * r * dx);
      ctx.stroke();
    },  

    drawAxes: () => {
      var w = width;
      var h = height;
      ctx.beginPath();
      ctx.strokeStyle = "rgb(128,128,128)";
      ctx.moveTo(0,y0); ctx.lineTo(w,y0);  // X axis
      ctx.moveTo(x0,0); ctx.lineTo(x0,h);  // Y axis
      ctx.stroke();

      // draw rulers
      var k = 2.0; //minimum number of ticks along the semidiagonal
      var pow = Math.floor(Math.log(radius/k) / Math.log(10.0));
      var dx = Math.pow(10.0,pow);

      ctx.font = "10px Arial"

      function round(x: number) {
        return format(x, {precision: 14});
      }

      var y;
      var x;
      y = pixel_y(0);
      var tick_dir = 1; // ticks go above
      var text_dir = -1; // text goes below
      if (y<0) {
        y=0;
        tick_dir = -1;
      }
      if (y>height) {
        y=height;
        text_dir = 1;
      }
      ctx.textAlign = "center"
      for (var i = Math.floor(x_pixel(0)/dx*10)+1; i<x_pixel(width)/dx*10; i++) {
        if (i==0) continue;
        x = pixel_x(i*dx/10);
        ctx.beginPath();
        ctx.moveTo(x,y);
        ctx.lineTo(x,y - tick_dir * (i%10==0 ? 6 : (i%5 == 0) ? 4:2));
        ctx.stroke();
        if (i%10 == 0) {
          ctx.fillText(`${round(i*dx/10)}`, x, y-text_dir*10.0);
        }
      }

      tick_dir = 1; // ticks on right hand side
      text_dir = -1; // text on left hand side
      x = pixel_x(0);
      ctx.textAlign = "right";
      if (x<0) {
        x = 0;
        text_dir = 4;
        ctx.textAlign = "left";
      }
      if (x>width) {
        x=width;
        tick_dir = -1;
        text_dir = -4
      }
      for (var i = Math.floor(y_pixel(height)/dx*10)+1; i<y_pixel(0)/dx*10; i++) {
        if (i==0) continue;
        y = pixel_y(i*dx/10);
        ctx.beginPath();
        ctx.moveTo(x,y);
        ctx.lineTo(x + tick_dir * (i%10==0 ? 6 : (i%5 == 0) ? 4:2), y);
        ctx.stroke();
        if (i%10 == 0) {
          // ugly hack to get (hopefully!) correct digits
          ctx.fillText(`${round(i*dx/10)}`, x+text_dir*2, y+3);
        }
      }
    }
  }
}

function getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent<HTMLCanvasElement>): {x: number, y: number} {
  const rect = canvas.getBoundingClientRect()
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  }
}

interface CanvasContextWrapper extends ContextWrapper {
  mouseCoords: (event: MouseEvent<HTMLCanvasElement>) => {x: number, y: number},
  // eventX: (event: MouseEvent<HTMLCanvasElement>) => number,
  // eventY: (event: MouseEvent<HTMLCanvasElement>) => number,
}

export function translateAxes(axes: Axes, dx: number, dy: number): Axes {
  return {
    x: axes.x + dx,
    y: axes.y + dy,
    r: axes.r
  }
}

export function zoomAxes(axes: Axes, factor: number, x: number, y: number): Axes {
  return {
    x: x + (axes.x - x) / factor,
    y: y + (axes.y - y) / factor,
    r: axes.r / factor
  }
}

export function canvasContext(axes: Axes, canvas: HTMLCanvasElement): CanvasContextWrapper|null {
  const ctx = canvas.getContext("2d")
  if (ctx === null) return null
  const contextWrapper = context(axes, canvas.width, canvas.height, ctx)
  return {
    ...contextWrapper,
    mouseCoords: (event: MouseEvent<HTMLCanvasElement>) => {
      const coords = getMousePos(canvas, event);
      return {
        x: contextWrapper.x_pixel(coords.x),
        y: contextWrapper.y_pixel(coords.y)
      }
    },
    /*
    eventX: (event: MouseEvent<HTMLCanvasElement>) => contextWrapper.x_pixel(event.offsetX),
    eventY: (event: MouseEvent<HTMLCanvasElement>) => contextWrapper.y_pixel(event.offsetY),
    */
  }
}

