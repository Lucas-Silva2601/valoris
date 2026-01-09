import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// StrictMode causa renderização dupla em desenvolvimento, o que pode causar
// problemas com Leaflet. Desabilitado temporariamente para evitar erro de inicialização.
// Em produção, o StrictMode não causa esse problema.
const root = createRoot(document.getElementById('root'));

if (import.meta.env.DEV) {
  // Em desenvolvimento, sem StrictMode para evitar problemas com Leaflet
  root.render(<App />);
} else {
  // Em produção, com StrictMode
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
