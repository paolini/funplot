import { Axes, Lines, Line, Point, Segment } from './axes'

export default odePlot

export type Fun2 = (x: number, y: number) => number

export function slopeGraph(plot: Axes, fx: Fun2, fy: Fun2, draw_arrows: boolean, color: string): Line {
    var xmin = plot.x_pixel(0);
    var ymin = plot.y_pixel(plot.height);
    var xmax = plot.x_pixel(plot.width);
    var ymax = plot.y_pixel(0);
    var gridx = (xmax - xmin)/40;
    var gridy = gridx;
    var h = (draw_arrows?0.5:0.3) * gridx;

    const segments: Segment[] = []

    for (var x=xmin + 0.5*gridx; x < xmax; x+=gridx) {
      for (var y=ymin + 0.5*gridy; y < ymax; y+=gridy) {
          var dx = fx(x, y);
          var dy = fy(x, y);
          var s = h/Math.sqrt(dx*dx + dy*dy);
          segments.push([[x,y],[s*dx,s*dy]])
      }
    }
  return {
      type: "segments",
      width: draw_arrows ? 1 : 2,
      color,
      arrow: draw_arrows,
      segments,
    }
}
  
export type OdePlotOptions = {
    draw_arrows: boolean,
    equation: boolean,
    grid_count: number,
    grid_points: [number, number][],
    grid_distance: number,
    color: string,
  }

export function odePlot(plot: Axes, fx: Fun2, fy: Fun2, x0: number, y0: number, options: OdePlotOptions): Line {
    var xmin = plot.x_pixel(0);
    var ymin = plot.y_pixel(plot.height);
    var xmax = plot.x_pixel(plot.width);
    var ymax = plot.y_pixel(0);
    function sqr(x:number) {return x*x}
    const dt = plot.radius / Math.sqrt(sqr(plot.width) + sqr(plot.height))
    //const dt = plot.radius/plot.width;
    const draw_arrows = options &&  options.draw_arrows;
    const equation = options && options.equation;
    
    const points: Point[] = []
    for (let dir=-1;dir<=1;dir+=2) {
      const maxstep = plot.width*10
      let x = x0
      let y = y0

      if (dir>0) points.push([x,y])

      for (var step=0;x<=xmax && x>=xmin && y<=ymax && y>=ymin && (step < maxstep || equation); step++) {
        const dx0 = fx(x, y)
        const dy0 = fy(x, y)

        if (isNaN(dx0) || isNaN(dy0)) break

        const v0 = Math.sqrt(sqr(dx0) + sqr(dy0))
        const l0 = dt / v0

//        if (l>1.1) break
        
        const xx = x + dir * l0 * dx0
        const yy = y + dir * l0 * dy0
        const dx1 = fx(xx,yy)
        const dy1 = fy(xx,yy)

        if (isNaN(dx1) || isNaN(dy1)) break

        const dx = 0.5 * (dx0 + dx1)
        const dy = 0.5 * (dy0 + dy1)

        const v = Math.sqrt(sqr(dx) + sqr(dy))
        const l = dt / v

        // useful with equations like y'=1/cos(y)
        if (equation && dy0*dy1 < - sqr(dt)) {
          break
        }

        // detect stationary points
        if (!equation && v<2*dt) break
  
        x += dir * l * dx;
        y += dir * l * dy;

        if (!equation && points.length>10 && sqr(x-points[0][0])+sqr(y-points[0][1])<sqr(2*dt)) {
          // curve has closed
          break
        }
        
        points.push([x,y])

        if (options.grid_points && options.grid_distance) {
          var d2 = options.grid_distance * options.grid_distance;
          var grid = options.grid_points;
          for (var i=0; i<grid.length; ++i) {
            let dx = grid[i][0] - x;
            let dy = grid[i][1] - y;
            if (dx*dx + dy*dy <= d2) {
              grid.splice(i,1);
              i--;
            }
          }
        }
      }
      if (dir < 0) points.reverse()
    }

    return {
      type: "line",
      color: options.color,
      width: 1,
      closed: false,
      arrows: draw_arrows,
      points,
    }
  }
