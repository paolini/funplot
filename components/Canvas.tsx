import {useRef, useState, useEffect,
    MouseEvent, UIEvent, WheelEvent,
    } from 'react'

import { Axes, ContextWrapper, canvasContext, translateAxes, zoomAxes } from '@/lib/plot'
import { set, get, State } from '@/lib/State'
import Coords from '@/lib/Coords'
import { getMousePos } from '@/lib/plot'

type PlotFunction = (ctx: ContextWrapper) => Promise<void>

export default function Canvas({axes, plot, click, move, updateCount}
    :{
        axes: Axes|State<Axes>,
        plot: PlotFunction,
        click?: (coords: Coords) => void,
        move?: (coords: Coords) => void,
        updateCount?: number,
    }) {
    const [dragStart, setDragStart] = useState<{x: number, y:number}>({x:0, y:0})
    const [dragging, setDragging] = useState<boolean>(false)
    const [moved, setMoved] = useState<boolean>(false)
    const [canvas, setCanvas] = useState<HTMLCanvasElement|null>(null)
    const canChangeAxes = Array.isArray(axes)
    const theAxes = canChangeAxes ? get(axes) : axes
    const width = canvas ? canvas.width : 0
    const height = canvas ? canvas.height : 0
    const ctx = canvas ? canvasContext(theAxes, canvas) : null
    console.log(`canvas ${updateCount} ${width}x${height}`)

    if (ctx) {
        plot(ctx)
    }

    //className="h-full w-full" 
    return <canvas
            className="border-2 border-black bg-white"
            style={{width: "100%",height: "100%"}}
            ref={onRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onScroll={onScroll}
            //onWheel={onWheel}
            //onBlur={blur}
            onMouseLeave={blur}
        />

    function onRef(myCanvas: HTMLCanvasElement) {
        console.log('onRef ${myCanvas}')
        if (!myCanvas) return
        // unable to fix type declaration:
        // hack: using "unknown" to avoid check
        myCanvas.addEventListener('wheel', (evt) => onWheel(evt as unknown as WheelEvent<HTMLCanvasElement>), {passive: false})
        myCanvas.width = myCanvas.clientWidth
        myCanvas.height = myCanvas.clientHeight
        setCanvas(myCanvas)
    }

    function onMouseDown(evt: MouseEvent<HTMLCanvasElement>) {
        if (!ctx) return
        if (!canvas) return
        document.body.style.userSelect = 'none'
        setDragStart(ctx.mouseCoords(evt))
        setMoved(false)
        setDragging(true)
    }
    
    function onMouseMove(evt: MouseEvent<HTMLCanvasElement>) {
        if (!ctx) return
        if (!canChangeAxes) return
        if (!canvas) return
        const pos = ctx.mouseCoords(evt)
        document.body.style.cursor="auto"
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
        document.body.style.cursor = "auto"
    }
    
    function zoom(delta: number, x:number, y:number) {
        if (!ctx) return
        if (!canChangeAxes) return
        var factor = Math.exp(delta/40)
        set(axes, zoomAxes(get(axes), factor, x, y))
    }

    function onScroll(evt: UIEvent<HTMLCanvasElement>) {
        console.log('onScroll')
        if (!ctx) return
        zoom(-evt.detail, 0, 0)
    }

    function onWheel(evt: WheelEvent<HTMLCanvasElement>) {
        evt.preventDefault()
        //console.log('onWheel')
        if (!ctx) return
        var delta = -evt.deltaY/40 
        const pos = ctx.mouseCoords(evt)
        zoom(delta, pos.x, pos.y)
    }

    function blur() {
        console.log('blur')
        setDragging(false)
        document.body.style.cursor = "auto"
    }

}

