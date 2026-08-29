"use client";
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import svgIcon from "@/public/carwash.svg";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import "./slider.css";

export default function Slider() {
  return (
    <div id="home" className="relative w-full">
      <Swiper
        slidesPerView={1}
        centeredSlides={true}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        loop={true}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        navigation={true}
        modules={[Autoplay, Pagination, Navigation]}
        className="mySwiper mySlider w-full"
      >
        {/* Slide 1: Illustration */}
        <SwiperSlide className="flex items-center justify-center">
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#9EB8D9] to-[#7A9BC4] relative overflow-hidden p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center justify-center z-10 text-center"
            >
              <Image
                src={svgIcon}
                alt="Car Wash Icon"
                width={150}
                height={150}
                className="mb-4 sm:mb-6"
                loading="lazy"
              />
              <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2 sm:mb-4">
                Welcome to CarLight
              </h2>
              <p className="text-sm sm:text-lg text-white/90 mb-6 sm:mb-8">
                Premium hand car wash services
              </p>
              <Link href="/#booking">
                <button className="px-6 sm:px-8 py-2 sm:py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl">
                  Book Now
                </button>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute bottom-0 right-0 w-48 h-48 sm:w-64 sm:h-64 opacity-80"
            >
              <Image
                src="/images/bluecar.png"
                alt="Blue Car"
                width={400}
                height={400}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </motion.div>
          </div>
        </SwiperSlide>

        {/* Slide 2: Exterior Treatment */}
        <SwiperSlide>
          <div className="relative w-full h-full flex flex-col items-center justify-center text-center">
            <Image
              src="/images/carwash1.jpg"
              alt="Full Service Car Wash"
              fill
              className="absolute inset-0 object-cover brightness-50"
              loading="lazy"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative z-10 px-4 sm:px-8 max-w-2xl"
            >
              <p className="text-xs sm:text-base text-white/90 mb-2 sm:mb-4 uppercase tracking-wider">
                Full Service & Exterior Treatment
              </p>
              <h2 className="text-xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
                We Love Your Car<br />
                <span className="text-blue-300">The Same As You Do</span>
              </h2>
              <Link href="/#services">
                <button className="px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all">
                  Learn More
                </button>
              </Link>
            </motion.div>
          </div>
        </SwiperSlide>

        {/* Slide 3: Detailing Services */}
        <SwiperSlide>
          <div className="relative w-full h-full flex flex-col items-center justify-center text-center">
            <Image
              src="/images/carwash2.jpg"
              alt="Detailing Services"
              fill
              className="absolute inset-0 object-cover brightness-50"
              loading="lazy"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative z-10 px-4 sm:px-8 max-w-2xl"
            >
              <p className="text-xs sm:text-base text-white/90 mb-2 sm:mb-4 uppercase tracking-wider">
                Express Detail to Full Interior & Exterior
              </p>
              <h2 className="text-xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
                Detailing Services<br />
                <span className="text-blue-300">With A Personal Touch</span>
              </h2>
              <Link href="/#booking">
                <button className="px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all">
                  Book Detailing
                </button>
              </Link>
            </motion.div>
          </div>
        </SwiperSlide>

        {/* Slide 4: Hand Care Wash */}
        <SwiperSlide>
          <div className="relative w-full h-full flex flex-col items-center justify-center text-center">
            <Image
              src="/images/carwash3.jpg"
              alt="Hand Car Wash"
              fill
              className="absolute inset-0 object-cover brightness-50"
              loading="lazy"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative z-10 px-4 sm:px-8 max-w-2xl"
            >
              <p className="text-xs sm:text-base text-white/90 mb-2 sm:mb-4 uppercase tracking-wider">
                Welcome to CarLight
              </p>
              <h2 className="text-xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
                Your Car Is Always<br />
                <span className="text-blue-300">In Great Hands With Us</span>
              </h2>
              <Link href="/#contact">
                <button className="px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all">
                  Contact Us
                </button>
              </Link>
            </motion.div>
          </div>
        </SwiperSlide>

        {/* Slide 5: Quality Service */}
        <SwiperSlide>
          <div className="relative w-full h-full flex flex-col items-center justify-center text-center">
            <Image
              src="/images/carwash4.jpg"
              alt="Quality Car Wash"
              fill
              className="absolute inset-0 object-cover brightness-50"
              loading="lazy"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative z-10 px-4 sm:px-8 max-w-2xl"
            >
              <p className="text-xs sm:text-base text-white/90 mb-2 sm:mb-4 uppercase tracking-wider">
                A Quality Service For You
              </p>
              <h2 className="text-xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
                We Help Keep<br />
                <span className="text-blue-300">Your Car Clean</span>
              </h2>
              <Link href="/#services">
                <button className="px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all">
                  View Services
                </button>
              </Link>
            </motion.div>
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
  );
}
