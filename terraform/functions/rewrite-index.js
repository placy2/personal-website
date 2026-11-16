// CloudFront Function (cloudfront-js-2.0), viewer-request.
//
// 1. www -> apex. Requests for www.<domain> get a 301 to https://<domain>
//    with the same path, so there's one canonical host. The query string is
//    dropped: the site uses none, and rebuilding it here risks re-encoding it.
//
// 2. Retired routes get a 301 to their replacement (/projects -> /work). Same
//    query-string rule as above. On www, the www redirect goes straight to the
//    replacement path, so it's one hop, not two.
//
// 3. Each prerendered route lives at <route>/index.html in S3. The origin is
//    the bucket's REST endpoint, which has no index document at all: it only
//    serves exact keys. This rewrites extensionless paths to their index.html
//    before the request reaches S3, so it is what serves every page.
//
//   /           -> /index.html
//   /about      -> /about/index.html
//   /about/     -> /about/index.html
//   /robots.txt -> unchanged (has an extension)
//
// Unknown paths (/nope -> /nope/index.html) have no such key, so S3 returns a
// real 404. The distribution's custom_error_response swaps in index.html as
// the body and keeps the 404 status.
var REDIRECTS = {
  '/projects': '/work',
  '/projects/': '/work',
};

function redirect(location) {
  return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: {
      location: { value: location },
      'cache-control': { value: 'max-age=86400' },
    },
  };
}

function handler(event) {
  var request = event.request;
  var uri = request.uri;
  var host = request.headers.host ? request.headers.host.value.toLowerCase() : '';
  var target = REDIRECTS[uri];

  if (host.indexOf('www.') === 0) {
    return redirect('https://' + host.slice(4) + (target || uri));
  }

  if (target) {
    // Relative, so it works on the custom domain and the *.cloudfront.net name.
    return redirect(target);
  }

  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (uri.split('/').pop().indexOf('.') === -1) {
    request.uri = uri + '/index.html';
  }

  return request;
}
