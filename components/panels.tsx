import { useState } from 'react'
import { HexColorPicker } from "react-colorful"
import 'katex/dist/katex.min.css'
import TeX from '@matejmazur/react-katex'
import { FaTrash, FaArrowUp, FaArrowDown } from 'react-icons/fa'

import { get, set, getField, update, onChange, onChangeBoolean, onChangeNumber, State } from '@/lib/State'
import { FigureState, GraphFigureState, ImplicitFigureState, OdeEquationFigureState, OdeSystemFigureState, ParameterState, Figure } from '@/lib/figures'
import Coords from '@/lib/Coords'

export function GraphPanel({state, figure, active, move}: 
    {
        state: State<GraphFigureState>,
        figure: Figure,
        active: State<boolean>,
        move: (f: FigureState, n: number) => void,
    }) {
    const color = getField(state,'color')
    const expr: State<string> = getField(state, 'expr')

    return <PanelBand 
                tex={figure.tex} 
                color={color} 
                active={active}
                move={n => move(figure.state, n)}
                >
        <div className="flex flex-row px-2 items-center">
            <span>{get(state).inverted?'x=f(y)=':'y=f(x)='}</span>
            <Input expr={expr} />
            <Errors errors={figure.errors} />
        </div>
    </PanelBand>
  }

export function ImplicitPanel({state, figure, active, move}: 
    {
        state: State<ImplicitFigureState>,
        figure: Figure,
        active: State<boolean>,
        move: (f: FigureState, n: number) => void,
    }) {
    const color = getField(state,'color')
    const expr: State<string> = getField(state, 'expr')

    return <PanelBand 
                color={color} 
                active={active} 
                tex={figure.tex}
                move={n => move(figure.state, n)}
            >
        <span>f(x,y)=</span>
        <Input expr={expr} />
        <Errors errors={figure.errors}/>
    </PanelBand>
  }

