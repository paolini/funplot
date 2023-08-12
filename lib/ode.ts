import { Axes, Lines, Point, Segment} from './axes'

export default odePlot

export type Fun2 = (x: number, y: number) => number

export function slopeGraph(plot: Axes, fx: Fun2, fy: Fun2, draw_arrows: boolean): Lines {
    var xmin = plot.x_pixel(0);
    var ymin = plot.y_pixel(plot.height);
    var xmax = plot.x_pixel(plot.width);
    var ymax = plot.y_pixel(0);
    var gridx = (xmax - xmin)/40;
    var gridy = gridx;
    var h = (draw_arrows?0.5:0.3) * gridx;

    const lines: Lines = []
  
    for (var x=xmin + 0.5*gridx; x < xmax; x+=gridx) {
      const segments: Segment[] = []
      for (var y=ymin + 0.5*gridy; y < ymax; y+=gridy) {
          var dx = fx(x, y);
          var dy = fy(x, y);
          var s = h/Math.sqrt(dx*dx + dy*dy);
          segments.push([[x,y],[s*dx,s*dy]])
      }
      lines.push({
        type: "segments",
        arrow: draw_arrows,
        segments,
      })
    }
  return lines
}
  
export type OdePlotOptions = {
    draw_arrows: boolean,
    equation: boolean,
    grid_count: number,
    grid_points: [number, number][],
    grid_distance: number,
  }

export function odePlot(plot: Axes, fx: Fun2, fy: Fun2, x0: number, y0: number, options: OdePlotOptions): Lines {
    var xmin = plot.x_pixel(0);
    var ymin = plot.y_pixel(plot.height);
    var xmax = plot.x_pixel(plot.width);
    var ymax = plot.y_pixel(0);
    const dt = plot.radius / Math.sqrt(plot.width*plot.width + plot.height*plot.height);
    //const dt = plot.radius/plot.width;
    const draw_arrows = options &&  options.draw_arrows;
    const equation = options && options.equation;
  
    const lines: Lines = []

    for (let dir=1;dir>=-1;dir-=2) {
      var maxstep = plot.width;
      var x = x0;
      var y = y0;
      const points: Point[] = []
      points.push([x,y])
      for (var step=0;x<=xmax && x>=xmin && y<=ymax && y>=ymin && (step < maxstep || equation); step++) {
        var dx = fx(x, y);
        var dy = fy(x, y);
        if (isNaN(dx) || isNaN(dy)) break;
        var l = dt / Math.sqrt(dx*dx + dy*dy);
        
        // useful with equations like y'=1/cos(y)
        if (equation && Math.abs(dy) > plot.height) break;
  
        if (l>2 && !equation) break;
        var r = dir * l;
        const xx = x + r * dx;
        const yy = y + r * dy;
        dx = 0.5 * (dx + fx(xx,yy));
        dy = 0.5 * (dy + fy(xx,yy));
        x += r * dx;
        y += r * dy;
        points.push([x,y])
        if (options.grid_points && options.grid_distance) {
          var d2 = options.grid_distance * options.grid_distance;
          var grid = options.grid_points;
          for (var i=0; i<grid.length; ++i) {
            var dx = grid[i][0] - x;
            var dy = grid[i][1] - y;
            if (dx*dx + dy*dy <= d2) {
              grid.splice(i,1);
              i--;
            }
          }
        }
      }
      lines.push({
        type: "line",
        closed: false,
        arrows: draw_arrows,
        points,
      })
    }
    return lines
  }
