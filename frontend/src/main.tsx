import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import WebApp from '@twa-dev/sdk'
import { LanguageProvider } from './context/LanguageContext.tsx'

const tg = (WebApp as any).default || WebApp;

console.log("main.tsx: Script start");

// Initialize Telegram WebApp
try {
  console.log("main.tsx: Initializing Telegram WebApp...");
  tg.ready();
  tg.expand();
} catch (e) {
  console.error("main.tsx: Telegram WebApp init failed", e);
}

console.log("main.tsx: Rendering React...");
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("main.tsx: Root element not found!");
} else {
  ReactDOM.createRoot(rootElement).render(
    <LanguageProvider>
      <App />
    </LanguageProvider>
  );
}

