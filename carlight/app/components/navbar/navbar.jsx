'use client';
import React from 'react';
import Image from 'next/image';
import { SlSocialFacebook } from 'react-icons/sl';
import { IoMailOutline } from 'react-icons/io5';
import { useAuth } from '../../context/AuthContext';

import MenuItems from './menuItems';
import Menuweb from './menuweb';
import Menumobile from './menumobile';
import Link from 'next/link';

export default function Navbar() {
  const { user, logout } = useAuth();


  return (
    <div className="flex bg-[#f8f8f8] shadow items-center py-3">
      <div className="flex-shrink-0">
        <Image
          src="/images/logo3.png"
          width={1000}
          height={1000}
          loading="lazy"
          alt="logo"
          className="h-10 w-auto md:h-12 lg:h-14"
        />
      </div>

      <div className="hidden md:flex md:items-center md:space-x-4 flex-1">
        <MenuItems
          items={user ? ['Home', 'Dashboard', 'Booking', 'Service', 'Contact'] : ['Home', 'Booking', 'Service', 'Contact']}
          link={user ? ['/#home', '/dashboard', '/#booking', '/#services', '/#contact'] : ['/#home', '/#booking', '/#services', '/#contact']}
        />
      </div>

      <div className="hidden md:flex md:items-center md:space-x-3">
        <SlSocialFacebook className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity" />
        <IoMailOutline className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity" />
      </div>

      {user ? (
        <div className="hidden md:flex md:items-center md:space-x-3">
          <Link href="/dashboard">
            <span className="font-semibold text-gray-700 hover:text-blue-600 transition-colors">
              {user.name || user.phoneNumber}
            </span>
          </Link>
          <button
            onClick={logout}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="hidden md:flex md:items-center md:space-x-3">
          <Link href="/login">
            <button className="px-4 py-1.5 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 hover:text-blue-800 transition-colors font-medium text-sm">
              Login
            </button>
          </Link>
        </div>
      )}

      <Menuweb className="hidden lg:block" />
      <div className="md:hidden">
        <Menumobile />
      </div>
    </div>
  );
}
