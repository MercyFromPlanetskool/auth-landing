import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  // Temporarily disabled StrictMode to prevent double initialization of Three.js scene
  // <StrictMode>
    <App />
  // </StrictMode>,
)
