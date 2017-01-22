document.getElementById('button').onmousedown = createHeart;
document.getElementById('canvas').onclick = createBlast;
var canvas = document.getElementById('canvas');
function canvasSize() {
  window.addEventListener('resize', resize, false);
  function resize() {
    canvas.setAttribute('width', window.innerWidth);
    canvas.setAttribute('height', window.innerHeight);
  }
  resize();
}
function createBlast(e) {
  var blast = document.getElementById('blast').cloneNode(true);
  var x = (e.x - e.target.getBoundingClientRect().left - 32) + 'px';
  var y = (e.y - e.target.getBoundingClientRect().top - 25) + 'px';
  blast.setAttribute('height', '70px');
  blast.setAttribute('width', '70px');
  blast.setAttribute('x', x);
  blast.setAttribute('y', y);
  blast.setAttribute('fill', document.getElementById('text').value);
  setTimeout(function () {
    blast.remove();
  }, 500);
  canvas.appendChild(blast);
}
function createHeart(e) {
  var heart = document.getElementById('heart').cloneNode(true);
  var x = e.x - e.target.getBoundingClientRect().left;
  var y = e.y - e.target.getBoundingClientRect().top;
  heart.setAttribute('class', 'heart');
  heart.setAttribute('height', '70px');
  heart.setAttribute('width', '70px');
  heart.setAttribute('x', x);
  heart.setAttribute('y', y);
  heart.setAttribute('fill', document.getElementById('text').value);
  heart.onclick = function () {
    heart.remove();
  }
  canvas.appendChild(heart);
}
setInterval(function () {
  var hearts = document.getElementsByClassName('heart');
  for(var i = 0; i < hearts.length; i++){
    var randomxIncrement = Math.random() * 100;
    var randomyIncrement = Math.random() * 100;
    var intx = parseInt(hearts[i].getAttribute('x'));
    var inty = parseInt(hearts[i].getAttribute('y'));
    hearts[i].setAttribute('x', intx + randomxIncrement + 'px');
    hearts[i].setAttribute('y', inty + randomyIncrement + 'px');
  }
}, 2000);
