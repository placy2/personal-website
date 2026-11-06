import React from 'react';
import { EXTERNAL_LINKS } from '../constants';

const shortSha = __BUILD_SHA__.slice(0, 7);

const Footer: React.FC = () => {
  return (
    <footer>
      <p>
        Find me at <a href="mailto:parkerlacy17@gmail.com">parkerlacy17@gmail.com</a> or on{' '}
        <a href={EXTERNAL_LINKS.GITHUB} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </p>
      {shortSha && (
        <p className="footer-build">
          Built from{' '}
          <a
            href={`${EXTERNAL_LINKS.SITE_REPO}/commit/${__BUILD_SHA__}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`commit ${shortSha} on GitHub (opens in a new tab)`}
          >
            <code>{shortSha}</code>
          </a>
          {__BUILD_DATE__ && (
            <>
              {' '}
              on <time dateTime={__BUILD_DATE__}>{__BUILD_DATE__}</time>
            </>
          )}
        </p>
      )}
    </footer>
  );
};

export default Footer;
