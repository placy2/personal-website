import React from 'react';
import headshotPhoto from '../assets/2024headshot.jpeg'

const Home: React.FC = () => {
  return (
    <>
      <div>
        <a href="https://github.com/placy2" target="_blank">
          <img src={headshotPhoto} className="headshot" alt="Recent headshot of Parker (2023)" />
        </a>
      </div>
      <h1>Parker Lacy</h1>
      <p className="read-the-docs">
        Cloud Engineer based in the Denver area - passionate about technology, music, and family
      </p>
    </>
  )
};

export default Home;