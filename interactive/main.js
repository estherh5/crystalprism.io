var canvas = document.getElementById('canvas');

// Resize canvas to full screen
function resize() {
  canvas.setAttribute('width', window.innerWidth);
  canvas.setAttribute('height', window.innerHeight);
}
window.addEventListener('resize', resize, false);

// Create heart shapes that are positioned 200 px apart on the x-axis
function createHeart() {
  var heart = document.getElementById('heart').cloneNode(true);
  heart.setAttribute('class', 'heart');
  heart.setAttribute('height', '40px');
  heart.setAttribute('width', '40px');
  heart.setAttribute('x', '0px');
  heart.setAttribute('y', '0px');
  canvas.appendChild(heart);
  setTimeout(function () {
    heart.remove();
  }, 10000);
  return heart;
}
function cloneHearts() {
  for(var i = 0; i < 10; i++){
    var heart = createHeart();
    heart.setAttribute('x', i*200 + 'px');
  };
}
setInterval(cloneHearts, 1500);

// Move heart shapes doesn the page like rain
setInterval(function () {
  var hearts = document.getElementsByClassName('heart');
  for(var i = 0; i < hearts.length; i++){
    var inty = parseFloat(hearts[i].getAttribute('y'));
    hearts[i].setAttribute('y', inty + 1 + 'px');
  }
}, 10);

// Create random shapes at random x and y coordinates
function createRandomShape() {
  var shape = document.getElementsByClassName('shape');
  var randomxIncrement = Math.random() * 1000;
  var randomyIncrement = Math.random() * 1000;
  z = Math.floor(Math.random() * 10);
  var randomShape = shape[z].cloneNode(true);
  randomShape.setAttribute('height', '100px');
  randomShape.setAttribute('width', '100px');
  randomShape.setAttribute('x', randomxIncrement + 'px');
  randomShape.setAttribute('y', randomyIncrement + 'px');
  canvas.appendChild(randomShape);
  randomShape.onclick = function () {
    randomShape.remove();
  };
  setTimeout(function () {
    randomShape.remove();
  }, 10000);
}
setInterval(createRandomShape, 3000);

// Create blast on click
document.getElementById('canvas').onclick = createBlast;
function createBlast(e) {
  var blast = document.getElementById('blast').cloneNode(true);
  var x = (e.x - e.target.getBoundingClientRect().left - 25) + 'px';
  var y = (e.y - e.target.getBoundingClientRect().top - 20) + 'px';
  blast.setAttribute('height', '50px');
  blast.setAttribute('width', '50px');
  blast.setAttribute('x', x);
  blast.setAttribute('y', y);
  canvas.appendChild(blast);
  setTimeout(function () {
    blast.remove();
  }, 500);
}
