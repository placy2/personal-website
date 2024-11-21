import React from 'react';
import headshotPhoto from '../assets/2024headshot.jpeg'

const Home: React.FC = () => {
  return (
    <div className='home-page-container'>
      <div>
        <a href="https://github.com/placy2" target="_blank">
          <img src={headshotPhoto} className="headshot" alt="Recent headshot of Parker (2023)" />
        </a>
      </div>
      <h1>Parker Lacy</h1>
      <p className="home-page-text">
        Cloud Engineer based in the Denver area - passionate about technology, music, and family
         <br/>
         <br/>
        See below for some icons of my favorite tools and technologies:
      </p>
      {/* <div className="icon-container">
        Add later with icons for Kubernetes, Docker, AWS, Azure DevOps, etc. and find a way to organize them neatly static at first
      </div> */}
    </div>
  )
};

export default Home;