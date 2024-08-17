import assert from 'assert'

import { Figure, FigureState, GraphFigureState, ImplicitFigureState, OdeEquationFigureState, OdeSystemFigureState, RecurrenceFigureState, ParameterState } from '@/lib/figures'
import { get, set, getField, update, map, extract, State, } from '@/lib/State'
import { GraphPanel, ImplicitPanel, OdeEquationPanel, OdeSystemPanel, RecurrencePanel, ParameterPanel } from '@/components/panels'
import { IPanel, extractFigurePairFromPanels, newPanel } from '@/lib/funplot'
import Coords from '@/lib/Coords'

export default function PanelElements({panelsPair, figures, cursor}:{
    panelsPair: State<IPanel[]>,
    figures: Figure[],
    cursor: State<Coords>,
}) {
    const panels = get(panelsPair)
    assert(panels.length === figures.length)

    function move(figure: FigureState, n: number) {
        if (n === 0) {
            update(panelsPair, panels => panels.filter(p => p.figure !== figure))
        } else {
            const i = panels.findIndex(p => p.figure === figure)
            const j = i + n
            if (j < 0 || j >= panels.length) return
            const newPanels = [...panels]
            const tmp = newPanels[i]
            newPanels[i] = newPanels[j]
            newPanels[j] = tmp
            set(panelsPair, newPanels)
        }
    }

    return <>
        {
        panels.map((panel,i) => {
        const state: FigureState = panel.figure
        const active = getField(extract(panelsPair, panel),'active')
        switch(state.type) {
            case 'graph':
                return <GraphPanel 
                        key={panel.key} 
                        state={extractFigurePairFromPanels<GraphFigureState>(panelsPair, state)}
                        figure={figures[i]}
                        active={active}
                        move={move}
                />
            case 'implicit':
                return <ImplicitPanel 
                        key={panel.key} state={extractFigurePairFromPanels<ImplicitFigureState>(panelsPair, state)}
                        figure={figures[i]}
                        active={active}
                        move={move}
                />
            case 'ode':
                return <OdeEquationPanel key={panel.key} state={extractFigurePairFromPanels<OdeEquationFigureState>(panelsPair, state)}
                        figure={figures[i]}
                        active={active}
                        move={move}
                    />
            case 'system':
                return <OdeSystemPanel key={panel.key} state={extractFigurePairFromPanels<OdeSystemFigureState>(panelsPair, state)}
                        figure={figures[i]}
                        active={active}
                        move={move}
                    />
            case 'recurrence':
                return <RecurrencePanel 
                    key={panel.key} 
                    state={extractFigurePairFromPanels<RecurrenceFigureState>(panelsPair, state)}
                    figure={figures[i]}
                    active={active}
                    move={move}
                />
            case 'parameter':
                return <ParameterPanel key={panel.key} state={extractFigurePairFromPanels<ParameterState>(panelsPair, state)}
                    figure={figures[i]}
                    active={active}
                    move={move}
                    />
        }
    })
    }
        <div className="flex flex-row">
            <select 
                value="" 
                className="border mx-1 bg-gray-300 hover:bg-gray-400 text-gray-800" 
                onChange={evt => update(panelsPair, panels => [...panels, newPanel(evt.target.value)])}
            >
                <option value="" disabled={true}>choose plot type</option>
                <option value="graph">graph y=f(x)</option>
                <option value="graph_inverted">graph x=f(y)</option>
                <option value="implicit">level curve f(x,y)=0</option>
                <option value="ode">ODE equation</option>
                <option value="system">ODE system</option>
                <option value="recurrence">cobweb diagram</option>
                <option value="" disabled={true}>-------</option>
                <option value="parameter">new parameter</option>
            </select>
            <span>x={get(cursor).x}</span><span className="ms-2">y={get(cursor).y}</span>
        </div>
    </>
}
