/** @type {import('next').NextConfig} */

const { BANNER } = require('./app/info')

const nextConfig = {
    // to build a static site (in /out)
    output: 'export',
}

// Deploying to GitHub Pages under a repository subpath
// (https://<user>.github.io/funplot) requires `basePath` and `assetPrefix`
// so Next generates links under `/funplot`. Enable unconditionally because
// this repo is intended to be served from that subpath.
nextConfig.basePath = '/funplot'
nextConfig.assetPrefix = '/funplot'

console.log(BANNER)
module.exports = nextConfig


