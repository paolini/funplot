import { ContextWrapper } from "./plot";

export default function funGraph(plot: ContextWrapper, func: (x: number) => number, inverted: boolean) {
    var pix = inverted?
      (plot.yMax - plot.yMin)/plot.height:
      (plot.xMax - plot.xMin)/plot.width;
  
    plot.ctx.beginPath();
  
    var x = inverted?plot.yMin:plot.xMin;
    var y = func(x);
    var need_move = 1;
    var max_dx = pix;
    var min_dx = pix/10;
    var dx = max_dx;
    var xend = inverted?plot.yMax:plot.xMax;
    var ymin = inverted?plot.xMin:plot.yMin;
    var ymax = inverted?plot.xMax:plot.yMax;
    while(x<xend) {
      var xx = x+dx;
      var yy = func(xx);
      if (isNaN(y) || isNaN(yy)) {
        need_move = 1;
      } else if (yy>ymax && y > ymax) {
        need_move = 1;
      } else if (yy<ymin && y < ymin) {
        need_move = 1;
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
        var i = 0;
        const ITER=10;
        if (Math.abs(dy)>pix) {
          // use bisection to decide if there is jump discontinuity
          var a = x;
          var b = xx;
          var ya = y;
          var yb = yy;
          var ymid = 0.5*(y+yy);
          for (i=0;i<ITER;++i) {
            var c = 0.5*(a+b);
            var y1 = func(c);
            if (isNaN(y1)) {
              i = ITER;
              break;
            }
            if (Math.abs(y1-ymid) < pix) {
              break;
            }
            if ((ya <= ymid && y1 >= ymid) || (ya>=ymid && y1 <=ymid)) {
              b = c;
              yb = y1;
            } else {
              a = c;
              ya = y1;
            }
          }
        }
        if (i>=ITER) {
          // jump detected
          need_move = 1;
        } else {
          if (need_move) {
            var xxx = x;
            var yyy = y;
            if (y > ymax) {
              yyy = ymax;
              xxx = x + (yyy-y)/(yy-y)*(xx-x);
            } else if (y<ymin) {
              yyy = ymin;
              xxx = x + (yyy-y)/(yy-y)*(xx-x);
            }
            inverted?plot.moveTo(yyy,xxx):plot.moveTo(xxx,yyy);
          }
          if (1) {
            var xxx = x;
            var yyy = y;
            if (yy > ymax) {
              yyy = ymax;
              xxx = xx + (yyy-yy)/(y-yy)*(x - xx);
              need_move = 1;
            } else if (yy < ymin) {
              yyy = ymin;
              xxx = xx + (yyy-yy)/(y-yy)*(x - xx);
              need_move = 1;
            } else {
              need_move = 0;
            }
            inverted?plot.lineTo(yyy, xxx):plot.lineTo(xxx, yyy);
          }
        }
      }
      y = yy;
      x = xx;
    }
    plot.ctx.stroke();
  }
  