"use client";
import React from "react";
import Image from "next/image";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";

export default function Customer() {
  const controls = useAnimation();
  const [ref, inView] = useInView({
  triggerOnce: true,
  });

  if (inView) {
    controls.start({ opacity: 1, x: 0 });
  }

  return (
    <div className="pt-[20px] md:mx-20   bg-[#b6cae5] mt-20 xl:h-[664px] lg:h-[600px]  mlg:h-[500px] md:h-[450px] sm:h-[450px] mxs:h-[420px] h-[370px]">
      <div className="flex justify-end pr-4 mb-[2rem] ]">
        {/* <motion.div
          ref={ref}
          initial={{ opacity: 0, x: "+100%" }}
          // animate={{ opacity: 1, x: 0 }}
          animate={controls}
          exit={{ opacity: 0, x: "+100%" }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="xl:w-[30%]   lg:py-5 lg:px-5 py-2 px-5 font-bold lg:text-xl md:text-[15px] text-[10px] text-[#393646] shadow-xl text-center rounded-[2rem] border-2 border-[#1186DB] "
        > */}


<motion.div
                initial={{ opacity: 0, x: "-100%" }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: "-100%" }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="xl:w-[30%]   lg:py-5 lg:px-5 py-2 px-5 font-bold lg:text-xl md:text-[15px] text-[10px] text-[#393646] shadow-xl text-center rounded-[2rem] border-2 border-[#1186DB] "
              >
          <p>Call and Book a Service </p>
          <p>+91 958xxxxxxx </p>
          <p>Monday-Sunday: 7am-7pm </p>
        </motion.div>
      </div>
      <div className="text-center">
        <Image
          src="/5000.svg"
          alt="5000"
          height={500}
          width={500}
          loading="lazy"
          className="xl:w-[50%]      mx-auto"
        />
        <div className="flex-col ">
          <div className="text-[#2D4CB8] relative xl:bottom-[10.5rem]  lg:bottom-[8rem] mxl:bottom-[7rem] mxs:bottom-[6rem] xs:bottom-[4rem] bottom-[5.5rem] text-center items-center ">
            <p className="xl:text-4xl text-2xl font-semibold ">
              Over{" "}
              <span className="font-semibold xl:text-5xl text-3xl     text-[#35A29F]">
                5000+
              </span>
            </p>
            <p className="mxl:text-3xl text-2xl  font-bold ">Happy Customer</p>
          </div>
          <div className="">
            <motion.div
            ref={ref}
              initial={{ opacity: 0, x: "-100%" }}
              // animate={{ opacity: 1, x: 0 }}
              animate={controls}
              exit={{ opacity: 0, x: "-100%" }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className=""
            >
              <Image
                src="/images/mirror-bluecar.png"
                alt="mirror-bluecar"
                width={2000}
                height={2000}
                loading="lazy"
                className="w-[70%] md:ml-[10rem] ml-[5rem] "
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
