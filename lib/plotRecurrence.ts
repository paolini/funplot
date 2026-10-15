import { Point, Picture } from "./picture"
import { AxesWrapper } from "./plot"

export function plotRecurrence(plot: AxesWrapper, func: (x: number) => number, start: number, color: string): Picture {
    if (!Number.isFinite(start)) return []
    var x = start
    var y = 0

    let points: Point[] = []
    let strongPoints: Point[] = []

    let lines: Picture = [{
        type: "line",
        color,
        width: 1,
        closed: false,
        arrows: false,
        points: points
    },{
        type: "line",
        color,
        width: 4,
        closed: false,
        arrows: false,
        points: strongPoints
    }]

    points.push([x,y])

    for(let i=0;i<100;++i) {
      y = func(x)
      if (typeof y !== 'number' || !Number.isFinite(y)) break
      if (i<90) {
        points.push([x,y])
        points.push([y,y])
      } else {
        strongPoints.push([x,y])
        strongPoints.push([y,y])
      }
      x = y
    }
    return lines
  }
  
/** Sample exactly one parameter value. Never sweep or connect distinct orbits. */
export function plotBifurcation(fun: (x: number) => unknown, parameter: number,
    start: number, color: string, transient = 1000, iterations = 200): Picture {
  const points: Point[] = []
  if (!Number.isFinite(parameter) || !Number.isFinite(start)) return []
  const seen = new Set<number>()
  let x = start
  for (let i = 0; i < transient + iterations; i++) {
    const next = fun(x)
    // Divergent and complex orbits have no finite real attractor to display.
    if (typeof next !== 'number' || !Number.isFinite(next)) return []
    x = next
    if (i >= transient && !seen.has(x)) {
      seen.add(x)
      points.push([parameter, x])
    }
  }
  return [{type: 'points', color, points}]
}
