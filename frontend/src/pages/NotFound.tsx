import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG, ROUTES } from '../constants';

// Catch-all route. In prod an unknown path gets a real 404 status from S3/
// CloudFront with the home page's HTML as the body, and main.tsx then renders
// this client-side instead of hydrating home's markup.
const NotFound: React.FC = () => {
  useEffect(() => {
    // TitleSync in App.tsx skips paths missing from ROUTE_META, so set it here.
    document.title = `Page not found - ${APP_CONFIG.author}`;
  }, []);

  return (
    <div>
      <h1>Page not found</h1>
      <p>There's nothing at this address. It may have moved, or the link may have a typo.</p>
      <Link className="button" to={ROUTES.HOME}>
        Back to the home page
      </Link>
    </div>
  );
};

export default NotFound;
