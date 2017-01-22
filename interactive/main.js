var canvas = document.getElementById('canvas');
document.getElementById('canvas').onclick = createBlast;
function canvasSize() {
  window.addEventListener('resize', resize, false);
  function resize() {
    canvas.setAttribute('width', window.innerWidth);
    canvas.setAttribute('height', window.innerHeight);
  }
  resize();
}
function createHeart() {
  var heart = document.getElementById('heart').cloneNode(true);
  heart.setAttribute('class', 'heart');
  heart.setAttribute('height', '40px');
  heart.setAttribute('width', '40px');
  heart.setAttribute('x', '10px');
  heart.setAttribute('y', '10px');
  heart.setAttribute('fill', document.getElementById('text').value);
  canvas.appendChild(heart);
  return heart;
}
function createRain() {
  for(var i = 0; i < 10; i++){
    var heart = createHeart();
    heart.setAttribute('x', i*200 + 'px');
  };
}
setInterval(createRain, 1500);
setInterval(function () {
  var hearts = document.getElementsByClassName('heart');
  for(var i = 0; i < hearts.length; i++){
    var inty = parseFloat(hearts[i].getAttribute('y'));
    hearts[i].setAttribute('y', inty + 1 + 'px');
  }
}, 10);
function createRandomShape() {
  var shape = document.getElementsByClassName('shape');
  var randomxIncrement = Math.random() * 1000;
  var randomyIncrement = Math.random() * 1000;
  z = Math.floor(Math.random() * 10);
  var randomShape = shape[z].cloneNode(true);
  randomShape.setAttribute('height', '70px');
  randomShape.setAttribute('width', '70px');
  randomShape.setAttribute('x', randomxIncrement + 'px');
  randomShape.setAttribute('y', randomyIncrement + 'px');
  canvas.appendChild(randomShape);
  randomShape.onclick = function () {
    randomShape.remove();
  };
}
setInterval(createRandomShape, 3000);
function createBlast(e) {
  var blast = document.getElementById('blast').cloneNode(true);
  var x = (e.x - e.target.getBoundingClientRect().left - 32) + 'px';
  var y = (e.y - e.target.getBoundingClientRect().top - 25) + 'px';
  blast.setAttribute('height', '70px');
  blast.setAttribute('width', '70px');
  blast.setAttribute('x', x);
  blast.setAttribute('y', y);
  blast.setAttribute('fill', document.getElementById('text').value);
  canvas.appendChild(blast);
  setTimeout(function () {
    blast.remove();
  }, 500);
}
