const {spawn} = require('node:child_process')
const {existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync} = require('node:fs')
const {tmpdir} = require('node:os')
const {dirname, join, resolve} = require('node:path')
const {basePath} = require('../next.config.js')

const output = resolve(__dirname, '../out')
if (!existsSync(join(output, 'index.html'))) {
    console.error('Run npm run build before starting the production preview.')
    process.exit(1)
}

// Mount the export at the same subpath used on GitHub Pages, including all assets.
const root = mkdtempSync(join(tmpdir(), 'funplot-preview-'))
const mount = join(root, basePath)
mkdirSync(dirname(mount), {recursive: true})
symlinkSync(output, mount, process.platform === 'win32' ? 'junction' : 'dir')
process.once('exit', () => rmSync(root, {recursive: true, force: true}))

const port = process.env.PORT || '3000'
const cli = join(dirname(require.resolve('serve/package.json')), 'build/main.js')
const child = spawn(process.execPath, [cli, root, '-l', port, '--symlinks', '--no-clipboard', '--no-port-switching'], {
    stdio: 'inherit',
    env: {...process.env, NO_UPDATE_CHECK: '1'},
})
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => child.kill(signal))
child.once('error', error => { console.error(error); process.exitCode = 1 })
child.once('exit', code => { process.exitCode = code ?? 1 })
console.log(`Apri FunPlot: http://localhost:${port}${basePath}`)
