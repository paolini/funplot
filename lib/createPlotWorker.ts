import PlotWorkerClient from './PlotWorkerClient'

export function createPlotWorker() {
    return new PlotWorkerClient(() => new Worker(new URL('./plot.worker.ts', import.meta.url)))
}
