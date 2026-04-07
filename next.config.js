/** @type {import('next').NextConfig} */

const { BANNER } = require('./app/info')

const nextConfig = {
    // to build a static site (in /out)
    output: 'export',
}

// When deploying to GitHub Pages under a repository subpath
// (https://<user>.github.io/funplot) we must set `basePath` and
// `assetPrefix` so Next generates links under `/funplot`.
// Apply permanently so local builds and CI produce URLs with the
// repository subpath. If you prefer conditional behaviour, revert.
nextConfig.basePath = '/funplot'
nextConfig.assetPrefix = '/funplot'

console.log(BANNER)
module.exports = nextConfig


