import React from 'react'
import { createRoot } from 'react-dom/client'
import { ChatDemo } from './ChatDemo'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChatDemo />
  </React.StrictMode>
)
