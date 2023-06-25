import {useRef, useState, 
    MouseEvent, UIEvent, WheelEvent,
    } from 'react'

import { Axes, ContextWrapper, canvasContext, translateAxes, zoomAxes } from '@/lib/plot'
import { set, get, State } from '@/lib/State'
import Coords from '@/lib/Coords'

export default function Canvas({plot, coords, click}
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
