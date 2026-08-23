"use client";
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import svgIcon from "@/public/carwash.svg";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import "./slider.css";

export default function Slider() {
  const customStyle = {
    height: "615px",
    zIndex: "1",
    "@media (max-width: 500px)": {
      height: "500px",
    },
  };

  return (
    <div id="home">
      <Swiper
        slidesPerView={1}
        centeredSlides={true}
        autoplay={{
          delay: 8000,
          disableOnInteraction: false,
        }}
        loop={true}
        pagination={{
          clickable: true,
        }}
        navigation={true}
        modules={[Autoplay, Pagination, Navigation]}
        className="mySwiper mySlider"
        // style={customStyle}
      >
        <AnimatePresence>
          <SwiperSlide>
            <div className=" h-full items-center bg-[#9EB8D9]">
              <Image
                src={svgIcon}
                alt="My SVG"
                width={200}
                height={200}
                className="relative top-[8rem] w-full h-50 "
                loading="lazy"
              />
              <motion.div
                initial={{ opacity: 0, x: "+100%" }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: "+100%" }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className=""
              >
                <Image
                  src="/images/bluecar.png"
                  alt="My SVG"
                  width={2000}
                  height={2000}
                  className="relative bottom-[-6rem] left-[4rem] w-[80%] "
                  loading="lazy"
                />
              </motion.div>
              {/* <p className="mb-10">Full Service and Exterior Treatment</p>
          <p className="text-5xl font-bold text-2xl">
            we love your car <br />
            the same as you do
          </p> */}
              {/* <div className="relative bottom-[12rem] left-[2rem] pl-5 border-2 w-[20%]">Book an  appointment via call 
            <p> +91 548xxxxxxx</p>
            <p>Monday-Sunday: 8am - 6pm</p>
          </div>*/}
            </div>
          </SwiperSlide>
        </AnimatePresence>
        <SwiperSlide>
          <div className="relative h-full bg-cover z-1 sm:bg-left flex flex-col content-center justify-center items-center sm:text-xl text-lg uppercase text-center">
            <Image
              height={500}
              width={500}
              src="/images/carwash1.jpg" // Replace with the actual path to your image
              alt="Car Wash"
              loading="lazy"
              className="absolute top-0 left-0 w-full h-full object-cover opacity-75"
            />
            <p className="sm:mb-10 relative bottom-2 ml-2 text-base sm:text-xl mb-2">
              Full Service and Exterior Treatment
            </p>
            <p className="sm:text-5xl relative font-bold sm:mb-8 text-base bottom-3 text-[#404040]">
              we love your car <br />
              the same as you do
            </p>
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div className="relative h-full bg-cover sm:bg-left bg-center flex flex-col content-center justify-center items-center sm:text-2xl text-xl uppercase text-center">
            <Image
              height={500}
              width={500}
              src="/images/carwash2.jpg" // Replace with the actual path to your image
              alt="Car Wash"
              loading="lazy"
              className="absolute top-0 left-0 w-full h-full object-cover opacity-75"
            />
            <p className="sm:mb-10 relative bottom-2 ml-2 text-base sm:text-xl mb-2">
              From express detail to full inside & out
            </p>
            <p className="sm:text-5xl relative font-bold sm:mb-8 text-base bottom-3  text-[#404040]">
              Detailing Services <br />
              with a personal touch
            </p>
          </div>
        </SwiperSlide>
        <SwiperSlide>
          {/* <div className="  bg-[url('/images/carwash3.jpg')] opacity-75 h-full bg-cover sm:bg-left bg-top  flex flex-col content-center justify-center item-center    sm:text-2xl text-xl uppercase ">
            <p className=" relative sm:top-[7rem] sm:left-20 sm:mb-5 top-[4rem] item-center ml-2 text-base sm:text-xl ">
              welcome to <strong>car light</strong> a hand car wash{" "}
            </p>
            <p className=" relative sm:top-[7rem] sm:text-5xl sm:left-20  top-[4rem] ml-2 font-bold text-base mb-8">
              your car is always <br />
              great hand with us
            </p>
          </div> */}
            <div className="  bg-cover opacity-75 h-full bg-cover sm:bg-left bg-top  flex flex-col content-center justify-center item-center    sm:text-2xl text-xl uppercase ">
            <Image
              height={500}
              width={500}
              src="/images/carwash3.jpg" // Replace with the actual path to your image
              alt="Car Wash"
              loading="lazy"
              className="absolute top-0 left-0 w-full h-full object-cover "
            />

            <p className=" relative sm:top-[7rem] sm:left-20 sm:mb-5 top-[4rem] item-center ml-2 text-base sm:text-xl ">
              welcome to <strong>car light</strong> a hand car wash{" "}
            </p>
            <p className=" relative sm:top-[7rem] sm:text-5xl sm:left-20  top-[4rem] ml-2 font-bold text-base mb-8">
              your car is always <br />
              great hand with us
            </p>
          </div>


        </SwiperSlide>
        <SwiperSlide>
          {/* <div className="bg-[url('/images/carwash4.jpg')] opacity-75 h-full bg-cover sm:bg-left bg-top  flex flex-col content-center justify-center items-center text-[#F8F8F8]  sm:text-2xl text-xl uppercase">
            <p className="mb-10 text-base sm:text-xl">
              A Quality service for you{" "}
            </p>
            <p className="sm:text-5xl font-bold text-center mb-8  text-base ">
              we help keep <br />
              your car clean
            </p>
          </div> */}

          <div className="bg-cover  opacity-75 h-full bg-cover sm:bg-left bg-top  flex flex-col content-center justify-center items-center text-[#F8F8F8]  sm:text-2xl text-xl uppercase">
            <Image
              height={500}
              width={500}
              src="/images/carwash4.jpg" // Replace with the actual path to your image
              alt="Car Wash"
              loading="lazy"
              className="absolute top-0 left-0 w-full h-full object-cover "
            />
            <p className="sm:mb-10 relative bottom-2 ml-2 text-base sm:text-xl mb-2">
              A Quality service for you{" "}
            </p>
            <p className="sm:text-5xl relative font-bold sm:mb-8 text-base bottom-3 text-center">
              we help keep <br />
              your car clean
            </p>
          </div>

       
        </SwiperSlide>
      </Swiper>
    </div>
  );
}
