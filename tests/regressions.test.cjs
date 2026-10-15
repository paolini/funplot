const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const {newPanel, extractFigurePairFromPanels} = require('../lib/funplot.ts');
const {hashLoad, panelToOptions, SHARE_VERSION} = require('../lib/hashConverter.ts');
const {createFigure} = require('../lib/figures.ts');
const {odePlot, slopeGraph} = require('../lib/plotOde.ts');
const {zoomAxes} = require('../lib/plot.ts');

const axes = {x: 0, y: 0, rx: 4, ry: 3};
const plot = {xMin: -4, xMax: 4, yMin: -3, yMax: 3, radius: 5, width: 640, height: 480};
const hash = data => '#q=' + encodeURIComponent(JSON.stringify(data));

function state(value) {
    const pair = [value, cb => {pair[0] = cb(pair[0]);}];
    return pair;
}

test('new panels have independent figures, point lists and defaults', () => {
    const a = newPanel('ode');
    const b = newPanel('ode');
    assert.notStrictEqual(a.figure, b.figure);
    a.figure.points.push({x: 1, y: 2});
    assert.deepEqual(b.figure.points, []);
    assert.deepEqual(newPanel('ode').figure.points, []);
});

test('panel updates target IDs and compose even from a stale render', () => {
    const pair = state([newPanel('graph'), newPanel('graph')]);
    const original = pair[0][1];
    const [, update] = extractFigurePairFromPanels(pair, pair[0][0]);
    update(figure => ({...figure, expr: 'x^2'}));
    update(figure => ({...figure, color: '#123456'}));
    assert.equal(pair[0][0].figure.expr, 'x^2');
    assert.equal(pair[0][0].figure.color, '#123456');
    assert.strictEqual(pair[0][1], original);
    // Editing a removed panel must not affect a different panel.
    pair[0] = [original];
    update(figure => ({...figure, expr: 'removed'}));
    assert.strictEqual(pair[0][0], original);
});

test('every figure and its settings survive URL serialization', () => {
    const panels = ['graph', 'graph_inverted', 'implicit', 'ode', 'system', 'recurrence', 'parameter'].map(newPanel);
    for (const panel of panels) {
        if (panel.figure.type === 'ode' || panel.figure.type === 'system') {
            Object.assign(panel.figure, {drawSlope: true, gridCount: 7, points: [{x: 1, y: 2}]});
        }
        if (panel.figure.type === 'system') panel.figure.drawArrows = false;
        if (panel.figure.type === 'recurrence') panel.figure.drawBifurcation = true;
    }
    const loaded = hashLoad(hash({v: SHARE_VERSION, p: axes, l: panels.map(panelToOptions)}));
    assert.deepEqual(loaded.axes, axes);
    assert.deepEqual(loaded.figures, panels.map(panel => panel.figure));
});

test('historical radius, inverted graphs and object points still load', () => {
    const loaded = hashLoad(hash({p: {x: 2, y: -1, r: 5}, l: [
        {t: 'graph_inverted', e: 'y^2', c: '#f00'},
        {t: 'ode_equation', e: 'x+y', c: '#f00', sc: '#0f0', ds: true, gp: false, l: [{x: 1, y: 2}]},
    ]}));
    assert.deepEqual(loaded.axes, {x: 2, y: -1, rx: 4, ry: 3});
    assert.equal(loaded.figures[0].inverted, true);
    assert.equal(loaded.figures[1].drawSlope, true);
    assert.equal(loaded.figures[1].gridCount, 20);
    assert.deepEqual(loaded.figures[1].points, [{x: 1, y: 2}]);
});

test('malformed or unsupported links are rejected before reaching the renderer', () => {
    assert.equal(hashLoad(''), undefined);
    assert.equal(hashLoad('#unrelated'), undefined);
    for (const invalid of ['#q=%', '#q=null', hash({v: 99, p: axes, l: []}),
        hash({p: {...axes, rx: 0}, l: []}), hash({p: axes, l: [{}]}),
        hash({p: axes, l: [{t: 'ode_equation', e: 'x', c: '#f00', sc: '#0f0', l: [[null, 0]]}]}),
        hash({p: axes, l: [{t: 'ode_equation', e: 'x', c: '#f00', sc: '#0f0', gn: 0, l: []}]}),
    ]) assert.throws(() => hashLoad(invalid));
});

test('invalid parameter formulas report errors without throwing during evaluation', () => {
    for (const expr of ['missingParameter', 'sqrt(-1)', '1/0', '[1,2]', 'x(']) {
        const figure = createFigure({...newPanel('parameter').figure, expr}, ['c']);
        const scope = {c: 0};
        assert.doesNotThrow(() => figure.eval(scope));
        assert.ok(figure.errors.length > 0, expr);
        assert.equal(scope.c, 0);
    }
    const figure = createFigure({...newPanel('parameter').figure, expr: '2+3'}, ['c']);
    const scope = {c: 0};
    figure.eval(scope);
    assert.equal(scope.c, 5);
    assert.deepEqual(figure.errors, []);
});

test('ODE overflow, non-finite slopes and stationary points terminate with finite coordinates', () => {
    for (const slope of [1e200, Infinity, NaN, 0]) {
        const result = vm.runInNewContext(`(${odePlot.toString()})(plot, () => 1, () => slope, 0, 0, options)`, {
            plot, slope, options: {equation: true, draw_arrows: false, grid_points: [], grid_distance: 0, color: '#f00'},
        }, {timeout: 1000});
        assert.ok(result.points.length <= 16001);
        assert.ok(result.points.flat().every(Number.isFinite));
    }
    const result = odePlot(plot, () => 0, () => 0, 0, 0, {equation: false, grid_points: [], color: '#f00'});
    assert.ok(result.points.flat().every(Number.isFinite));
});

test('ordinary ODE integration still follows the expected straight line', () => {
    const result = odePlot(plot, () => 1, () => 2, 0, 0, {equation: true, grid_points: [], color: '#f00'});
    assert.ok(result.points.length > 100);
    for (const [x, y] of result.points) assert.ok(Math.abs(y - 2*x) < 1e-10);
});

test('slope fields omit stationary or non-finite vectors', () => {
    assert.deepEqual(slopeGraph(plot, () => 0, () => 0, true, '#f00').segments, []);
    assert.deepEqual(slopeGraph(plot, () => Infinity, () => 1, true, '#f00').segments, []);
});

test('invalid or exhausted zoom does not corrupt axes', () => {
    for (const factor of [0, Infinity, NaN, -1, Number.MIN_VALUE]) {
        assert.strictEqual(zoomAxes(axes, factor, 0, 0), axes);
    }
    assert.deepEqual(zoomAxes(axes, 2, 0, 0), {x: 0, y: 0, rx: 2, ry: 1.5});
});
