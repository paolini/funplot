'use client'
import {useState } from 'react'
import { HexColorPicker } from "react-colorful"
import { compile, parse } from 'mathjs'

import { ContextWrapper } from '@/lib/plot'
import funGraph from '@/lib/funGraph'
import { get, set, getField, update, map, onChange, State } from '@/lib/State'
import Coords from '@/lib/Coords'
import Canvas from '@/components/Canvas'

interface GraphFigureState {
    type: 'graph'
    color: string
    inverted: boolean
    expr: string
}

type FigureState = GraphFigureState

interface Figure {
    state: FigureState
    plot: (ctx: ContextWrapper) => void
    htmlElement: React.ReactElement
}

function figure(state: FigureState): Figure {
    switch(state.type) {
        case 'graph':
            return graphFigure(state)
        default:
            return errorFigure(state, `unknown figure type ${state.type}`)
    }
}

function errorFigure(state: FigureState, error: string): Figure {
    return {
        state,
        plot: (ctx: ContextWrapper) => {},
        htmlElement: <span className="error">{error}</span>
    }
}

function graphFigure(state: GraphFigureState): Figure {
    let fun: ((x:number) => number) | null = null
    let errors: string[] = []
    let formulaHtml = ''
    try {
        const compiledExpr = compile(state.expr)
        if (state.inverted) {
            fun = y => compiledExpr.evaluate({y})
        } else {
            fun = x => compiledExpr.evaluate({x})
        }
    } catch(e) {
        errors.push(`${e}`)
    }
    try {
        formulaHtml = `$$ ${state.inverted ? 'x' : 'y'} = ${parse(state.expr).toTex()} $$`
        // MathJax.Hub.Queue(["Typeset", MathJax.Hub])
    } catch(e) {
        errors.push(`${e}`)
    }

    if (errors) {
        formulaHtml = `<span class="error">${errors.join('<br/>')}</span>`
    }

    function plot(ctx: ContextWrapper) {
        ctx.ctx.strokeStyle = state.color
        if (fun) funGraph(ctx, fun, state.inverted)
    }

    return {
        state,
        plot,
        htmlElement: <span className="formula" dangerouslySetInnerHTML={{__html: formulaHtml}} />
    }
}

interface Panel {
    key: string,
    figure: Figure,
    active: boolean,
}

export default function Funplot() {
    const coords = useState<Coords>({x: NaN, y: NaN})
    const panels = useState<Panel[]>([])

    function newPanel(value: string) {
        console.log(`newPanel: ${value}`)
        const fig = figure({
            type: 'graph',
            inverted: false,
            color: '#f00',
            expr: 'sin(x^2)/x'
        })
        update(panels, panels => [...panels, {
            figure: fig,
            key: Math.random().toString(36).substring(7),
            active: true,
        }])
    }

    function plot(ctx: ContextWrapper) {
        ctx.clear()
        ctx.drawAxes()
        get(panels).forEach(panel => {
            panel.figure.plot(ctx)
        })
    }

    function click(coords: Coords) {
    }

    return <main className="flex flex-col flex-1 bg-blue-200">
      <h1 className="">Funplot</h1>
      <div className="block">
        { map(panels, panel => <Panel key={get(panel).key} panel={panel} />) }
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
        <span>x={get(coords).x}</span>, <span>y={get(coords).y}</span>
      </div>
      <div className="flex-1 border-2 border-black h-8 bg-white">  
        <Canvas plot={plot} coords={coords} click={click}/>
      </div>
    </main>
}


function Panel({panel}:{
    panel: State<Panel>,
}) {
    const figure = getField(panel, 'figure')
    const state = getField(figure, 'state')
    switch(get(state).type) {
        case 'graph':
            return <GraphPanel state={state} active={get(panel).active}/>
        default:
            return <>unknown panel type {get(state).type}</>
    }
}

function GraphPanel({state, active}: 
    {
        state: State<GraphFigureState>,
        active: boolean
    }) {
    const color = useState<string>('#ff1677')
    const expr: State<string> = getField(state, 'expr')

    if (active) return <div>
        <ColorBlock color={color} active={active}/>
        <span>y(x)=</span>
        <input type="text" className="border" value={get(expr)} onChange={onChange(expr)} />
    </div>
    else return <div>
        <ColorBlock color={color} active={active}/>
        <span>y(x)={get(expr)}</span>
    </div>
    /*
    <span v-if="inverted">x(y)</span><span v-else>y(x)</span> = <input v-model="expr" class="expr"> <span v-html="expr_compilation_error"></span>' +
    </div>' +
    <div class="options_pane" v-else>' +
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
    return <>
        <div 
            className="w-5 h-5 rounded" 
            style={{background: get(color)}}
            onClick={() => (active && update(open, open => !open))}
        />
        {active && get(open) && <button className="border rounded" onClick={() => set(open,false)}>close</button> }
        {active && get(open) && <HexColorPicker 
            color={get(color)} 
            onChange={_ => set(color, _)} 
            />}
    </>
}