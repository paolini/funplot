import {useRef, useState, useEffect,
    MouseEvent, UIEvent, WheelEvent,
    } from 'react'

import { Axes, ContextWrapper, canvasContext, translateAxes, zoomAxes } from '@/lib/plot'
import { set, get, State } from '@/lib/State'
import Coords from '@/lib/Coords'
import { context } from '@/lib/plot'
import { jsPDF } from 'jspdf'

type PlotFunction = (ctx: ContextWrapper) => void

export default function Canvas({axes, plot, click, info}
    :{
        axes: State<Axes>,
        plot: PlotFunction,
        click: (coords: Coords) => void,
        info: {x:number, y:number, width:number, height:number, exportPdf: () => void},
    }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [dragStart, setDragStart] = useState<{x: number, y:number}>({x:0, y:0})
    const [dragging, setDragging] = useState<boolean>(false)
    const [moved, setMoved] = useState<boolean>(false)
    const [canvas, setCanvas] = useState<HTMLCanvasElement|null>(null)
    const [count, setCount] = useState<number>(0) // used to force a re-render

    useEffect(() => {
        setCanvas(canvasRef.current)
        window.addEventListener("resize",onWindowResize)
        return (() => window.removeEventListener("resize",onWindowResize))
    }, [])

    if (canvas) {
        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight
        info.width = canvas.width
        info.height = canvas.height
        info.exportPdf = exportPdf
    }

    const ctx = canvas ? canvasContext(get(axes), canvas) : null

    if (ctx) {
        plot(ctx)
    }

    function onWindowResize() {
        setCount(count => count+1)
    }

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
        info.x = pos.x
        info.y = pos.y
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
        zoom(-evt.detail, info.x, info.y)
    }

    function onWheel(evt: WheelEvent<HTMLCanvasElement>) {
        var delta = -evt.deltaY/40 
        zoom(delta, info.x, info.y)
    }

    function exportPdf() {
        const width = canvas?.width || 640 
        const height = canvas?.height || 480
        const filename = 'funplot.pdf'
        console.log(`export Pdf ${width}x${height}`)
        const margin = 10
        const doc = new jsPDF({
            unit: 'pt',
            format: [width+2*margin, height+2*margin],
            orientation: (height > width ? 'p' : 'l')
          })
        doc.setLineJoin('rounded');
        //  doc.line(20, 20, 60, 20) // horizontal line
        //  doc.setLineWidth(0.5)
      
        const c = doc.context2d
        c.autoPaging = false
        console.log("autopaging: " + c.autoPaging)
        //ctx.lineWidth = 1.0;
        doc.setFontSize(10)
        c.translate(margin, margin);
        c.scale(1.0,1.0);
        // doc.save("test.pdf")
        const myctx = context(get(axes), width, height, c)
        plot(myctx)        
        doc.save(filename)
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
