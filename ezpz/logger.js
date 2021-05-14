const c = require('chalk')
const { log } = console

/**
 * @returns {String} current time as (H)H:MM:SS
 * @example '9:11:08'
 */
const getTime = () => new Date().toLocaleTimeString().replace(/\s*(AM|PM)/, '')

module.exports = {
  /**
   * @description
   * Logs a colorful message to console along with timestamp, event, and filepath
   * @param {String} event chokidar event: add, change, etc
   * @param {String} filePath filename and path that emitted event
   * @param {String} msg message to log with time, event, and file
   * @example '[9:11:08] [change] src/js/modules/example-module.js'
   */
  fileEvent(event, filePath, msg) {
    const time = getTime()
    log(c.dim(`[${time}] `) + c.magenta(`[${event}] `) + c.green(`${filePath}`))
    log(c.dim(`[${time}] `) + c.cyan('⟳  ') + c.dim(msg))
  },
  /**
   * @description
   * Logs a simple message to console with timestamp and filepath
   * @param {String} file filename/path
   * @example '[9:11:00]  - src/js/modules/example-module.js'
   */
  fileInfo(file) {
    const time = getTime()
    log(c.dim(`[${time}]  - `) + c.dim(file))
  },
  /**
   * @description
   * Logs a simple message to console with timestamp, message, and duration
   * @param {String} msg message to log with duration of timer
   * @param {Number} duration duration in ms, usually the result of subtracting two timestamps
   * @example '[9:11:08]  ✓ Modules built in 0ms'
   */
  timer(msg, duration) {
    log(
      c.dim(`[${getTime()}] `) + c.green(' ✓ ') + c.dim(`${msg} built in ${duration}ms`)
    )
  }
}
