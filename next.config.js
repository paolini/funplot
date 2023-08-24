/** @type {import('next').NextConfig} */

const { BANNER } = require('./app/info')

const nextConfig = {
    // to build a static site (in /out)
    output: 'export',
}

console.log(BANNER)
module.exports = nextConfig


