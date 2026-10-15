const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const {newPanel, extractFigurePairFromPanels} = require('../lib/funplot.ts');
const {hashLoad, panelToOptions, SHARE_VERSION} = require('../lib/hashConverter.ts');
const {createFigure} = require('../lib/figures.ts');
const {odePlot, slopeGraph} = require('../lib/plotOde.ts');
const {zoomAxes} = require('../lib/plot.ts');
const PlotWorkerClient = require('../lib/PlotWorkerClient.ts').default;
const {calculateScene} = require('../lib/plotScene.ts');
const {figureClick} = require('../lib/figureClick.ts');

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

const CanvasGesture = require('../lib/CanvasGesture.ts').default;
const viewport = {width: 640, height: 480};
const worldAt = (axes, point) => ({
    x: axes.x + (2 * point.x / viewport.width - 1) * axes.rx,
    y: axes.y - (2 * point.y / viewport.height - 1) * axes.ry,
});
const close = (actual, expected) => {
    for (const key of Object.keys(expected)) {
        assert.ok(Math.abs(actual[key] - expected[key]) < 1e-10, `${key}: ${actual[key]} != ${expected[key]}`);
    }
};

test('a single pointer pans, while a tap still inserts a point', () => {
    const gesture = new CanvasGesture();
    gesture.begin(1, {x: 320, y: 240}, axes, viewport);
    assert.equal(gesture.move(1, {x: 322, y: 241}), undefined);
    assert.equal(gesture.end(1, axes, viewport), true);
    gesture.begin(2, {x: 320, y: 240}, axes, viewport);
    const panned = gesture.move(2, {x: 400, y: 280});
    close(panned, {...axes, x: -1, y: 0.5});
    assert.equal(gesture.end(2, panned, viewport), false);
});

test('pinch doubles scale around the midpoint rather than the viewport center', () => {
    const gesture = new CanvasGesture();
    gesture.begin(1, {x: 200, y: 150}, axes, viewport);
    gesture.begin(2, {x: 400, y: 150}, axes, viewport);
    const anchor = worldAt(axes, {x: 300, y: 150});
    const intermediate = gesture.move(1, {x: 100, y: 150});
    close(worldAt(intermediate, {x: 250, y: 150}), anchor);
    const zoomed = gesture.move(2, {x: 500, y: 150});
    assert.equal(zoomed.rx, 2);
    assert.equal(zoomed.ry, 1.5);
    close(worldAt(zoomed, {x: 300, y: 150}), anchor);
    assert.equal(gesture.end(1, zoomed, viewport), false);
    assert.equal(gesture.end(2, zoomed, viewport), false);
});

test('pinching inward and moving both fingers pans and zooms together', () => {
    const gesture = new CanvasGesture();
    gesture.begin(1, {x: 100, y: 200}, axes, viewport);
    gesture.begin(2, {x: 500, y: 200}, axes, viewport);
    gesture.move(1, {x: 250, y: 260});
    const result = gesture.move(2, {x: 450, y: 260});
    assert.equal(result.rx, 8);
    assert.equal(result.ry, 6);
    close(worldAt(result, {x: 350, y: 260}), worldAt(axes, {x: 300, y: 200}));
});

test('adding or lifting a finger rebases the gesture without a jump or accidental tap', () => {
    const gesture = new CanvasGesture();
    gesture.begin(1, {x: 100, y: 100}, axes, viewport);
    const panned = gesture.move(1, {x: 120, y: 100});
    gesture.begin(2, {x: 220, y: 100}, panned, viewport);
    close(gesture.move(2, {x: 220, y: 100}), panned);
    const zoomed = gesture.move(2, {x: 320, y: 100});
    assert.equal(gesture.end(1, zoomed, viewport), false);
    close(gesture.move(2, {x: 320, y: 100}), zoomed);
    const continued = gesture.move(2, {x: 340, y: 130});
    close(continued, {...zoomed,
        x: zoomed.x - 20 * 2 * zoomed.rx / viewport.width,
        y: zoomed.y + 30 * 2 * zoomed.ry / viewport.height,
    });
    assert.equal(gesture.end(2, continued, viewport), false);
});

