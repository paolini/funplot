import { useRef, useCallback, SetStateAction, Dispatch } from 'react'

import { draw } from '@/lib/funplot'
import Coords from '@/lib/Coords'
import { Axes, ContextWrapper } from '@/lib/plot'
import { Picture } from '@/lib/picture'
import Canvas from './Canvas'

/** Debounce computation and ignore results from superseded or unmounted views. */
export default function PictureCanvas({axes, setAxes, picture, click, move, resize}: {
    axes: Axes,
    setAxes?: Dispatch<SetStateAction<Axes>>,
    click?: (coords: Coords) => void,
    move?: (coords: Coords) => void,
    resize?: (width: number, height: number) => void,
    picture: (ctx: ContextWrapper) => Promise<Picture>,
}) {
    const cache = useRef<Picture|null>(null)
    const plot = useCallback((ctx: ContextWrapper) => {
        if (cache.current) draw(ctx, cache.current, {})
        let cancelled = false
        const timeout = setTimeout(async () => {
            try {
                const result = await picture(ctx)
                if (cancelled) return
                cache.current = result
                draw(ctx, result, {})
            } catch(error) {
                if (!cancelled) console.error('Unable to draw plot', error)
            }
        }, 100)
        return () => {
            cancelled = true
            clearTimeout(timeout)
        }
    }, [picture])

    return <Canvas axes={axes} setAxes={setAxes} plot={plot}
        click={click} move={move} resize={resize} />
}
