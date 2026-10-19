import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'

function App() {
  return (
    <BrowserRouter>
      <header className="header">
        <Link to="/" className="logo">
          돌돌 비트즙
        </Link>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
