import { compile, parse } from 'mathjs'
import assert from 'assert'

import {plotGraph,plotInvertedGraph} from '@/lib/plotGraph'
import levelPlot from './plotLevels'
import { odePlot, slopeGraph, OdePlotOptions, Fun2 } from '@/lib/plotOde'
import { plotRecurrence } from '@/lib/plotRecurrence'
import Coords from '@/lib/Coords'
import { State, getField, update, set } from './State'
import { Picture } from './picture'
import { AxesWrapper } from './plot'

export type PlotParameters = {
    [name: string]: number
}

export interface GraphFigureState {
    type: 'graph'
    color: string
    inverted: boolean
    expr: string
}

export interface ImplicitFigureState {
    type: 'implicit'
    color: string
    expr: string
}

export interface OdeEquationFigureState extends OdeFigureStateCommon {
    type: 'ode'
    expr: string
}

export interface OdeSystemFigureState extends OdeFigureStateCommon {
    type: 'system'
    exprX: string
    exprY: string
    drawArrows: boolean
}

export interface OdeFigureStateCommon {
    color: string
    slopeColor: string
    drawSlope: boolean
    gridPoints: boolean
    gridCount: number // 10
    points: Coords[]
}

export interface RecurrenceFigureState {
    type: 'recurrence'
    expr: string
    graphColor: string
    webColor: string
    start: number
    drawBifurcation: boolean
}

export interface ParameterState {
    type: 'parameter'
    expr: string
    name: string
    min: number
    max: number
}

export type FigureState = 
    GraphFigureState |
    ImplicitFigureState |
    OdeEquationFigureState |
    OdeSystemFigureState |
    RecurrenceFigureState |
    ParameterState

export interface Figure {
    state: FigureState
    eval: (parameters: PlotParameters) => void
    plot: (axes: AxesWrapper, parameters: PlotParameters) => Promise<Picture>
    click: (state: State<FigureState>, point: Coords) => void
    tex: string,
    errors: string[],
    compiledExpr: math.EvalFunction|null
}

export function createFigure(state: FigureState, parameters: string[]): Figure {
    switch(state.type) {
        case 'graph':
            return graphFigure(state, parameters)
        case 'implicit':
            return implicitFigure(state, parameters)
        case 'ode':
            return odeEquationFigure(state, parameters)
        case 'system':
            return odeSystemFigure(state, parameters)
        case 'recurrence':
            return recurrenceFigure(state, parameters)
        case 'parameter':
            return parameterFigure(state, parameters)
    }
}

function getFunX(compiledExpr: math.EvalFunction, parameters: PlotParameters) {
    const vars = {...parameters, x:0}
    return (x: number) => {
        vars.x = x
        return compiledExpr.evaluate(vars)
    }
}

function getFunY(compiledExpr: math.EvalFunction, parameters: PlotParameters) {
    const vars = {...parameters, y:0}
    return (y: number) => {
        vars.y = y
        return compiledExpr.evaluate(vars)
    }
}

function getFunXY(compiledExpr: math.EvalFunction, parameters: PlotParameters) {
    const vars = {...parameters,x:0,y:0}
    return (x: number, y: number) => {
        vars.x = x
        vars.y = y
        return compiledExpr.evaluate(vars)
    }
}

function graphFigure(state: GraphFigureState, parameters: string[]): Figure {
    let fun: ((x:number) => number) | null = null
    let errors: string[] = []
    let tex = ''
    let compiledExpr: math.EvalFunction | null = null

    function getFun(compiledExpr: math.EvalFunction, parameters: PlotParameters) {
        if (state.inverted) return getFunY(compiledExpr, parameters)
        else return getFunX(compiledExpr, parameters)
    }

    try {
        compiledExpr = compile(state.expr)
        fun = getFun(compiledExpr, Object.fromEntries(parameters.map(p => [p, 0.0])))
        fun(0) // check if it is working
    } catch(e) {
        fun = null
        errors.push(`graph ${e}`)
    }
    try {
        tex = `${state.inverted ? 'x' : 'y'} = ${parse(state.expr).toTex()}`
        // MathJax.Hub.Queue(["Typeset", MathJax.Hub])
    } catch(e) {
        tex = `\\text{parse error}`
    }
    
    async function plot(axes: AxesWrapper, parameters: PlotParameters) {
        if (!compiledExpr) return []
        try {
            const fun = getFun(compiledExpr, parameters)
            if (state.inverted) return plotInvertedGraph(axes, fun, state.color)
            else return plotGraph(axes, fun, state.color)
        } catch(e) {
            console.error(e)
            return []
        }    
    }

    function click(state: State<FigureState>, point: Coords) {
    }

    function eval_(parameters: PlotParameters) {}

    return { state, eval: eval_, plot, click, tex, errors, compiledExpr}
}

