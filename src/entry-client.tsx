import { hydrateRoot } from 'react-dom/client';
import App from './App';
import './styles/main.css';

hydrateRoot(document.getElementById('root')!, <App />);
