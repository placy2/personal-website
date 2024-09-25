import React from 'react';
import headshotPhoto from '../assets/2024headshot.jpeg'

const Home: React.FC = () => {
  return (
    <div className='flex justify-center flex-col items-center'>
      <a href="https://github.com/placy2" target="_blank">
        <img src={headshotPhoto} className="headshot" alt="Recent headshot of Parker (2023) - links to Github" />
      </a>
      <h1>Parker Lacy</h1>
      <p className="home-page-text">
        Cloud Engineer based in the Denver area - passionate about technology, music, and family
      </p>
      <p className="home-page-text">
        Exciting CSS animation coming soon?
      </p>
    </div>
  )
};

export default Home;