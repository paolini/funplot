import {State,get,getField} from '@/lib/State'
import {Figure} from '@/lib/figures'
import { FigureState, OdeEquationFigureState } from '@/lib/figures'
import Checkbox from './Checkbox'
import Separator from './Separator'
import PanelBand from './PanelBand'
import Input from './Input'
import Points from './Points'
import Errors from './Errors'

export default function OdeEquationPanel({state, figure, active, move}: 
    {
        state: State<OdeEquationFigureState>,
        figure: Figure,
        active: State<boolean>,
        move: (f: FigureState, n: number) => void,
    }) {
    const color = getField(state,'color')
    const expr: State<string> = getField(state, 'expr')
    const drawSlope: State<boolean> = getField(state, 'drawSlope')
    const gridPoints: State<boolean> = getField(state, 'gridPoints') 

    return <PanelBand 
                active={active} 
                tex={figure.tex} 
                color={color}
                move={n => move(figure.state, n)}
            >
        <div className="flex flex-col">
            <div className="flex">
                <Checkbox value={drawSlope}>draw slope field</Checkbox>
                <Checkbox value={gridPoints}>fill plane</Checkbox>
                <Separator />
                <span>y&apos; = </span>
                <Input expr={expr}/>
                <Errors errors={figure.errors} />
            </div>
            <Points points={getField(state, 'points')} gridPoints={get(gridPoints)} />
        </div>
    </PanelBand>
  }
