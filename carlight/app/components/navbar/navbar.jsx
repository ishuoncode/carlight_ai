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
    <div className="flex bg-[#f8f8f8] shadow items-center py-2">
      <div>
        <Image
          src="/images/logo3.png"
          width={1000}
          height={1000}
          loading="lazy"
          alt="logo"
          className="mxs:h-16 mxs:w-56 mxs:ml-5 h-8 w-25 ml-3"
        />
      </div>
      <div className="hidden md:grid grid-cols-5 gap-2 mx-auto w-1/3">
        <MenuItems
          items={user ? ['Home', 'Dashboard', 'Booking', 'Service', 'Contact'] : ['Home', 'Booking', 'Service', 'Contact']}
          link={user ? ['/#home', '/dashboard', '/#booking', '/#services', '/#contact'] : ['/#home', '/#booking', '/#services', '/#contact']}
        />
      </div>
      <div className="hidden sm:grid grid-cols-2 gap-5 mr-10 sm:mr-2 sm:gap-1">
        <SlSocialFacebook className="w-10 h-5 cursor-pointer" />
        <IoMailOutline className="w-10 h-5 cursor-pointer" />
      </div>
      {user ? (
        <div className="flex items-center gap-3 mr-5">
          <Link href="/dashboard">
            <span className="font-semibold hidden lg:block cursor-pointer hover:text-blue-600 transition-colors">
              {user.name || user.phoneNumber}
            </span>
          </Link>
          <button
            onClick={logout}
            className="cursor-pointer border-2 px-5 py-1 hover:bg-[#cccccc] duration-300 hidden lg:block"
          >
            Logout
          </button>
        </div>
      ) : (
        <Link href="/login">
          <button className="mr-5 cursor-pointer border-2 px-5 py-1 hover:bg-[#cccccc] duration-300 lg:block hidden">
            Login
          </button>
        </Link>
      )}
      <Menuweb className="hidden lg:block" />
      <div className=" lg:hidden">
        <Menumobile />
      </div>
    </div>
  );
}