test('cancelled pointers and lost capture cannot create a click or leave a stuck gesture', () => {
    const gesture = new CanvasGesture();
    gesture.begin(1, {x: 100, y: 100}, axes, viewport);
    assert.equal(gesture.end(1, axes, viewport, true), false);
    assert.equal(gesture.move(1, {x: 200, y: 200}), undefined);
    assert.equal(gesture.end(1, axes, viewport), false);
    gesture.begin(2, {x: 100, y: 100}, axes, viewport);
    assert.equal(gesture.end(2, axes, viewport), true);
});

test('coincident pinch pointers do not produce invalid scales', () => {
    const gesture = new CanvasGesture();
    gesture.begin(1, {x: 100, y: 100}, axes, viewport);
    gesture.begin(2, {x: 100, y: 100}, axes, viewport);
    assert.equal(gesture.move(2, {x: 110, y: 100}), undefined);
    const result = gesture.move(2, {x: 120, y: 100});
    assert.ok(Object.values(result).every(Number.isFinite));
    assert.equal(gesture.move(2, {x: 100, y: 100}), undefined);
    assert.equal(gesture.end(1, result, viewport), false);
    assert.equal(gesture.end(2, result, viewport), false);
});

const {parseNumberInput} = require('../lib/numberInput.ts');

test('number fields accept complete decimal values with a dot or comma', () => {
    for (const [text, expected] of [
        ['0.005', 0.005], ['0,005', 0.005], ['00.0500', 0.05],
        ['-0,25', -0.25], ['.5', 0.5], [',5', 0.5], ['0.', 0],
        ['-10', -10], ['+2', 2], ['  1,25  ', 1.25],
        ['2e-3', 0.002], ['-1,5e+2', -150],
    ]) assert.equal(parseNumberInput(text), expected, text);
});

test('empty or incomplete number drafts do not turn into a committed value', () => {
    for (const text of ['', ' ', '-', '+', '.', ',', '-.', '1e', '1e-']) {
        assert.equal(parseNumberInput(text), undefined, text);
    }
});

test('number fields reject trailing junk, mixed separators and non-finite values', () => {
    for (const text of ['1abc', '1.2.3', '1,2.3', '1,000,000', 'Infinity', 'NaN', '1e999', '0x10', '1 2']) {
        assert.equal(parseNumberInput(text), undefined, text);
    }
});

test('an unset parameter is displayed as a question mark rather than undefined', () => {
    for (const expr of ['', '   ', 'undefined']) {
        const figure = createFigure({...newPanel('parameter').figure, expr}, ['c']);
        assert.equal(figure.tex, 'c = ?');
    }
    const figure = createFigure({...newPanel('parameter').figure, expr: '0.125'}, ['c']);
    assert.equal(figure.tex, 'c = 0.125');
});

class FakePlotWorker {
    requests = [];
    terminated = false;
    postMessage(request) { this.requests.push(structuredClone(request)); }
    terminate() { this.terminated = true; }
    reply(data) { this.onmessage?.({data}); }
}

function computer() {
    const workers = [];
    const client = new PlotWorkerClient(() => {
        const worker = new FakePlotWorker();
        workers.push(worker);
        return worker;
    });
    return {client, workers};
}

test('worker receives only serializable viewport data and reuses an idle thread', async () => {
    const {client, workers} = computer();
    const states = [newPanel('graph').figure];
    const presentations = [];
    const first = client.compute(states, {...plot, ctx: {draw() {}}, moveTo() {}}, undefined,
        figures => presentations.push(figures));
    const worker = workers[0];
    assert.deepEqual(worker.requests[0].viewport, plot);
    worker.reply({id: 1, type: 'prepared', figures: [{tex: 'y=x', errors: []}]});
    worker.reply({id: 1, type: 'picture', picture: []});
    assert.deepEqual(await first, []);
    assert.equal(presentations[0][0].tex, 'y=x');
    const second = client.compute(states, plot);
    assert.equal(workers.length, 1);
    worker.reply({id: 1, type: 'picture', picture: ['stale']});
    worker.reply({id: 2, type: 'picture', picture: []});
    assert.deepEqual(await second, []);
    client.dispose();
    assert.equal(worker.terminated, true);
});

