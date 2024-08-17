import { FigureState } from './figures'
import { Axes } from './plot'
import { IPanel } from '@/lib/funplot'

`
TESTING:
http://localhost:3000/#q=%7B%22p%22%3A%7B%22x%22%3A0%2C%22y%22%3A0%2C%22r%22%3A5%7D%2C%22l%22%3A%5B%7B%22t%22%3A%22ode_equation%22%2C%22e%22%3A%22x%5E2*exp(y)%22%2C%22c%22%3A%22%234A90E2%22%2C%22sc%22%3A%22%237ED321%22%2C%22ds%22%3Afalse%2C%22gp%22%3Atrue%2C%22l%22%3A%5B%5D%7D%5D%7D
http://localhost:3000/#q=%7B%22p%22%3A%7B%22x%22%3A0.06254685170865516%2C%22y%22%3A-0.11758873413430246%2C%22r%22%3A7.348071607205723%7D%2C%22l%22%3A%5B%7B%22t%22%3A%22ode_equation%22%2C%22e%22%3A%22x*y%5E2%2Bx%22%2C%22c%22%3A%22%234A90E2%22%2C%22sc%22%3A%22%237ED321%22%2C%22ds%22%3Afalse%2C%22gp%22%3Atrue%2C%22l%22%3A%5B%5D%7D%5D%7D
http://localhost:3000/#q=%7B%22p%22%3A%7B%22x%22%3A0.06254685170865516%2C%22y%22%3A-0.11758873413430246%2C%22r%22%3A7.348071607205723%7D%2C%22l%22%3A%5B%7B%22t%22%3A%22ode_equation%22%2C%22e%22%3A%22y%20%2F%20abs(y)%5E(2%2F3)%22%2C%22c%22%3A%22%234A90E2%22%2C%22sc%22%3A%22%237ED321%22%2C%22ds%22%3Afalse%2C%22gp%22%3Afalse%2C%22l%22%3A%5B%7B%22x%22%3A0.19587884700344577%2C%22y%22%3A0.07071956130373995%7D%2C%7B%22x%22%3A0.30698884308243823%2C%22y%22%3A-0.010761102487521181%7D%2C%7B%22x%22%3A0.6403188313194156%2C%22y%22%3A0.04109022901600863%7D%2C%7B%22x%22%3A1.106980814851184%2C%22y%22%3A-0.02557576863138684%7D%2C%7B%22x%22%3A1.5736427983829522%2C%22y%22%3A0.06331222823180713%7D%2C%7B%22x%22%3A2.0477121149866533%2C%22y%22%3A-0.02557576863138684%7D%2C%7B%22x%22%3A2.5143740985184215%2C%22y%22%3A0.07071956130373995%7D%2C%7B%22x%22%3A2.9662214159063245%2C%22y%22%3A-0.010761102487521181%7D%2C%7B%22x%22%3A3.4032540671503613%2C%22y%22%3A0.12257089280726977%7D%2C%7B%22x%22%3A4.062506710552383%2C%22y%22%3A-0.062612433991051%7D%2C%7B%22x%22%3A4.44768803029289%2C%22y%22%3A0.07071956130373995%7D%2C%7B%22x%22%3A5.010645343759785%2C%22y%22%3A-0.032983101703319674%7D%2C%7B%22x%22%3A5.477307327291554%2C%22y%22%3A0.11516355973533693%7D%2C%7B%22x%22%3A5.936561977751389%2C%22y%22%3A-0.062612433991051%7D%2C%7B%22x%22%3A6.3810019620673595%2C%22y%22%3A0.11481634099759008%7D%2C%7B%22x%22%3A6.653907765564865%2C%22y%22%3A-0.04420689757925167%7D%5D%7D%5D%7D
http://localhost:3000/#q=%7B%22p%22%3A%7B%22x%22%3A0.6317763501997922%2C%22y%22%3A0.14774102772394218%2C%22r%22%3A6.954840642318821%7D%2C%22l%22%3A%5B%7B%22t%22%3A%22graph%22%2C%22e%22%3A%22tan(x)%22%2C%22c%22%3A%22%238B572A%22%7D%2C%7B%22t%22%3A%22graph%22%2C%22e%22%3A%22cos(x)%22%2C%22c%22%3A%22%230000FF%22%7D%2C%7B%22t%22%3A%22graph%22%2C%22e%22%3A%22sin(x)%22%2C%22c%22%3A%22%23417505%22%7D%2C%7B%22t%22%3A%22graph_inverted%22%2C%22e%22%3A%22pi%2F2%22%2C%22c%22%3A%22%23CED1CB%22%7D%2C%7B%22t%22%3A%22graph_inverted%22%2C%22e%22%3A%22-pi%2F2%22%2C%22c%22%3A%22%23CECFCB%22%7D%5D%7D
http://localhost:3000/#q=%7B%22p%22%3A%7B%22x%22%3A-0.05295440431163167%2C%22y%22%3A-0.3520883830793602%2C%22r%22%3A11.010098668753743%7D%2C%22l%22%3A%5B%7B%22t%22%3A%22graph%22%2C%22e%22%3A%221%22%2C%22c%22%3A%22%23D9D9D8%22%7D%2C%7B%22t%22%3A%22graph%22%2C%22e%22%3A%22-1%22%2C%22c%22%3A%22%23D3D3D3%22%7D%2C%7B%22t%22%3A%22graph%22%2C%22e%22%3A%22tanh(x)%22%2C%22c%22%3A%22%238B572A%22%7D%2C%7B%22t%22%3A%22graph%22%2C%22e%22%3A%22cosh(x)%22%2C%22c%22%3A%22%23020BFA%22%7D%2C%7B%22t%22%3A%22graph%22%2C%22e%22%3A%22sinh(x)%22%2C%22c%22%3A%22%23D0021B%22%7D%5D%7D
http://localhost:3000/#q=%7B%22p%22%3A%7B%22x%22%3A0%2C%22y%22%3A0%2C%22r%22%3A5%7D%2C%22l%22%3A%5B%7B%22t%22%3A%22ode_equation%22%2C%22e%22%3A%22x%5E2*exp(y)%22%2C%22c%22%3A%22%234A90E2%22%2C%22sc%22%3A%22%237ED321%22%2C%22ds%22%3Afalse%2C%22gp%22%3Atrue%2C%22l%22%3A%5B%5D%7D%5D%7D
http://localhost:3000/#q=%7B%22p%22%3A%7B%22x%22%3A0.24976002087478472%2C%22y%22%3A-0.17819487847667634%2C%22r%22%3A6.456342057408671%7D%2C%22l%22%3A%5B%7B%22t%22%3A%22graph%22%2C%22e%22%3A%221%22%2C%22c%22%3A%22%23D0021B%22%7D%2C%7B%22t%22%3A%22graph%22%2C%22e%22%3A%22-1%22%2C%22c%22%3A%22%23D0021B%22%7D%2C%7B%22t%22%3A%22ode_equation%22%2C%22e%22%3A%22(1-y%5E2)x%20sin(x)%22%2C%22c%22%3A%22%23000000%22%2C%22sc%22%3A%22%237ED321%22%2C%22ds%22%3Afalse%2C%22gp%22%3Afalse%2C%22l%22%3A%5B%7B%22x%22%3A-5.283862230447393e-9%2C%22y%22%3A-3.1582453986645245e-8%7D%5D%7D%5D%7D
http://localhost:3000/#q=%7B%22p%22%3A%7B%22x%22%3A-0.07614353762585471%2C%22y%22%3A-0.5940066347406062%2C%22r%22%3A6.855579953554406%7D%2C%22l%22%3A%5B%7B%22t%22%3A%22graph%22%2C%22e%22%3A%22pi%2F2%22%2C%22c%22%3A%22%23D0021B%22%7D%2C%7B%22t%22%3A%22graph%22%2C%22e%22%3A%22-pi%2F2%22%2C%22c%22%3A%22%23D0021B%22%7D%2C%7B%22t%22%3A%22ode_equation%22%2C%22e%22%3A%22cos(y)*sin(x)%22%2C%22c%22%3A%22%234A90E2%22%2C%22sc%22%3A%22%237ED321%22%2C%22ds%22%3Afalse%2C%22gp%22%3Afalse%2C%22l%22%3A%5B%7B%22x%22%3A0.0%2C%22y%22%3A0.0%7D%5D%7D%5D%7D
http://localhost:3000/#q=%7B%22p%22%3A%7B%22x%22%3A0.015%2C%22y%22%3A-0.14%2C%22r%22%3A2.77%7D%2C%22l%22%3A%5B%7B%22t%22%3A%22ode_system%22%2C%22ex%22%3A%22%20y%22%2C%22ey%22%3A%22y%20%2B%20x%22%2C%22c%22%3A%22%234A90E2%22%2C%22sc%22%3A%22%237ED321%22%2C%22ds%22%3Afalse%2C%22gp%22%3Atrue%2C%22l%22%3A%5B%5D%7D%5D%7D
http://localhost:3000/#q=%7B%22p%22%3A%7B%22x%22%3A0.015%2C%22y%22%3A-0.14%2C%22r%22%3A2.77%7D%2C%22l%22%3A%5B%7B%22t%22%3A%22ode_system%22%2C%22ex%22%3A%22%20y%22%2C%22ey%22%3A%22-x%20-y%22%2C%22c%22%3A%22%234A90E2%22%2C%22sc%22%3A%22%237ED321%22%2C%22ds%22%3Afalse%2C%22gp%22%3Atrue%2C%22l%22%3A%5B%5D%7D%5D%7D
http://localhost:3000/#q=%7B%22p%22%3A%7B%22x%22%3A0.015%2C%22y%22%3A-0.14113430003440713%2C%22r%22%3A2.775103135445589%7D%2C%22l%22%3A%5B%7B%22t%22%3A%22ode_system%22%2C%22ex%22%3A%22-2*x%2By%22%2C%22ey%22%3A%22-3*y%22%2C%22c%22%3A%22%234A90E2%22%2C%22sc%22%3A%22%237ED321%22%2C%22ds%22%3Afalse%2C%22gp%22%3Atrue%2C%22l%22%3A%5B%5D%7D%5D%7D
http://localhost:3000/#q=%7B%22p%22%3A%7B%22x%22%3A0.014%2C%22y%22%3A-0.16%2C%22r%22%3A2.92%7D%2C%22l%22%3A%5B%7B%22t%22%3A%22ode_system%22%2C%22ex%22%3A%22-x%2By%22%2C%22ey%22%3A%22-y%22%2C%22c%22%3A%22%234A90E2%22%2C%22sc%22%3A%22%237ED321%22%2C%22ds%22%3Afalse%2C%22gp%22%3Atrue%2C%22l%22%3A%5B%5D%7D%5D%7D
http://localhost:3000/#q=%7B%22p%22%3A%7B%22x%22%3A0.015%2C%22y%22%3A-0.14%2C%22r%22%3A2.77%7D%2C%22l%22%3A%5B%7B%22t%22%3A%22ode_system%22%2C%22ex%22%3A%22-x%22%2C%22ey%22%3A%22-y%22%2C%22c%22%3A%22%234A90E2%22%2C%22sc%22%3A%22%237ED321%22%2C%22ds%22%3Afalse%2C%22gp%22%3Atrue%2C%22l%22%3A%5B%5D%7D%5D%7D
http://localhost:3000/#q=%7B%22p%22%3A%7B%22x%22%3A0.015%2C%22y%22%3A-0.14%2C%22r%22%3A2.77%7D%2C%22l%22%3A%5B%7B%22t%22%3A%22ode_system%22%2C%22ex%22%3A%22-4*x%2B17*y%22%2C%22ey%22%3A%22-23*x%2B4*y%22%2C%22c%22%3A%22%234A90E2%22%2C%22sc%22%3A%22%237ED321%22%2C%22ds%22%3Afalse%2C%22gp%22%3Atrue%2C%22l%22%3A%5B%5D%7D%5D%7D
http://localhost:3000/#q=%7B%22p%22%3A%7B%22x%22%3A0.03916255253926221%2C%22y%22%3A-0.02282969005983251%2C%22r%22%3A0.7408648288253102%7D%2C%22l%22%3A%5B%7B%22t%22%3A%22graph%22%2C%22e%22%3A%22x%5E2%22%2C%22c%22%3A%22%2366B906%22%7D%2C%7B%22t%22%3A%22graph%22%2C%22e%22%3A%22-x%5E2%22%2C%22c%22%3A%22%2361B105%22%7D%2C%7B%22t%22%3A%22graph%22%2C%22e%22%3A%22x%5E2*sin(1%2Fx)%22%2C%22c%22%3A%22%23000000%22%7D%5D%7D


`
export function hashLoad(hash: string): {axes: Axes, figures: FigureState[]}|void {
    if (hash.substring(0,3) !== "#q=") return
    hash = hash.substring(3);
    hash = decodeURIComponent(hash);
    const opt = JSON.parse(hash);
    console.log('hash:', opt)
    const axes: Axes = opt.p
    const figures: FigureState[] = []
    for (const params of opt.l) {
        const figure = newFigureState(params)
        if (figure) figures.push(figure)
    }
    return { axes, figures }
}

