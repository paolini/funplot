import type { FigureState } from './figures'
import type { Axes } from './plot'
import type { IPanel } from './funplot'

export const SHARE_VERSION = 1

type RecordValue = Record<string, unknown>

function record(value: unknown): RecordValue {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Invalid shared plot data')
    }
    return value as RecordValue
}

function number(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error('Expected a finite number in shared plot')
    }
    return value
}

function text(value: unknown): string {
    if (typeof value !== 'string') throw new Error('Expected text in shared plot')
    return value
}

function flag(value: unknown, fallback = false): boolean {
    if (value === undefined) return fallback
    if (typeof value !== 'boolean') throw new Error('Expected a boolean in shared plot')
    return value
}

function gridCount(value: unknown): number {
    if (value === undefined) return 20
    const count = number(value)
    if (!Number.isInteger(count) || count < 1 || count > 100) {
        throw new Error('Invalid grid size in shared plot')
    }
    return count
}

function loadCoord(value: unknown) {
    if (Array.isArray(value)) return {x: number(value[0]), y: number(value[1])}
    const point = record(value)
    return {x: number(point.x), y: number(point.y)}
}

function points(value: unknown) {
    if (!Array.isArray(value)) throw new Error('Invalid points in shared plot')
    return value.map(loadCoord)
}

/** Accept unversioned historical links as well as the current format. */
export function hashLoad(hash: string): {axes: Axes, figures: FigureState[]}|void {
    if (!hash.startsWith('#q=')) return
    const opt = record(JSON.parse(decodeURIComponent(hash.slice(3))))
    if (opt.v !== undefined && opt.v !== SHARE_VERSION) {
        throw new Error('Unsupported shared plot version')
    }
    const p = record(opt.p)
    const axes: Axes = {
        x: number(p.x),
        y: number(p.y),
        rx: p.rx === undefined ? 4 * number(p.r) / 5 : number(p.rx),
        ry: p.ry === undefined ? 3 * number(p.r) / 5 : number(p.ry),
    }
    if (axes.rx <= 0 || axes.ry <= 0) throw new Error('Invalid shared plot axes')
    if (!Array.isArray(opt.l)) throw new Error('Invalid shared plot figures')
    return {axes, figures: opt.l.map(newFigureState)}
}

function newFigureState(value: unknown): FigureState {
    const opts = record(value)
    switch(opts.t) {
        case 'graph':
        case 'graph_inverted': return {
            type: 'graph',
            inverted: opts.t === 'graph_inverted' || flag(opts.i),
            color: text(opts.c),
            expr: text(opts.e),
        }
        case 'implicit': return {
            type: 'implicit', color: text(opts.c), expr: text(opts.e),
        }
        case 'ode_equation': return {
            type: 'ode',
            color: text(opts.c), slopeColor: text(opts.sc), expr: text(opts.e),
            drawSlope: flag(opts.ds), gridPoints: flag(opts.gp),
            gridCount: gridCount(opts.gn), points: points(opts.l),
        }
        case 'ode_system': return {
            type: 'system',
            exprX: text(opts.ex), exprY: text(opts.ey),
            color: text(opts.c), slopeColor: text(opts.sc),
            drawSlope: flag(opts.ds), drawArrows: flag(opts.da, true),
            gridPoints: flag(opts.gp), gridCount: gridCount(opts.gn),
            points: points(opts.l),
        }
        case 'recurrence': return {
            type: 'recurrence', expr: text(opts.e),
            webColor: text(opts.wc), graphColor: text(opts.gc),
            // JSON represents an unset (NaN) initial point as null.
            start: opts.s === null ? NaN : number(opts.s),
            drawBifurcation: flag(opts.db),
        }
        case 'parameter': return {
            type: 'parameter', expr: text(opts.e), name: text(opts.n),
            min: number(opts.m), max: number(opts.M),
        }
        default: throw new Error('Unknown figure type in shared plot')
    }
}

export function panelToOptions(panel: IPanel) {
    const state = panel.figure
    switch(state.type) {
        case 'graph': return {
            t: 'graph', i: state.inverted, c: state.color, e: state.expr,
        }
        case 'implicit': return {
            t: 'implicit', c: state.color, e: state.expr,
        }
        case 'ode': return {
            t: 'ode_equation', c: state.color, sc: state.slopeColor,
            e: state.expr, ds: state.drawSlope, gp: state.gridPoints,
            gn: state.gridCount, l: state.points.map(p => [p.x, p.y]),
        }
        case 'system': return {
            t: 'ode_system', ex: state.exprX, ey: state.exprY,
            c: state.color, sc: state.slopeColor,
            ds: state.drawSlope, da: state.drawArrows, gp: state.gridPoints,
            gn: state.gridCount, l: state.points.map(p => [p.x, p.y]),
        }
        case 'recurrence': return {
            t: 'recurrence', e: state.expr, s: state.start,
            wc: state.webColor, gc: state.graphColor, db: state.drawBifurcation,
        }
        case 'parameter': return {
            t: 'parameter', e: state.expr, n: state.name, m: state.min, M: state.max,
        }
    }
}
