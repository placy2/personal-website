// CloudFront Function (cloudfront-js-2.0), viewer-request.
//
// 1. www -> apex. Requests for www.<domain> get a 301 to https://<domain>
//    with the same path, so there's one canonical host. The query string is
//    dropped: the site uses none, and rebuilding it here risks re-encoding it.
//
// 2. Each prerendered route lives at <route>/index.html in S3. The S3 website
//    origin only maps a "directory" URL to its index.html when the URL ends in
//    "/", so without this a direct load of /about 404s. This rewrites
//    extensionless paths to their index.html before the request reaches S3.
//
//   /           -> /index.html
//   /about      -> /about/index.html
//   /about/     -> /about/index.html
//   /robots.txt -> unchanged (has an extension)
//
// Unknown paths (/nope -> /nope/index.html) have no such key, so S3 returns a
// real 404 (body: its error document, index.html) and CloudFront passes it
// through unchanged.
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  var host = request.headers.host ? request.headers.host.value.toLowerCase() : '';

  if (host.indexOf('www.') === 0) {
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: {
        location: { value: 'https://' + host.slice(4) + uri },
        'cache-control': { value: 'max-age=86400' },
      },
    };
  }

  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (uri.split('/').pop().indexOf('.') === -1) {
    request.uri = uri + '/index.html';
  }

  return request;
}