function implicitFigure(state: ImplicitFigureState, parameters: string[]): Figure {
    let errors: string[] = []
    let tex = ''
    let compiledExpr: math.EvalFunction|null = null

    function getFun(compiledExpr: math.EvalFunction, parameters: PlotParameters) {
        return (x: number, y:number) => compiledExpr.evaluate({...parameters, x, y})       
    }
    
    try {
        compiledExpr = compile(state.expr)
        const fun = getFun(compiledExpr, Object.fromEntries(parameters.map(p=>[p,0])))
        fun(0,0) // check if it is working
    } catch(e) {
        compiledExpr = null
        errors.push(`${e}`)
    }
    try {
        tex = `${parse(state.expr).toTex()} = 0`
        // MathJax.Hub.Queue(["Typeset", MathJax.Hub])
    } catch(e) {
        tex = `\\text{parse error}`
    }

    async function plot(axes: AxesWrapper, parameters: PlotParameters) {
        if (!compiledExpr) return []
        try {
            const fun = getFun(compiledExpr, parameters)
            return levelPlot(axes, fun, state.color)
        } catch(e) {
            console.error(e)
            return []
        }    
    }

    function eval_(parameters: PlotParameters) {}

    function click(state: State<FigureState>, point: Coords) {}

    return {state, eval: eval_, plot, click, tex, errors, compiledExpr}
}

function odeEquationFigure(state: OdeEquationFigureState, parameters: string[]): Figure {
    let errors: string[] = []
    let compiledExpr: math.EvalFunction|null = null
    let tex = ''

    try {
        compiledExpr = compile(state.expr)
        const fun = getFunXY(compiledExpr, Object.fromEntries(parameters.map(p=>[p,0])))
        fun(0,0) // try if it is working
    } catch(e) {
        compiledExpr = null
        errors.push(`${e}`)
    }
    try {
        tex = `y' = ${parse(state.expr.replace(/y/g,'y')).toTex()}`                        
        // MathJax.Hub.Queue(["Typeset", MathJax.Hub])
    } catch(e) {
        tex = `\\text{parse error}`
    }

    async function plot(ctx: AxesWrapper, parameters: PlotParameters) {
        if (!compiledExpr) return []
        const fun = getFunXY(compiledExpr, parameters)
        const fx = (x: number, y: number) => 1.0            
        return await odePlotHelper(ctx, state, fx, fun, true)
    }

    function click(statePair: State<FigureState>, point: Coords) {
        assert(statePair[0].type === 'ode')
        const odePair: State<OdeEquationFigureState> = statePair as State<OdeEquationFigureState>
        const points = getField(odePair, 'points')
        update<Coords[]>(points, points => [...points, point])
    }

    function eval_(parameters: PlotParameters) {}

    return {state, eval: eval_, plot, click, tex, errors, compiledExpr}
}

function odeSystemFigure(state: OdeSystemFigureState, parameterList: string[]): Figure {
    let errors: string[] = []
    let tex = ''
    let compiledExprX: math.EvalFunction|null = null
    let compiledExprY: math.EvalFunction|null = null

    try {
        compiledExprX = compile(state.exprX)
        compiledExprY = compile(state.exprY)
        const parameters = Object.fromEntries(parameterList.map(p=>[p,0]))
        const funX = getFunXY(compiledExprX, parameters)
        const funY = getFunXY(compiledExprY, parameters)
        funX(0,0) // check if it is working
        funY(0,0)
    } catch(e) {
        compiledExprX = null
        compiledExprY = null
        errors.push(`${e}`)
    }
    try {
        tex = `
            \\begin{cases}
            x' = ${parse(state.exprX).toTex()} \\\\
            y' = ${parse(state.exprY).toTex()} \\\\
            \\end{cases}`
        // MathJax.Hub.Queue(["Typeset", MathJax.Hub])
    } catch(e) {
        tex=`\\text{parse error}`
    }

    async function plot(ctx: AxesWrapper, parameters: PlotParameters) {
        if (!(compiledExprX && compiledExprY)) return []
        const funX = getFunXY(compiledExprX, parameters)
        const funY = getFunXY(compiledExprY, parameters)
        return await odePlotHelper(ctx, state, funX, funY, false)
    }

    function click(statePair: State<FigureState>, point: Coords) {
        assert(statePair[0].type === 'system')
        const systemPair: State<OdeSystemFigureState> = statePair as State<OdeSystemFigureState>
        const points = getField(systemPair, 'points')
        update<Coords[]>(points, points => [...points, point])
    }

    function eval_(parameters: PlotParameters) {}

    return {state, eval: eval_, plot, click, tex, errors, compiledExpr: null}
}

