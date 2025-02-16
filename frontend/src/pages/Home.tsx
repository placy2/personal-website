import React from 'react';
import headshotPhoto from '../assets/2024headshot.jpeg'
import k8sIcon from '../assets/kubernetes_logo.png'
import tfIcon from '../assets/terraform_logo.png'
import awsIcon from '../assets/aws_logo.png'
import adoIcon from '../assets/ado_logo.webp'
import helmIcon from '../assets/helm_logo.png'

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
        Cloud Engineer based in the Denver area.
        <br/>
        Passionate about technology, music, and family. 
         <br/>
        See below for some icons of my favorite tools and technologies:
      </p>
      <div className="icon-container">
        {/* Add your icons here */}
        <a href="https://kubernetes.io/" target="_blank">
          <img src={k8sIcon} alt="Kubernetes" className="icon"/>
        </a>
        <a href="https://www.terraform.io/" target="_blank">
          <img src={tfIcon} alt="Terraform" className="icon" />
        </a>
        <a href="https://aws.amazon.com/" target="_blank">
          <img src={awsIcon} alt="AWS" className="icon" />
        </a>
        <a href="https://azure.microsoft.com/en-us/products/devops/pipelines/" target="_blank">
          <img src={adoIcon} alt="Azure DevOps" className="icon" />
        </a>
        <a href="https://helm.sh/" target="_blank">
          <img src={helmIcon} alt="Helm" className="icon" />
        </a>
      </div>
    </div>
  )
};

export default Home;