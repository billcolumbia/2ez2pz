/**
 * @typedef SizeCheckOption
 * @property {String} pattern usually a glob matching some files, or path to a single file
 * @property {Number} limit file size limit to enforce (in KB)
 */

const Config = {
  paths: {
    /**
     * @type {String}
     * @description Where should processed files, manifest, etc be output
     */
    dist: 'static/dist',
    js: {
      /**
       * @type {Boolean}
       * @description Optionally turn on verbose errors for esbuild
       * @default false
       */
      verboseErrors: false,
      /**
       * @type {Array<String>}
       * @description paths to entry files that should each be an output
       */
      modules: ['src/js/modules/*.js'],
      /**
       * @type {Array<String>}
       * @description paths to all files that should trigger rebuild/reload on add/change
       */
      watch: ['src/js/**/*.{js,svelte}'],
      /**
       * @type {String}
       * @description output path for all JS modules
       */
      dist: 'static/dist/js'
    },
    css: {
      /**
       * @type {Array<String>}
       * @description paths to entry files that should each be an output
       */
      modules: ['src/css/modules/*.css'],
      /**
       * @type {Array<String>}
       * @description paths to all files that should trigger rebuild/reload on add/change
       */
      watch: [
        'src/css/**/*.css',
        './static/**/*.{html,twig}',
        './src/js/**/*.{js,svelte}'
      ],
      /**
       * @type {String}
       * @description output path for all CSS modules
       */
      dist: 'static/dist/css',
      /**
       * @type {Array<String>}
       * @description
       * TailwindCSS purge options for JIT mode. Also used to trigger
       * CSS utility recompilation.
       * @url https://tailwindcss.com/docs/just-in-time-mode
       */
      purge: ['./static/**/*.{html,twig}', './src/js/**/*.{js,svelte}']
    }
  },
  sizeCheck: {
    /**
     * @type {Array<SizeCheckOption>}
     * @description
     * Create a set of patterns and limits. Patterns are globs that match
     * one or more files. Limits are size limits in KB. Any files matched
     * to the pattern will be checked for payload size and will warn when
     * they exceed the set limit.
     */
    options: [
      {
        pattern: 'static/dist/**/*.js',
        limit: 20
      },
      {
        pattern: 'static/dist/**/*.css',
        limit: 15
      }
    ]
  }
}

module.exports = Config
