'use client'
import {useRef, useState, useEffect, SetStateAction, Dispatch, 
    MouseEvent, UIEvent, WheelEvent, ChangeEvent, ChangeEventHandler
    } from 'react'
import assert from 'assert'
import { HexColorPicker } from "react-colorful"
import { compile, parse } from 'mathjs'

import { Axes, ContextWrapper, canvasContext, translateAxes, zoomAxes } from '@/lib/plot'
import funGraph from '@/lib/funGraph'

// [value, setValue] pairs
type State<T> = [T, (cb: (newValue: T) => T) => void]

// get the value of a state [value, setValue]
function get<T>([value, setValue]: State<T>): T {
    return value
}

// get the field of a state [value, setValue]
function getField<T,K extends keyof T>([value, setValue]: State<T>, field: K): State<T[K]> {
    return [value[field], (cb: (newValue: T[K]) => T[K]) => setValue(value => ({...value, [field]: cb(value[field])}))]
}

// set the value of a state [value, setValue]
// with a constant value 
function set<T>([value, setValue]: State<T>, newValue: T) {
    setValue(() => newValue)
}

// set the value of a state [value, setValue]
// with a function of the current value
function update<T>([value, setValue]: State<T>, cb: (newValue: T) => T) {
    setValue(cb)
}

// onChange event handler of input for a string state [value, setValue]
function onChange([value, setValue]: State<string>): ChangeEventHandler<HTMLInputElement> {
    return (evt: ChangeEvent<HTMLInputElement>) => setValue(_ => evt.target.value)
}

// map a function over a state [value, setValue]
// building the setState function for each element of the array
function map<T,U>([value, setValue]: State<T[]>, f: (item: State<T>, i: number) => U): U[] {
    return value.map((item,i) => f([item, (setItem: (x:T)=> T) => setValue(value => value.map(item2 => item2===item ? setItem(item2) : item2))],i))
}

type Coords = {
    x: number
    y: number
}

type GraphFigure = {
    type: 'graph',
    color: string,
    inverted: boolean,
    expr: string,
}

type Figure = GraphFigure

function updateFigure(figure: Figure, ctx: ContextWrapper, div?: HTMLDivElement) {
    switch(figure.type) {
        case 'graph': return updateGraphFigure(figure, ctx, div)
        default: return `invalid figure type ${figure.type}`
    }
}

function updateGraphFigure(figure: GraphFigure, ctx: ContextWrapper, div?: HTMLDivElement) {
    try {
        var compiledExpr = compile(figure.expr)
    } catch(e) {
        return `${e}`
    }
    const formula_html = `$$ ${figure.inverted ? 'x' : 'y'} = ${parse(figure.expr).toTex()} $$`
    // MathJax.Hub.Queue(["Typeset", MathJax.Hub])
    const f: ((x:number) => number) = figure.inverted 
        ? y => compiledExpr.evaluate({y})
        : x => compiledExpr.evaluate({x})
    ctx.ctx.strokeStyle = figure.color;
    funGraph(ctx, f, figure.inverted)
}

interface Panel {
    key: string,
    figure: Figure,
    active: boolean,
}

function drawFigure(figure: Figure, plot: ContextWrapper) {

}

function clickFigure(figure: Figure, coords: Coords) {

}

export default function Funplot() {
    const coords = useState<Coords>({x: NaN, y: NaN})
    const panels = useState<Panel[]>([])

    function newPanel(value: string) {
        console.log(`newPanel: ${value}`)
        const figure: Figure = {
            type: 'graph',
            inverted: false,
            color: '#f00',
            expr: 'sin(x^2)/x'
        }
        update(panels, panels => [...panels, {
            figure,
            key: Math.random().toString(36).substring(7),
            active: true,
        }])
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
        <Canvas 
            plot={(ctx) => {
                ctx.clear();
                ctx.drawAxes();           
            }}
            coords={coords}
            click={coords => {}}
        />
      </div>
    </main>
}

function Canvas({plot, coords, click}
    :{
        plot: (ctx: ContextWrapper) => void,
        coords: State<Coords>,
        click: (coords: Coords) => void,
    }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const axes = useState<Axes>({x: 0, y: 0, r: 5})
    const [dragStart, setDragStart] = useState<{x: number, y:number}>({x:0, y:0})
    const [dragging, setDragging] = useState<boolean>(false)
    const [moved, setMoved] = useState<boolean>(false)
    const canvas = canvasRef.current

    if (canvas) {
        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight
    }

    const ctx = canvas ? canvasContext(get(axes), canvas) : null

    if (ctx) plot(ctx)

    function onMouseDown(evt: MouseEvent<HTMLCanvasElement>) {
        if (!ctx) return
        document.body.style.userSelect = 'none'        
        setDragStart(ctx.mouseCoords(evt))
        setMoved(false)
        setDragging(true)
    }
  
    function onMouseMove(evt: MouseEvent<HTMLCanvasElement>) {
        if (!ctx) return
        const pos = ctx.mouseCoords(evt)
        if (dragging) {
            set(axes, translateAxes(get(axes), dragStart.x-pos.x, dragStart.y-pos.y))
        }
        set(coords, {x: pos.x, y: pos.y})
        setMoved(true)
    }
  
    function onMouseUp(evt: MouseEvent<HTMLCanvasElement>) {
        if (!ctx) return
        const pos = ctx.mouseCoords(evt);
        if (!moved) { // it's a click!
            click(pos)
        }
        setMoved(false)
        setDragging(false)
    }
  
    function zoom(delta: number, x:number, y:number) {
        if (!ctx) return
        var factor = Math.exp(delta/40)
        set(axes, zoomAxes(get(axes), factor, x, y))
    }

    function onScroll(evt: UIEvent<HTMLCanvasElement>) {
        console.log('onScroll')
        if (!ctx) return
        zoom(-evt.detail, get(coords).x, get(coords).y)
    }

    function onWheel(evt: WheelEvent<HTMLCanvasElement>) {
        var delta = evt.deltaY/40 
        zoom(delta, get(coords).x, get(coords).y)
    }

    return <canvas 
            className="h-full w-full" 
            ref={canvasRef} 
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onScroll={onScroll}
            onWheel={onWheel}
        />
}

function Panel({panel}:{
    panel: State<Panel>,
}) {
    const figure = getField(panel, 'figure')
    switch(get(figure).type) {
        case 'graph':
            return <GraphPanel figure={figure} active={get(panel).active}/>
        default:
            return <>unknown panel type {get(panel).figure.type}</>
    }
}

function GraphPanel({figure, active}: 
    {
        figure: State<GraphFigure>,
        active: boolean
    }) {
    const color = useState<string>('#ff1677')
    const expr = getField(figure, 'expr')

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