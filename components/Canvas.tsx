import {useRef, useState, useEffect,
    MouseEvent, UIEvent, WheelEvent,
    } from 'react'

import { Axes, ContextWrapper, canvasContext, translateAxes, zoomAxes } from '@/lib/plot'
import { set, get, State } from '@/lib/State'
import Coords from '@/lib/Coords'

type PlotFunction = (ctx: ContextWrapper) => Promise<void>

export default function Canvas({axes, width=640, height=480, plot, click, move}
    :{
        axes: State<Axes>,
        width?: number,
        height?: number,
        plot: PlotFunction,
        resize?: (width: number, height: number)=> void,
        click?: (coords: Coords) => void,
        move?: (coords: Coords) => void,
    }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [dragStart, setDragStart] = useState<{x: number, y:number}>({x:0, y:0})
    const [dragging, setDragging] = useState<boolean>(false)
    const [moved, setMoved] = useState<boolean>(false)
    const [canvas, setCanvas] = useState<HTMLCanvasElement|null>(null)

    useEffect(() => {
        setCanvas(canvasRef.current)
    }, [])

    const ctx = canvas ? canvasContext(get(axes), canvas) : null

    if (ctx) {
        plot(ctx)
    }

    //className="h-full w-full" 
    return <canvas
            className="border-2 border-black bg-white"
            style={{resize:"both"}} // not working
            width={width}
            height={height}
            ref={canvasRef} 
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onScroll={onScroll}
            onWheel={onWheel}
            onBlur={() => setDragging(false)}
        />

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
        if (move) move(pos)
        setMoved(true)
    }
    
    function onMouseUp(evt: MouseEvent<HTMLCanvasElement>) {
        if (!ctx) return
        const pos = ctx.mouseCoords(evt);
        if (!moved) { // it's a click!
            if (click) click(pos)
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
        zoom(-evt.detail, 0, 0)
    }

    function onWheel(evt: WheelEvent<HTMLCanvasElement>) {
        if (!ctx) return
        var delta = -evt.deltaY/40 
        const pos = ctx.mouseCoords(evt)
        zoom(delta, pos.x, pos.y)
    }

}

