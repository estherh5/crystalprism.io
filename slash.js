// A folder page reached without its trailing slash (Netlify serves
// /easel as a plain 200, no slash 301) resolves its relative refs one level
// up. Add the slash before anything relative loads; every folder page loads
// this first, as /slash.js, synchronously.
(function () {
  var p = location.pathname;
  var last = p.slice(p.lastIndexOf('/') + 1);
  if (last && last.indexOf('.') === -1) {
    location.replace(p + '/' + location.search + location.hash);
  }
})();
