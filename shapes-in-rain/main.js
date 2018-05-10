// Define global variables
var game = document.getElementById('game');
var score = document.getElementById('score');
var shapeObjects = document.getElementsByClassName('shape');
var shapes = []; // Array to store SVG shapes
var started = false; // Stores whether game has started or not


// Define load functions
window.onload = function() {
  // Assess if user is on mobile device (from common.js script)
  assessMobile();

  // Unhide starting instructions based on device
  if (mobile) {
    document.getElementById('mobile-body-start').classList.remove('hidden');
    document.getElementById('mobile-start').classList.remove('hidden');
  } else {
    document.getElementById('desktop-body-start').classList.remove('hidden');
    document.getElementById('desktop-start').classList.remove('hidden');
  }

  // Load top 5 game leaders
  loadLeaders();

  // Create page header (from common.js script)
  createPageHeader();

  // Check if user is logged in (from common.js script)
  checkIfLoggedIn();

  // Check if Crystal Prism API is online (from common.js script)
  pingServer(retryFunctions);

  // Create page footer (from common.js script)
  createPageFooter();

  // Resize game to full screen
  resizeGame();

  return;
}


// Functions to run when Retry button is clicked from server down banner
function retryFunctions() {
  checkIfLoggedIn();
  loadLeaders();
  return;
}


// Load leaders from server to display on game screen
function loadLeaders() {
  var leaders = document.getElementsByClassName('leader');

  // Request top 5 game leaders from server
  return fetch(api + '/shapes-in-rain/scores')

    // Display error message if server is down
    .catch(function(error) {
      // Add server down banner to page (from common.js script)
      pingServer(retryFunctions);

      // Display cached leaders list if it is stored in localStorage
      if (localStorage.getItem('shapes-leaders-list')) {
        displayLeaders(JSON.parse(localStorage
            .getItem('shapes-leaders-list')));
      }

      // Otherwise, add error to leaders display
      else {
        // Clear leaders list
        for (var i = 0; i < leaders.length; i++) {
          leaders[i].innerHTML = '';
        }

        // Display error
        var errorCell = document.createElement('td');
        errorCell.id = 'error-cell';
        errorCell.colSpan = "2";
        errorCell.innerHTML = 'The leaderboard could not be loaded.';
        leaders[0].appendChild(errorCell);

        // Display game screen
        document.getElementById('game-screen').classList.remove('hidden');
      }

      return;
    })

    .then(function(response) {
      if (response) {
        // Remove server down banner from page (from common.js script)
        pingServer();

        // Display leaders in game screen if server responds without error
        if (response.ok) {
          response.json().then(function(leadersList) {
            displayLeaders(leadersList);

            // Store leaders in localStorage for offline loading
            localStorage.setItem('shapes-leaders-list', JSON
              .stringify(leadersList));
          });

          return;
        }

        // Clear leaders list and display error otherwise
        for (var i = 0; i < leaders.length; i++) {
          leaders[i].innerHTML = '';
        }

        var errorCell = document.createElement('td');
        errorCell.id = 'error-cell';
        errorCell.colSpan = "2";
        errorCell.innerHTML = 'The leaderboard could not be loaded.';
        leaders[0].appendChild(errorCell);

        // Display game screen
        document.getElementById('game-screen').classList.remove('hidden');

        return;
      }
    });
}


// Display top 5 game leaders from passed leaders list
function displayLeaders(leadersList) {
  var leaders = document.getElementsByClassName('leader');

  for (var i = 0; i < leadersList.length; i++) {
    /* Create cells for score and player name in leaders list from
    server */
    var scoreCell = document.createElement('td');
    var playerCell = document.createElement('td');

    /* Clear current leader display on game board and replace with new
    player and score cells for mobile/desktop */
    leaders[i].innerHTML = '';
    leaders[i].appendChild(scoreCell);
    leaders[i].appendChild(playerCell);

    // Display score in score cell
    scoreCell.innerHTML = leadersList[i].score;

    // Display link to player's user profile in player cell
    var userLink = document.createElement('a');
    userLink.href = '../user/?username=' + leadersList[i].username;
    userLink.innerHTML = leadersList[i].username;
    playerCell.appendChild(userLink);
  }

  // Display game screen
  document.getElementById('game-screen').classList.remove('hidden');

  return;
}


// Resize game to full screen on load and when window is resized
window.addEventListener('resize', resizeGame, false);

function resizeGame() {
  game.setAttribute('width', window.innerWidth);

  // Set game height to window height minus header and footer height
  game.setAttribute('height', window.innerHeight - parseInt(window.
    getComputedStyle(document.getElementById('header')).height
    .slice(0, -2)) - parseInt(window.getComputedStyle(document
    .getElementById('footer')).height.slice(0, -2)));

  return;
}


// Store SVG shapes in array when their containing objects load
for (var i = 0; i < shapeObjects.length; i++) {
  shapeObjects[i].addEventListener('load', function() {
    shapes.push(this.contentDocument.getElementsByTagName('svg')[0]);
    return;
  }, false);
}


// Start game when user clicks game screen
document.getElementById('game-screen').onclick = startGame;

