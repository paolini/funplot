'use client'
import {useState } from 'react'
import { HexColorPicker } from "react-colorful"
import { compile, parse } from 'mathjs'
import assert from 'assert'

import { ContextWrapper } from '@/lib/plot'
import funGraph from '@/lib/funGraph'
import { get, set, getField, update, map, extract, onChange, State, SetState } from '@/lib/State'
import Coords from '@/lib/Coords'
import Canvas from '@/components/Canvas'

interface GraphFigureState {
    type: 'graph'
    color: string
    inverted: boolean
    expr: string
}

interface ImplicitFigureState {
    type: 'implicit'
    color: string
    expr: string
}

type FigureState = GraphFigureState|ImplicitFigureState

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
        htmlElement: <span className="error">{error}</span>,
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
        console.log(`compiled? ${state.expr} fun(0)=${fun(0)}`)
        fun(0) // try if it is working
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
        console.log(`panel plot color ${state.color}`)
        if (fun) {
            try {
                funGraph(ctx, fun, state.inverted)
            } catch(e) {
                console.error(e)
            }    
        }
    }

    return {
        state,
        plot,
        htmlElement: <span className="formula" dangerouslySetInnerHTML={{__html: formulaHtml}} />,
    }
}

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


export default function Funplot() {
    const coordsPair = useState<Coords>({x: NaN, y: NaN})
    const panelsPair = useState<IPanel[]>([])

    const figures = get(panelsPair).map(p => figure(p.figure))

    function newPanel(value: string) {
        function newState(type: string): FigureState { 
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
            }
            assert(false,`invalid figure type ${value}`)
        }
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

            if (figure.type === 'graph') {
                /*
                // construct the setFigure function
                // from the setPanels function
                const setFigure = (figure: GraphFigureState): SetState<GraphFigureState> => (cb: (old: GraphFigureState) => GraphFigureState) => {
                    setPanels(panels => panels.map(p => {
                        if (p.figure === figure) {
                            return {...p, figure: cb(p.figure)}
                        } else {
                            return p
                        }
                    }))
                }
                const figurePair: State<GraphFigureState> = [figure, setFigure(figure)]
                */
                return <GraphPanel state={extractFigurePairFromPanels<GraphFigureState>(panelsPair, figure)} active={panel.active}/>
            }
        })
    }


    return <main className="flex flex-col flex-1 bg-blue-200">
      <h1 className="">Funplot</h1>
      <div className="block">
        { 
            panelElements()
            /*map(panels, panel => 
            {
                return <Panel key={get(panel).key} panel={panel} />
            }
            )
            */ 
        }
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
 
/*
function Panel({panel}:{
    panel: State<IPanel>,
}) {
    const statePair: State<FigureState> = getField(panel, 'figure')

    function isGraph([value, setValue]: [FigureState, State<FigureState>]): setValue is SetState<GraphFigureState> {
        return pair[0].type === 'graph'
    }

    if (statePair[0].type === 'graph') {
        const setState: ((cb: (x: GraphFigureState)=>GraphFigureState) => void) = statePair[1]
        return <GraphPanel state={[statePair[0],setState]} active={get(panel).active}/>
    }
    switch(statePair[0].type) {
        case 'graph':
            assert(statePair[0].type === 'graph')
            isPanel<GraphFigureState>(...statePair)
            return <GraphPanel state={[statePair[0],statePair[1]]} active={get(panel).active}/>
//        case 'implicit':
//            return <ImplicitPanel state={state} active={get(panel).active}/>
        default:
            return <>unknown panel type {get(state).type}</>
    }
}
*/

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