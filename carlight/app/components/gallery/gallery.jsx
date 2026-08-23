import Image from "next/image";
import React from "react";

export default function carprotection() {
  return (
    <div className="md:pt-[12rem] pt-[6rem] flex-col" id="gallery">
      <div className="flex-col text-center text-3xl font-semibold text-[#222222] w-[18rem] m-auto ">
        LATEST WORKS
        <hr className="mt-5" />
      </div>
      <p className="text-[#209FDC] italic text-center my-7 ">Carlite gallery</p>
      <div className="p-5 md:p-10 ">
        <div className="columns-1 xs:columns-2 lg:columns-3 xl:columns-4 gap-5 lg:gap-8 [&>img:not(:first-child)]:mt-5 lg:[&>img:not(:first-child)]:mt-8">
          <Image
            src={`/images/gallery/gallery_01.jpg`}
            alt="galery-01"
            height={500}
            width={500}
            loading="lazy"
          />
          <Image
            src={`/images/gallery/gallery_02.jpg`}
            alt="galery-02"
            height={500}
            width={500}
            loading="lazy"
          />
          <Image
            src={`/images/gallery/gallery_04.jpg`}
            alt="galery-04"
            height={500}
            width={500}
            loading="lazy"
          />
          <Image
            src={`/images/gallery/gallery_05.jpg`}
            alt="galery-05"
            height={500}
            width={500}
            loading="lazy"
          />
          <Image
            src={`/images/gallery/gallery_06.jpg`}
            alt="galery-06"
            height={500}
            width={500}
            loading="lazy"
          />
          <Image
            src={`/images/gallery/gallery_07.jpg`}
            alt="galery-07"
            height={500}
            width={500}
            loading="lazy"
          />
          <Image
            src={`/images/gallery/gallery_08.jpg`}
            alt="galery-08"
            height={500}
            width={500}
            loading="lazy"
          />
          <Image
            src={`/images/gallery/gallery_09.jpg`}
            alt="galery-09"
            height={500}
            width={500}
            loading="lazy"
          />
          <Image
            src={`/images/gallery/gallery_10.jpg`}
            alt="galery-10"
            height={500}
            width={500}
            loading="lazy"
          />
          <Image
            src={`/images/gallery/gallery_11.jpg`}
            alt="galery-11"
            height={500}
            width={500}
            loading="lazy"
          />
          <Image
            src={`/images/gallery/gallery_12.jpg`}
            alt="galery-12"
            height={500}
            width={500}
            loading="lazy"
          />
          <Image
            src={`/images/gallery/gallery_13.jpg`}
            alt="galery-13"
            height={500}
            width={500}
            loading="lazy"
          />
          <Image
            src={`/images/gallery/gallery_14.jpg`}
            alt="galery-14"
            height={500}
            width={500}
            loading="lazy"
          />
          
           <Image
            src={`/images/gallery/gallery_16.jpg`}
            alt="galery-14"
            height={500}
            width={500}
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
