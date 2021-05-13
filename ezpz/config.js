module.exports = {
  jsOptions: {
    verboseErrors: false
  },
  paths: {
    dist: 'static/dist',
    js: {
      modules: ['src/js/modules/*.js'],
      watch: ['src/js/**/*.{js,svelte}'],
      dist: 'static/dist/js'
    },
    css: {
      modules: ['src/css/modules/*.css'],
      watch: ['src/css/**/*.css', './static/**/*.{html,twig}', './src/js/**/*.{js,svelte}'],
      dist: 'static/dist/css',
      purge: ['./static/**/*.{html,twig}', './src/js/**/*.{js,svelte}']
    }
  },
  sizeCheck: {
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
