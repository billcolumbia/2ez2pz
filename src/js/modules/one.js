class Say {
  hi() {
    const num = 'one'
    console.log(`Hello, I'm module ${num}!`)
  }

  bye() {
    const num = 'one'
    console.log(`Bye, from module ${num}!`)
  }
}

const instance = new Say()
instance.hi()
instance.bye()