test('superseding a calculation terminates its thread and ignores queued results', async () => {
    const {client, workers} = computer();
    const first = client.compute([], plot);
    const rejected = assert.rejects(first, {name: 'AbortError'});
    const staleMessage = workers[0].onmessage;
    const second = client.compute([], plot);
    assert.equal(workers[0].terminated, true);
    staleMessage({data: {id: 1, type: 'picture', picture: ['stale']}});
    workers[1].reply({id: 2, type: 'picture', picture: []});
    assert.deepEqual(await second, []);
    await rejected;
    client.dispose();
});

test('aborting or unmounting rejects pending work and permits a clean restart', async () => {
    const {client, workers} = computer();
    const controller = new AbortController();
    const first = client.compute([], plot, controller.signal);
    const rejected = assert.rejects(first, {name: 'AbortError'});
    controller.abort();
    await rejected;
    assert.equal(workers[0].terminated, true);
    await assert.rejects(client.compute([], plot, controller.signal), {name: 'AbortError'});
    assert.equal(workers.length, 1);
    const second = client.compute([], plot);
    const unmounted = assert.rejects(second, {name: 'AbortError'});
    client.dispose();
    await unmounted;
    const third = client.compute([], plot);
    workers[2].reply({id: 3, type: 'picture', picture: []});
    assert.deepEqual(await third, []);
    client.dispose();
});

test('worker startup, protocol and transport failures reject instead of hanging', async () => {
    await assert.rejects(new PlotWorkerClient(() => {throw new Error('unsupported');}).compute([], plot), /unsupported/);
    const {client, workers} = computer();
    const first = client.compute([], plot);
    const failed = assert.rejects(first, /calculation failed/);
    workers[0].reply({id: 1, type: 'error', message: 'calculation failed'});
    await failed;
    const second = client.compute([], plot);
    const crashed = assert.rejects(second, /worker crashed/);
    workers[1].onerror({message: 'worker crashed', preventDefault() {}});
    await crashed;
    const third = client.compute([], plot);
    const unreadable = assert.rejects(third, /Unable to read/);
    workers[2].onmessageerror({});
    await unreadable;
    assert.ok(workers.every(worker => worker.terminated));
});

test('scene computation preserves parameter order, drawing order and validation errors', async () => {
    const states = [
        {...newPanel('parameter').figure, name: 'c', expr: '2'},
        {...newPanel('parameter').figure, name: 'd', expr: 'c+1'},
        {...newPanel('graph').figure, expr: 'd*x'},
        {...newPanel('parameter').figure, name: 'bad', expr: '1/0'},
    ];
    let metadata;
    const picture = await calculateScene(states, plot, figures => {metadata = figures;});
    assert.equal(picture[0].type, 'axes');
    assert.ok(metadata[3].errors.some(message => message.includes('finite real number')));
    const graph = createFigure(states[2], ['c', 'd', 'bad']);
    assert.deepEqual(picture.slice(1), await graph.plot(plot, {c: 2, d: 3, bad: 0}));
    assert.doesNotThrow(() => structuredClone({picture, metadata}));
});

test('real worker computes every figure type with the same geometry as the numerical core', {timeout: 15000}, async t => {
    const {Worker} = require('node:worker_threads');
    const path = require('node:path');
    const worker = new Worker(path.join(__dirname, 'plot-worker.cjs'));
    t.after(() => worker.terminate());
    const states = ['graph', 'graph_inverted', 'implicit', 'ode', 'system', 'recurrence', 'parameter']
        .map(type => newPanel(type).figure);
    for (const state of states) {
        if (state.type === 'ode' || state.type === 'system') {
            state.gridCount = 3;
            state.points = [{x: 1, y: 0}];
            state.drawSlope = true;
        }
        if (state.type === 'recurrence') state.start = 0.5;
    }
    const viewport = {...plot, width: 80, height: 60};
    let metadata;
    const expected = await calculateScene(states, viewport, figures => {metadata = figures;});
    const messages = await new Promise((resolve, reject) => {
        const received = [];
        worker.on('error', reject);
        worker.on('message', message => {
            received.push(message);
            if (message.type === 'error') reject(new Error(message.message));
            if (message.type === 'picture') resolve(received);
        });
        worker.postMessage({id: 42, states, viewport});
    });
    assert.deepEqual(messages, [
        {id: 42, type: 'prepared', figures: metadata},
        {id: 42, type: 'picture', picture: expected},
    ]);
});

