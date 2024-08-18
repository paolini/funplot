import { get, getField, State, onChange } from '@/lib/State'
import { FigureState, ParameterState, Figure } from '@/lib/figures'
import PanelBand from './PanelBand'
import Input from './Input'
import InputNumber from './InputNumber'
import Errors from './Errors'

export function ParameterPanel({state, figure, active, move}: 
    {
        state: State<ParameterState>,
        figure: Figure,
        active: State<boolean>,
        move: (f: FigureState, n: number) => void,
    }) {
    const expr: State<string> = getField(state, 'expr')
    const name: State<string> = getField(state, 'name')
    const min: State<number> = getField(state, 'min')
    const max: State<number> = getField(state, 'max')

    return <PanelBand 
                tex={figure.tex} 
                active={active}
                move={n => move(figure.state, n)}
                >
        <div className="flex flex-row px-2 items-center">
            <Input expr={name} size={1} right={true}/>
            <span>=</span>
            <Input expr={expr} />
            <div className="m-2"/>
            <InputNumber expr={min} size={1}/>
            <input 
                type="range" 
                className="slider" 
                value={get(expr)} 
                min={get(min)}
                max={get(max)}
                step={0.001*(get(max)-get(min))}
                onChange={onChange(expr)}
            />
            <InputNumber expr={max} size={1}/>
            <Errors errors={figure.errors} />
        </div>
    </PanelBand>
  }

