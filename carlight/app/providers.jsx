'use client';
import { AuthProvider } from './context/AuthContext';
import { PrimeReactProvider } from 'primereact/api';

export default function provider({ children }) {
  return (
    <PrimeReactProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </PrimeReactProvider>
  );
}
