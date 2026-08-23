import Image from "next/image";
import React from "react";


export default function features() {
  const data = [
    {
      name: "Washing",
      detail:
        "Car Lite provides automobile owners with a variety of cleaning services, from full inside detailing to a top wash.",
    },
    {
      name: "Interior Cleaning",
      detail:
        "Car Lite provides a premium inside wash that will restore your vehicle to new condition.",
    },
    {
      name: "Safety Materials",
      detail:
        "We exclusively use trustworthy brands of products that prolong the life of your vehicle and are safe to use.",
    },
    {
      name: "Polish and waxing",
      detail:
        "Car Lite provides you with the greatest polishing and waxing services available, making your car shine in any situation.",
    },
  ];
  return (
    <div className="grid mxs:grid-cols-2 md:grid-cols-4 gap-4 mt-10 mx-5 md:mx-20 pt-[70px]">
      {data.map((item, i) => (
        <div
          className="flex items-center justify-center mb-4 md:mb-0 flex-col "
          key={i}
        >
          <Image
            src={`/features${i + 1}.svg`}
            alt="features1"
            width={500}
            height={500}
            className="h-[7rem] w-[7rem] hover:scale-105 cursor-pointer duration-300"
            loading="lazy"
          />
          <p className="font-semibold mt-2 ">{item.name}</p>
          <p className="mt-2 p-4">{item.detail}</p>
        </div>
      ))}
    </div>
  );
}
