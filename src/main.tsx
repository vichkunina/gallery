import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

function Ready() {
  useEffect(() => { document.getElementById('root')?.removeAttribute('data-prerender'); }, []);
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Ready />
  </StrictMode>,
);
