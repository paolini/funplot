'use client'
import { useState, useEffect } from 'react'
import assert from 'assert'
import { ContextWrapper } from '@/lib/plot'
import { get, set, getField, update, map, State, } from '@/lib/State'
import Coords from '@/lib/Coords'
import Canvas from '@/components/Canvas'

import { FigureState, ParameterState, createFigure } from '@/lib/figures'
import { Axes } from '@/lib/plot'
import Messages, { IMessage } from './Messages'
import { Lines } from '@/lib/lines'
import { hashLoad, panelToOptions } from '@/lib/hashConverter'
import { BANNER } from '@/app/info'
import { IPanel, exportPdf, draw, newPanel } from '@/lib/funplot'
import Header from '@/components/Header'
import PanelElements from '@/components/PanelElements'

export default function Funplot() {
    const axes = useState<Axes>({x: 0, y: 0, r: 5})
    const panelsPair = useState<IPanel[]>([])
    const messages = useState<IMessage[]>([])
    const [pending, setPending] = useState<{timeout: NodeJS.Timeout|null}>({timeout: null})
    const [lines, setLines] = useState<Lines>([])
    const updateCount = useState<number>(1)
    const drawCount = useState<number>(0)
    const cursor = useState<Coords>({x:0, y:0})
    const width = useState<number>(0)
    const height = useState<number>(0)

    useEffect(() => {
        /* load data from url */
        console.log("loadFromHash")
        const load = hashLoad(window.location.hash)
        if (!load) return
        set(axes, load.axes)
        set(panelsPair, load.figures.map(newPanel))
        console.log(BANNER)
    }, [])

    const parameterList: string[] = get(panelsPair)
        .map(panel => panel.figure)
        .filter((figure: FigureState): figure is ParameterState => figure.type === 'parameter')
        .map(f => f.name)

    const figures = get(panelsPair).map(p => createFigure(p.figure, parameterList))

    useEffect(() => {
        //console.log("changed!")
        update(updateCount, count => count+1)
    }, [get(axes),get(panelsPair)])

    return <main className="flex flex-col flex-1 bg-blue-200">
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
        <div className="flex-1 h-8">  
            <Canvas 
                axes={axes}
                plot={plot} 
                click={click}
                move={pos => set(cursor,pos)}
            />
        </div>
    </main>

    function share() {
        const panels = get(panelsPair)
        const opt = {
            p: get(axes),
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

    function downloadPDF() {
        exportPdf(get(axes), get(width), get(height), lines)
    }

    async function plot(ctx: ContextWrapper) {
        // console.log('plot!')
        draw(ctx, lines)
        if (get(updateCount)!==get(drawCount)) {
            if (pending.timeout) clearTimeout(pending.timeout)
            pending.timeout = setTimeout(async () => {
                // console.log('recompute')
                let mylines: Lines = []
                const parameters = Object.fromEntries(parameterList.map(p => [p,0]))

                // set parameters
                for(const figure of figures) {
                    figure.eval(parameters)
                }

                // plot
                for(const figure of figures) {
                    mylines = mylines.concat(await figure.plot(ctx, parameters))
                }
                setLines(mylines)
                set(drawCount, get(updateCount))
            }, 100)
        }
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

