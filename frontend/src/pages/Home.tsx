import React, { useEffect } from 'react';
import headshotPhoto from '../assets/2024headshot.jpeg';
import k8sIcon from '../assets/kubernetes_logo.png';
import tfIcon from '../assets/terraform_logo.png';
import awsIcon from '../assets/aws_logo.png';
import adoIcon from '../assets/ado_logo.webp';
import helmIcon from '../assets/helm_logo.png';
import { APP_CONFIG, EXTERNAL_LINKS, BREAKPOINTS } from '../constants';

const Home: React.FC = () => {
  // Use hooks to disable scrolling when on Homepage
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > BREAKPOINTS.MOBILE) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Reset scroll position to top
    window.scrollTo(0, 40);

    // Cleanup event listener and reset overflow style on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="home-page-container">
      <div>
        <a href={EXTERNAL_LINKS.GITHUB} target="_blank" rel="noopener noreferrer">
          <img src={headshotPhoto} className="headshot" alt="Recent headshot of Parker (2023)" />
        </a>
      </div>
      <h1>Parker Lacy</h1>
      <p className="home-page-text">
        {APP_CONFIG.description}
        <br />
        See below for some icons of my favorite tools and technologies:
      </p>
      <div className="icon-container">
        <a href={EXTERNAL_LINKS.KUBERNETES} target="_blank" rel="noopener noreferrer">
          <img src={k8sIcon} alt="Kubernetes" className="icon" />
        </a>
        <a href={EXTERNAL_LINKS.TERRAFORM} target="_blank" rel="noopener noreferrer">
          <img src={tfIcon} alt="Terraform" className="icon" />
        </a>
        <a href={EXTERNAL_LINKS.AWS} target="_blank" rel="noopener noreferrer">
          <img src={awsIcon} alt="AWS" className="icon" />
        </a>
        <a href={EXTERNAL_LINKS.AZURE_DEVOPS} target="_blank" rel="noopener noreferrer">
          <img src={adoIcon} alt="Azure DevOps" className="icon" />
        </a>
        <a href={EXTERNAL_LINKS.HELM} target="_blank" rel="noopener noreferrer">
          <img src={helmIcon} alt="Helm" className="icon" />
        </a>
      </div>
    </div>
  );
};

export default Home;