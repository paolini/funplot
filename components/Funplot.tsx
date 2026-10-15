'use client'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

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
import BifurcationDiagram, {type BifurcationHandle} from './BifurcationDiagram'

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
    const bifurcations = useRef(new Map<string, BifurcationHandle>())
    const hasParameters = states.some(state => state.type === 'parameter')
    const [presentations, setPresentations] = useState<{
        keys: string[], states: FigureState[], figures: FigurePresentation[],
    } | null>(null)
    const figures: PanelFigure[] = panels.map(panel => {
        // Keep the last formula for this panel while its new state is evaluated.
        // Object identity changes on clicks and slider moves; the panel ID does not.
        const index = presentations?.keys?.indexOf(panel.key) ?? -1
        return {state: panel.figure,
            tex: presentations?.figures[index]?.tex ?? '\\ldots',
            errors: presentations?.states[index] === panel.figure ? presentations.figures[index].errors : []}
    })
    const prepared = useCallback((states: FigureState[], figures: FigurePresentation[]) => {
        setPresentations({keys: panels.map(panel => panel.key), states, figures})
    }, [panels])
    const plotError = useCallback((error: unknown) => {
        const message = `Unable to calculate plot: ${String(error)}`
        setMessages(items => [...items.filter(item => item.source !== 'plot'), {type: 'error', message, source: 'plot'}])
    }, [setMessages])
    const plotComplete = useCallback(() => {
        setMessages(items => items.some(item => item.source === 'plot' || item.message.startsWith('Unable to calculate plot:'))
            ? items.filter(item => item.source !== 'plot' && !item.message.startsWith('Unable to calculate plot:')) : items)
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
            chooseParameter={chooseParameter}
            />
        <Messages messages={messages} />
        <div className="app-plots">
            <div style={{maxWidth: '100%'}}>
                <PictureCanvas
                    axes={axes}
                    setAxes={setAxes}
                    states={states}
                    prepared={prepared}
                    error={plotError}
                    complete={plotComplete}
                    click={click}
                    move={move}
                    resize={resize}
                    />
                <p style={{contain: 'inline-size'}}>Drag to pan; pinch or scroll to zoom.
                    {' '}Click to set initial points for ODEs and cobweb diagrams.</p>
            </div>
            {hasParameters && panels.map((panel, index) => panel.figure.type === 'recurrence' &&
                <BifurcationDiagram key={panel.key} states={states} figureIndex={index} axes={axes}
                    choose={chooseParameter} ref={handle => {
                        if (handle) bifurcations.current.set(panel.key, handle)
                        else bifurcations.current.delete(panel.key)
                    }} />)}
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

    function chooseParameter(name: string, value: number) {
        if (!Number.isFinite(value)) return
        const change = (state: FigureState): FigureState => state.type === 'parameter' && state.name === name
            ? {...state, expr: String(value), min: Math.min(state.min, value), max: Math.max(state.max, value)}
            : state
        const nextStates = states.map(change)
        setPanels(panels => panels.map(panel => ({...panel, figure: change(panel.figure)})))
        bifurcations.current.forEach(diagram => diagram.sample(nextStates, name, value))
    }

}

function usePlotComputer() {
    const [computer] = useState(createPlotWorker)
    useEffect(() => () => computer.dispose(), [computer])
    return computer
}
