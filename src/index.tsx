/* @refresh reload */
import { render } from 'solid-js/web';
import { Router, hashIntegration } from '@solidjs/router';
import { HopeProvider, type HopeThemeConfig } from '@hope-ui/solid';
import './index.css';
import App from './App';
import 'flowbite';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got mispelled?',
  );
}

render(() => (
  <Router source={hashIntegration()}>
    <HopeProvider>
      <App />
    </HopeProvider>
  </Router>
), root!);