function loadCoord(c: any) {
    if (Array.isArray(c)) return {x:c[0], y:c[1]}
    return {x: c.x, y: c.y}
}

function newFigureState(opts: any): FigureState|void { 
    console.log('newfigurestate', JSON.stringify(opts))
    switch(opts.t) {
        case 'graph': return {
            type: 'graph',
            inverted: opts.i,
            color: opts.c,
            expr: opts.e,   
        }
        case 'implicit': return {
            type: 'implicit',
            color: opts.c,
            expr: opts.e,
        }
        case 'ode_equation': return {
            type: 'ode',
            color: opts.c,
            slopeColor: opts.sc,
            expr: opts.e,
            drawSlope: false,
            gridPoints: opts.gp,
            gridCount: 20,
            points: opts.l.map(loadCoord),
        }
        case 'ode_system': return {
            type: 'system',
            exprX: opts.ex,
            exprY: opts.ey,
            color: opts.c,
            slopeColor: opts.sc,
            drawSlope: opts.ds,
            drawArrows: opts.da,
            gridPoints: opts.gp,
            gridCount: 20,
            points: opts.l.map(loadCoord),
        }
        case 'recurrence': return {
            type: 'recurrence',
            expr: opts.e,
            webColor: opts.webColor,
            graphColor: opts.graphColor,
            start: opts.s
        }
        case 'parameter': return {
            type: 'parameter',
            expr: opts.e,
            name: opts.n,
            min: opts.m,
            max: opts.M,
        }
    }
}

