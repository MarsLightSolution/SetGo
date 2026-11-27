import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from './redux/index.js';
import { Toaster } from 'react-hot-toast';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n'; 
import { installServerAuth } from './utils/serverAuth';

// Our server's requests carry the login (secured /api/v2 routes need it).
installServerAuth();

export const store = configureStore({
  reducer: rootReducer,
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <Provider store={store}>
          <App />
          <Toaster />
        </Provider>
      </BrowserRouter>
    </I18nextProvider>
  </StrictMode>
);