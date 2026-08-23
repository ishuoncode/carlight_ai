"use client";
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";


import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";

export default function Serviceslider() {
    const data=["Dry cleaning any dirt inside the car and trunk","Stain removal and upholstery restoration","Trunk and pile rug car cleaning service","Deep interior cleaning after flooding"]
  return (
    <div className="">
      <Swiper
        slidesPerView={1}
        centeredSlides={true}
        // autoplay={{
        //   delay: 8000,
        //   disableOnInteraction: false,
        // }}
        loop={true}
        pagination={{
          clickable: true,
        }}
        navigation={true}
        modules={[Pagination, Navigation]}
        allowTouchMove={false}
        className="mySwiper mySlider"
        style={{ height: "420px" }}
      >
        {data.map((item,i)=>(
            <div key={i}>
            <SwiperSlide>
            <div className="  mlg:flex flex-cols bg-[#2B2A4C]  ">
                
              <div className="mlg:w-[60%] w-[90%] mlg:mt-28  ">
                
                <div className="flex items-center justify-center">
                  <hr className="w-[15%] relative bottom-[9px] mr-5" />
                  <p className="upper text-center mb-5 text-[#209FDC] italic ">
                    Dry cleaning
                  </p>
                </div>
                <div className=" mx-[10%] text-[#f8f8f8]">
                  <p className="font-bold text-2xl text-center ">
                    {item}
                  </p>
                  <button className="text-center ml-5 md:mt-8 mt-3 p-2 text-[#209FDC] border-[#209FDC] hover:scale-110 border-2 hover:text-white hover:bg-[#209FDC]   rounded-xl mb-[5px]   ">Go to Services</button>
                </div>
              </div>
              <div className=" ">
                <ReactCompareSlider
                  itemOne={
                    <ReactCompareSliderImage
                      src={`/images/Before_0${i+1}.jpg`}
                      srcSet={`/images/Before_0${i+1}.jpg`}
                      alt="Image one" 
                      loading="lazy"
                      className=""
                    />
                  }
                  itemTwo={
                    <ReactCompareSliderImage
                      src={`/images/After_0${i+1}.jpg`}
                      srcSet={`/images/After_0${i+1}.jpg`}
                      alt="Image two"
                      loading="lazy"
                    />
                  }
                />
              </div>
            </div>
          </SwiperSlide>
          </div>
        ))}
      </Swiper>
    </div>
  );
}
