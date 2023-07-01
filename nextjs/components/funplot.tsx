'use client'
import { useState, useEffect } from 'react'
import assert from 'assert'

import { ContextWrapper } from '@/lib/plot'
import { get, set, getField, update, map, extract, State, } from '@/lib/State'
import Coords from '@/lib/Coords'
import Canvas from '@/components/Canvas'
import { FigureState, GraphFigureState, ImplicitFigureState, OdeEquationFigureState, OdeSystemFigureState, figure, } from '@/lib/figures'
import { GraphPanel, ImplicitPanel, OdeEquationPanel, OdeSystemPanel } from '@/components/panels'
import { Axes } from '@/lib/plot'

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

type Options = GraphOptions | ImplicitOptions | OdeEquationOptions | OdeSystemOptions

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
            expr: "y^2+x",
            drawSlope: false,
            gridPoints: true,
            gridCount: 20,
            points: [],
        }
        case 'ode_system': return {
            type: 'system',
            exprX: "y",
            exprY: "-sin(x)-y",
            color: "#4A90E2",
            slopeColor: "#7ED321",
            drawSlope: opts.ds,
            drawArrows: opts.da,
            gridPoints: opts.gp,
            gridCount: 20,
            points: opts.l.map(([x,y]) => ({x,y})),
        }
    }
}

export default function Funplot() {
    const axes = useState<Axes>({x: 0, y: 0, r: 5})
    const panelsPair = useState<IPanel[]>([])

    useEffect(() => {
        loadFromHash()
    }, [])

    const figures = get(panelsPair).map(p => figure(p.figure))
    const info = { x:0,y:0,height:0,width:0, exportPdf: () => {} }

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
                if (info.exportPdf) info.exportPdf()
                break
        }
    }

    function plot(ctx: ContextWrapper) {
        console.log('plot!')
        ctx.clear()
        ctx.drawAxes()
        figures.forEach(figure => figure.plot(ctx))
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
                    />
                case 'implicit':
                    return <ImplicitPanel 
                            key={panel.key} state={extractFigurePairFromPanels<ImplicitFigureState>(panelsPair, state)}
                            figure={figures[i]}
                            active={active}
                    />
                case 'ode':
                    return <OdeEquationPanel key={panel.key} state={extractFigurePairFromPanels<OdeEquationFigureState>(panelsPair, state)}
                        figure={figures[i]}
                        active={active}
                        />
                case 'system':
                    return <OdeSystemPanel key={panel.key} state={extractFigurePairFromPanels<OdeSystemFigureState>(panelsPair, state)}
                        figure={figures[i]}
                        active={active}
                        />
            }
        })
    }

    return <main className="flex flex-col flex-1 bg-blue-200">
      <div className="block">
        <div className="flex flex-row">
            <span className="font-bold mx-1">FunPlot</span>
            <select value="" className="border mx-1" onChange={evt => newPanel(evt.target.value)}>
                <option value="">choose plot type</option>
                <option value="graph">graph y=f(x)</option>
                <option value="graph_inverted">graph x=f(y)</option>
                <option value="implicit">level curve f(x,y)=0</option>
                <option value="ode_equation">ODE equation</option>
                <option value="ode_system">ODE system</option>
            </select>
            <select value="" className="border mx-1" onChange={evt => performAction(evt.target.value)}>
                <option value="">choose action</option>
                <option value="pdf">export PDF</option>
            </select>
            <span>x={info.x}</span>, <span>y={info.y}</span>
        </div>
        { panelElements() }
      </div>
      <div className="flex-1 border-2 border-black h-8 bg-white">  
        <Canvas 
            axes={axes}
            plot={plot} 
            click={click}
            info={info}
        />
      </div>
    </main>
}

