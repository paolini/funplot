import {useState, useCallback,
    MouseEvent, UIEvent, WheelEvent,
    Dispatch, SetStateAction,
    } from 'react'

import { Axes, ContextWrapper, canvasContext, translateAxes, zoomAxes } from '@/lib/plot'
import Coords from '@/lib/Coords'
import useResizeObserver from '@/lib/useResizeObserver'

type PlotFunction = (ctx: ContextWrapper) => Promise<void>

export default function Canvas({axes,  setAxes, plot, click, move, resize}
    :{
        axes: Axes,
        setAxes?: Dispatch<SetStateAction<Axes>>,
        plot: PlotFunction,
        click?: (coords: Coords) => void,
        move?: (coords: Coords) => void,
        resize?: (width: number, height: number) => void,
    }) {
    const [dragStart, setDragStart] = useState<{x: number, y:number}>({x:0, y:0})
    const [dragging, setDragging] = useState<boolean>(false)
    const [moved, setMoved] = useState<boolean>(false)
    const [canvas, setCanvas] = useState<HTMLCanvasElement|null>(null)
    const width = canvas ? canvas.width : 0
    const height = canvas ? canvas.height : 0
    const onResize = useCallback((target: HTMLDivElement) => {
        // Handle the resize event
        const w = target.clientWidth
        const h = target.clientHeight
        //console.log(`resize ${w}x${h}`)
        if (resize) resize(w, h)
        if (setAxes) {
            const a = axes
            const d = Math.sqrt((a.rx*a.rx + a.ry*a.ry)/(w*w+h*h))
            setAxes({
                x: a.x,
                y: a.y,
                rx: w*d,
                ry: h*d,
            })
            }
        }, []);
    const resizeRef = useResizeObserver(onResize);
    // console.log(`canvas ${width}x${height}`)

    const ctx = canvas ? canvasContext(axes, canvas) : null

    //className="h-full w-full" 
    return <div ref={resizeRef} style={{resize:"both",overflow:"auto",width:"640px",height:"480px"}}>
        <canvas
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
    </div>

    function onRef(myCanvas: HTMLCanvasElement) {
        // console.log('onRef ${myCanvas}')
        if (!myCanvas) return
        // unable to fix type declaration:
        // hack: using "unknown" to avoid check
        myCanvas.addEventListener('wheel', (evt) => onWheel(evt as unknown as WheelEvent<HTMLCanvasElement>), {passive: false})
        myCanvas.width = myCanvas.clientWidth
        myCanvas.height = myCanvas.clientHeight
        setCanvas(myCanvas)
        const myCtx = canvasContext(axes, myCanvas)
        //console.log(`Canvas plot ${myCtx!==null}`)
        if (myCtx) plot(myCtx)
    }
    
    function onMouseDown(evt: MouseEvent<HTMLCanvasElement>) {
        if (!canvas) return
        if (!ctx) return
        document.body.style.userSelect = 'none'
        setDragStart(ctx.mouseCoords(evt))
        setMoved(false)
        setDragging(true)
    }
    
    function onMouseMove(evt: MouseEvent<HTMLCanvasElement>) {
        if (!ctx) return
        if (!canvas) return
        const pos = ctx.mouseCoords(evt)
        document.body.style.cursor="auto"
        if (dragging && setAxes) {
            setAxes(translateAxes(axes, dragStart.x-pos.x, dragStart.y-pos.y))
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
        //console.log('zoom')
        if (!ctx) return
        var factor = Math.exp(delta/40)
        if (setAxes) setAxes(zoomAxes(axes, factor, x, y))
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
        // console.log('blur')
        setDragging(false)
        document.body.style.cursor = "auto"
    }

}

