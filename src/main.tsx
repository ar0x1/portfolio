import { createRoot } from 'react-dom/client';
import App from './App';

// Order matters: base.css holds the Google Fonts @import and must come first.
import './styles/base.css';
import './styles/header.css';
import './styles/slides.css';
import './styles/grid.css';
import './styles/interlude.css';
import './styles/intro.css';
import './styles/responsive.css';
// Last by design: the monochrome theme layer overrides the few colour values that
// live in frozen files, and forces every image through greyscale.
import './styles/mono.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

// No StrictMode: its double-invoked effects would create two WebGL contexts.
createRoot(root).render(<App />);
