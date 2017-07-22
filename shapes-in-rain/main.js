var canvas = document.getElementById('canvas');
var shape = document.getElementsByClassName('shape');
var score = document.getElementById('score');

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
  heart.setAttribute('height', '6%');
  heart.setAttribute('width', '6%');
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
    heart.setAttribute('x', i * 18.8 + '%');
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

// Create random shapes at random x and y coordinates without text overlap
function createRandomShape() {
  var randomyCoordinate = Math.random() * 60 + 20;
  if (randomyCoordinate > 30 && randomyCoordinate < 60) {
    var rightOrLeft = Math.floor(Math.random() * 2) + 1;
    if (rightOrLeft == 1) {
      var randomxCoordinate = Math.random() * 5 + 5;
    } else {
      var randomxCoordinate = Math.random() * 5 + 85;
    }
  } else {
    var randomxCoordinate = Math.random() * 60 + 20;
  }
  z = Math.floor(Math.random() * shape.length);
  var randomShape = shape[z].cloneNode(true);
  randomShape.classList.remove('shape');
  randomShape.setAttribute('height', '15%');
  randomShape.setAttribute('width', '15%');
  randomShape.setAttribute('x', randomxCoordinate + '%');
  randomShape.setAttribute('y', randomyCoordinate + '%');
  canvas.appendChild(randomShape);
  randomShape.onclick = function () {
    randomShape.remove();
    score.innerHTML = 'Score: ' + (parseInt(score.innerHTML.split(' ')[1]) + 1);
  };
  setTimeout(function () {
    randomShape.remove();
  }, 9000);
}

setInterval(createRandomShape, 2000);

// Create blast on click
document.body.onclick = createBlast;

function createBlast() {
  document.body.style.cursor = 'url("images/create-blast.png") 25 20, auto';
  setTimeout(function() {
    document.body.style.cursor = 'url("images/blast-start.png") 25 20, auto';
  }, 500);
}
