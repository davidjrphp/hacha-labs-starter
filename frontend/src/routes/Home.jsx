import Hero from "../components/Hero.jsx";
import AboutSnippet from "../components/AboutSnippet.jsx";
import StaffCarousel from "../components/StaffCarousel.jsx";
import NewsFeed from "../components/NewsFeed.jsx";

export default function Home(){
  return (
    <>
      <Hero/>
      <AboutSnippet/>
      <StaffCarousel/>
      <NewsFeed/>
    </>
  );
}
