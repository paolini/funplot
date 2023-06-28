'use client'
import {useState } from 'react'
import { HexColorPicker } from "react-colorful"
import assert from 'assert'
import 'katex/dist/katex.min.css'
import TeX from '@matejmazur/react-katex'

import { ContextWrapper } from '@/lib/plot'
import { get, set, getField, update, map, extract, onChange, onChangeBoolean, State, SetState } from '@/lib/State'
import Coords from '@/lib/Coords'
import Canvas from '@/components/Canvas'
import { FigureState, GraphFigureState, ImplicitFigureState, OdeEquationFigureState, OdeSystemFigureState, figure, Figure } from '@/lib/figures'

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

function newFigureState(value: string): FigureState { 
    switch(value) {
        case 'graph': return {
            type: 'graph',
            inverted: false,
            color: '#f00',
            expr: 'x*sin(1/x)',   
        }
        case 'graph_inverted': return {
            type: 'graph',
            inverted: true,
            color: '#0f0',
            expr: 'y^2',  
        }
        case 'implicit': return {
            type: 'implicit',
            color: '#00f',
            expr: 'x^4-x^2+y^2',
        }
        case 'ode_equation': return {
            type: 'ode',
            color: "#4A90E2",
            slopeColor: "#7ED321",
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
            drawSlope: false,
            drawArrows: true,
            gridPoints: true,
            gridCount: 20,
            points: [],
        }
    }
    assert(false,`invalid figure type ${value}`)
}

export default function Funplot() {
    const coordsPair = useState<Coords>({x: NaN, y: NaN})
    const panelsPair = useState<IPanel[]>([])

    const figures = get(panelsPair).map(p => figure(p.figure))

    function newPanel(value: string) {
        const fig = newFigureState(value)
        update(panelsPair, panels => [...panels, {
            figure: fig,
            key: Math.random().toString(36).substring(7),
            active: true,
        }])
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
      <h1 className="">Funplot</h1>
      <div className="block">
        { panelElements() }
        <select value="" className="border" onChange={evt => newPanel(evt.target.value)}>
            <option value="">new plot</option>
            <option value="graph">graph y=f(x)</option>
            <option value="graph_inverted">graph x=f(y)</option>
            <option value="implicit">level curve f(x,y)=0</option>
            <option value="ode_equation">ODE equation</option>
            <option value="ode_system">ODE system</option>
        </select>
      </div>
      <div className="block">    
        <span>x={get(coordsPair).x}</span>, <span>y={get(coordsPair).y}</span>
      </div>
      <div className="flex-1 border-2 border-black h-8 bg-white">  
        <Canvas plot={plot} coords={coordsPair} click={click}/>
      </div>
    </main>
}

function GraphPanel({state, figure, active}: 
    {
        state: State<GraphFigureState>,
        figure: Figure,
        active: State<boolean>,
    }) {
    const color = getField(state,'color')
    const expr: State<string> = getField(state, 'expr')

    return <PanelBand tex={figure.tex} color={color} active={active}>
        <div className="flex flex-row px-2 items-center">
            <span>{get(state).inverted?'x=f(y)=':'y=f(x)='}</span>
            <Input expr={expr} />
        </div>
    </PanelBand>
  }

function ImplicitPanel({state, figure, active}: 
    {
        state: State<ImplicitFigureState>,
        figure: Figure,
        active: State<boolean>
    }) {
    const color = getField(state,'color')
    const expr: State<string> = getField(state, 'expr')

    return <PanelBand color={color} active={active} tex={figure.tex}>
        <span>y(x)=</span>
        <Input expr={expr} />
    </PanelBand>
  }

function OdeEquationPanel({state, figure, active}: 
    {
        state: State<OdeEquationFigureState>,
        figure: Figure,
        active: State<boolean>
    }) {
    const color = getField(state,'color')
    const expr: State<string> = getField(state, 'expr')
    const drawSlope: State<boolean> = getField(state, 'drawSlope')
    const gridPoints: State<boolean> = getField(state, 'gridPoints') 

    return <PanelBand active={active} tex={figure.tex} color={color}>
        <Checkbox value={drawSlope}>draw slope field</Checkbox>
        <Checkbox value={gridPoints}>fill plane</Checkbox>
        <Separator />
        <span>y' = </span>
        <Input expr={expr}/>
    </PanelBand>
  }

  function OdeSystemPanel({state, figure, active} : {
        state: State<OdeSystemFigureState>,
        figure: Figure,
        active: State<boolean>
    }) {
    const color = getField(state,'color')
    const exprX: State<string> = getField(state, 'exprX')
    const exprY: State<string> = getField(state, 'exprY')
    const drawSlope: State<boolean> = getField(state, 'drawSlope')
    const gridPoints: State<boolean> = getField(state, 'gridPoints') 

    return <PanelBand active={active} tex={figure.tex} color={color}>
        <Checkbox value={drawSlope}>draw slope field</Checkbox>
        <Checkbox value={gridPoints}>fill plane</Checkbox>
        <Separator />
        <div className="grid grid-cols-4 grid-rows-2 auto-cols-min">
            <div className="text-right">
                x' = f(x,y) 
            </div>
            <div className="col-span-3">
                = <Input expr={exprX} />
            </div>
            <div className="text-right">
                y' = g(x,y) 
            </div>
            <div className="col-span-3">
                = <Input expr={exprY} />
            </div>
        </div>
    </PanelBand>
  }

function PanelBand({active, color, children, tex}:{
    active: State<boolean>,
    color: State<string>,
    tex: string
    children: any,
}) {
    return <div className="flex flex-row items-center">
        <ColorBlock color={color} active={active}/>
        <Formula tex={tex} active={active}/>
        {get(active) && <Separator />}
        {get(active) && children}
    </div>
}

function ColorBlock({color, active, className}:{
    color: State<string>,
    active: State<boolean>,
    className?: string,
}) {
    const open = useState<boolean>(false)
    return <div className="inline h-full">
        <div 
            className={(className||"") + " w-5 h-5 rounded m-1"} 
            style={{background: get(color)}}
            onClick={() => (get(active)?update(open, open => !open):set(active, true))}
        />
        {get(active) && get(open) && <HexColorPicker 
            className=""
            color={get(color)} 
            onChange={_ => set(color, _)} 
            />}
    </div>
}

function Formula({tex,active}:{
    tex: string,
    active: State<boolean>
}) {
    if (get(active)) return <TeX 
            className="px-1 hover:bg-blue-300 border border-blue-200 hover:border-blue-400 rounded" 
            math={tex} 
            onClick={() => set(active, false)}
            block />
    else return <TeX 
            className="hover:bg-blue-300 hover:border rounded" 
            math={tex} 
            onClick={() => set(active, true)}
        />
}

function Input({expr}: {expr: State<string>}){
    return <input className="h-8 border p-1 bg-blue-100" type="text" value={get(expr)} onChange={onChange(expr)} />
}

function Checkbox({value, children}:{
    value: State<boolean>,
    children: any,
}) {
    return <label className="flex flex-row items-center mx-1">
        <input className="mr-1" type="checkbox" checked={get(value)} onChange={onChangeBoolean(value)} />
        {children}
    </label>
}

function Separator() {
    return <div className="m-1 h-10 border-r-2 border-blue-400" />
}