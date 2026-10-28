// Define global variables
var game = document.getElementById('game');
var score = document.getElementById('score');
var controls = document.getElementById('controls');
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
  var slot = document.getElementById('leaders-slot');

  // The game screen shows from the first frame, Loading in the leaders' slot
  document.getElementById('game-screen').classList.remove('hidden');

  if (leaders[0].children.length == 0) {
    slotLoading(slot, 'Loading scores…');
  }

  // Request top 5 game leaders from server
  return fetchWithTimeout(api + '/shapes-in-rain/scores')

    .then(function(response) {
      if (!response.ok) {
        throw new Error('Server answered ' + response.status);
      }

      // Remove server down banner from page (from common.js script)
      pingServer();

      return response.json();
    })

    .then(function(leadersList) {
      clearSlotStatus(slot);
      displayLeaders(leadersList);

      // An empty leaderboard says so
      if (leadersList.length == 0) {
        var empty = document.createElement('p');
        empty.className = 'slot-status';
        empty.textContent = 'No scores yet.';
        slot.appendChild(empty);
      }

      // Store leaders in localStorage for offline loading
      try {
        localStorage.setItem('shapes-leaders-list', JSON
          .stringify(leadersList));
      } catch (e) {}

      return;
    })

    .catch(function() {
      // A refresh that fails leaves the list already on screen
      if (leaders[0].children.length > 0) {
        clearSlotStatus(slot);
        return;
      }

      // Display cached leaders list if it is stored in localStorage
      try {
        var cached = JSON.parse(localStorage.getItem('shapes-leaders-list'));
      } catch (e) {
        var cached = null;
      }

      if (cached && cached.length) {
        clearSlotStatus(slot);
        displayLeaders(cached);
        return;
      }

      // Otherwise the failure shows in the leaders' slot, with Retry
      slotFailure(slot, "Couldn't load scores.", loadLeaders);

      return;
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
    scoreCell.textContent = String(Number(leadersList[i].score) || 0);

    // Display link to player's user profile in player cell
    var userLink = document.createElement('a');
    userLink.href = appUrl('account', '?username=' + encodeURIComponent(leadersList[i].username));
    userLink.textContent = leadersList[i].username;
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


/* Run fn once an SVG <object> has its document. Its load event can fire
before this script runs (the scripts above it block parsing), so an object
that has already loaded is handled at once */
function whenSvgLoads(object, fn) {
  function run() {
    var svg = object.contentDocument &&
      object.contentDocument.getElementsByTagName('svg')[0];

    if (svg && !object.dataset.svgReady) {
      object.dataset.svgReady = 'true';
      fn(svg);
    }

    return;
  }

  object.addEventListener('load', run, false);
  run();

  return;
}


// Store SVG shapes in array when their containing objects load
for (var i = 0; i < shapeObjects.length; i++) {
  whenSvgLoads(shapeObjects[i], function(svg) {
    shapes.push(svg);
    return;
  });
}


// Start game when user clicks game screen
document.getElementById('game-screen').onclick = startGame;

function startGame(e) {
  // Links, Retry and the score status act on their own, not as a start tap
  if (e && e.target.closest && e.target.closest('a, .slot-retry, #score-status')) {
    return;
  }

  // Clear the last game's score status
  setScoreStatus('');

  // Hide game screen
  document.getElementById('game-screen').classList.add('hidden');

  // Unhide game, controls and score
  game.classList.remove('hidden');
  controls.classList.remove('hidden');
  score.classList.remove('hidden');

  // Reset intervals for creating hearts that move down screen like rain
  heartInterval = setInterval(multiplyHeart, 2500);
  rainInterval = setInterval(rain, 15);

  // Reset interval for creating random shapes for user to clear from screen
  shapeInterval = setInterval(createRandomShape, 2000);

  // Turn audio back on if user had started playing it last game
  if (audioStarted && typeof audioiFrame != 'undefined' &&
    audioiFrame.playVideo) {
      audioiFrame.playVideo();
      setAudioIcon(true);
    }

  started = true;

  return;
}


// Clone heart SVG and append it to game space
function cloneHeart() {
  var heartDocument = document.getElementById('heart').contentDocument;
  var heart = heartDocument && heartDocument.getElementsByTagName('svg')[0];

  // Nothing to draw until the heart SVG has loaded
  if (!heart) {
    return null;
  }

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

    if (!heartClone) {
      return;
    }

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

  // Nothing to draw until the shape SVGs have loaded
  if (shapes.length == 0) {
    return;
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
  // Stop music player (once the YouTube player exists)
  if (typeof audioiFrame != 'undefined' && audioiFrame.stopVideo) {
    audioiFrame.stopVideo(0);
    setAudioIcon(false);
  }

  // Clear heart rain and shapes from game
  clearInterval(heartInterval);
  clearInterval(rainInterval);
  clearInterval(shapeInterval);

  game.innerHTML = '';

  // Reset score to 0
  score.innerHTML = 'Score: 0';

  // Hide game, controls and score
  game.classList.add('hidden');
  controls.classList.add('hidden');
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

// Score status on the game screen: saving, failed, or sign in to save
var scoreStatus = document.getElementById('score-status');

function setScoreStatus(text, role) {
  scoreStatus.innerHTML = '';
  scoreStatus.setAttribute('role', role || 'status');
  scoreStatus.textContent = text;
  return;
}

function showScoreSignIn() {
  setScoreStatus('');
  var link = document.createElement('a');
  link.href = signedOutRows()[0].href;
  link.textContent = 'Sign in to save your score';
  scoreStatus.appendChild(link);
  return;
}

function showScoreFailure(finalScore) {
  setScoreStatus("Your score couldn't be saved.", 'alert');
  var retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'slot-retry';
  retry.textContent = 'Retry';
  retry.onclick = function() {
    saveScore(finalScore, retry);
    return;
  };
  scoreStatus.appendChild(retry);
  return;
}


// Send a finished game's score; the pressed control shows it is saving
function saveScore(finalScore, button) {
  var restore = setBusy(button, 'Saving…');

  return fetchWithTimeout(api + '/shapes-in-rain/score', {
    credentials: 'include',
    headers: {'Content-Type': 'application/json'},
    method: 'POST',
    body: JSON.stringify(finalScore),
  })

    .then(function(response) {
      // Remove server down banner from page (from common.js script)
      pingServer();

      if (response.ok) {
        return true;
      }

      // The session ended while playing: sign in again to save
      if (response.status == 401) {
        localStorage.removeItem('username');
        return 'signed-out';
      }

      return false;
    }, function() {
      return false;
    })

    .then(function(saved) {
      restore();

      if (saved === true) {
        setScoreStatus('Score saved.');
      } else if (saved == 'signed-out') {
        showScoreSignIn();
      } else {
        showScoreFailure(finalScore);
      }

      if (started) {
        resetGame();
      }

      loadLeaders();
      return;
    });
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

  // If user is logged in, send score to server and display leaders
  if (localStorage.getItem('username')) {
    // Restart waits too, so the game isn't reset under the save
    document.getElementById('restart').disabled = true;
    return saveScore({'score': parseInt(score.innerHTML.split(' ')[1])},
      document.getElementById('end'));
  }

  // Otherwise offer the sign-in that would have saved it
  showScoreSignIn();
  resetGame();
  loadLeaders();

  return;
}


/* The soundtrack toggle (built by audio-embed.js inside #audio-container, now
a button): name its icon and report on/off as the button's pressed state */
function setAudioIcon(on) {
  var icon = document.getElementById('audio-icon');

  if (icon) {
    icon.src = 'images/' + (on ? 'on.svg' : 'off.svg');
  }

  return;
}

new MutationObserver(function() {
  var container = document.getElementById('audio-container');
  var icon = document.getElementById('audio-icon');

  if (icon) {
    icon.alt = '';
    container.setAttribute('aria-pressed',
      /on\.svg$/.test(icon.getAttribute('src') || '') ? 'true' : 'false');
  }

  // The hidden player frame is not a stop on the tab order
  var frame = container.getElementsByTagName('iframe')[0];
  if (frame && frame.tabIndex != -1) {
    frame.tabIndex = -1;
    frame.setAttribute('aria-hidden', 'true');
  }

  return;
}).observe(document.getElementById('audio-container'), {childList: true,
  subtree: true, attributes: true, attributeFilter: ['src']});
