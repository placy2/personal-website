import React from 'react';

const About: React.FC = () => {
  return (
    <div className="about-content">
      <h1>A little bit about me</h1>

      <h2>Early Years (Childhood-College)</h2>
      <p>
        As with many programmers, I was an 'inside kid'. A high school class led me to Java and I
        was hooked! I didn't launch a unicorn startup by 18 or anything, but I did get a solid
        foundation in programming and algorithms.
      </p>

      <h2>Career</h2>
      <p>
        After school, I started in tech consulting. I contributed across the full stack in different
        web apps and learned how large-scale SDLC works in the real world.
      </p>
      <p>
        I became passionate about CI/CD and reliable releases, which led me to switch gears to a
        Cloud Engineer role. I now work day-to-day enabling developer teams and working towards
        safer, faster, & simpler production releases.
      </p>

      <h2>Looking Forward</h2>
      <p>
        I'm still in the "soak up everything" stage of my career. I am always happy to learn new
        things and work with new people. Please reach out if you'd like to collaborate or chat!
      </p>
    </div>
  );
};

export default About;
