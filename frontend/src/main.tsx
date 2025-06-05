import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github.css';
import App from './App.tsx'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.tsx'
import axios from 'axios'
import { Toaster } from 'react-hot-toast'
import { ChatProvider } from './context/ChatContext.tsx'

// axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL
axios.defaults.withCredentials = true;

const theme = createTheme({
  typography: { fontFamily: 'Roboto Slab, sans-serif', allVariants: { color: 'white' } },
})
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ChatProvider>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <Toaster position='top-right'/>
            <App />
          </ThemeProvider>
        </BrowserRouter>
      </ChatProvider> 
    </AuthProvider>
  </StrictMode>,
)
