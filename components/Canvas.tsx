import {useState, useCallback, useEffect, useRef, MouseEvent, Dispatch, SetStateAction} from 'react'

import { Axes, ContextWrapper, canvasContext, translateAxes, zoomAxes } from '@/lib/plot'
import Coords from '@/lib/Coords'
import useResizeObserver from '@/lib/useResizeObserver'

type PlotFunction = (ctx: ContextWrapper) => void | (() => void)

export default function Canvas({axes, setAxes, plot, click, move, resize}: {
    axes: Axes,
    setAxes?: Dispatch<SetStateAction<Axes>>,
    plot: PlotFunction,
    click?: (coords: Coords) => void,
    move?: (coords: Coords) => void,
    resize?: (width: number, height: number) => void,
}) {
    const [canvas, setCanvas] = useState<HTMLCanvasElement|null>(null)
    const [size, setSize] = useState({width: 640, height: 480})
    const drag = useRef<{x: number, y: number, axes: Axes, moved: boolean}|null>(null)

    const onResize = useCallback((target: HTMLDivElement) => {
        const width = target.clientWidth
        const height = target.clientHeight
        if (width <= 0 || height <= 0) return
        setSize(old => old.width === width && old.height === height ? old : {width, height})
        resize?.(width, height)
        setAxes?.(current => {
            const scale = Math.hypot(current.rx, current.ry) / Math.hypot(width, height)
            const rx = width * scale
            const ry = height * scale
            if (Math.abs(rx - current.rx) < 1e-12 * current.rx &&
                Math.abs(ry - current.ry) < 1e-12 * current.ry) return current
            return {...current, rx, ry}
        })
    }, [resize, setAxes])
    const resizeRef = useResizeObserver(onResize)

    useEffect(() => {
        if (!canvas) return
        if (canvas.width !== size.width) canvas.width = size.width
        if (canvas.height !== size.height) canvas.height = size.height
        const ctx = canvasContext(axes, canvas)
        if (ctx) return plot(ctx)
    }, [axes, canvas, plot, size])

    useEffect(() => {
        if (!canvas || !setAxes) return
        const wheel = (evt: globalThis.WheelEvent) => {
            evt.preventDefault()
            // Capture coordinates before React processes the state update.
            const position = {clientX: evt.clientX, clientY: evt.clientY}
            const factor = Math.exp(Math.max(-200, Math.min(200, -evt.deltaY)) / 1600)
            setAxes(current => {
                const ctx = canvasContext(current, canvas)
                if (!ctx) return current
                const point = ctx.mouseCoords(position)
                return zoomAxes(current, factor, point.x, point.y)
            })
        }
        canvas.addEventListener('wheel', wheel, {passive: false})
        return () => canvas.removeEventListener('wheel', wheel)
    }, [canvas, setAxes])

    return <div ref={resizeRef} style={{resize: 'both', overflow: 'auto', width: '640px', height: '480px'}}>
        <canvas
            className="app-canvas"
            style={{width: '100%', height: '100%'}}
            ref={setCanvas}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={() => {drag.current = null}}
        />
    </div>

    function onMouseDown(evt: MouseEvent<HTMLCanvasElement>) {
        if (evt.button !== 0) return
        evt.preventDefault()
        drag.current = {x: evt.clientX, y: evt.clientY, axes, moved: false}
    }

    function onMouseMove(evt: MouseEvent<HTMLCanvasElement>) {
        if (!canvas) return
        const ctx = canvasContext(axes, canvas)
        if (!ctx) return
        const start = drag.current
        if (start) {
            const dx = evt.clientX - start.x
            const dy = evt.clientY - start.y
            if (Math.hypot(dx, dy) > 3) start.moved = true
            if (start.moved && setAxes) {
                setAxes(translateAxes(start.axes,
                    -dx * 2 * start.axes.rx / canvas.width,
                    dy * 2 * start.axes.ry / canvas.height))
            }
        }
        move?.(ctx.mouseCoords(evt))
    }

    function onMouseUp(evt: MouseEvent<HTMLCanvasElement>) {
        const start = drag.current
        drag.current = null
        if (!canvas || !start || start.moved) return
        const ctx = canvasContext(axes, canvas)
        if (ctx) click?.(ctx.mouseCoords(evt))
    }
}
