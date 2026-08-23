import React from "react";
import ServiceSlider from "./Serviceslider";

export default function services() {
  return (
    <div className="pt-[80px] flex-col " id="services">
      <div className="flex-col text-center text-3xl font-semibold text-[#222222] w-[18rem] m-auto ">
        OUR SERVICES
        <hr className="mt-5" />
      </div>
      <p className="text-[#209FDC] italic text-center my-7">
        See what we can do for you{" "}
      </p>
      <p className="text-[#818181] not-italic text-center my-7 font-medium text-2xl">
        Premium Washing Services
      </p>
      <div className=" lg:mx-[10%]  mx-5  mt-10">
        <p
          className="font-bold text-[#209FDC] text-4xl italic text-center bg-clip-text text-transparent mlg:block hidden"
          style={{ WebkitTextStroke: "1px #209FDC" }}
        >
          BEFORE
        </p>
        <ServiceSlider />
        <p
          className="font-bold text-[#209FDC] text-4xl italic text-center bg-clip-text text-transparent text-right mr-20 mlg:block hidden"
          style={{ WebkitTextStroke: "1px #209FDC" }}
        >
          AFTER
        </p>
      </div>
    </div>
  );
}
