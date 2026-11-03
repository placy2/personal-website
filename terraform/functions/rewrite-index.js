// CloudFront Function (cloudfront-js-2.0), viewer-request.
//
// Each prerendered route lives at <route>/index.html in S3. The S3 website
// origin only maps a "directory" URL to its index.html when the URL ends in
// "/", so a direct load of /about 404s, and the distribution's error page then
// serves the home page's HTML instead. This rewrites extensionless paths to
// their index.html before the request reaches S3.
//
//   /           -> /index.html
//   /about      -> /about/index.html
//   /about/     -> /about/index.html
//   /robots.txt -> unchanged (has an extension)
//
// Unknown paths (/nope -> /nope/index.html) still 404 at S3 and fall through
// to custom_error_response, same as before. Real 404s are a separate change.
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (uri.split('/').pop().indexOf('.') === -1) {
    request.uri = uri + '/index.html';
  }

  return request;
}
