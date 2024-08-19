'use client'
import { useState, useEffect } from 'react'
import assert from 'assert'
import { ContextWrapper } from '@/lib/plot'
import { get, set, getField, update, map, State, } from '@/lib/State'
import Coords from '@/lib/Coords'
import Canvas from '@/components/Canvas'
import PictureCanvas from '@/components/PictureCanvas'

import { FigureState, ParameterState, createFigure } from '@/lib/figures'
import { Axes } from '@/lib/plot'
import Messages, { IMessage } from './Messages'
import { Picture } from '@/lib/picture'
import { hashLoad, panelToOptions } from '@/lib/hashConverter'
import { BANNER } from '@/app/info'
import { IPanel, exportPdf, draw, newPanel } from '@/lib/funplot'
import Header from '@/components/Header'
import PanelElements from '@/components/PanelElements'

export default function Funplot() {
    const axes = useState<Axes>({x: 0, y: 0, r: 5})
    const panelsPair = useState<IPanel[]>([])
    const messages = useState<IMessage[]>([])
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
    const bifurcation = computeBifurcation()
    
    return <main className="flex-col flex-1 bg-blue-200">
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
                picture={picture}
                click={click}
                move={pos => set(cursor,pos)}
            />
            { bifurcation.enabled && 
                <PictureCanvas 
                    axes={axes}
                    picture={bifurcationPicture}
                />
            }
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

    async function downloadPDF() {
        await exportPdf(get(axes), get(width), get(height), picture)
    }

    async function picture(ctx: ContextWrapper) {
        const parameters = Object.fromEntries(parameterList.map(p => [p,0]))

        // compute parameters
        for(const figure of figures) {
            figure.eval(parameters)
        }

        // plot
        let myPicture: Picture = [{
            type: "axes",
            options: {labels: {x:'x', y:'y'}}
        }]

        for(const figure of figures) {
            myPicture = myPicture.concat(await figure.plot(ctx, parameters))
        }
        return myPicture
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

    function computeBifurcation() {
        let enabled = false
        let param: ParameterState|null = null
        let axes: Axes|null = null
        for (const figure of figures) {
            const state = figure.state
            if (state.type !== "recurrence") {
                if (state.type === "parameter") {
                    param=state
                }
                continue
            }
            if (!state.drawBifurcation) continue
            enabled = true
        }
        return {enabled,param}
    }

    async function bifurcationPicture(ctx: ContextWrapper): Promise<Picture> {
        if (!bifurcation.param) return []
        let picture: Picture = [{
            type: "axes",
            options: {labels:{x:'x', y:bifurcation.param.name}}
        }]
        for (const figure of figures) {
            if (figure.state.type !== 'recurrence') continue
            if (!figure.state.drawBifurcation) continue
            if (!bifurcation.param) continue
        }
        return picture
    }
}

