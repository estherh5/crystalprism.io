// Define variables
var canvas = document.getElementById('canvas');
var heart = document.getElementById('heart');
var shapes = document.getElementsByClassName('shape');
var score = document.getElementById('score');

// Resize canvas to fullscreen
function resize() {
  canvas.setAttribute('width', window.innerWidth);
  canvas.setAttribute('height', window.innerHeight);
}

window.addEventListener('resize', resize, false);

// Create heart shapes positioned a distance apart on the x-axis
function cloneHeart() {
  var heartClone = heart.cloneNode(true);
  heartClone.setAttribute('class', 'heart');
  heartClone.setAttribute('height', '6%');
  heartClone.setAttribute('width', '6%');
  heartClone.setAttribute('x', '0px');
  heartClone.setAttribute('y', '0px');
  canvas.appendChild(heartClone);
  setTimeout(function () {
    heartClone.remove();
  }, 15000);
  return heartClone;
}

function multiplyHeart() {
  for (var i = 0; i < 6; i++) {
    var heartClone = cloneHeart();
    heartClone.setAttribute('x', i * 18.8 + '%');
  };
}

setInterval(multiplyHeart, 2500);

// Move heart shapes down y-axis like rain
function rain() {
  var heartClones = document.getElementsByClassName('heart');
  for (var i = 0; i < heartClones.length; i++) {
    var intY = parseFloat(heartClones[i].getAttribute('y'));
    heartClones[i].setAttribute('y', intY + 1 + 'px');
  }
}

setInterval(rain, 15);

// Create random shapes at random x and y coordinates with minimal text overlap
function createRandomShape() {
  var randomYCoordinate = Math.random() * 60 + 20;
  if (randomYCoordinate > 30 && randomYCoordinate < 60) {
    var rightOrLeftOfText = Math.floor(Math.random() * 2) + 1;
    if (rightOrLeftOfText == 1) {
      var randomXCoordinate = Math.random() * 5 + 5;
    } else {
      var randomXCoordinate = Math.random() * 5 + 85;
    }
  } else {
    var randomXCoordinate = Math.random() * 60 + 20;
  }
  var randomNumber = Math.floor(Math.random() * shapes.length);
  var randomShape = shapes[randomNumber].cloneNode(true);
  randomShape.classList.remove('shape');
  randomShape.setAttribute('height', '15%');
  randomShape.setAttribute('width', '15%');
  randomShape.setAttribute('x', randomXCoordinate + '%');
  randomShape.setAttribute('y', randomYCoordinate + '%');
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
