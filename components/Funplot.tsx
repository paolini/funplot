'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'

import { ContextWrapper } from '@/lib/plot'
import { get, update } from '@/lib/State'
import Coords from '@/lib/Coords'
import PictureCanvas from '@/components/PictureCanvas'
import type { FigureState } from '@/lib/figures'
import { Axes } from '@/lib/plot'
import Messages, { IMessage } from './Messages'
import type {FigurePresentation, PanelFigure} from '@/lib/plotScene'
import {createPlotWorker} from '@/lib/createPlotWorker'
import {figureClick} from '@/lib/figureClick'
import { hashLoad, panelToOptions, SHARE_VERSION } from '@/lib/hashConverter'
import { IPanel, exportPdf, newPanel } from '@/lib/funplot'
import Header from '@/components/Header'
import PanelElements from '@/components/PanelElements'

export default function Funplot() {
    const [axes, setAxes] = useState<Axes>({x: 0, y: 0, rx: 4, ry: 3})
    const panelsPair = useState<IPanel[]>([])
    const messages = useState<IMessage[]>([])
    const [, setPanels] = panelsPair
    const [, setMessages] = messages
    const [cursor,setCursor] = useState<Coords>({x:0, y:0})
    const [width, setWidth] = useState(0)
    const [height, setHeight] = useState(0)
    const move = useCallback((coords: Coords) => {
        setCursor(coords)
    },[setCursor])

    const resize = useCallback((w: number, h: number) => {
        setWidth(w)
        setHeight(h)
    }, [])

    // Import browser URL state after hydration, keeping the initial server/client render identical.
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        try {
            const load = hashLoad(window.location.hash)
            if (!load) return
            setAxes(load.axes)
            setPanels(load.figures.map(newPanel))
        } catch {
            setMessages(items => [...items, {
                type: 'error',
                message: 'Unable to open this shared plot: the link is invalid or unsupported.',
            }])
        }
    }, [setPanels, setMessages])
    /* eslint-enable react-hooks/set-state-in-effect */

    const panels = get(panelsPair)
    const states = useMemo(() => panels.map(panel => panel.figure), [panels])
    const [presentations, setPresentations] = useState<{
        states: FigureState[], figures: FigurePresentation[],
    } | null>(null)
    const figures: PanelFigure[] = states.map(state => {
        const index = presentations?.states.indexOf(state) ?? -1
        return {state, ...(presentations?.figures[index] ?? {tex: '\\ldots', errors: []})}
    })
    const prepared = useCallback((states: FigureState[], figures: FigurePresentation[]) => {
        setPresentations({states, figures})
    }, [])
    const plotError = useCallback((error: unknown) => {
        const message = `Unable to calculate plot: ${String(error)}`
        setMessages(items => items.some(item => item.message === message) ? items : [...items, {type: 'error', message}])
    }, [setMessages])

    const pdfComputer = usePlotComputer()
    const picture = useCallback((ctx: ContextWrapper) => pdfComputer.compute(states, ctx), [pdfComputer, states])
    
    return <main className="app-main">
        <Header 
            share={share}
            downloadPDF={downloadPDF}
            />
        <PanelElements 
            panelsPair={panelsPair} 
            figures={figures} 
            cursor={cursor}
            />
        <Messages messages={messages} />
        <div>
            <PictureCanvas 
                axes={axes}
                setAxes={setAxes}
                states={states}
                prepared={prepared}
                error={plotError}
                click={click}
                move={move}
                resize={resize}
                />

        </div>
    </main>

    function share() {
        const panels = get(panelsPair)
        const opt = {
            v: SHARE_VERSION,
            p: axes,
            l: panels.map(panelToOptions),
        }
        const hash = encodeURIComponent(JSON.stringify(opt))
        window.location.hash = `#q=${hash}`
        // copy to clipboard
        const el = document.createElement('textarea')
        el.value = window.location.href
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
        update<IMessage[]>(messages, messages => [...messages, {
            type: 'info',
            message: 'link copied to clipboard',
            }])
    }

    async function downloadPDF() {
        try {
            if (!width || !height) throw new Error(`invalid size ${width}x${height}`)
            await exportPdf(axes, width, height, picture)
        } catch (error) {
            if (!(error instanceof Error && error.name === 'AbortError')) plotError(error)
        }
    }

    function click(coords: Coords) {
        setPanels(panels => panels.map(panel => panel.active
            ? {...panel, figure: figureClick(panel.figure, coords)}
            : panel))
    }

}

function usePlotComputer() {
    const [computer] = useState(createPlotWorker)
    useEffect(() => () => computer.dispose(), [computer])
    return computer
}
