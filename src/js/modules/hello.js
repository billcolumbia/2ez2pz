import Hello from '../components/Hello.svelte'

const hello = new Hello({
  target: document.querySelector('#hello'),
  props: {
    text: 'world'
  }
})
