'use client'
import {useState } from 'react'
import { HexColorPicker } from "react-colorful"
import assert from 'assert'

import { ContextWrapper } from '@/lib/plot'
import { get, set, getField, update, map, extract, onChange, State, SetState } from '@/lib/State'
import Coords from '@/lib/Coords'
import Canvas from '@/components/Canvas'
import { FigureState, GraphFigureState, ImplicitFigureState, figure } from '@/lib/figures'

interface IPanel {
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

function newState(value: string): FigureState { 
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
        const fig = newState(value)
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
    }

    function panelElements() {
        const [panels, setPanels] = panelsPair
        return panels.map(panel => {
            const figure: FigureState = panel.figure
            switch(figure.type) {
                case 'graph':
                    return <GraphPanel key={panel.key} state={extractFigurePairFromPanels<GraphFigureState>(panelsPair, figure)} active={panel.active}/>
                case 'implicit':
                    return <ImplicitPanel key={panel.key} state={extractFigurePairFromPanels<ImplicitFigureState>(panelsPair, figure)} active={panel.active}/>
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

function GraphPanel({state, active}: 
    {
        state: State<GraphFigureState>,
        active: boolean
    }) {
    const color = getField(state,'color')
    const expr: State<string> = getField(state, 'expr')

    if (active) return <div className="flex flex-row">
        <ColorBlock color={color} active={active}/>
        <span>f(x,y)=</span>
        <input type="text" className="border" value={get(expr)} onChange={onChange(expr)} />
        <span>=0</span>
    </div>
    else return <div>
        <ColorBlock color={color} active={active}/>
        <span>{get(expr)}=0</span>
    </div>
    /*
    <br/><button @click="edit">edit</button>' +
    <span class="color_button" :style="\'background-color: \' + plot_color.hex"></span>' +
    </div>' +
    <p class="formula_pane" @click="edit" v-html="formula_html"></p>' +
    </div>',
    </>
    */
  }

function ImplicitPanel({state, active}: 
    {
        state: State<ImplicitFigureState>,
        active: boolean
    }) {
    const color = getField(state,'color')
    const expr: State<string> = getField(state, 'expr')

    if (active) return <div className="flex flex-row">
        <ColorBlock color={color} active={active}/>
        <span>y(x)=</span>
        <input type="text" className="border" value={get(expr)} onChange={onChange(expr)} />
    </div>
    else return <div>
        <ColorBlock color={color} active={active}/>
        <span>y(x)={get(expr)}</span>
    </div>
    /*
    <br/><button @click="edit">edit</button>' +
    <span class="color_button" :style="\'background-color: \' + plot_color.hex"></span>' +
    </div>' +
    <p class="formula_pane" @click="edit" v-html="formula_html"></p>' +
    </div>',
    </>
    */
  }

function ColorBlock({color, active}:{
    color: State<string>,
    active: boolean
}) {
    const open = useState<boolean>(false)
    return <div className="inline">
        <div 
            className="w-5 h-5 rounded" 
            style={{background: get(color)}}
            onClick={() => (active && update(open, open => !open))}
        />
        {active && get(open) && <button className="border rounded" onClick={() => set(open,false)}>close</button> }
        {active && get(open) && <HexColorPicker 
            className=""
            color={get(color)} 
            onChange={_ => set(color, _)} 
            />}
    </div>
}