test('UI clicks still add initial points and recurrence starts without evaluating formulas', () => {
    const point = {x: 2, y: 3};
    for (const type of ['ode', 'system']) {
        const state = newPanel(type).figure;
        const next = figureClick(state, point);
        assert.deepEqual(next.points, [point]);
        assert.deepEqual(state.points, []);
    }
    assert.equal(figureClick(newPanel('recurrence').figure, point).start, 2);
    const graph = {...newPanel('graph').figure, expr: 'not a valid formula'};
    assert.strictEqual(figureClick(graph, point), graph);
});

const {plotBifurcation} = require('../lib/plotRecurrence.ts');
const {calculateBifurcationSample} = require('../lib/plotScene.ts');
const {bifurcationSignature} = require('../lib/bifurcationState.ts');
const BifurcationRecorder = require('../lib/BifurcationRecorder.ts').default;

test('bifurcation samples only the selected parameter and discards the transient', () => {
    const picture = plotBifurcation(x => x / 2, 3.5, 1, '#123', 10, 3);
    assert.deepEqual(picture, [{type: 'points', color: '#123', points: [
        [3.5, 2 ** -11], [3.5, 2 ** -12], [3.5, 2 ** -13],
    ]}]);
    const fixed = plotBifurcation(x => 2 * x * (1 - x), 2, 0.2, '#f00')[0].points;
    assert.equal(fixed.length, 1);
    assert.ok(Math.abs(fixed[0][1] - 0.5) < 1e-12);
    const cycle = plotBifurcation(x => 3.2 * x * (1 - x), 3.2, 0.2, '#f00')[0].points;
    const values = [...new Set(cycle.map(point => point[1].toFixed(10)))];
    assert.equal(values.length, 2);
    assert.ok(cycle.every(([c]) => c === 3.2));
    const chaotic = plotBifurcation(x => 4 * x * (1 - x), 4, 0.2, '#f00')[0].points;
    assert.ok(chaotic.length > 100);
    assert.ok(chaotic.every(([c, x]) => c === 4 && x >= 0 && x <= 1));
});

test('bifurcation does not record non-real or divergent orbits or invent an initial point', () => {
    assert.deepEqual(plotBifurcation(x => x * x, 1, 2, '#f00'), []);
    assert.deepEqual(plotBifurcation(() => ({re: 1, im: 1}), 1, 0, '#f00'), []);
    assert.deepEqual(plotBifurcation(x => x, 1, NaN, '#f00'), []);
    assert.throws(() => calculateBifurcationSample([newPanel('recurrence').figure],
        {figureIndex: 0, parameterName: 'c', value: 2}), /initial point/);
});

test('bifurcation evaluates dependent parameters for each chosen value', () => {
    const states = [
        {...newPanel('parameter').figure, name: 'c', expr: '1'},
        {...newPanel('parameter').figure, name: 'd', expr: 'c+2'},
        {...newPanel('recurrence').figure, start: 0.2, expr: 'd'},
    ];
    const picture = calculateBifurcationSample(states, {figureIndex: 2, parameterName: 'c', value: 3});
    assert.deepEqual(picture[0].points, [[3, 5]]);
    assert.equal(states[0].expr, '1');
    assert.throws(() => calculateBifurcationSample(states,
        {figureIndex: 2, parameterName: 'missing', value: 3}), /no longer available/);
});

test('bifurcation ink survives slider, range and initial-point changes but not a change of formula', () => {
    const parameter = {...newPanel('parameter').figure, name: 'c'};
    const other = {...newPanel('parameter').figure, name: 'd'};
    const recurrence = {...newPanel('recurrence').figure, start: 0.2};
    const states = [parameter, other, recurrence];
    const signature = bifurcationSignature(states, recurrence, 'c');
    assert.equal(signature, bifurcationSignature([{...parameter, expr: '3', min: -1, max: 10}, other, recurrence], recurrence, 'c'));
    assert.notEqual(signature, bifurcationSignature([parameter, {...other, expr: '3'}, recurrence], recurrence, 'c'));
    assert.equal(signature, bifurcationSignature(states, {...recurrence, start: 0.3}, 'c'));
    assert.notEqual(signature, bifurcationSignature(states, {...recurrence, expr: 'c*x*(1-x)'}, 'c'));
    assert.notEqual(signature, bifurcationSignature(states, recurrence, 'd'));
});

