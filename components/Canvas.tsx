import {useState, useCallback, useEffect, useLayoutEffect, useRef, PointerEvent, Dispatch, SetStateAction} from 'react'

import { Axes, ContextWrapper, canvasContext, zoomAxes } from '@/lib/plot'
import Coords from '@/lib/Coords'
import CanvasGesture from '@/lib/CanvasGesture'
import useResizeObserver from '@/lib/useResizeObserver'

type PlotFunction = (ctx: ContextWrapper) => void | (() => void)

export default function Canvas({axes, setAxes, plot, click, move, resize,
    width = 640, height = 480, isometric = true, label = 'Plot'}: {
    axes: Axes,
    setAxes?: Dispatch<SetStateAction<Axes>>,
    plot: PlotFunction,
    click?: (coords: Coords) => void,
    move?: (coords: Coords) => void,
    resize?: (width: number, height: number) => void,
    width?: number,
    height?: number,
    isometric?: boolean,
    label?: string,
}) {
    const [canvas, setCanvas] = useState<HTMLCanvasElement|null>(null)
    const [size, setSize] = useState({width, height})
    const gesture = useRef(new CanvasGesture())
    const currentAxes = useRef(axes)
    useLayoutEffect(() => {currentAxes.current = axes}, [axes])

    const onResize = useCallback((target: HTMLDivElement) => {
        const width = target.clientWidth
        const height = target.clientHeight
        if (width <= 0 || height <= 0) return
        setSize(old => old.width === width && old.height === height ? old : {width, height})
        resize?.(width, height)
        if (isometric) setAxes?.(current => {
            const scale = Math.hypot(current.rx, current.ry) / Math.hypot(width, height)
            const rx = width * scale
            const ry = height * scale
            if (Math.abs(rx - current.rx) < 1e-12 * current.rx &&
                Math.abs(ry - current.ry) < 1e-12 * current.ry) return current
            return {...current, rx, ry}
        })
    }, [resize, setAxes, isometric])
    const resizeRef = useResizeObserver(onResize)

    useEffect(() => {
        if (!canvas) return
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

    return <div ref={resizeRef} style={{resize: 'both', overflow: 'auto', width, height, maxWidth: '100%'}}>
        <canvas
            aria-label={label}
            className="app-canvas"
            style={{width: '100%', height: '100%', touchAction: 'none', userSelect: 'none'}}
            ref={setCanvas}
            width={size.width}
            height={size.height}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={cancelPointer}
            onLostPointerCapture={cancelPointer}
        />
    </div>

    function viewport(target: HTMLCanvasElement) {
        const rect = target.getBoundingClientRect()
        return {width: rect.width, height: rect.height}
    }

    function position(evt: PointerEvent<HTMLCanvasElement>) {
        const rect = evt.currentTarget.getBoundingClientRect()
        return {x: evt.clientX - rect.left, y: evt.clientY - rect.top}
    }

    function onPointerDown(evt: PointerEvent<HTMLCanvasElement>) {
        if (evt.button !== 0) return
        evt.preventDefault()
        evt.currentTarget.setPointerCapture(evt.pointerId)
        gesture.current.begin(evt.pointerId, position(evt), currentAxes.current, viewport(evt.currentTarget))
    }

    function updateGesture(evt: PointerEvent<HTMLCanvasElement>) {
        const next = gesture.current.move(evt.pointerId, position(evt))
        if (next && setAxes) {
            currentAxes.current = next
            setAxes(next)
        }
    }

    function onPointerMove(evt: PointerEvent<HTMLCanvasElement>) {
        updateGesture(evt)
        const ctx = canvasContext(currentAxes.current, evt.currentTarget)
        if (ctx) move?.(ctx.mouseCoords(evt))
    }

    function onPointerUp(evt: PointerEvent<HTMLCanvasElement>) {
        updateGesture(evt)
        const tap = gesture.current.end(evt.pointerId, currentAxes.current, viewport(evt.currentTarget))
        if (evt.currentTarget.hasPointerCapture(evt.pointerId)) {
            evt.currentTarget.releasePointerCapture(evt.pointerId)
        }
        if (tap) {
            const ctx = canvasContext(currentAxes.current, evt.currentTarget)
            if (ctx) click?.(ctx.mouseCoords(evt))
        }
    }

    function cancelPointer(evt: PointerEvent<HTMLCanvasElement>) {
        gesture.current.end(evt.pointerId, currentAxes.current, viewport(evt.currentTarget), true)
    }
}
