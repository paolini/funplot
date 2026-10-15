// Execute the actual browser worker entry point on a real Node worker thread.
require('./register.cjs');
const {parentPort} = require('node:worker_threads');
globalThis.self = {postMessage: message => parentPort.postMessage(message)};
require('../lib/plot.worker.ts');
parentPort.on('message', data => self.onmessage({data}));