export function OdeEquationPanel({state, figure, active, move}: 
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

export function OdeSystemPanel({state, figure, active, move} : {
        state: State<OdeSystemFigureState>,
        figure: Figure,
        active: State<boolean>
        move: (f: FigureState, n: number) => void,
    }) {
    const color = getField(state,'color')
    const slopeColor = getField(state,'slopeColor')
    const exprX: State<string> = getField(state, 'exprX')
    const exprY: State<string> = getField(state, 'exprY')
    const drawSlope: State<boolean> = getField(state, 'drawSlope')
    const gridPoints: State<boolean> = getField(state, 'gridPoints') 
    const points = getField(state, 'points')

    return <PanelBand 
                active={active} 
                tex={figure.tex} 
                color={color}
                move={(n: number) => move(figure.state, n)}
            >
        <div className="flex flex-col">
            <div className="flex flex-row">
                <SlopeControl value={drawSlope} color={slopeColor} />
                <Checkbox value={gridPoints}>fill plane</Checkbox>
                <Separator />
                <table><tbody>
                    <tr>
                        <td className="text-right min-w-max whitespace-nowrap">
                        x&apos; = f(x,y) 
                        </td>
                        <td className="min-w-max whitespace-nowrap">
                        = <Input expr={exprX} />
                        </td>
                    </tr>
                    <tr>
                        <td className="text-right min-w-max whitespace-nowrap">
                        y&apos; = g(x,y) 
                        </td>
                        <td className="min-w-max whitespace-nowrap">
                        = <Input expr={exprY} />
                        </td>
                    </tr></tbody>
                </table>
                <Errors errors={figure.errors} />
            </div>
            <Points points={points} gridPoints={get(gridPoints)} />
        </div>
    </PanelBand>
  }

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


function PanelBand({active, color, children, tex, move}:{
    active: State<boolean>,
    color?: State<string>,
    tex: string
    children: any,
    move: (n: number) => void,
}) {
    return <div className="flex flex-row items-center">
        <ColorBlock color={color} active={active}/>
        <Formula tex={tex} active={active}/>
        {get(active) && <Separator />}
        {get(active) && children}
        {get(active) &&
            <div>
                <FaTrash     className="inline border bg-blue-300 p-1 hover:border-black" onClick={evt => move(+0)} size="2em"/>
                <FaArrowUp   className="inline border bg-blue-300 p-1 hover:border-black" onClick={evt => move(-1)} size="2em"/>
                <FaArrowDown className="inline border bg-blue-300 p-1 hover:border-black" onClick={evt => move(+1)} size="2em"/>
            </div>
        }   
    </div>
}

function SlopeControl({value, color}:{
        value: State<boolean>,
        color: State<string>
    }) {
    return <div className="flex flex-row items-center">
        {get(value) && <ColorBlock className="flex mr-1" color={color} />}
        <Checkbox value={value}>draw slope field</Checkbox>
    </div>
}

function ColorBlock({color, active, className}:{
    color?: State<string>,
    active?: State<boolean>,
    className?: string,
}) {
    const open = useState<boolean>(false)
    const isActive = active ? get(active) : true
    const theColor = color ? get(color) : "#000"
    return <div className="inline">
        <div 
            className={`${className||""} w-5 h-5 ${color?'rounded':'rounded-full'} m-1`} 
            style={{background: theColor}}
            onClick={() => (isActive?update(open, open => !open):(active && set(active, true)))}
        />
        {isActive && get(open) && color && <HexColorPicker 
            className=""
            color={theColor} 
            onChange={_ => set(color, _)} 
            />}
    </div>
}

function Formula({tex,active}:{
    tex: string,
    active: State<boolean>
}) {
    if (get(active)) return <TeX 
            className="px-1 hover:bg-blue-300 border border-blue-200 hover:border-blue-400 rounded" 
            math={tex} 
            onClick={() => set(active, false)}
            block />
    else return <TeX 
            className="hover:bg-blue-300 hover:border rounded" 
            math={tex} 
            onClick={() => set(active, true)}
        />
}

function Input({expr,size,right}:{
    expr: State<string>,
    size?: number,
    right?: boolean,
}){
    return <input 
        className="h-8 border p-1 bg-blue-100" 
        style={{textAlign: right?'right':'left'}}
        type="text" 
        value={get(expr)} 
        onChange={onChange(expr)} 
        size={size || undefined}
    />
}

function InputNumber({expr,size,right}:{
    expr: State<number>,
    size?: number,
    right?: boolean,
}){
    const value = useState<string>(`${get(expr)}`)
    const error=useState<boolean>(false)
    return <input 
        className={`h-8 border p-1 ${get(error)?'bg-red-300':'bg-blue-100'}`}
        style={{textAlign: right?'right':'left'}}
        type="text" 
        value={get(value)} 
        onChange={(evt) => {
            const s = evt.target.value
            const v = parseFloat(s)
            if (isNaN(v)) {
                set(error, true)
            } else {
                set(error, false)
                set(value, s)
                set(expr, v)
            }
        }}
        size={size || undefined}
    />
}

function Checkbox({value, children}:{
    value: State<boolean>,
    children: any,
}) {
    return <label className="flex flex-row items-center mx-1">
        <input className="mr-1" type="checkbox" checked={get(value)} onChange={onChangeBoolean(value)} />
        {children}
    </label>
}

function Separator() {
    return <div className="m-1 h-10 border-r-2 border-blue-400" />
}

function Points({points, gridPoints}: 
    {points: State<Coords[]>, gridPoints: boolean}) {
    return <div className="flex flex-wrap">
    { get(points).length > 0 
        ? get(points).map((p,i) =>  
        <span 
            key={i} 
            className="online hover:line-through hover:bg-blue-300 mr-1"
            onClick={() => update(points, points => points.filter((_,j) => i!==j))}
        >({Math.round(p.x*100)/100}, {Math.round(p.y*100)/100})</span>)
        : (!gridPoints && <span className="online bg-red-300"> click on picture to draw an integral line or check &apos;fill plane&apos;
          </span>)
    }
    </div>
}

function Errors({errors}:{
    errors: string[]
}) {
    if (errors.length===0) return null
    return <div className="bg-red-200">
        { errors.map((error,i) => <div className="" key={i}>{error}</div>)}
    </div>
}