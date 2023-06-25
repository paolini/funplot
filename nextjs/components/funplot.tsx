'use client'
import {useRef, useState, useEffect, SetStateAction, Dispatch, MouseEvent, UIEvent, WheelEvent} from 'react'
import assert from 'assert'
import { HexColorPicker } from "react-colorful"

import Plot from '@/lib/plot'

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
}

type Figure = GraphFigure

interface Panel {
    key: string,
    figure: Figure,
    active: boolean,
}

function drawFigure(figure: Figure, plot: Plot) {

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
            color: '#f00',
        }
        update(panels, panels => [...panels, {
            figure,
            key: Math.random().toString(36).substring(7),
            active: true,
        }])
    }

    return <main className="flex flex-col flex-1 bg-blue-500">
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
        <Canvas coords={coords} panels={panels} />
      </div>
      </main>
  }

  function Canvas({coords, panels}
    :{
        coords: State<Coords>, 
        panels: State<Panel[]>
    }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [plot, setPlot] = useState<Plot|null>(null)
    const [dragStart, setDragStart] = useState<{x: number, y:number}>({x:0, y:0})
    const [dragging, setDragging] = useState<boolean>(false)
    const [moved, setMoved] = useState<boolean>(false)
    const canvas = canvasRef.current

    useEffect(() => {
        const canvas = canvasRef.current
        assert(canvas, 'canvas not initialized')
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight
        const plot = new Plot({
            xCenter: 0.0,
            yCenter: 0.0,
            radius: Math.sqrt(320*320 + 240*240) / 80
          })

          plot.setCanvas(canvas)
          plot.drawAxes()
          setPlot(plot)        
    },[])

    function draw(plot: Plot) {
        plot.clear();
        plot.drawAxes();
        map(panels, panel => drawFigure(get(panel).figure, plot))
    }

    function drawToCanvas() {
        if (!plot) return
        plot.setCanvas(canvas)
        draw(plot);
    }

    type MyMouseEvent = MouseEvent<HTMLCanvasElement>

    function onMouseDown(evt: MyMouseEvent) {
        if (!plot) return
        document.body.style.userSelect = 'none'        
        setDragStart(plot.mouse_coords(evt))
        setMoved(false)
        setDragging(true)
    }
  
    function onMouseMove(evt: MyMouseEvent) {
        if (!plot) return
        const pos = plot.mouse_coords(evt)
        if (dragging) {
          plot.translate(dragStart.x-pos.x, dragStart.y-pos.y)
          drawToCanvas()
        }
        set(coords, {x: pos.x, y: pos.y})
        setMoved(true)
    }
  
    function onMouseUp(evt: MyMouseEvent) {
        if (!plot) return
        const pos = plot.mouse_coords(evt);
        if (!moved) { // it's a click!
            map(panels, panel => {
                if (get(panel).active) clickFigure(get(panel).figure, pos)
            })
        }
        setMoved(false)
        setDragging(false)
    }
  
    function zoom(delta: number, x:number, y:number) {
        if (!plot) return
        var factor = Math.exp(delta/40)
        plot.zoom(factor, x, y)
        drawToCanvas()
    }

    function onScroll(evt: UIEvent<HTMLCanvasElement>) {
        console.log('onScroll')
        if (!plot) return
        const pos = plot.mouse_coords(evt)
        zoom(-evt.detail, pos.x, pos.y)
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
    const [color, setColor] = useState<string>('#ff1677')

    return <div>
            <ColorBlock color={color} setColor={setColor} />
            {active && <>
                <span>y(x)=</span>
                <input type="text" className="border" />
            </>}
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

function ColorBlock({color, setColor}:{
    color: string,
    setColor: Dispatch<SetStateAction<string>>
}) {
    const [open, setOpen] = useState<boolean>(false)
    return <>
        <div 
            className="w-5 h-5 rounded" 
            style={{background: color}}
            onClick={() => setOpen(!open)}
        />
        {open && <HexColorPicker 
            color={color} 
            onChange={setColor} 
            />}
    </>
}