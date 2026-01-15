import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { UserProfileProvider } from './contexts/UserProfileContext';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <UserProfileProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </UserProfileProvider>
    </AuthProvider>
  </StrictMode>
);
