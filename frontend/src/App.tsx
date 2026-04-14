import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="text-red-700"><p>Hello World</p></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
