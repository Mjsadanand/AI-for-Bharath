import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { initCapacitor } from './lib/capacitor'
import './index.css'
import App from './App.tsx'

// Initialize Capacitor native plugins (no-op on web)
initCapacitor();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { background: '#1e293b', color: '#f8fafc', fontSize: '14px', borderRadius: '10px' },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
