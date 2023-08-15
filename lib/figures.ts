import { compile, parse } from 'mathjs'
import assert from 'assert'

import funGraph from '@/lib/funGraph'
import levelPlot from './levels'
import { odePlot, slopeGraph, OdePlotOptions, Fun2 } from '@/lib/ode'
import Coords from '@/lib/Coords'
import { State, SetState, get, getField, update } from './State'
import { Axes, Lines } from './axes'

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

export interface OdeFigureStateCommon {
    color: string
    slopeColor: string
    drawSlope: boolean,
    gridPoints: boolean,
    gridCount: number, // 10
    points: Coords[],
}

export interface OdeEquationFigureState extends OdeFigureStateCommon {
    type: 'ode'
    expr: string
}

export interface OdeSystemFigureState extends OdeFigureStateCommon {
    type: 'system'
    exprX: string,
    exprY: string,
    drawArrows: boolean,
}

export type FigureState = 
    GraphFigureState |
    ImplicitFigureState |
    OdeEquationFigureState |
    OdeSystemFigureState

export interface Figure {
    state: FigureState
    plot: (axes: Axes) => Promise<Lines>
    click: (state: State<FigureState>, point: Coords) => void
    tex: string,
    errors: string[]
}

export function figure(state: FigureState): Figure {
    switch(state.type) {
        case 'graph':
            return graphFigure(state)
        case 'implicit':
            return implicitFigure(state)
        case 'ode':
            return odeEquationFigure(state)
        case 'system':
            return odeSystemFigure(state)
    }
}

function graphFigure(state: GraphFigureState): Figure {
    let fun: ((x:number) => number) | null = null
    let errors: string[] = []
    let tex = ''
    try {
        const compiledExpr = compile(state.expr)
        if (state.inverted) {
            fun = y => compiledExpr.evaluate({y})
        } else {
            fun = x => compiledExpr.evaluate({x})
        }
        fun(0) // check if it is working
    } catch(e) {
        fun = null
        errors.push(`${e}`)
    }
    try {
        tex = `${state.inverted ? 'x' : 'y'} = ${parse(state.expr).toTex()}`
        // MathJax.Hub.Queue(["Typeset", MathJax.Hub])
    } catch(e) {
        tex = `\\text{parse error}`
    }
    
    async function plot(axes: Axes) {
        if (!fun) return []
        try {
            return funGraph(axes, fun, state.inverted, state.color)
        } catch(e) {
            console.error(e)
            return []
        }    
    }

    function click(state: State<FigureState>, point: Coords) {
    }

    return { state, plot, click, tex, errors }
}

function implicitFigure(state: ImplicitFigureState): Figure {
    let fun: ((x:number, y:number) => number) | null = null
    let errors: string[] = []
    let tex = ''
    try {
        const compiledExpr = compile(state.expr)
        fun = (x,y) => compiledExpr.evaluate({x, y})
        fun(0,0) // check if it is working
    } catch(e) {
        fun = null
        errors.push(`${e}`)
    }
    try {
        tex = `${parse(state.expr).toTex()} = 0`
        // MathJax.Hub.Queue(["Typeset", MathJax.Hub])
    } catch(e) {
        tex = `\\text{parse error}`
    }

    async function plot(axes: Axes) {
        if (!fun) return []
        try {
            return levelPlot(axes, fun, state.color)
        } catch(e) {
            console.error(e)
            return []
        }    
    }

    function click(state: State<FigureState>, point: Coords) {}
    return {state, plot, click, tex, errors}
}

function odeEquationFigure(state: OdeEquationFigureState): Figure {
    let fun: ((x:number, y:number) => number) | null = null
    let errors: string[] = []
    let tex = ''
    try {
        const compiledExpr = compile(state.expr)
        fun = (x,y) => compiledExpr.evaluate({x, y})
        fun(0,0) // try if it is working
    } catch(e) {
        fun = null
        errors.push(`${e}`)
    }
    try {
        tex = `y' = ${parse(state.expr.replace(/y/g,'y')).toTex()}`                        
        // MathJax.Hub.Queue(["Typeset", MathJax.Hub])
    } catch(e) {
        tex = `\\text{parse error}`
    }

    async function plot(ctx: Axes) {
        if (!fun) return []
        const fx = (x: number, y: number) => 1.0            
        return await odePlotHelper(ctx, state, fx, fun, true)
    }

    function click(statePair: State<FigureState>, point: Coords) {
        assert(statePair[0].type === 'ode')
        const odePair: State<OdeEquationFigureState> = statePair as State<OdeEquationFigureState>
        const points = getField(odePair, 'points')
        update<Coords[]>(points, points => [...points, point])
    }

    return {state, plot, click, tex, errors}
}

function odeSystemFigure(state: OdeSystemFigureState): Figure {
    let funX: ((x:number, y:number) => number) | null = null
    let funY: ((x:number, y:number) => number) | null = null
    let errors: string[] = []
    let tex = ''
    try {
        const compiledExprX = compile(state.exprX)
        const compiledExprY = compile(state.exprY)
        funX = (x,y) => compiledExprX.evaluate({x, y})
        funY = (x,y) => compiledExprY.evaluate({x, y})
        funX(0,0) // check if it is working
        funY(0,0)
    } catch(e) {
        funX = null
        funY = null
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

    async function plot(ctx: Axes) {
        if (funX && funY) {
            return await odePlotHelper(ctx, state, funX, funY, false)
        } else return []
    }

    function click(statePair: State<FigureState>, point: Coords) {
        assert(statePair[0].type === 'system')
        const systemPair: State<OdeSystemFigureState> = statePair as State<OdeSystemFigureState>
        const points = getField(systemPair, 'points')
        update<Coords[]>(points, points => [...points, point])
    }

    return {state, plot, click, tex, errors}
}

async function odePlotHelper(ctx: Axes, state: OdeFigureStateCommon, fx: Fun2, fy: Fun2, equation: boolean) {
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

        let lines: Lines = []
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

