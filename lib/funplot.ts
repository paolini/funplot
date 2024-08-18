import { jsPDF } from 'jspdf'

import { context } from '@/lib/plot'
import { FigureState } from '@/lib/figures'
import { State, } from '@/lib/State'
import { ContextWrapper, Axes } from '@/lib/plot'
import { Picture } from '@/lib/picture'


export type IPanel = {
    key: string,
    figure: FigureState,
    active: boolean,
}

// construct the setFigure function
// from the setPanels function
export function extractFigurePairFromPanels<FigureType extends FigureState>(panelsPair: State<IPanel[]>, figure: FigureType): State<FigureType> {
    const [panels, setPanels] = panelsPair
    function setFigure(cb: (old: FigureType) => FigureType) {
        setPanels(panels => panels.map((p: IPanel) => {
            if (p.figure === figure) {
                const newPanel: IPanel = {...p, figure: cb(figure)}
                return newPanel
            } else {
                return p
            }
        }))
    }
    return [figure, setFigure]
}

const DEFAULT_FIGURE: {
    [key: string]: FigureState,
        } = {
    'graph': {
        type: 'graph',
        inverted: false,
        color: '#f00',
        expr: 'x*sin(1/x)',
    },
    'graph_inverted': {
        type: 'graph',
        inverted: true,
        color: '#0f0',
        expr: 'y^2',
    },
    'implicit': {
        type: 'implicit',
        color: '#00f',
        expr: 'x^4-x^2+y^2',
    },
    'ode': {
        type: 'ode',
        color: "#4A90E2",
        slopeColor: "#7ED321",
        expr: "y^2+x",
        drawSlope: false,
        gridPoints: true,
        gridCount: 20,
        points: [],
    },
    'system': {
        type: 'system',
        exprX: "y",
        exprY: "-sin(x)-y",
        color: "#4A90E2",
        slopeColor: "#7ED321",
        drawSlope: false,
        drawArrows: true,
        gridPoints: true,
        gridCount: 20,
        points: [],
    },
    'recurrence': {
        type: 'recurrence',
        expr: 'cos(x)',
        graphColor: "#0000ff",
        webColor: "#f99f03",
        start: NaN,
    },
    'parameter': {
        type: 'parameter',
        name: 'c',
        expr: '1',
        min: 0.0,
        max: 1.0,
    },
}

export function newPanel(value: string|FigureState) {
    const figure: FigureState = typeof(value)==='string' 
        ? DEFAULT_FIGURE[value] 
        : value
    return {
        figure,
        key: Math.random().toString(36).substring(7),
        active: true,
    }
}

function plotLines(plot: ContextWrapper, lines: Picture) {
    const arrow_step = 80

    lines.forEach(line => {
      if (line.type === "line") {
        plot.ctx.strokeStyle = line.color
        plot.ctx.lineWidth = line.width
        plot.ctx.beginPath()
        line.points.forEach(([x,y], i) => {
          if (i === 0) plot.moveTo(x,y)
          else plot.lineTo(x,y)
        })
        if (line.closed) plot.ctx.closePath()
        plot.ctx.stroke()
        if (line.arrows) {
            for (let i=arrow_step;i<line.points.length;i+=2*arrow_step) {
                const [x, y] = line.points[i]
                const [xx, yy] = line.points[i-1]
                plot.drawArrowHead(x,y, x-xx,y-yy)
            }
        }
      } else if (line.type === "squares") {
        line.squares.forEach(([[x,y],[dx,dy]]) => {
          plot.ctx.beginPath()
          plot.moveTo(x, y)
          plot.lineTo(x+dx,y)
          plot.lineTo(x+dx,y+dy)
          plot.lineTo(x,y+dy)
          plot.ctx.closePath()
          plot.ctx.stroke()
        })
        plot.ctx.strokeStyle = "#0ff"
      } else if (line.type === "segments") {
        plot.ctx.strokeStyle = line.color
        plot.ctx.lineWidth = line.width
        line.segments.forEach(([[x,y],[dx,dy]]) => {
            plot.ctx.beginPath()
            plot.moveTo(x,y)
            plot.lineTo(x+dx,y+dy)
            plot.ctx.stroke()
            if (line.arrow) plot.drawArrowHead(x+dx,y+dy, dx,dy)
        })
      }
    })
  }  

export function draw(ctx: ContextWrapper, lines: Picture) {
    ctx.clear()
    ctx.ctx.lineWidth = 1
    ctx.drawAxes({labels:{x:'x',y:'y'}})
    plotLines(ctx, lines)
}

export function exportPdf(axes: Axes, width: number, height: number, lines: Picture) {
//    const width = canvas?.width || 640 
//    const height = canvas?.height || 480
    const filename = 'funplot.pdf'
    console.log(`export Pdf ${width}x${height}`)
    const margin = 10
    const doc = new jsPDF({
        unit: 'pt',
        format: [width+2*margin, height+2*margin],
        orientation: (height > width ? 'p' : 'l')
      })
    doc.setLineJoin('rounded');
    //  doc.line(20, 20, 60, 20) // horizontal line
    //  doc.setLineWidth(0.5)
  
    const c = doc.context2d
    c.autoPaging = false
    console.log("autopaging: " + c.autoPaging)
    //ctx.lineWidth = 1.0;
    doc.setFontSize(10)
    c.translate(margin, margin);
    c.scale(1.0,1.0);
    // doc.save("test.pdf")
    const myctx = context(axes, width, height, c)
    draw(myctx, lines)        
    doc.save(filename)
  }

