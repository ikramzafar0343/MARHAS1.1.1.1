import React from 'react';
import HeroSlider from '../components/HeroSlider';
import CategoryShowcase from '../components/sections/CategoryShowcase';
import BestSellers from '../components/sections/BestSellers';
import Craftsmanship from '../components/sections/Craftsmanship';
import Features from '../components/sections/Features';
import InstagramGrid from '../components/sections/InstagramGrid';

const Home = () => {
  return (
    <div className="bg-brand-bg">
      <HeroSlider />
      <CategoryShowcase />
      <BestSellers />
      <Craftsmanship />
      <InstagramGrid />
      <Features />
    </div>
  );
};

export default Home;
