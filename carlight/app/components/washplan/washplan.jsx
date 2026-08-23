"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function WashPlan() {
  const [active, setActive] = useState("1");
  const handleClick = (event) => {
    setActive(event.target.id);
  };

  const services = [
    ["Exterior Hand Wash", "Towel Hand Dry", "Wheel Shine"],
    [
      "Exterior Hand Wash",
      "Towel Hand Dry",
      "Wheel Shine",
      "Tire Dressing",
      "Windows In & Out",
      "Sealer Hand Wax",
    ],
    [
      "Exterior Hand Wash",
      "Towel Hand Dry",
      "Wheel Shine",
      "Tire Dressing",
      "Windows In & Out",
      "Interior Vacuum",
      "Door Shuts & Plastics",
      "Dashboard Clean",
      "Air Freshener",
      "Sealer Hand Wax",
    ],
    [
      "Exterior Hand Wash",
      "Towel Hand Dry",
      "Wheel Shine",
      "Tire Dressing",
      "Windows In & Out",
      "Interior Vacuum",
      "Door Shuts & Plastics",
      "Dashboard Clean",
      "Air Freshener",
      "Sealer Hand Wax",
      "Triple Coat Hand Wax",
      "Exterior Vinyl Protectant",
      "Rain-X Complete",
    ],
  ];

  const packages = [
    {
      id: "1",
      name: "Regular Car",
      heading: [
        "basic hand wash",
        "DELUXE WASH",
        "ULTIMATE SHINE",
        "PLATINUM WORKS",
      ],
      prices: [250, 450, 650, 750],
      time: [30, 50, 70, 90],
    },
    {
      id: "2",
      name: "SUV",
      heading: [
        "basic hand wash",
        "DELUXE WASH",
        "ULTIMATE SHINE",
        "PLATINUM WORKS",
      ],
      prices: [300, 500, 700, 800],
      time: [35, 50, 75, 100],
    },
    {
      id: "3",
      name: "Pickup Truck",
      heading: [
        "basic hand wash",
        "DELUXE WASH",
        "ULTIMATE SHINE",
        "PLATINUM WORKS",
      ],
      prices: [350, 550, 750, 750],
      time: [40, 55, 80, 110],
    },
    {
      id: "4",
      name: "Cargo Truck",
      heading: [
        "basic hand wash",
        "DELUXE WASH",
        "ULTIMATE SHINE",
        "PLATINUM WORKS",
      ],
      prices: [450, 650, 850, 950],
      time: [50, 60, 90, 120],
    },
  ];

  const activePackage = packages.find((pkg) => pkg.id === active);


  return (
    <div className="pt-20 flex-col" id="booking">
        <div className="flex-col text-center text-3xl font-semibold text-[#222222] w-[18rem] m-auto">
          WASH PACKAGES
          <hr className="mt-5" />
        </div>
        <p className="text-[#209FDC] italic text-center my-7">
          Which wash is the best for your vehicle?
        </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mt-10  mlg:mx-[5rem] mx-[3rem]  md:pt-10">
        {packages.map((item) => (
          <button
            key={item.id}
            className={`flex items-center justify-center mb-4 md:mb-0 flex-col border-2 pb-2 border-solid text-[#818181] ${
              active === item.id
                ? "bg-[#cfc9c9] text-white"
                : "hover:bg-[#cfc9c9] hover:text-white"
            } transition-colors duration-300 hover:bg-[#e2cfcf]`}
            id={item.id}
            onClick={handleClick}
          >
            <Image
              src={`/package-${item.id}.svg`}
              alt={`package-${item.id}`}
              height={500}
              width={500}
              loading="lazy"
              className="h-[7rem] w-[7rem]"
              id={item.id}
              onClick={handleClick}
            />
            <p className="" id={item.id} onClick={handleClick}>
              {item.name}
            </p>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mt-10 mlg:mx-[5rem]  mx-[3rem]   pt-10 text-center ">
        {packages.map((item, i) => (
          <div className="border-2 w-full p-4" key={item.id}>
            <p className="uppercase mb-5 font-semibold text-xl text-[#222222]">
              {item.heading[i]}
            </p>
            <p className="text-[#209FDC] mb-5 text-xl font-semibold">
              ₹ {activePackage ? activePackage.prices[i] : ""}
            </p>
            <hr className="W-[90%]" />
            <div className="flex justify-center py-3">
              <Image
                src={"/clock.svg"}
                height={500}
                width={500}
                alt="clock"
                loading="lazy"
                className="h-[1.2rem] w-[1.2rem] "
              />
              <p className="ml-4">{`${
                activePackage ? activePackage.time[i] : ""
              } min`}</p>
            </div>
            <hr className="W-[90%] mb-5" />
            <div className="text-[#818181] leading-loose">
              {services[i].map((service, j) => (
                <p key={j}>{service}</p>
              ))}
            </div>
            <Link  href="/book">
            <button className="uppercase border-2 rounded-3xl px-5 py-2 text-[#209FDC] border-[#209FDC] mt-5 hover:text-white hover:bg-[#209FDC] ">
              Book now
            </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
