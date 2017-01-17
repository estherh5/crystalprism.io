document.getElementById('button').onmousedown = createCircle;
var canvas = document.getElementById('canvas');
function canvasSize() {
  window.addEventListener('resize', resize, false);
  function resize() {
    canvas.setAttribute('width', window.innerWidth);
    canvas.setAttribute('height', window.innerHeight);
  }
  resize();
}
function createCircle() {
  var shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  shape.setAttribute('class', 'circle');
  shape.setAttribute('cx', '1px');
  shape.setAttribute('cy', '1px');
  shape.setAttribute('r', '10px');
  shape.setAttribute('fill', document.getElementById('text').value);
  canvas.appendChild(shape);
}
setInterval(function () {
  var circles = document.getElementsByClassName('circle');
  for(var i = 0; i < circles.length; i++){
    var randomNumberOne = Math.random() * 100;
    var randomNumberTwo = Math.random() * 100;
    var intcx = parseInt(circles[i].getAttribute('cx'));
    var intcy = parseInt(circles[i].getAttribute('cy'));
    circles[i].setAttribute('cx', intcx + randomNumberOne + 'px');
    circles[i].setAttribute('cy', intcy + randomNumberTwo + 'px');
  }
}, 75);
