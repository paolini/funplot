import { Point, Picture } from "./picture"
import { AxesWrapper } from "./plot"

export function plotRecurrence(plot: AxesWrapper, func: (x: number) => number, start: number, color: string): Picture {
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
  
export function plotBifurcation(fun:(x:number,c:number)=>number,c0:number,c1:number,cn:number,x0:number,x1:number,xn:number): Picture {
  console.log(`plot bifurcation`)
  const picture: Picture = [{
    type: "line",
    color: "#ff0000",
    width: 5,
    closed: false,
    arrows: false,
    points: [
      [c0,x1],
      [0.5*(c0+c1),0.5*(x0+x1)],
      [c1,x1],
    ]
  }]
  const lines:[number,number][][]=[]
  let active_lines:[number,number][][]=[]
  const cstep=(c1-c0)/cn
  const xstep=(x1-x0)/xn
  const xgrid = Array(xn)
  xgrid.forEach((x,i)=>{xgrid[i]=x0+i*xstep})
  for (let c=c0;c<=c1;c+=cstep) {
    let xset: number[] = []
    let last_x:number=0.0
    let len = 0
    for (let x of xgrid) {
      let xx=x
      let i=0
      for (;i<10 && Math.abs(xx-x)<xstep;++i) {
        xx=fun(xx,c)
      }
      if (i<10) continue
      if (len>0 && Math.abs(xx-last_x)<0.5*xstep) continue
      if (len>0 && x<last_x) continue // rispetta ordinamento! 
      xset.push(xx)
      last_x=xx
      len++
    }
    console.log(`c=${c} => ${JSON.stringify(xset)}`)
      // collega xset alle linee esistenti
    let count = 0
    active_lines = active_lines.filter(line => {
      const [last_c,last_x] = line[line.length-1]
      for (let xx of xset) {
        if (Math.abs(last_x-xx)>2.0*xstep) {
          // estendi linea
          line.push([c,xx])
          if (count>0) return false // giunzione
          count++
          return true
        }
      }
    })}
  return picture
}