async function odePlotHelper(ctx: AxesWrapper, state: OdeFigureStateCommon, fx: Fun2, fy: Fun2, equation: boolean) {
    try {
        var options: OdePlotOptions = {
            draw_arrows: !equation,
            equation: equation,
            grid_points: [],
            grid_distance: 0,
            grid_count: state.gridCount,
            color: state.color,
        };

        if (state.gridPoints) {
            var dx = ctx.radius / state.gridCount;
            var dy = dx;
            options.grid_distance = Math.sqrt(2) * dx / 1.99;
            for (var x = ctx.xMin + dx/2; x < ctx.xMax; x+=dx) {
                for (var y = ctx.yMin + dy/2; y < ctx.yMax; y+=dy) {
                    options.grid_points.push([x,y]);
                }
            }
        }

        let lines: Picture = []
        if (state.drawSlope) {
            lines.push(slopeGraph(ctx, fx, fy, !equation, state.slopeColor))
        }

        state.points.forEach(({x, y}) => {
            lines.push(odePlot(ctx, fx, fy, x, y, options))
        })

        for(;;) {
            const point = options.grid_points.pop();
            if (point === undefined) break
            const [x,y] = point
            lines.push(odePlot(ctx, fx, fy, x, y, options))
        }
        return lines
    } catch(e) {
        console.error(e)
        return []
    }    
}

function recurrenceFigure(state: RecurrenceFigureState, parameterList: string[]): Figure {
    let errors: string[] = []
    let tex = ''
    let compiledExpr: math.EvalFunction|null = null

    try {
        compiledExpr = compile(state.expr)
        const parameters = Object.fromEntries(parameterList.map(p=>[p,0]))
        const fun = getFunX(compiledExpr, parameters)
        fun(0) // check if it is working
    } catch(e) {
        compiledExpr = null
        errors.push(`${e}`)
    }
    try {
        tex = `
            \\begin{cases}
            a_0 = ${Number.isNaN(state.start)?'???':state.start}\\\\
            a_{n+1} = f(a_n)\\\\
            f(x) = ${parse(state.expr).toTex()} \\\\
            \\end{cases}`
        // MathJax.Hub.Queue(["Typeset", MathJax.Hub])
    } catch(e) {
        tex=`\\text{parse error}`
    }

    async function plot(axes: AxesWrapper, parameters: PlotParameters): Promise<Picture> {
        if (!compiledExpr) return []
        try {
            const fun = getFunX(compiledExpr, parameters)
            return [
                ...plotRecurrence(axes, fun, state.start, state.webColor),
                ...plotGraph(axes, fun, state.graphColor),
                ...plotGraph(axes, x=>x, "#AAAAAA"),
            ]
        } catch(e) {
            console.error(e)
            return []
        }    
    }

    function click(statePair: State<FigureState>, point: Coords) {
        assert(statePair[0].type === 'recurrence')
        const recurrencePair: State<RecurrenceFigureState> = statePair as State<RecurrenceFigureState>
        const start = getField(recurrencePair, 'start')
        set(start, point.x)
    }

    function eval_(parameters: PlotParameters) {}

    return {state, eval: eval_, plot, click, tex, errors, compiledExpr}
}

function parameterFigure(state: ParameterState, parameters: string[]): Figure {
    let errors: string[] = []
    let tex = ''
    let compiledExpr: math.EvalFunction|null = null

    function getVal(compiledExpr: math.EvalFunction, parameters: PlotParameters) {
        return compiledExpr.evaluate(parameters)
    }

    try {
        compiledExpr = compile(state.expr)
        getVal(compiledExpr, Object.fromEntries(parameters.map(p => [p, 0.0])))
    } catch(e) {
        errors.push(`${e}`)
    }
    try {
        tex = `${state.name} = ${parse(state.expr).toTex()}`
        // MathJax.Hub.Queue(["Typeset", MathJax.Hub])
    } catch(e) {
        tex = `\\text{parse error}`
    }
    
    async function plot(axes: AxesWrapper, parameters: PlotParameters) {
        return []
    }

    function click(state: State<FigureState>, point: Coords) {}

    function eval_(parameters: PlotParameters) {
        if (!compiledExpr) return
        const value = getVal(compiledExpr, parameters)
        parameters[state.name] = value
    }

    return { state, eval: eval_, plot, click, tex, errors, compiledExpr:null }
}
