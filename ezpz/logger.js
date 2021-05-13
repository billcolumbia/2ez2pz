const c = require('chalk')
const { log } = console

const getTime = () => new Date().toLocaleTimeString().replace(/\s*(AM|PM)/, '')

module.exports = {
  fileEvent(event, filePath, msg) {
    const time = getTime()
    log(c.dim(`[${time}] `) + c.magenta(`[${event}] `) + c.green(`${filePath}`))
    log(c.dim(`[${time}] `) + c.cyan('⟳  ') + c.dim(msg))
  },
  fileInfo(file) {
    const time = getTime()
    log(c.dim(`[${time}]  - `) + c.dim(file))
  },
  timer(msg, duration) {
    log(
      c.dim(`[${getTime()}] `) + c.green(' ✓ ') + c.dim(`${msg} built in ${duration}ms`)
    )
  }
}