function startGame() {
  // Hide game screen
  document.getElementById('game-screen').classList.add('hidden');

  // Unhide game and score
  game.classList.remove('hidden');
  score.classList.remove('hidden');

  // Reset intervals for creating hearts that move down screen like rain
  heartInterval = setInterval(multiplyHeart, 2500);
  rainInterval = setInterval(rain, 15);

  // Reset interval for creating random shapes for user to clear from screen
  shapeInterval = setInterval(createRandomShape, 2000);

  // Turn audio back on if user had started playing it last game
  if (audioStarted) {
    audioiFrame.playVideo();

    // Set audio icon to on
    document.getElementById('audio-icon').src = 'images/on.svg';
  }

  started = true;

  return;
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
    (between 5 and 35) */
    if (rightOrLeft == 1) {
      var randomXCoordinate = Math.random() * 30 + 5;
    }

    /* Otherwise, set x-coordinate as random number to right of text (between
    60 and 90) */
    else {
      var randomXCoordinate = Math.random() * 30 + 60;
    }
  }

  /* If random y-coordinate does not overlap with text, generate random
  x-coordinate between 10 and 90 */
  else {
    var randomXCoordinate = Math.random() * 80 + 10;
  }

  // Create random shape from shapes array and append to game space
  var randomNumber = Math.floor(Math.random() * shapes.length);
  var randomShape = shapes[randomNumber].cloneNode(true);
  randomShape.classList.add('shapes');
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
game.onclick = createBlast;

function createBlast() {
  // Change cursor to filled in blast shape on click
  game.style.cursor = 'url("images/blast-filled.svg") 25 20, auto';

  // Set cursor back to blast outline after 300 ms
  setTimeout(function() {
    game.style.cursor = '';
    return;
  }, 300);

  return;
}


// Reset game when user clicks Restart button
document.getElementById('restart').onclick = function() {
  // Do nothing if game hasn't started yet
  if (!started) {
    return;
  }

  // Hide ending text and unhide starting instructions based on device
  document.getElementById('body-end').classList.add('hidden');

  if (mobile) {
    document.getElementById('mobile-end').classList.add('hidden');
    document.getElementById('mobile-body-start').classList.remove('hidden');
    document.getElementById('mobile-start').classList.remove('hidden');
  } else {
    document.getElementById('desktop-end').classList.add('hidden');
    document.getElementById('desktop-body-start').classList.remove('hidden');
    document.getElementById('desktop-start').classList.remove('hidden');
  }

  resetGame();

  loadLeaders();

  return;
}

function resetGame() {
  // Stop music player
  audioiFrame.stopVideo(0);

  // Set audio icon to off
  document.getElementById('audio-icon').src = 'images/off.svg';

  // Clear heart rain and shapes from game
  clearInterval(heartInterval);
  clearInterval(rainInterval);
  clearInterval(shapeInterval);

  game.innerHTML = '';

  // Reset score to 0
  score.innerHTML = 'Score: 0';

  // Hide game and score
  game.classList.add('hidden');
  score.classList.add('hidden');

  // Reset menu buttons and cursor style
  document.getElementById('restart').disabled = false;
  document.getElementById('end').disabled = false;
  document.body.style.cursor = '';

  started = false;

  return;
}


// End game when user clicks End button
document.getElementById('end').onclick = function() {
  // Do nothing if game hasn't started yet
  if (!started) {
    return;
  }

  endGame();

  return;
}

function endGame() {
  // Hide starting instructions and unhide ending text based on device
  document.getElementById('body-end').classList.remove('hidden');

  if (mobile) {
    document.getElementById('mobile-end').classList.remove('hidden');
    document.getElementById('mobile-body-start').classList.add('hidden');
    document.getElementById('mobile-start').classList.add('hidden');
  } else {
    document.getElementById('desktop-end').classList.remove('hidden');
    document.getElementById('desktop-body-start').classList.add('hidden');
    document.getElementById('desktop-start').classList.add('hidden');
  }

  /* Disable menu buttons and set cursor style to waiting until server request
  goes through */
  document.getElementById('restart').disabled = true;
  document.getElementById('end').disabled = true;
  document.body.style.cursor = 'wait';

  // If user is logged in, send score to server and display leaders
  if (localStorage.getItem('username')) {
    var finalScore = {'score': parseInt(score.innerHTML.split(' ')[1])};
    data = JSON.stringify(finalScore);

    return fetch(api + '/shapes-in-rain/score', {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'),
        'Content-Type': 'application/json'},
      method: 'POST',
      body: data,
    })

    // Display error message if server is down
    .catch(function(error) {
      // Add server down banner to page (from common.js script)
      pingServer(retryFunctions);

      window.alert('Your score could not be saved. Please play again later.');

      loadLeaders();

      resetGame();

      return;
    })

    .then(function(response) {
      if (response) {
        // Remove server down banner from page (from common.js script)
        pingServer();

        if (!response.ok) {
          window.alert('Your score could not be saved. Please play again ' +
            'later.');
          return;
        }

        loadLeaders();

        resetGame();
      }
    });
  }

  else {
    loadLeaders();

    resetGame();
  }

  return;
}
