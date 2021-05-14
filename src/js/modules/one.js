import { add } from '../util/math'

class Say {
  hi() {
    const num = 'one'
    console.log(`Hello, I'm module ${num}!`)
    console.log('math util: ', add(1, 2))
  }

  bye() {
    const num = 'one'
    console.log(`Bye, from module ${num}!`)
  }
}

const instance = new Say()
instance.hi()
instance.bye()
