import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app'; // New root component
import './index.css'; // Tailwind CSS

// Render the React application
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(React.createElement(App));
} else {
  console.error('Failed to find the root element');
}
