'use client';
import { usePathname } from 'next/navigation';
import {Toaster} from "react-hot-toast"
import Navbar from './navbar/navbar';
import Footer from './footer';
import GoToTop from './GotoTop';

export default function LayoutContent({ children }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      {!isDashboard && <Navbar />}
      {children}
      {!isDashboard && <GoToTop />}
      {!isDashboard && <Footer />}
    </>
  );
}