test('rapid slider choices are queued without gaps, deduplicated, and never auto-swept', async () => {
    const requests = [];
    const results = [];
    const computer = {
        compute(states, viewport, signal, prepared, sample) {
            return new Promise(resolve => requests.push({sample, resolve}));
        },
        dispose() {},
    };
    const recorder = new BifurcationRecorder(computer, (picture, value) => results.push(value), error => {throw error;});
    const sample = value => recorder.record([], {figureIndex: 0, parameterName: 'c', value});
    sample(2);
    sample(3.2);
    sample(3.8);
    sample(2);
    assert.equal(requests.length, 1);
    requests[0].resolve([]);
    await new Promise(resolve => setImmediate(resolve));
    requests[1].resolve([]);
    await new Promise(resolve => setImmediate(resolve));
    requests[2].resolve([]);
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(requests.map(request => request.sample.value), [2, 3.2, 3.8]);
    assert.deepEqual(results, [2, 3.2, 3.8]);
    recorder.clear();
});

test('clearing bifurcation cancels pending ink and allows choosing the same value again', async () => {
    const requests = [];
    const results = [];
    let disposed = 0;
    const recorder = new BifurcationRecorder({
        compute() {return new Promise(resolve => requests.push(resolve));},
        dispose() {disposed++;},
    }, (picture, value) => results.push(value), error => {throw error;});
    const sample = value => recorder.record([], {figureIndex: 0, parameterName: 'c', value});
    sample(2);
    sample(3);
    recorder.clear();
    sample(2);
    requests[0]([]); // A late result must not redraw cleared data.
    requests[1]([]);
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(results, [2]);
    assert.equal(requests.length, 2);
    assert.equal(disposed, 1);
    recorder.clear();
});

test('real worker handles isolated bifurcation samples without a parameter sweep', {timeout: 15000}, async t => {
    const {Worker} = require('node:worker_threads');
    const worker = new Worker(require('node:path').join(__dirname, 'plot-worker.cjs'));
    t.after(() => worker.terminate());
    const states = [
        {...newPanel('parameter').figure, name: 'c', expr: '1'},
        {...newPanel('recurrence').figure, expr: 'c*x*(1-x)', start: 0.2},
    ];
    const response = await new Promise((resolve, reject) => {
        worker.on('error', reject);
        worker.on('message', resolve);
        worker.postMessage({id: 1, states, viewport: plot,
            sample: {figureIndex: 1, parameterName: 'c', value: 2}});
    });
    assert.equal(response.type, 'picture');
    assert.equal(response.picture[0].points.length, 1);
    assert.equal(response.picture[0].points[0][0], 2);
    assert.ok(Math.abs(response.picture[0].points[0][1] - 0.5) < 1e-12);
});

test('point pictures draw separate dots and clip points outside the visible axes', () => {
    const {draw} = require('../lib/funplot.ts');
    const {context} = require('../lib/plot.ts');
    const arcs = [];
    let fills = 0;
    const ctx = {clearRect() {}, beginPath() {}, arc(...args) {arcs.push(args);}, fill() {fills++;}};
    draw(context(axes, 640, 480, ctx), [{type: 'points', color: '#f00', points: [[0, 0], [1, 1], [10, 10]]}], {});
    assert.equal(fills, 2);
    assert.deepEqual(arcs.map(arc => arc.slice(0, 2)), [[320, 240], [400, 160]]);
    assert.equal(ctx.fillStyle, '#f00');
});

test('formulas returning functions cannot enter any plot geometry or worker messages', async () => {
    for (const type of ['graph', 'graph_inverted', 'implicit', 'ode', 'system', 'recurrence']) {
        const state = {...newPanel(type).figure, expr: 'sin', exprX: 'sin', start: 0.2};
        let metadata;
        const picture = await calculateScene([state], plot, figures => {metadata = figures;});
        assert.ok(metadata[0].errors.some(error => error.includes('Supply its arguments')), type);
        assert.doesNotThrow(() => structuredClone({metadata, picture}), type);
        assert.deepEqual(picture, [{type: 'axes', options: {labels: {x: 'x', y: 'y'}}}]);
    }
});

