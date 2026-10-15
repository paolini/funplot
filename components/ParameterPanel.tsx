import type {PanelFigure} from '@/lib/plotScene'
import { get, getField, State } from '@/lib/State'
import { FigureState, ParameterState } from '@/lib/figures'
import PanelBand from './PanelBand'
import Input from './Input'
import InputNumber from './InputNumber'
import Errors from './Errors'

export function ParameterPanel({state, figure, active, move, chooseParameter}:
    {
        state: State<ParameterState>,
        figure: PanelFigure,
        active: State<boolean>,
        move: (f: FigureState, n: number) => void,
        chooseParameter: (name: string, value: number) => void,
    }) {
    const expr: State<string> = getField(state, 'expr')
    const name: State<string> = getField(state, 'name')
    const min: State<number> = getField(state, 'min')
    const max: State<number> = getField(state, 'max')

    return <PanelBand 
                tex={figure.tex} 
                formulaClassName="app-parameter-formula"
                active={active}
                move={n => move(figure.state, n)}
                >
        <div className="flex flex-row px-2 items-center">
            <Input expr={name} size={1} right={true}/>
            <span>=</span>
            <Input expr={expr} />
            <div className="m-2"/>
            <InputNumber expr={min} size={6} label="Minimum"
                validate={value => value < get(max) ? undefined : 'Minimum must be less than maximum.'} />
            <input 
                type="range" 
                aria-label={`Parameter ${get(name)}`}
                className="slider" 
                value={get(expr)} 
                min={get(min)}
                max={get(max)}
                step={0.00001*(get(max)-get(min))}
                onChange={event => chooseParameter(get(name), event.currentTarget.valueAsNumber)}
            />
            <InputNumber expr={max} size={6} label="Maximum"
                validate={value => value > get(min) ? undefined : 'Maximum must be greater than minimum.'} />
            <Errors errors={figure.errors} />
        </div>
    </PanelBand>
  }

