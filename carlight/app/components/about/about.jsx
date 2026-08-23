import React from "react";
import Image from "next/image";

export default function about() {
  const about1 = [
    "We offer multiple services at a great value",
    "Multiple car wash locations throughout India",
    "Biodegradable and eco-friendly products",
    "Pay for your wash electronically and securely",
    "Trained and skilled car wash crew members",
  ];
  const about2 = [
    "We are very open and easy to reach company",
    "Our email is checked hourly during the day",
    "Book an appointment online under 3 minutes",
    "Our tool free number will be answered",
    "ou can pay online for your appointment",
  ];
  return (
    <div className="align-center pt-[120px]" id="about">
      <div className="flex-col text-center text-3xl font-semibold text-[#222222] w-[18rem] m-auto ">
        WHO IS CARLIGHT
        <hr className="mt-5" />
      </div>
      <p className="text-[#209FDC] italic text-center my-7">
        Car wash & detailling service
      </p>
      <div className="grid lg:grid-cols-2 grid-cols-1 gap-3 lg:gap-1 xl:mx-[5%]  px-5">
        <Image
          src="/images/profile.jpg"
          alt="washing car"
          height={500}
          width={500}
          className="xl:pl-8 pl-2 mx-auto lg:col-span-1 lg:self-center"
          loading="lazy"
        />
        <div className="italic text-[#818181] ">
          CarLight Hand Wash is an eco-friendly, hand car wash and detailing
          service based in INDIA. Our company was founded back in 2020 by a team
          of experts with more then 10 years of professional car wash
          experience. We operate three car washes throught INDIA area. Our goal
          is to provide our customers with the friendliest, most convenient hand
          car wash experience possible. We use the most modern and up-to-date
          water reclamation modules as a part of our car wash systems. Our
          products are all biodegradable and eco-friendly.
          <div className="flex mxs:flex-row  flex-col">
            <div className="flex flex-col  mr-4 ">
              <Image
                src="/about1.svg"
                alt="about1"
                height={500}
                width={500}
                className="h-[5rem] w-[5rem] mt-5 mb-5 ml-10  "
                loading="lazy"
              />
              <p className="text-[#222222] not-italic font-medium ml-10 mb-5">THE BEST CAR WASH</p>

              <ol>
                {about1.map((item, i) => (
                  <li key={i}>
                    <span className="flex ml-2">
                      <Image
                        src="/tick.svg"
                        height={500}
                        width={500}
                        className="h-[2rem] w-[2rem]"
                        alt="tick"
                        loading="lazy"
                      />
                      {item}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div className=" flex flex-col">
              <Image
                src="/about2.svg"
                alt="about2"
                height={500}
                width={500}
                className="h-[5rem] w-[5rem] mt-5 mb-5 ml-10"
                loading="lazy"
              />
                     <p className="text-[#222222] not-italic font-medium ml-10 mb-5" >CONTACTING US</p>
              <ol>
                {about2.map((item, i) => (
                  <li key={i}>
                    <span className="flex ml-2">
                      <Image
                        src="/tick.svg"
                        height={500}
                        width={500}
                        className="h-[2rem] w-[2rem]"
                        alt="tick"
                        loading="lazy"
                      />
                      {item}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
