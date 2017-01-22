document.getElementById('button').onmousedown = createCircle;
document.getElementById('canvas').onclick = createHeart;
var canvas = document.getElementById('canvas');
function canvasSize() {
  window.addEventListener('resize', resize, false);
  function resize() {
    canvas.setAttribute('width', window.innerWidth);
    canvas.setAttribute('height', window.innerHeight);
  }
  resize();
}
function createHeart(e) {
  var heart = document.getElementById('heart').cloneNode(true);
  var x = e.x - e.target.getBoundingClientRect().left;
  var y = e.y - e.target.getBoundingClientRect().top;
  heart.setAttribute('class', 'heart');
  heart.setAttribute('height', '32px');
  heart.setAttribute('width', '32px');
  heart.setAttribute('x', x);
  heart.setAttribute('y', y);
  heart.setAttribute('fill', document.getElementById('text').value);
  canvas.appendChild(heart);
}
function createCircle() {
  var shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  var randomWidth = Math.random() * 1000;
  var randomHeight = Math.random() * 1000;
  shape.setAttribute('class', 'circle');
  shape.setAttribute('cx', randomWidth + 'px');
  shape.setAttribute('cy', randomHeight + 'px');
  shape.setAttribute('r', '10px');
  shape.setAttribute('fill', document.getElementById('text').value);
  canvas.appendChild(shape);
}
setInterval(function () {
  var circles = document.getElementsByClassName('circle');
  for(var i = 0; i < circles.length; i++){
    var randomIncrementOne = Math.random() * 100;
    var randomIncrementTwo = Math.random() * 100;
    var intcx = parseInt(circles[i].getAttribute('cx'));
    var intcy = parseInt(circles[i].getAttribute('cy'));
    circles[i].setAttribute('cx', intcx + randomIncrementOne + 'px');
    circles[i].setAttribute('cy', intcy + randomIncrementTwo + 'px');
  }
}, 75);
setInterval(function () {
  var hearts = document.getElementsByClassName('heart');
  for(var i = 0; i < hearts.length; i++){
    var randomIncrementOne = Math.random() * 100;
    var randomIncrementTwo = Math.random() * 100;
    var intx = parseInt(hearts[i].getAttribute('x'));
    var inty = parseInt(hearts[i].getAttribute('y'));
    hearts[i].setAttribute('x', intx + randomIncrementOne + 'px');
    hearts[i].setAttribute('y', inty + randomIncrementTwo + 'px');
  }
}, 75);
