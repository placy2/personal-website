import React from 'react';
import { EXTERNAL_LINKS } from '../constants';

const Footer: React.FC = () => {
  return (
    <footer>
      <p>
        Find me at <a href="mailto:parkerlacy17@gmail.com">parkerlacy17@gmail.com</a> or on{' '}
        <a href={EXTERNAL_LINKS.GITHUB} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </p>
    </footer>
  );
};

export default Footer;
