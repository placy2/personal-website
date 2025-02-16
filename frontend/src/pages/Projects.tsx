import React from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import '../stylesheets/Projects.css';

const projects = [
  { name: 'Personal Site (This!)', description: 'My own site - AWS hosting 🔋 included', url: 'https://github.com/placy2/personal-website' },
  { name: 'Big Data/ML Course Final Project', description: 'Analysis of large opioid distribution dataset', url: 'https://github.com/placy2/US-opioid-data-analysis' },
  { name: 'Reddit/Telegram Bot', description: 'Fun little Telegram bot that scrapes Reddit', url: 'https://github.com/placy2/telegramBot' },
  // Add more repositories as needed
];

const Projects: React.FC = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: '0',
  };

  return (
    <div>
      <h1>Projects Page</h1>

      <p>
        This is a collection of my public projects and past work.
      <br/>
        While not exhaustive, this is what I can easily show off (for now)!
      </p>
      <Slider {...settings} className="slick-slider">
        {projects.map((project, index) => (
          <div key={index} className="project-card">
            <h3>{project.name}</h3>
            <p>{project.description}</p>
            <a href={project.url} target="_blank" rel="noopener noreferrer">View Repository</a>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default Projects;