test('cobwebs without a seed or with divergent or non-numeric iterates contain no invalid coordinates', () => {
    const {plotRecurrence} = require('../lib/plotRecurrence.ts');
    assert.deepEqual(plotRecurrence(plot, x => x, NaN, '#f00'), []);
    for (const fun of [() => Infinity, () => Math.sin, x => x * x]) {
        const picture = plotRecurrence(plot, fun, 2, '#f00');
        assert.doesNotThrow(() => structuredClone(picture));
        assert.ok(picture.every(line => line.points.every(point => point.every(Number.isFinite))));
    }
});

test('real-domain formulas retain their graph when complex values occur outside their domain', async () => {
    const graph = createFigure({...newPanel('graph').figure, expr: 'sqrt(x)'}, []);
    const picture = await graph.plot(plot, {});
    assert.deepEqual(graph.errors, []);
    assert.ok(picture.some(line => line.type === 'line' && line.points.length > 1));
    assert.ok(picture.every(line => line.points.every(point => point.every(Number.isFinite))));
});

test('real worker reports formula errors and recovers when a parameter is defined', {timeout: 15000}, async t => {
    const {Worker} = require('node:worker_threads');
    const worker = new Worker(require('node:path').join(__dirname, 'plot-worker.cjs'));
    t.after(() => worker.terminate());
    let id = 0;
    async function request(expr, withParameter = true) {
        const requestId = ++id;
        const states = [{...newPanel('recurrence').figure, expr}];
        if (withParameter) states.push({...newPanel('parameter').figure, name: 'c', expr: '1'});
        return new Promise((resolve, reject) => {
            const messages = [];
            const onError = error => {cleanup(); reject(error);};
            const onMessage = message => {
                if (message.id !== requestId) return;
                messages.push(message);
                if (message.type === 'error') onError(new Error(message.message));
                if (message.type === 'picture') {cleanup(); resolve(messages);}
            };
            const cleanup = () => {
                worker.off('error', onError);
                worker.off('message', onMessage);
            };
            worker.on('error', onError);
            worker.on('message', onMessage);
            worker.postMessage({id: requestId, states, viewport: plot});
        });
    }
    const missing = await request('c*(1-x^2)', false);
    assert.ok(missing[0].figures[0].errors.some(error => error.includes('Undefined symbol c')));
    const functionValue = await request('sin');
    assert.ok(functionValue[0].figures[0].errors.some(error => error.includes('Supply its arguments')));
    const lateError = await request('x == 0 ? 0 : sin');
    assert.equal(lateError.filter(message => message.type === 'prepared').length, 2);
    assert.ok(lateError.at(-2).figures[0].errors.some(error => error.includes('Supply its arguments')));
    const valid = await request('c*(1-x^2)'); // Same panel order and missing seed as the user's screenshot.
    assert.deepEqual(valid[0].figures.map(figure => figure.errors), [[], []]);
    assert.equal(valid.at(-1).type, 'picture');
    assert.ok(valid.at(-1).picture.some(element => element.type === 'line' && element.points.length > 1));
});

test('the same parameter can accumulate samples from different initial points without losing queued orbits', async () => {
    const requests = [];
    const pictures = [];
    const recorder = new BifurcationRecorder({
        compute(states, viewport, signal, prepared, sample) {
            return new Promise(resolve => requests.push({start: states[0].start, value: sample.value, resolve}));
        },
        dispose() {},
    }, picture => pictures.push(picture), error => {throw error;});
    const first = {...newPanel('recurrence').figure, start: 0.2};
    const second = {...first, start: 0.8};
    const sample = {figureIndex: 0, parameterName: 'c', value: 3};
    recorder.record([first], sample);
    recorder.record([second], sample);
    recorder.record([first], sample);
    recorder.record([second], sample);
    assert.equal(requests.length, 1);
    requests[0].resolve([{type: 'points', color: '#f00', points: [[3, 0.2]]}]);
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(requests.map(({start, value}) => [start, value]), [[0.2, 3], [0.8, 3]]);
    requests[1].resolve([{type: 'points', color: '#f00', points: [[3, 0.8]]}]);
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(pictures.flatMap(picture => picture[0].points), [[3, 0.2], [3, 0.8]]);
    assert.equal(requests.length, 2);
    recorder.clear();
});

