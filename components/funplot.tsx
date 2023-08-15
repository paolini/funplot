'use client'
import { useState, useEffect } from 'react'
import assert from 'assert'
import { jsPDF } from 'jspdf'

import { context } from '@/lib/plot'
import { ContextWrapper } from '@/lib/plot'
import { get, set, getField, update, map, extract, State, } from '@/lib/State'
import Coords from '@/lib/Coords'
import Canvas from '@/components/Canvas'
import { FigureState, GraphFigureState, ImplicitFigureState, OdeEquationFigureState, OdeSystemFigureState, ParameterState, createFigure } from '@/lib/figures'
import { GraphPanel, ImplicitPanel, OdeEquationPanel, OdeSystemPanel, ParameterPanel } from '@/components/panels'
import { Axes } from '@/lib/plot'
import Messages, { IMessage } from './Messages'
import { Lines } from '@/lib/axes'

export default function Funplot() {
    const axes = useState<Axes>({x: 0, y: 0, r: 5})
    const panelsPair = useState<IPanel[]>([])
    const messages = useState<IMessage[]>([])
    const [pending, setPending] = useState<{timeout: NodeJS.Timeout|null}>({timeout: null})
    const [lines, setLines] = useState<Lines>([])
    const updateCount = useState<number>(1)
    const drawCount = useState<number>(0)
    const cursor = useState<Coords>({x:0, y:0})
    const width = useState<number>(0)
    const height = useState<number>(0)

    useEffect(() => {
        console.log("loadFromHash")
        loadFromHash()
    }, [])

    const parameterList: string[] = get(panelsPair)
        .map(panel => panel.figure)
        .filter((figure: FigureState): figure is ParameterState => figure.type === 'parameter')
        .map(f => f.name)

    const figures = get(panelsPair).map(p => createFigure(p.figure, parameterList))

    useEffect(() => {
        console.log("changed!")
        update(updateCount, count => count+1)
    }, [get(axes),get(panelsPair)])

    return <main className="flex flex-col flex-1 bg-blue-200">
      <div className="block">
        <div className="flex flex-row">
            <span className="font-bold mx-1">FunPlot</span>
            <select value="" className="border mx-1" onChange={evt => newPanel(evt.target.value)}>
                <option value="" disabled={true}>choose plot type</option>
                <option value="graph">graph y=f(x)</option>
                <option value="graph_inverted">graph x=f(y)</option>
                <option value="implicit">level curve f(x,y)=0</option>
                <option value="ode_equation">ODE equation</option>
                <option value="ode_system">ODE system</option>
                <option value="" disabled={true}>-------</option>
                <option value="parameter">new parameter</option>
            </select>
            <select value="" className="border mx-1" onChange={evt => performAction(evt.target.value)}>
                <option value="">choose action</option>
                <option value="pdf">export PDF</option>
                <option value="share">share link</option>
            </select>
            <span>x={get(cursor).x}</span>, <span>y={get(cursor).y}</span>
        </div>
        { panelElements() }
        <Messages messages={messages} />
      </div>
      <div className="flex-1 border-2 border-black h-8 bg-white">  
        <Canvas 
            axes={axes}
            plot={plot} 
            click={click}
            move={pos => set(cursor,pos)}
            resize={(w,h) => {set(width, w);set(height, h)}}
        />
      </div>
    </main>

    function newPanel(value: string) {
        const fig = newFigureState(((type):Options => {
            switch (type) {
                case 'graph': return {
                    t: 'graph',
                    i: false,
                    c: '#f00',
                    e: 'x*sin(1/x)',
                }
                case 'graph_inverted': return {
                    t: 'graph',
                    i: true,
                    c: '#0f0',
                    e: 'y^2',
                }
                case 'implicit': return {
                    t: 'implicit',
                    c: '#00f',
                    e: 'x^4-x^2+y^2',
                }
                case 'ode_equation': return {
                    t: 'ode_equation',
                    c: "#4A90E2",
                    sc: "#7ED321",
                    e: "y^2+x",
                    ds: false,
                    gp: true,
                    l: [],
                }
                case 'ode_system': return {
                    t: 'ode_system',
                    ex: "y",
                    ey: "-sin(x)-y",
                    c: "#4A90E2",
                    sc: "#7ED321",
                    ds: false,
                    da: true,
                    gp: true,
                    l: [],
                }
                case 'parameter': return {
                    t: 'parameter',
                    n: 'c',
                    e: '1',
                }
            }
            assert(false,`invalid figure type ${type}`)
        })(value))
        update(panelsPair, panels => [...panels, {
            figure: fig,
            key: Math.random().toString(36).substring(7),
            active: true,
        }])
    }

    function performAction(value: string) {
        switch(value) {
            case 'pdf':
                exportPdf(get(axes), get(width), get(height), lines)
                break
            case 'share':
                const panels = get(panelsPair)
                const opt = {
                    p: get(axes),
                    l: panels.map(panelToOptions),
                }
                const hash = encodeURIComponent(JSON.stringify(opt))
                window.location.hash = `#q=${hash}`
                // copy to clipboard
                const el = document.createElement('textarea')
                el.value = window.location.href
                document.body.appendChild(el)
                el.select()
                document.execCommand('copy')
                document.body.removeChild(el)
                update<IMessage[]>(messages, messages => [...messages, {
                    type: 'info',
                    message: 'link copied to clipboard',
                    }])
                break
        }
    }           

    async function plot(ctx: ContextWrapper) {
        console.log('plot!')
        draw(ctx, lines)
        if (get(updateCount)!==get(drawCount)) {
            if (pending.timeout) clearTimeout(pending.timeout)
            pending.timeout = setTimeout(async () => {
                console.log('recompute')
                let mylines: Lines = []
                const parameters = Object.fromEntries(parameterList.map(p => [p,0]))

                // set parameters
                for(const figure of figures) {
                    figure.eval(parameters)
                }

                // plot
                for(const figure of figures) {
                    mylines = mylines.concat(await figure.plot(ctx, parameters))
                }
                setLines(mylines)
                set(drawCount, get(updateCount))
            }, 100)
        }
    }

    function click(coords: Coords) {
        const panelPairs: State<IPanel>[] = map(panelsPair, panel => panel)
        const figurePairs: State<FigureState>[] = panelPairs.map(panel => getField(panel, 'figure'))
        assert(figures.length === panelPairs.length)
        assert(figures.length === figurePairs.length)
        figures.forEach((figure,i) => {
            if (get(panelPairs[i]).active) {
                figure.click(getField(panelPairs[i],'figure'), coords)
            }
        })
    }

    function loadFromHash() {
        let hash = window.location.hash;
        if (hash.substring(0,3) !== "#q=") return;
        hash = hash.substring(3);
        hash = decodeURIComponent(hash);
        const opt = JSON.parse(hash);
        console.log('hash:', opt)
        set(axes, opt.p)
        const figures: FigureState[] = opt.l.map((params: Options) => newFigureState(params))
        set(panelsPair, figures.map(figure => ({
            figure: figure,
            key: Math.random().toString(36).substring(7),
            active: true,
        })))
    }

    function panelElements() {
        const [panels, setPanels] = panelsPair
        assert(panels.length === figures.length)

        function move(figure: FigureState, n: number) {
            if (n === 0) {
                setPanels(panels => panels.filter(p => p.figure !== figure))
            } else {
                const i = panels.findIndex(p => p.figure === figure)
                const j = i + n
                if (j < 0 || j >= panels.length) return
                const newPanels = [...panels]
                const tmp = newPanels[i]
                newPanels[i] = newPanels[j]
                newPanels[j] = tmp
                setPanels(newPanels)
            }
        }

        return panels.map((panel,i) => {
            const state: FigureState = panel.figure
            const active = getField(extract(panelsPair, panel),'active')
            switch(state.type) {
                case 'graph':
                    return <GraphPanel 
                            key={panel.key} 
                            state={extractFigurePairFromPanels<GraphFigureState>(panelsPair, state)}
                            figure={figures[i]}
                            active={active}
                            move={move}
                    />
                case 'implicit':
                    return <ImplicitPanel 
                            key={panel.key} state={extractFigurePairFromPanels<ImplicitFigureState>(panelsPair, state)}
                            figure={figures[i]}
                            active={active}
                            move={move}
                    />
                case 'ode':
                    return <OdeEquationPanel key={panel.key} state={extractFigurePairFromPanels<OdeEquationFigureState>(panelsPair, state)}
                            figure={figures[i]}
                            active={active}
                            move={move}
                        />
                case 'system':
                    return <OdeSystemPanel key={panel.key} state={extractFigurePairFromPanels<OdeSystemFigureState>(panelsPair, state)}
                            figure={figures[i]}
                            active={active}
                            move={move}
                        />
                case 'parameter':
                    return <ParameterPanel key={panel.key} state={extractFigurePairFromPanels<ParameterState>(panelsPair, state)}
                        figure={figures[i]}
                        active={active}
                        move={move}
                        />
            }
        })
    }
}