export function panelToOptions(panel: IPanel): Options {
    const state = panel.figure
    switch(state.type) {
        case 'graph': return {
            t: 'graph',
            i: state.inverted,
            c: state.color,
            e: state.expr,
        }
        case 'implicit': return {
            t: 'implicit',
            c: state.color,
            e: state.expr,
        }
        case 'ode': return {
            t: 'ode_equation',
            c: state.color,
            sc: state.slopeColor,
            e: state.expr,
            ds: state.drawSlope,
            gp: state.gridPoints,
            l: state.points.map(p => [p.x,p.y]),
        }
        case 'system': return {
            t: 'ode_system',
            ex: state.exprX,
            ey: state.exprY,
            c: state.color,
            sc: state.slopeColor,
            ds: state.drawSlope,
            da: state.drawArrows,
            gp: state.gridPoints,
            l: state.points.map(p => [p.x,p.y]),
        }
        case 'recurrence': return {
            t: 'recurrence',
            e: state.expr,
            s: state.start,
            wc: state.webColor,
            gc: state.graphColor
        }
        case 'parameter': return {
            t: 'parameter',
            e: state.expr,
            n: state.name,
            m: state.min,
            M: state.max,
        }
    }
}

type GraphOptions = {
    t: 'graph',
    i: boolean, // inverted
    e: string, // expr
    c: string, // color
}

type ImplicitOptions = {
    t: 'implicit',
    e: string, // expr
    c: string, // color
}

type OdeEquationOptions = {
    t: 'ode_equation',
    e: string, // expr
    c: string, // color
    sc: string, // slope_color
    ds: boolean, // draw_slope
    gp: boolean, // grid_points
    l: [number,number][], // points
}

type OdeSystemOptions = {
    t: 'ode_system',
    ex: string, // expr
    ey: string, // expr
    da: boolean, // draw_arrows
    c: string, // color
    sc: string, // slope_color
    ds: boolean, // draw_slope
    gp: boolean, // grid_points
    l: [number,number][], // points
}

type RecurrenceOptions = {
    t: 'recurrence',
    e: string, // expr
    wc: string, // webColor
    gc: string, // graphColor
    s: number // start
}

type ParameterOptions = {
    t: 'parameter',
    e: string, // expr
    n: string, // name
    m: number, // min
    M: number, // max
}

type Options 
    = GraphOptions 
    | ImplicitOptions 
    | OdeEquationOptions 
    | OdeSystemOptions
    | RecurrenceOptions 
    | ParameterOptions

