import { Point, Lines } from "./lines"
import { AxesWrapper } from "./plot"

export function plotRecurrence(plot: AxesWrapper, func: (x: number) => number, start: number, color: string): Lines {
    var x = start
    var y = 0

    let points: Point[] = []
    let strongPoints: Point[] = []

    let lines: Lines = [{
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
  