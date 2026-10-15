import { useRef, useCallback, useState, useEffect, SetStateAction, Dispatch } from 'react'

import { draw } from '@/lib/funplot'
import Coords from '@/lib/Coords'
import { Axes, ContextWrapper } from '@/lib/plot'
import { Picture } from '@/lib/picture'
import Canvas from './Canvas'
import type {FigureState} from '@/lib/figures'
import type {FigurePresentation} from '@/lib/plotScene'
import {createPlotWorker} from '@/lib/createPlotWorker'

/** Debounce computation and ignore results from superseded or unmounted views. */
export default function PictureCanvas({axes, setAxes, states, prepared, error, complete, click, move, resize}: {
    axes: Axes,
    setAxes?: Dispatch<SetStateAction<Axes>>,
    click?: (coords: Coords) => void,
    move?: (coords: Coords) => void,
    resize?: (width: number, height: number) => void,
    states: FigureState[],
    prepared: (states: FigureState[], figures: FigurePresentation[]) => void,
    error: (error: unknown) => void,
    complete: () => void,
}) {
    const cache = useRef<Picture|null>(null)
    const [computer] = useState(createPlotWorker)
    useEffect(() => () => computer.dispose(), [computer])
    const plot = useCallback((ctx: ContextWrapper) => {
        draw(ctx, cache.current ?? [{type: 'axes', options: {labels: {x: 'x', y: 'y'}}}], {})
        let cancelled = false
        const controller = new AbortController()
        const timeout = setTimeout(async () => {
            try {
                const result = await computer.compute(states, ctx, controller.signal,
                    figures => {if (!cancelled) prepared(states, figures)})
                if (cancelled) return
                cache.current = result
                draw(ctx, result, {})
                complete()
            } catch(reason) {
                if (!cancelled && !(reason instanceof Error && reason.name === 'AbortError')) error(reason)
            }
        }, 100)
        return () => {
            cancelled = true
            clearTimeout(timeout)
            controller.abort()
        }
    }, [states, computer, prepared, error, complete])

    return <Canvas axes={axes} setAxes={setAxes} plot={plot}
        click={click} move={move} resize={resize} />
}
