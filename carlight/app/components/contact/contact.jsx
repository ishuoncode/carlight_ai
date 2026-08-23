import React from "react";
import Contactbar from "./contactbar";

export default function contact() {
  return (
    <div className="pt-[60px]" id="contact">
      <div className="flex-col text-center text-3xl font-semibold text-[#222222] w-[18rem] m-auto">
        Want to Talk
        <hr className="mt-5" />
      </div>
      <p className="text-[#209FDC] italic text-center my-7 mb-10">Contact us</p>

      <div className="sm:flex p-5 md:p-10   ">
        <div className="sm:w-[50%] sm:mb-[0px] mb-[2rem]  ">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d3598.7621894199424!2d79.58162349261308!3d25.57957749893325!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e3!4m5!1s0x399d43c2230dd81d%3A0x90e5941f09c51ee9!2z4KSV4KS-4KSwIOCksuCkvuCkiOCknyDgpJXgpL7gpLAg4KSn4KWB4KSy4KS-4KSIIOCkuOClh-CkqOCljeCkn-CksA!3m2!1d25.5796209!2d79.58317009999999!4m5!1s0x399d43c2230dd81d%3A0x90e5941f09c51ee9!2zSEhITStSN1Yg4KSV4KS-4KSwIOCksuCkvuCkiOCknyDgpJXgpL7gpLAg4KSn4KWB4KSy4KS-4KSIIOCkuOClh-CkqOCljeCkn-CksCwgUmF0aCwgUmF0aCBQdXJhYiwgVXR0YXIgUHJhZGVzaCAyMTA0MzE!3m2!1d25.5796209!2d79.58317009999999!5e0!3m2!1sen!2sin!4v1701957381334!5m2!1sen!2sin"
            width="100%"
            height="100%"
            title="map"
            className="w-full h-[20rem] sm:h-full inset-0 aspect-w-1 aspect-h-1"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
        <div className=" text-center sm:w-[50%] ">
          <h2 className="title-font sm:text-3xl text-2xl mb-4 font-medium text-gray-900">
            Contact
          </h2>
          <p className="leading-relaxed mb-5 text-gray-600">
            Feel free to Contact
          </p>
          <div className="mlg:mx-[15%] mx-[5%] text-left">
          <form action="https://formspree.io/f/xleyqbnq" method="POST">
              <div className=" mb-4">
                <label
                  htmlFor="name"
                  className="leading-7 text-sm text-gray-600"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                  required
                />
              </div>
              <div className=" mb-4">
                <label
                  htmlFor="email"
                  className="leading-7 text-sm text-gray-600"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                  required
                />
              </div>
              <div className=" mb-4">
                <label
                  htmlFor="subject"
                  className="leading-7 text-sm text-gray-600"
                >
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                  required
                />
              </div>
              <div className=" mb-4">
                <label
                  htmlFor="message"
                  className="leading-7 text-sm text-gray-600"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  className="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 h-32 text-base outline-none text-gray-700 py-1 px-3 resize-none leading-6 transition-colors duration-200 ease-in-out"
                  defaultValue={""}
                  required
                />
              </div>
              <button className="text-white bg-blue-500 border-0 py-2 px-6 focus:outline-none hover:bg-blue-600 rounded text-lg">
                Send Message
              </button>
            </form>
            </div>
        </div>
      </div>
      <Contactbar/>
    </div>
  );
}
