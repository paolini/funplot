import assert from 'assert'

import { Figure, FigureState, GraphFigureState, ImplicitFigureState, OdeEquationFigureState, OdeSystemFigureState, ParameterState, createFigure } from '@/lib/figures'
import { get, set, getField, update, map, extract, State, } from '@/lib/State'
import { GraphPanel, ImplicitPanel, OdeEquationPanel, OdeSystemPanel, ParameterPanel } from '@/components/panels'
import { IPanel, extractFigurePairFromPanels } from '@/lib/funplot'

export default function PanelElements({panelsPair, figures}:{
    panelsPair: State<IPanel[]>,
    figures: Figure[],
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

    return panels.map((panel,i) => {
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
            case 'parameter':
                return <ParameterPanel key={panel.key} state={extractFigurePairFromPanels<ParameterState>(panelsPair, state)}
                    figure={figures[i]}
                    active={active}
                    move={move}
                    />
        }
    })
}
