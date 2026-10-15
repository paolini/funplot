'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import assert from 'assert'

import { ContextWrapper } from '@/lib/plot'
import { get, set, getField, update, map, State, } from '@/lib/State'
import Coords from '@/lib/Coords'
import PictureCanvas from '@/components/PictureCanvas'
import { FigureState, ParameterState, createFigure } from '@/lib/figures'
import { Axes } from '@/lib/plot'
import Messages, { IMessage } from './Messages'
import { Picture } from '@/lib/picture'
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
    const {figures, parameters} = useMemo(() => {
        const parameterList = panels
            .map(panel => panel.figure)
            .filter((figure): figure is ParameterState => figure.type === 'parameter')
            .map(figure => figure.name)
        const figures = panels.map(panel => createFigure(panel.figure, parameterList))
        const parameters = Object.fromEntries(parameterList.map(name => [name, 0]))
        for (const figure of figures) figure.eval(parameters)
        return {figures, parameters}
    }, [panels])

    const picture = useCallback(async (ctx: ContextWrapper): Promise<Picture> => {
        let result: Picture = [{type: 'axes', options: {labels: {x: 'x', y: 'y'}}}]
        for (const figure of figures) result = result.concat(await figure.plot(ctx, parameters))
        return result
    }, [figures, parameters])
    
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
                picture={picture}
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
        if (!width || !height) throw new Error(`invalid size ${width}x${height}`)
        await exportPdf(axes, width, height, picture)
    }

    function click(coords: Coords) {
        const panelPairs: State<IPanel>[] = map(panelsPair, panel => panel)
        const figurePairs: State<FigureState>[] = panelPairs.map(panel => getField(panel, 'figure'))
        assert(figures.length === panelPairs.length)
        assert(figures.length === figurePairs.length)
        figures.forEach((figure,i) => {
            if (get(panelPairs[i]).active) {
                figure.click(getField(panelPairs[i],'figure'), coords)
            }
        })
    }

}
