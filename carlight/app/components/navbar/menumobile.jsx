'use client';
import React, { useState } from 'react';
import { IoMenuSharp, IoClose } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function MenuMobile() {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const toggleMenu = () => {
    setShowMenu(!showMenu);
    // Toggle body scrolling
    document.body.classList.toggle('overflow-hidden');
  };

  return (
    <div className="mr-5">
      <IoMenuSharp
        className="cursor-pointer w-10 h-7"
        onClick={toggleMenu}
      />
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, x: '-100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '-100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed top-0 left-0 w-full h-full bg-gray-200 flex flex-col z-10 overflow-y-auto"
          >
            <div className="flex items-center justify-center mt-8">
              <IoClose
                className="absolute top-5 right-4 cursor-pointer h-6 w-6"
                onClick={toggleMenu}
              />
            </div>
            <div className="grid grid-rows-7 gap-3 mt-[20%] px-5 py-2">
              <p className="">
                <Link href="/#home" onClick={() => setShowMenu(!showMenu)}>
                  Home
                </Link>
              </p>{' '}
              <hr />
              <p className="">
                <Link
                  href="/#booking"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  Booking
                </Link>
              </p>{' '}
              <hr />
              <p className="">
                <Link
                  href="/#services"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  Service
                </Link>
              </p>{' '}
              <hr />
              <p className="">
                <Link href="#" onClick={() => setShowMenu(!showMenu)}>
                  Shop
                </Link>
              </p>{' '}
              <hr />
              <p className="">
                <Link
                  href="/#contact"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  {' '}
                  Contact
                </Link>
              </p>{' '}
              {user ? (
                <>
                  <hr />
                  <p className="">
                    <Link href="/dashboard" onClick={() => setShowMenu(!showMenu)}>
                      <span className="font-semibold text-blue-600">
                        {user.name || user.phoneNumber}
                      </span>
                    </Link>
                  </p>{' '}
                  <hr />
                  <p className="">
                    <button
                      onClick={() => {
                        setShowMenu(!showMenu);
                        logout();
                      }}
                      className="text-red-600 font-semibold"
                    >
                      Logout
                    </button>
                  </p>{' '}
                </>
              ) : (
                <>
                  <hr />
                  <p className="">
                    <Link href="/login" onClick={() => setShowMenu(!showMenu)}>
                      Login
                    </Link>
                  </p>{' '}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
