import {calculateScene, type PlotRequest, type PlotResponse} from './plotScene'

// A narrow type avoids adding the WebWorker lib alongside the conflicting DOM lib.
const worker = self as unknown as {
    onmessage: ((event: MessageEvent<PlotRequest>) => void) | null
    postMessage: (message: PlotResponse) => void
}

worker.onmessage = async ({data: {id, states, viewport}}) => {
    try {
        const picture = await calculateScene(states, viewport, figures => {
            worker.postMessage({id, type: 'prepared', figures})
        })
        worker.postMessage({id, type: 'picture', picture})
    } catch (error) {
        worker.postMessage({id, type: 'error', message: String(error)})
    }
}
