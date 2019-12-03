// META: script=../resources/utils.js

// Creates a promise_test that fetches a URL that returns a redirect response.
//
// |opts| has additional options:
// |opts.body|: the request body as a string or blob (default is empty body)
// |opts.expectedBodyAsString|: the expected response body as a string. The
// server is expected to echo the request body. The default is the empty string
// if the request after redirection isn't POST; otherwise it's |opts.body|.
function redirectMethod(desc, redirectUrl, redirectLocation, redirectStatus, method, expectedMethod, opts) {
  let url = redirectUrl;
  let urlParameters = "?redirect_status=" + redirectStatus;
  urlParameters += "&location=" + encodeURIComponent(redirectLocation);

  let requestInit = {"method": method, "redirect": "follow"};
  opts = opts || {};
  if (opts.body){
    requestInit.body = opts.body;
  }

  promise_test(function(test) {
    return fetch(url + urlParameters, requestInit).then(function(resp) {
      let isPostEnded = (expectedMethod == "POST");
      let expectedBody = "";
      if (isPostEnded) {
        expectedBody = opts.expectedBodyAsString || requestInit.body;
      }
      let expectedRequestContentLength = isPostEnded ? expectedBody.length.toString() : "NO";
      let expectedRequestContentType = "NO";

      if (isPostEnded && opts.expectedRequestContentType) {
        expectedRequestContentType = opts.expectedRequestContentType;
      }

      assert_equals(resp.status, 200, "Response's status is 200");
      assert_equals(resp.type, "basic", "Response's type basic");
      assert_equals(resp.headers.get("x-request-method"), expectedMethod, "Request method after redirection is " + expectedMethod);
      assert_equals(resp.headers.get("x-request-content-length"), expectedRequestContentLength, "Request Content-Length after redirection is " + expectedRequestContentLength);
      assert_equals(resp.headers.get("x-request-content-type"), expectedRequestContentType, "Request Content-Type after redirection is " + expectedRequestContentType);
      assert_true(resp.redirected);
      return resp.text().then(function(text) {
        assert_equals(text, expectedBody, "request body");
      });
    });
  }, desc);
}

promise_test(function(test) {
  assert_false(new Response().redirected);
  return fetch(RESOURCES_DIR + "method.py").then(function(resp) {
    assert_equals(resp.status, 200, "Response's status is 200");
    assert_false(resp.redirected);
  });
}, "Response.redirected should be false on not-redirected responses");

var redirUrl = RESOURCES_DIR + "redirect.py";
var locationUrl = "method.py";

const stringBody = "this is my body";
const blobBody = new Blob(["it's me the blob!", " ", "and more blob!"]);
const blobBodyAsString = "it's me the blob! and more blob!";

redirectMethod("Redirect 301 with GET", redirUrl, locationUrl, 301, "GET", "GET");
redirectMethod("Redirect 301 with POST", redirUrl, locationUrl, 301, "POST", "GET", { body: stringBody });
redirectMethod("Redirect 301 with HEAD", redirUrl, locationUrl, 301, "HEAD", "HEAD");

redirectMethod("Redirect 302 with GET", redirUrl, locationUrl, 302, "GET", "GET");
redirectMethod("Redirect 302 with POST", redirUrl, locationUrl, 302, "POST", "GET", { body: stringBody });
redirectMethod("Redirect 302 with HEAD", redirUrl, locationUrl, 302, "HEAD", "HEAD");

redirectMethod("Redirect 303 with GET", redirUrl, locationUrl, 303, "GET", "GET");
redirectMethod("Redirect 303 with POST", redirUrl, locationUrl, 303, "POST", "GET", { body: stringBody });
redirectMethod("Redirect 303 with HEAD", redirUrl, locationUrl, 303, "HEAD", "HEAD");

redirectMethod("Redirect 307 with GET", redirUrl, locationUrl, 307, "GET", "GET");
redirectMethod("Redirect 307 with POST (string body)", redirUrl, locationUrl, 307, "POST", "POST", { body: stringBody , expectedRequestContentType: "text/plain;charset=UTF-8"});
redirectMethod("Redirect 307 with POST (blob body)", redirUrl, locationUrl, 307, "POST", "POST", { body: blobBody, expectedBodyAsString: blobBodyAsString });
redirectMethod("Redirect 307 with HEAD", redirUrl, locationUrl, 307, "HEAD", "HEAD");

done();
