import { Inter } from 'next/font/google';
import './globals.css';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import Providers from './providers';
import LayoutContent from './components/LayoutContent';
import PwaRegister from './components/PwaRegister';
import { SpeedInsights } from '@vercel/speed-insights/next';
// import { StoreProvider } from '@/redux/StoreProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: {
    default: 'CarLight — Hand Car Wash & Billing',
    template: '%s | CarLight',
  },
  description:
    'CarLight hand car wash — bookings, billing, and customer management.',
  applicationName: 'CarLight',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CarLight',
  },
};

export const viewport = {
  themeColor: '#2563eb',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* <StoreProvider> */}
        <Providers>
          <LayoutContent>{children}</LayoutContent>
          <SpeedInsights />
          {/* PWA: registers the service worker for offline support & install */}
          <PwaRegister />
        </Providers>
        {/* </StoreProvider> */}
      </body>
    </html>
  );
}
