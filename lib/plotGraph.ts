import { Point, Lines } from "./lines"
import { AxesWrapper } from "./plot"
import assert from "assert"

export function plotInvertedGraph(plot: AxesWrapper, f: (y:number) => number, color: string): Lines {
  const invertedAxes = {
    xMin: plot.yMin,
    xMax: plot.yMax,
    yMin: plot.xMin,
    yMax: plot.xMax,
    height: plot.width,
    width: plot.height,
    radius: plot.radius,
  }
  const lines = plotGraph(invertedAxes, f, color)
  return lines.map(line => {
    if (line.type === 'line') {
      return {...line, points: line.points.map(([x,y])=>[y,x])}
    } else {
      // non succede mai in realtà.
      return line
    }
  })
}

export function newPlotGraph(plot: AxesWrapper, f: (x:number)=>number, color: string): Lines {
  let lines: Lines = []
  let points: Point[] = []

  function pushLine() {
    if (points.length>1) {
      lines.push({
        type: "line",
        color,
        width: 1,
        closed: false,
        arrows: false,
        points})
      points = []
    }
  }

  const xMin = plot.xMin
  const xMax = plot.xMax
  const yMin = plot.yMin
  const yMax = plot.yMax
  const dx = 0.5 //(plot.xMax - plot.xMin)/plot.width
  const dy = dx // suppose isometric

  function bisectDomain(x0: number, y0: number, x1: number, eps: number): [number,number] {
    // find value in interval [x0,x1] last non NaN
    assert(!isNaN(y0))
    for(let i=0;i<20;i++) {
      let x = 0.5*(x0+x1)
      let y = f(x)
      if (isNaN(y)) {
        x1 = x 
      } else {
        if (Math.abs(y0-y)<eps) return [x,y]
        x0 = x
        y0 = y 
      }
    }
    console.log("bisect domain max iteration reached at point", x0)
    return [x0,y0]
}

  function bisectValue(x0: number, y0: number, x1: number, y1: number, value: number, eps: number): [number, number] {
    // find point in interval [x0,x1] last inside window
    let increase = (y1>y0)
    let x = x0
    let y = y0
    for(let i=0;i<30;++i) {
      x = 0.5*(x0+x1)
      y = f(x)
      // console.log("###",y0-value,y-value,y1-value)
      if (Math.abs(y-value)<eps) return [x,y]
      let inc = (y>value)
      if (inc === increase) {
        x1 = x
        y1 = y
      } else {
        x0 = x
        y0 = y
      }
    }
    console.log("bisectValue max iterations reached at", x0, x1)
    return [x,y]
  }

  let slopeAvg = 0.0

  function bisectObs(x0: number, y0: number, x1: number, y1: number, eps: number): [number, number, boolean, boolean] {
    // detect obscillation in interval
    const yMean = 0.5*(y1+y0)
    const jump = Math.abs(y1-y0)
    let jumpDetected = true
    let obsDetected = false
    let yMax = Math.max(y0,y1)
    let yMin = Math.min(y0,y1)
    const MAX_ITER = 20
    let i
    for(i=0; i<MAX_ITER; i++) {
      let x = 0.5*(x0+x1)
      let y = f(x)
      // console.log("**", {i,x,y,yMean})
      if (jumpDetected && 1.5*Math.abs(y-yMean) < jump) jumpDetected = false 
      if (Math.abs(y-y0)>0.5*Math.abs(y1-y0)) {
        x1=x
        y1=y
      } else {
        x0=x
        y0=y
      }
      if (y>yMax) {
        obsDetected = true
        yMax = y
      } else if (y<yMin) {
        obsDetected = true
        yMin = y
      } else if (i>slopeAvg) break
    }
    if (i>=MAX_ITER) console.log("bisectObs max iterations reached at point", x0, "slopeAvg", slopeAvg)
    if (jumpDetected) return [y0,y1,true,obsDetected]
    else {
      return [yMin,yMax,false,obsDetected]
    }
  }

  let xx = NaN
  let yy = NaN

  function pushPoint([x, y]:[number, number]) {
    points.push([x,y])
    if (xx!==x && !isNaN(yy)) {
      slopeAvg = 0.75 * slopeAvg + 0.25 * Math.abs((yy-y)/(xx-x))
    }
    xx = x
    yy = y
  }

  for (let x = xMin;x < xMax; x+=dx) {
    const y = f(x)
    if (isNaN(y)) {
      // last point of interval
      if (points.length > 0) {
        pushPoint(bisectDomain(x-dx,yy,x,dy))
        pushLine()
      } else {
        xx=x
        yy=y
      }
      continue
    } 

    if (y>yMax || y<yMin) {
      if (points.length>0) {
        if (y>yMax) pushPoint(bisectValue(xx,yy,x,y,yMax, dy))
        else pushPoint(bisectValue(xx,yy,x,y,yMin, dy))
        pushLine()
      } 
      xx = x
      yy = y
      continue
    }

    if (points.length === 0 && x>xMin) {
      // first point of interval
      if (isNaN(yy)) {
        pushPoint(bisectDomain(x,y,x-dx,dy))
      } else {
        if (yy>yMax) pushPoint(bisectValue(x,y,xx,yy,yMax,dy))
        else if (yy<yMin) pushPoint(bisectValue(x,y,xx,yy,yMin,dy))
      }
      continue
    }
    const [j0,j1,jump,obs] = bisectObs(xx,yy,x,y,dy)
    if (jump) {
      // jump detected!
      console.log("jump at", x)
      pushPoint([x,j0])
      pushLine()
      pushPoint([x,j1])
      continue
    }
    if (obs) {
      // obscillation detected!
      console.log("obs at", x)
      pushPoint([x,j0])
      pushPoint([x,j1])
    }
    pushPoint([x,y])
  }
  pushLine()
  return lines
}

