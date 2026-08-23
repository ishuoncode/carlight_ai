import Carousel from "./components/homeslider/slider";
import Features from "./components/features/features";
import About from "./components/about/about";
import Services from "./components/Services/services";
import Washplan from "./components/washplan/washplan";
import Sastifiedcustomer from "./components/Sastifiedcustomer/Sastifiedcustomer";
import Gallery from "./components/gallery/gallery";
import Contact from "./components/contact/contact";

export default function Home() {
  return (
    <div className="">
      <Carousel />
      <About />
      <Features />
      <Services />
      <Washplan />
      <Sastifiedcustomer />
      <Gallery />
      <Contact />
    </div>
  );
}
