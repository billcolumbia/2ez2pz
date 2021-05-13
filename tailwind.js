const { paths } = require('./ezpz/config')
/**
 * Originally this config object was in build-css.js
 * It was moved to its own file so that the tailwind
 * intellisense would work.
 *
 * @url https://github.com/tailwindlabs/tailwindcss-intellisense
 * @url https://tailwindcss.com/docs/configuration
 */
module.exports = {
  mode: 'jit',
  purge: paths.css.purge,
  darkMode: false,
  theme: {
    extend: {}
  },
  variants: {
    extend: {}
  },
  plugins: []
}
