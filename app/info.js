const VERSION = process.env.NEXT_PUBLIC_PACKAGE_VERSION
const BANNER = `https://github.com/paolini/funplot/
 _____  __ __  ____   ____  _       ___   ______                          
|     ||  |  ||    \\ |    \\| |     /   \\ |      |                         
|   __||  |  ||  _  ||  o  ) |    |     ||      |                         
|  |_  |  |  ||  |  ||   _/| |___ |  O  ||_|  |_|                         
|   _] |  :  ||  |  ||  |  |     ||     |  |  |                           
|  |   |     ||  |  ||  |  |     ||     |  |  |                           
|__|    \\__,_||__|__||__|  |_____| \\___/   |__| ${VERSION}

https://github.com/paolini/funplot/
`

module.exports = {
    VERSION,
    BANNER,
}