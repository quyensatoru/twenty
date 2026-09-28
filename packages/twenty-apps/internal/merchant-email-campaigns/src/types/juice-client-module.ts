// juice ships types for its Node entry only. The browser build is used instead
// because it does not pull in web-resource-inliner, which needs fs and http,
// and has the same call signature.
declare module 'juice/client.js' {
  import juice from 'juice';

  export default juice;
}