test('shift-click ranges include both endpoints and fill columns in either direction', () => {
    const {bifurcationRange} = require('../lib/bifurcationState.ts');
    assert.deepEqual(bifurcationRange(1, 5, 1), [1, 2, 3, 4, 5]);
    assert.deepEqual(bifurcationRange(5, 1, 1), [5, 4, 3, 2, 1]);
    const uneven = bifurcationRange(0, 1, 0.3);
    assert.equal(uneven[0], 0);
    assert.equal(uneven.at(-1), 1);
    assert.ok(uneven.every((value, i) => i === 0 || value - uneven[i - 1] <= 0.3));
    assert.equal(bifurcationRange(0, 1, 0.01).length, 101);
});

test('first, repeated and extreme shift-clicks are finite and bounded', () => {
    const {bifurcationRange} = require('../lib/bifurcationState.ts');
    assert.deepEqual(bifurcationRange(null, 3, 1), [3]);
    assert.deepEqual(bifurcationRange(3, 3, 1), [3]);
    assert.deepEqual(bifurcationRange(NaN, 3, 1), [3]);
    assert.deepEqual(bifurcationRange(1, NaN, 1), []);
    assert.deepEqual(bifurcationRange(1, 3, 0), [3]);
    const extreme = bifurcationRange(-1e308, 1e308, 1e-100);
    assert.equal(extreme.length, 2001);
    assert.ok(extreme.every(Number.isFinite));
    assert.equal(extreme[0], -1e308);
    assert.equal(extreme.at(-1), 1e308);
});

test('choosing a new cobweb seed samples the current parameter expression without changing it', () => {
    const states = [
        {...newPanel('parameter').figure, name: 'a', expr: '2'},
        {...newPanel('parameter').figure, name: 'c', expr: 'a+1'},
        {...newPanel('recurrence').figure, expr: 'x > 0 ? c : -c'},
    ];
    const sample = {figureIndex: 2, parameterName: 'c', value: null};
    const positive = states.map((state, i) => i === 2 ? figureClick(state, {x: 0.2, y: 0}) : state);
    const negative = states.map((state, i) => i === 2 ? figureClick(state, {x: -0.2, y: 0}) : state);
    assert.deepEqual(calculateBifurcationSample(positive, sample)[0].points, [[3, 3]]);
    assert.deepEqual(calculateBifurcationSample(negative, sample)[0].points, [[3, -3]]);
    assert.equal(states[1].expr, 'a+1');
    assert.ok(Number.isNaN(states[2].start));
});

test('current-parameter samples are queued per seed and deduplicated against numeric slider choices', async () => {
    const jobs = [];
    const results = [];
    const recorder = new BifurcationRecorder({
        compute(states, viewport, signal, prepared, sample) {
            return new Promise(resolve => jobs.push({states, sample, resolve}));
        },
        dispose() {},
    }, picture => results.push(picture), error => {throw error;});
    const parameter = {...newPanel('parameter').figure, name: 'c', expr: '3'};
    const recurrence = {...newPanel('recurrence').figure, start: 0.2};
    const sample = {figureIndex: 1, parameterName: 'c', value: null};
    recorder.record([parameter, recurrence], sample);
    recorder.record([parameter, recurrence], {...sample, value: 3});
    recorder.record([parameter, {...recurrence, start: 0.8}], sample);
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].sample.value, null);
    jobs[0].resolve([{type: 'points', color: '#f00', points: [[3, 1]]}]);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(jobs.length, 2);
    assert.equal(jobs[1].states[1].start, 0.8);
    jobs[1].resolve([{type: 'points', color: '#f00', points: [[3, -1]]}]);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(results.length, 2);
    recorder.clear();
});

test('real worker samples a newly chosen cobweb point at the evaluated current parameter', {timeout: 15000}, async t => {
    const {Worker} = require('node:worker_threads');
    const worker = new Worker(require('node:path').join(__dirname, 'plot-worker.cjs'));
    t.after(() => worker.terminate());
    const states = [
        {...newPanel('parameter').figure, name: 'c', expr: '1+2'},
        figureClick({...newPanel('recurrence').figure, expr: 'c'}, {x: 0.2, y: 0}),
    ];
    const response = await new Promise((resolve, reject) => {
        worker.on('error', reject);
        worker.on('message', resolve);
        worker.postMessage({id: 1, states, viewport: plot,
            sample: {figureIndex: 1, parameterName: 'c', value: null}});
    });
    assert.equal(response.type, 'picture');
    assert.deepEqual(response.picture[0].points, [[3, 3]]);
});
