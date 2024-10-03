import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import SnackbarProvider from './providers/SnackbarProvider';
import './index.css';
import Snackbar from './components/Snackbar';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <SnackbarProvider>
      <Snackbar />
      <App />
    </SnackbarProvider>
  </React.StrictMode>
);