type IPanel = {
    key: string,
    figure: FigureState,
    active: boolean,
}

// construct the setFigure function
// from the setPanels function
function extractFigurePairFromPanels<FigureType extends FigureState>(panelsPair: State<IPanel[]>, figure: FigureType): State<FigureType> {
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

type GraphOptions = {
    t: 'graph',
    i: boolean, // inverted
    e: string, // expr
    c: string, // color
}

type ImplicitOptions = {
    t: 'implicit',
    e: string, // expr
    c: string, // color
}

type OdeEquationOptions = {
    t: 'ode_equation',
    e: string, // expr
    c: string, // color
    sc: string, // slope_color
    ds: boolean, // draw_slope
    gp: boolean, // grid_points
    l: [number,number][], // points
}

type OdeSystemOptions = {
    t: 'ode_system',
    ex: string, // expr
    ey: string, // expr
    da: boolean, // draw_arrows
    c: string, // color
    sc: string, // slope_color
    ds: boolean, // draw_slope
    gp: boolean, // grid_points
    l: [number,number][], // points
}

type ParameterOptions = {
    t: 'parameter',
    e: string, // expr
    n: string, // name
}

type Options 
    = GraphOptions 
    | ImplicitOptions 
    | OdeEquationOptions 
    | OdeSystemOptions 
    | ParameterOptions

function newFigureState(opts: Options): FigureState { 
    switch(opts.t) {
        case 'graph': return {
            type: 'graph',
            inverted: opts.i,
            color: opts.c,
            expr: opts.e,   
        }
        case 'implicit': return {
            type: 'implicit',
            color: opts.c,
            expr: opts.e,
        }
        case 'ode_equation': return {
            type: 'ode',
            color: opts.c,
            slopeColor: opts.sc,
            expr: opts.e,
            drawSlope: false,
            gridPoints: true,
            gridCount: 20,
            points: [],
        }
        case 'ode_system': return {
            type: 'system',
            exprX: opts.ex,
            exprY: opts.ey,
            color: opts.c,
            slopeColor: opts.sc,
            drawSlope: opts.ds,
            drawArrows: opts.da,
            gridPoints: opts.gp,
            gridCount: 20,
            points: opts.l.map(([x,y]) => ({x,y})),
        }
        case 'parameter': return {
            type: 'parameter',
            expr: opts.e,
            name: opts.n,
        }
    }
}

function panelToOptions(panel: IPanel): Options {
    const state = panel.figure
    switch(state.type) {
        case 'graph': return {
            t: 'graph',
            i: state.inverted,
            c: state.color,
            e: state.expr,
        }
        case 'implicit': return {
            t: 'implicit',
            c: state.color,
            e: state.expr,
        }
        case 'ode': return {
            t: 'ode_equation',
            c: state.color,
            sc: state.slopeColor,
            e: state.expr,
            ds: state.drawSlope,
            gp: state.gridPoints,
            l: state.points.map(p => [p.x,p.y]),
        }
        case 'system': return {
            t: 'ode_system',
            ex: state.exprX,
            ey: state.exprY,
            c: state.color,
            sc: state.slopeColor,
            ds: state.drawSlope,
            da: state.drawArrows,
            gp: state.gridPoints,
            l: state.points.map(p => [p.x,p.y]),
        }
        case 'parameter': return {
            t: 'parameter',
            e: state.expr,
            n: state.name,
        }
    }
}

function plotLines(plot: ContextWrapper, lines: Lines) {
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

function draw(ctx: ContextWrapper, lines: Lines) {
    ctx.clear()
    ctx.drawAxes()
    plotLines(ctx, lines)
}

function exportPdf(axes: Axes, width: number, height: number, lines: Lines) {
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

