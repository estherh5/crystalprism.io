// Define global variables
var game = document.getElementById('game');
var score = document.getElementById('score');
var shapeObjects = document.getElementsByClassName('shape');
var shapes = []; // Array to store SVG shapes


// Define load functions
window.onload = function() {
  // Create page header (from common.js script)
  createPageHeader();

  // Check if user is logged in (from common.js script)
  checkIfLoggedIn();

  // Resize game to full screen
  resizeGame();

  // Set intervals for creating hearts that move down screen like rain
  setInterval(multiplyHeart, 2500);
  setInterval(rain, 15);

  // Set interval for creating random shapes for user to clear from screen
  setInterval(createRandomShape, 2000);

  return;
}


// Resize game to full screen on load and when window is resized
window.addEventListener('resize', resizeGame, false);

function resizeGame() {
  game.setAttribute('width', window.innerWidth);
  game.setAttribute('height', window.innerHeight);
  return;
}


// Store SVG shapes in array when their containing objects load
for (var i = 0; i < shapeObjects.length; i++) {
  shapeObjects[i].addEventListener('load', function() {
    shapes.push(this.contentDocument.getElementsByTagName('svg')[0]);
    return;
  }, false);
}


// Clone heart SVG and append it to game space
function cloneHeart() {
  var heart = document.getElementById('heart').contentDocument
    .getElementsByTagName('svg')[0];
  var heartClone = heart.cloneNode(true);
  heartClone.classList.add('heart');
  heartClone.setAttribute('height', '6%');
  heartClone.setAttribute('width', '6%');
  heartClone.setAttribute('x', '0px');
  heartClone.setAttribute('y', '0px');
  game.appendChild(heartClone);

  // Remove heart from screen after 15 seconds to minimize performance lag
  setTimeout(function() {
    heartClone.remove();
    return;
  }, 15000);

  return heartClone;
}


// Multiply heart shape 6 times
function multiplyHeart() {
  for (var i = 0; i < 6; i++) {
    // Clone heart SVG and set x-coordinate
    var heartClone = cloneHeart();
    heartClone.setAttribute('x', i * 18.8 + '%');
  }

  return;
}


// Move heart shapes down y-axis like rain
function rain() {
  var heartClones = document.getElementsByClassName('heart');

  for (var i = 0; i < heartClones.length; i++) {
    var intY = parseFloat(heartClones[i].getAttribute('y'));
    heartClones[i].setAttribute('y', intY + 1 + 'px');
  }

  return;
}


// Create random shape at random x- and y-coordinates with minimal text overlap
function createRandomShape() {
  // Generate random y-coordinate between 20 and 80
  var randomYCoordinate = Math.random() * 60 + 20;

  /* If random y-coordinate overlaps with text (between 30% and 60% of screen),
  generate x-coordinate to minimize overlap */
  if (randomYCoordinate > 30 && randomYCoordinate < 60) {
    /* Generate number 1 or 2 randomly to determine if x-coordinate should be
    to right or left of text */
    var rightOrLeft = Math.floor(Math.random() * 2) + 1;

    /* If number is 1, set x-coordinate as random number to left of text
    (between 5 and 10) */
    if (rightOrLeft == 1) {
      var randomXCoordinate = Math.random() * 5 + 5;
    }

    /* Otherwise, set x-coordinate as random number to right of text (between
    90 and 95) */
    else {
      var randomXCoordinate = Math.random() * 5 + 90;
    }
  }

  /* If random y-coordinate does not overlap with text, generate random
  x-coordinate between 20 and 80 */
  else {
    var randomXCoordinate = Math.random() * 60 + 20;
  }

  // Create random shape from shapes array and append to game space
  var randomNumber = Math.floor(Math.random() * shapes.length);
  var randomShape = shapes[randomNumber].cloneNode(true);
  randomShape.setAttribute('height', '15%');
  randomShape.setAttribute('width', '15%');
  randomShape.setAttribute('x', randomXCoordinate + '%');
  randomShape.setAttribute('y', randomYCoordinate + '%');
  game.appendChild(randomShape);

  // Remove shape from game and increase score when shape is clicked
  randomShape.onclick = function() {
    randomShape.remove();
    score.innerHTML = 'Score: ' + (parseInt(score.innerHTML.split(' ')[1]) + 1);
    return;
  }

  // Remove random shape after 9 seconds
  setTimeout(function() {
    randomShape.remove();
    return;
  }, 9000);

  return;
}


// Create blast on click
document.body.onclick = createBlast;

function createBlast() {
  // Change cursor to filled in blast shape on click
  document.body.style.cursor = 'url("images/blast-filled.svg") 25 20, auto';

  // Set cursor back to blast outline after 300 ms
  setTimeout(function() {
    document.body.style.cursor = '';
    return;
  }, 300);

  return;
}


// Send score to server when user exits page
window.onbeforeunload = sendScore;

function sendScore() {
  // If user is logged in, send score to server
  if (localStorage.getItem('username') != null) {
    var finalScore = {'score': parseInt(score.innerHTML.split(' ')[1])};
    data = JSON.stringify(finalScore);

    return fetch(server + '/shapes-in-rain', {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'),
        'Content-Type': 'application/json'},
      method: 'POST',
      body: data,
    });
  }

  return;
}
