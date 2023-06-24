'use client'
import {useRef, useState, useEffect, SetStateAction, useMemo} from 'react'
import assert from 'assert'
import type { Color } from '@rc-component/color-picker';
import ColorPicker, { ColorBlock } from '@rc-component/color-picker';
import Trigger from '@rc-component/trigger';

import Plot from '@/lib/plot'
import builtinPlacements from '@/lib/placements';

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
    figure: Figure,
    active: boolean,
}

function drawFigure(figure: Figure, plot: Plot) {

}

function clickFigure(figure: Figure, coords: Coords) {

}

export default function Funplot() {
    const [coords, setCoords] = useState<Coords>({x: NaN, y: NaN})
    const [panels, setPanels] = useState<Panel[]>([])

    function newPanel(value: string) {
        console.log(`newPanel: ${value}`)
        setPanels(panels => [...panels, {
            figure: {
                type: 'graph',
                color: '#f00',
            },
            active: true,
        }])
    }

    return <main className="flex flex-col flex-1 bg-blue-500">
      <h1 className="">Funplot</h1>
      <div className="block">
        { panels.map((panel,i) => <Panel key={i} panel={panel} />) }
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
        <span>x={coords.x}</span>, <span>y={coords.y}</span>
      </div>
      <div className="flex-1 border-2 border-black h-8 bg-white">  
        <Canvas coords={coords} setCoords={setCoords} panels={panels} />
      </div>
      </main>
  }

  function Canvas({coords, setCoords, panels}
    :{
        coords:Coords, 
        setCoords: React.Dispatch<SetStateAction<Coords>>,
        panels: Panel[]
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
        panels.forEach(panel => drawFigure(panel.figure, plot))
    }

    function drawToCanvas() {
        if (!plot) return
        plot.setCanvas(canvas)
        draw(plot);
    }

    type MyMouseEvent = React.MouseEvent<HTMLCanvasElement>

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
        setCoords({x: pos.x, y: pos.y})
        setMoved(true)
    }
  
    function onMouseUp(evt: MyMouseEvent) {
        if (!plot) return
        const pos = plot.mouse_coords(evt);
        if (!moved) { // it's a click!
            panels.forEach(panel => {
                if (panel.active) clickFigure(panel.figure, pos)
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

    function onScroll(evt: React.UIEvent<HTMLCanvasElement>) {
        console.log('onScroll')
        if (!plot) return
        const pos = plot.mouse_coords(evt)
        zoom(-evt.detail, pos.x, pos.y)
    }

    function onWheel(evt: React.WheelEvent<HTMLCanvasElement>) {
        var delta = evt.deltaY/40 
        zoom(delta, coords.x, coords.y)
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
    panel: Panel
}) {
    return <div className="block">
        Panel {panel.figure.type}
    </div>
    switch(panel.figure.type) {
        case 'graph':
            return <GraphPanel figure={panel.figure} active={panel.active}/>
        default:
            return <>unknown panel type {panel.figure.type}</>
    }
}

function GraphPanel({figure, active}: 
    {
        figure: GraphFigure,
        active: boolean
    }) {
    const [value, setValue] = useState<Color|string>('#1677ff')
    const color = useMemo(
        () => (typeof value === 'string' ? value : value.toRgbString()),
        [value],
        )

    return <div>
            <Trigger
            action={['click']}
            prefixCls="rc-color-picker"
            popupPlacement="bottomLeft"
            builtinPlacements={builtinPlacements}
            popup={<ColorPicker value={value} onChange={setValue} />}
        >
            <ColorBlock color={color} prefixCls="rc-color-picker" />
        </Trigger>
    </div>
    /*
        <colorpicker v-model="plot_color" /> ' +
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