export function plotGraph(plot: AxesWrapper, func: (x: number) => number, color: string): Lines {
    var pix = (plot.xMax - plot.xMin)/plot.width
    var x = plot.xMin;
    var y = func(x);
    var max_dx = pix;
    var min_dx = pix/10;
    var dx = max_dx;
    var xend = plot.xMax;
    var ymin = plot.yMin;
    var ymax = plot.yMax;

    let lines: Lines = []
    let points: Point[] = []

    function push() {
      if (points.length>0) lines.push({
        type: "line",
        color,
        width: 1,
        closed: false,
        arrows: false,
        points: points})
      points = []
    }

    function bisectJump(a:number, y:number, b:number, yy:number) {
      const ITER=10
      let ya = y
      let ymid = 0.5*(y+yy)
      let i
      for (i=0;i<ITER;++i) {
        var c = 0.5*(a+b);
        var y1 = func(c);
        if (isNaN(y1)) return true
        if (Math.abs(y1-ymid) < pix) return false
        if ((ya <= ymid && y1 >= ymid) || (ya>=ymid && y1 <=ymid)) {
          b = c;
        } else {
          a = c;
          ya = y1;
        }
      }
      return true
    }

    function bisectDomain(x: number, y: number, xx: number, eps: number): [number,number] {
      // find last domain point from x (in domain) to xx (outside)
      assert(!isNaN(y))
      for(let i=0;i<10;++i) {
        const xxx = 0.5*(x+xx)
        const yyy = func(xxx)
        if (isNaN(yyy)) {
          xx=xxx          
        } else {
          if (Math.abs(yyy-y)<eps) return [xxx,yyy]
          x=xxx
          y=yyy
        }
      }
      return [x,y]
    }

    while(x<xend) {
      var xx = x+dx;
      var yy = func(xx);
      if (isNaN(yy)) {
        if (!isNaN(y)) {
          points.push(bisectDomain(x,y,xx,pix))
          push()
        } else push()
      } else if (isNaN(y)) {
          push()
          ;[xx,yy] = bisectDomain(xx,yy,x,pix)
          points.push([xx,yy])
      } else if (yy>ymax && y > ymax) {
        push()
      } else if (yy<ymin && y < ymin) {
        push()
      } else {
        var dy = yy-y;
        if (Math.abs(dy) > pix) {
          // refine dx step
          if (dx > min_dx) {
            dx = 0.5 * dx;
            continue;
          }
        } else {
          if (dx < max_dx) dx = 2.0 * dx;
        }

        // use bisection to decide if there is jump discontinuity
        if (Math.abs(dy)>pix && bisectJump(x,y,xx,yy)) {
          // jump detected
          push()
        } else {
          if (points.length === 0) {
            var xxx = x;
            var yyy = y;
            if (y > ymax) {
              yyy = ymax;
              xxx = x + (yyy-y)/(yy-y)*(xx-x);
            } else if (y<ymin) {
              yyy = ymin;
              xxx = x + (yyy-y)/(yy-y)*(xx-x);
            }
            points.push([xxx,yyy])
          }
          if (1) {
            var xxx = x;
            var yyy = y;
            if (yy > ymax) {
              yyy = ymax;
              xxx = xx + (yyy-yy)/(y-yy)*(x - xx);
              push()
            } else if (yy < ymin) {
              yyy = ymin;
              xxx = xx + (yyy-yy)/(y-yy)*(x - xx);
              push()
            }
            points.push([xxx, yyy])
          }
        }
      }
      y = yy;
      x = xx;
    }
    push()
    return lines
  }
  