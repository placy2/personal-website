import headshotPhoto from './assets/2024headshot.jpeg'
import './App.css'

function App() {
  return (
    <>
      <div>
        <a href="https://github.com/placy2" target="_blank">
          <img src={headshotPhoto} className="headshot" alt="Recent headshot of Parker (2023)" />
        </a>
      </div>
      <h1>Parker Lacy</h1>
      <p className="read-the-docs">
        Cloud Engineer based in the Denver area - passionate about technology, music, and family
      </p>
    </>
  )
}

export default App
