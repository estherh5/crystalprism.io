var canvas = document.getElementById('canvas');

// Resize canvas to full screen
function resize() {
  canvas.setAttribute('width', window.innerWidth);
  canvas.setAttribute('height', window.innerHeight);
}

window.addEventListener('resize', resize, false);

// Create heart shapes that are positioned a distance apart on the x-axis
function createHeart() {
  var heart = document.getElementById('heart').cloneNode(true);
  heart.setAttribute('class', 'heart');
  heart.setAttribute('height', '10%');
  heart.setAttribute('width', '10%');
  heart.setAttribute('x', '0px');
  heart.setAttribute('y', '0px');
  canvas.appendChild(heart);
  setTimeout(function () {
    heart.remove();
  }, 15000);
  return heart;
}

function cloneHearts() {
  for(var i = 0; i < 6; i++){
    var heart = createHeart();
    heart.setAttribute('x', i*18.8 + '%');
  };
}

setInterval(cloneHearts, 2500);

// Move heart shapes down the page like rain
setInterval(function () {
  var hearts = document.getElementsByClassName('heart');
  for(var i = 0; i < hearts.length; i++){
    var inty = parseFloat(hearts[i].getAttribute('y'));
    hearts[i].setAttribute('y', inty + 1 + 'px');
  }
}, 15);

// Create random shapes at random x and y coordinates
function createRandomShape() {
  var shape = document.getElementsByClassName('shape');
  var randomyIncrement = Math.random() * 60 + 20;
  if (randomyIncrement > 35 && randomyIncrement < 55) {
    var randomxIncrement = Math.random() * 3;
  } else {
    randomxIncrement = Math.random() * 60 + 20;
  }
  z = Math.floor(Math.random() * 10);
  var randomShape = shape[z].cloneNode(true);
  randomShape.setAttribute('height', '20%');
  randomShape.setAttribute('width', '20%');
  randomShape.setAttribute('x', randomxIncrement + '%');
  randomShape.setAttribute('y', randomyIncrement + '%');
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
