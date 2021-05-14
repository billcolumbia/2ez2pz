module.exports = {
  jsOptions: {
    /**
     * @type {Boolean}
     * @description Optionally turn on verbose errors for esbuild
     * @default false
     */
    verboseErrors: false
  },
  paths: {
    /**
     * @type {String}
     * @description Where should processed files, manifest, etc be output
     */
    dist: 'static/dist',
    js: {
      modules: ['src/js/modules/*.js'],
      watch: ['src/js/**/*.{js,svelte}'],
      dist: 'static/dist/js'
    },
    css: {
      modules: ['src/css/modules/*.css'],
      watch: [
        'src/css/**/*.css',
        './static/**/*.{html,twig}',
        './src/js/**/*.{js,svelte}'
      ],
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
     * @type {Array<Object>}
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
