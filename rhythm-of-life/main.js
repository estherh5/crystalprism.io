// Define global variables
var startScreenDesktop = document.getElementById('start-screen-desktop');
var startScreenMobile = document.getElementById('start-screen-mobile');
var pauseScreenDesktop = document.getElementById('pause-screen-desktop');
var pauseScreenMobile = document.getElementById('pause-screen-mobile');
var learnScreen = document.getElementById('learn-more-screen');
var leaderScreen = document.getElementById('leader-screen');
var gameOverScreen = document.getElementById('game-over-screen');
var systolicText = document.getElementById('systolic');
var diastolicText = document.getElementById('diastolic');
var lifespan = document.getElementById('lifespan');
var leaders = document.getElementsByClassName('leaders');
var leadersMobile = document.getElementsByClassName('leaders-mobile');
var svgGame = Snap('#svg-game'); // SVG game board
var gameLength = document.getElementById('game-board').offsetHeight;
var gameWidth = document.getElementById('game-board').offsetWidth;
var mobile = false; // Used to determine if user is on mobile device or desktop
var scale = 60; // Length/width of one unit of game board
var speed; // Frequency of game functions that run via setTimeout
var hours;
var minutes;
var seconds;
var systolic;
var diastolic;
var direction;
var xStart;
var yStart;
var heart;
var relievers = [];
var stressors = [];
var reliever;
var stressor;
// Add heartbeat sound with Howler
var heartbeat = new Howl({
  src: ['sounds/heartbeat.m4a'],
  loop: true,
});


// Define load functions
window.onload = function() {
  // Set stylesheet to mobile version if user is on mobile device
  setMobileStyle();

  // Set game settings to starting state
  reset();

  // Create page header (from common.js script)
  createPageHeader();

  // Create page footer (from common.js script)
  createPageFooter();

  // Check if user is logged in (from common.js script)
  checkIfLoggedIn();

  // Display top 5 game leaders
  displayLeaders();

  return;
}


// Add reliever SVG objects to relievers array when they load
for (var i = 0; i < document.getElementsByClassName('reliever').length; i++) {
  document.getElementsByClassName('reliever')[i]
    .addEventListener('load', function() {
      relievers.push(this.contentDocument.getElementsByTagName('svg')[0]);

      // Place reliever on game board when all 4 relievers have loaded
      if (relievers.length == 4) {
        reliever = place(relievers);
      }

      return;
    }, false);
}


// Add stressor SVG objects to stressors array when they load
for (var i = 0; i < document.getElementsByClassName('stressor').length; i++) {
  document.getElementsByClassName('stressor')[i]
    .addEventListener('load', function() {
      stressors.push(this.contentDocument.getElementsByTagName('svg')[0]);

      // Place stressor on game board when all 4 stressors have loaded
      if (stressors.length == 4) {
        stressor = place(stressors);
      }

      return;
    }, false);
}

// Add heart SVG to game board when heart SVG object loads
document.getElementById('heart').onload = function() {
  heart = Snap(document.getElementById('heart').contentDocument
    .getElementsByTagName('svg')[0]).attr({fill: '#56d056', 'x': 0, 'y': 0,
    width: scale, height: scale});

  svgGame.append(heart);

  return;
}

// Set stylesheet to mobile version on load if user is on mobile device
function setMobileStyle() {
  /* Assess if user is on mobile device and set mobile variable, scale, and
  stylesheet accordingly */
  (function(a) {
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) {
      mobile = true;
      scale = 30;
      document.getElementById('stylesheet').href = 'style-mobile.css';
    }
  }) (navigator.userAgent||navigator.vendor||window.opera);

  return;
}


// Define game state functions

// Set game settings to starting state
function reset() {
  // Reset lifespan
  hours = 0;
  minutes = 0;
  seconds = 0;
  lifespan.innerHTML = 'Lifespan: 00:00:00';

  // Set systolic and diastolic values to normal range
  systolic = 100;
  diastolic = 70;
  speed = 200;
  systolicText.innerHTML = systolic;
  diastolicText.innerHTML = diastolic;
  systolicText.style.color = '#56d056';
  diastolicText.style.color = '#56d056';

  // Place heart at top left of game board
  heart.attr({'x': 0, 'y': 0, fill: '#56d056'});

  // Place stressor randomly on game board
  stressor.remove();
  stressor = place(stressors);

  // Place reliever randomly on game board
  reliever.remove();
  reliever = place(relievers);

  // Hide Game Over screen and Learn More screen
  gameOverScreen.style.visibility = 'hidden';
  learnScreen.style.visibility = 'hidden';

  // Hide Pause screen and unhide Start screen for mobile/desktop
  if (mobile) {
    pauseScreenMobile.style.visibility = 'hidden';
    startScreenMobile.style.visibility = 'visible';
  } else {
    pauseScreenDesktop.style.visibility = 'hidden';
    startScreenDesktop.style.visibility = 'visible';
  }

  // Set Pause button text to starting state of Pause
  document.getElementById('pause').innerHTML = 'Pause';

  // Stop heartbeat sound
  heartbeat.stop();

  return;
}


// Place random object from array of passed objects on game board
function place(objs) {
  // Generate random number based on length of objects array
  randNum = Math.floor(Math.random() * objs.length);

  /* Clone random object and place at random x- and y-coordinates on game board
  based on scale size */
  var obj = Snap(objs[randNum].cloneNode(true));
  var randX = Math.floor((gameWidth/scale) * Math.random()) * scale;
  var randY = Math.floor((gameLength/scale) * Math.random()) * scale;
  obj.attr({'x': randX, 'y': randY, width: scale, height: scale});
  svgGame.append(obj);

  // Return object as value of stressor/reliever variable set as function
  return obj;
}


// Pause game loop
function pause() {
  // Display Pause screen for mobile/desktop
  if (mobile) {
    pauseScreenMobile.style.visibility = 'visible';
  } else {
    pauseScreenDesktop.style.visibility = 'visible';
  }

  // Stop heartbeat sound
  heartbeat.stop();

  // Set Pause button text to Resume
  document.getElementById('pause').innerHTML = 'Resume';

  return;
}


// Resume game loop
function resume() {
  // Hide Start screen, Pause screen, and Leaders screen for mobile/desktop
  if (mobile) {
    startScreenMobile.style.visibility = 'hidden';
    pauseScreenMobile.style.visibility = 'hidden';
    leaderScreen.style.visibility = 'hidden';
  } else {
    startScreenDesktop.style.visibility = 'hidden';
    pauseScreenDesktop.style.visibility = 'hidden';
  }

  // Hide Learn More screen
  learnScreen.style.visibility = 'hidden';

  // Start heartbeat sound
  heartbeat.play();

  // Set Pause button text to Pause
  document.getElementById('pause').innerHTML = 'Pause';

  return;
}


// Define game states

/* Assess that game is ready to start if Start screen is the only screen
displayed */
function readyToStart() {
  if ((startScreenMobile.style.visibility == 'visible' || startScreenDesktop
    .style.visibility == 'visible') && (learnScreen.style
    .visibility != 'visible' && leaderScreen.style.visibility != 'visible')) {
      return true;
    }

  return false;
}

/* Assess that game is paused if Pause screen, Learn More screen, or Leaders
screen is visible */
function paused() {
  if (pauseScreenDesktop.style.visibility == 'visible' || pauseScreenMobile
    .style.visibility == 'visible' || learnScreen.style.visibility == 'visible'
    || leaderScreen.style.visibility == 'visible') {
      return true;
    }

  return false;
}


// Assess that game is over if Game Over screen is visible
function gameOver() {
  if (gameOverScreen.style.visibility == 'visible') {
    return true;
  }
  return false;
}


// Define game state controls

// Pause/resume game if Pause button is clicked
document.getElementById('pause').onclick = function() {
  // Do nothing if game is over or hasn't started yet
  if (gameOver() || readyToStart()) {
    return;
  }

  // Resume game if paused
  if (paused()) {
    resume();
    return;
  }

  // Pause game otherwise
  pause();

  return;
}


// Restart game if Retry or Start Over button is clicked
document.getElementById('retry').onclick = reset;

document.getElementById('restart').onclick = function() {
  // Do nothing if game hasn't started yet
  if (readyToStart()) {
    return;
  }

  // Reset game to starting state otherwise
  reset();

  return;
}


// Define user touch/keyboard controls

/* Determine initial x- and y-coordinates where user touched the screen when
swiping on mobile */
document.getElementById('game-board').addEventListener('touchstart',
  function(e) {
    e.preventDefault();
    xStart = e.touches[0].clientX;
    yStart = e.touches[0].clientY;
    return;
  }, false);


// Determine final x- and y-coordinates where user touched the screen when
// swiping on mobile
document.getElementById('game-board').addEventListener('touchmove',
  function(e) {
    e.preventDefault();

    // Do nothing if there are no starting coordinates for user's swipe motion
    if (!xStart || !yStart) {
      return;
    }

    /* Determine final x- and y-coordinates where user touched the screen and
    the difference between the start and end values */
    var xEnd = e.touches[0].clientX;
    var yEnd = e.touches[0].clientY;
    var xDiff = xStart - xEnd;
    var yDiff = yStart - yEnd;

    // If user swiped left/right, set direction as appropriate
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      /* If starting x-coordinate is greater than ending x-coordinate, user
      swiped left */
      if (xDiff > 0) {
        direction = 'ArrowLeft';
      }

      // Otherwise, user swiped right
      else {
        direction = 'ArrowRight';
      }
    }

    // If user swiped up/down, set direction as appropriate
    else {
      /* If starting y-coordinate is greater than ending y-coordinate, user
      swiped up */
      if (yDiff > 0) {
        direction = 'ArrowUp';
      }

      // Otherwise, user swiped down
      else {
        direction = 'ArrowDown';
      }
    }

    // Start/resume game if it hasn't started yet or is paused
    if (readyToStart() || paused()) {
      resume();
    }

    // Reset starting swipe x- and y-coordinates in preparation for next swipe
    xStart = null;
    yStart = null;
    return;
  }, false);


// Define keyboard shortcuts on desktop
document.body.onkeydown = function(e) {
  // Resume game when space key is clicked
  if (e.keyCode == 32) {
    e.preventDefault();

    // Do nothing if game is over or hasn't started yet
    if (gameOver() || readyToStart()) {
      return;
    }

    // Resume game if currently paused
    if (paused()) {
      resume();
      return;
    }

    // Pause game otherwise
    pause();

    return;
  }

  // If user clicked an arrow key, set game direction as appropriate
  else if (e.key == 'ArrowUp' || e.key == 'ArrowDown' || e.key == 'ArrowRight'
    || e.key == 'ArrowLeft') {
    e.preventDefault();
    direction = e.key;

    // Start/resume game if it hasn't started yet or is paused
    if (readyToStart() || paused()) {
      resume();
    }

    return;
  }

  // Pause game if user clicked 'p' key in non-paused game state
  else if (e.keyCode == '80' && !paused()) {
    e.preventDefault();

    // Do nothing if game is over or hasn't started yet
    if (gameOver() || readyToStart()) {
      return;
    }

    // Pause game otherwise
    pause();

    return;
  }

  // Resume game if user clicked 'r' key in paused game state
  else if (e.keyCode == '82' && paused()) {
    e.preventDefault();

    // Do nothing if game is over or hasn't started yet
    if (gameOver() || readyToStart()) {
      return;
    }

    // Resume game otherwise
    resume();

    return;
  }

  // Start game over if user clicked 's' key
  else if (e.keyCode == '83') {
    e.preventDefault();
    reset();
    return;
  }

  // Toggle Learn More screen if user clicked 'l' key
  else if (e.keyCode == '76') {
    e.preventDefault();
    toggleLearnScreen();
    return;
  }

  return;
}


// Define game functions

// Run game loop function at speed frequency
setTimeout(gameLoop, speed);

function gameLoop() {
  setTimeout(gameLoop, speed);

  // Do nothing if game hasn't started yet, is paused, or is over
  if (readyToStart() || paused() || gameOver()) {
    return;
  }

  // Get length and width of game board based on current device/window size
  gameLength = document.getElementById('game-board').offsetHeight;
  gameWidth = document.getElementById('game-board').offsetWidth;

  // Move heart in direction user specified
  move(heart, direction);

  // Assess if heart and reliever collided and lower blood pressure if so
  didCollide(heart, reliever, relieveHeart);

  /* Assess if stressor and reliever collided and replace reliever with another
  if so */
  didCollide(stressor, reliever, replaceReliever);

  // Assess if heart and stressor collided and raise blood pressure if so
  didCollide(heart, stressor, stressHeart);

  return;
}


// Update lifespan every second
setInterval(updateLifespan, 1000);

function updateLifespan() {
  // Do nothing if game hasn't started yet, is paused, or is over
  if (readyToStart() || paused() || gameOver()) {
    return;
  }

  // Update seconds if < 59
  if (seconds < 59) {
    seconds++;
  }

  // Set seconds back to 0 and update minutes if seconds = 59
  else if (seconds == 59) {
    seconds = 0;
    minutes++;
  }

  // Set minutes back to 0 and update hours if minutes = 60
  if (minutes == 60) {
    minutes = 0;
    hours++;
  }

  // Set lifespan as HH:MM:SS of game play
  lifespan.innerHTML = 'Lifespan: ' + ('0' + hours)
    .slice(-2) + ':' + ('0' + minutes).slice(-2) + ':' + ('0' + seconds)
    .slice(-2);

  return;
}


// Move object in specified direction
function move(obj, direction) {
  // Define x/y attribute for each direction
  var directions = {
    'ArrowUp': {'y': parseFloat(obj.attr('y')) - scale},
    'ArrowDown': {'y': parseFloat(obj.attr('y')) + scale},
    'ArrowLeft' : {'x': parseFloat(obj.attr('x')) - scale},
    'ArrowRight': {'x': parseFloat(obj.attr('x')) + scale},
  };

  // Set x/y attribute for object based on specified direction
  obj.attr(directions[direction]);

  /* If object is now off game board (x is too far right), set x to far-left
  of game board */
  if (obj.attr('x') >= gameWidth) {
    obj.attr({'x': 0});
    return;
  }

  /* If object is now off game board (x is too far left), set x to far-right
  of game board */
  if (obj.attr('x') < 0) {
    obj.attr({'x': gameWidth});
    return;
  }

  /* If object is now off game board (y is too far down), set y to top of
  game board */
  if (obj.attr('y') >= gameLength) {
    obj.attr({'y': 0});
    return;
  }

  /* If object is now off game board (y is too far up), set y to bottom of
  game board */
  if (obj.attr('y') < 0) {
    obj.attr({'y': gameLength});
    return;
  }

  return;
}


// Set stressor direction and move stressor 50% slower than heart moves
setTimeout(orientStressor, speed * 1.5);

function orientStressor() {
  setTimeout(orientStressor, speed * 1.5);

  // Do nothing if game hasn't started yet, is paused, or is over
  if (readyToStart() || paused() || gameOver()) {
    return;
  }

  // If heart is to the left of stressor, move stressor to the left
  if (parseFloat(heart.attr('x')) < parseFloat(stressor.attr('x'))) {
    move(stressor, 'ArrowLeft');
  }

  // If heart is to the right of stressor, move stressor to the right
  else if (parseFloat(heart.attr('x')) > parseFloat(stressor.attr('x'))) {
    move(stressor, 'ArrowRight');
    return;
  }

  // If heart is above stressor, move stressor up
  else if (parseFloat(heart.attr('y')) < parseFloat(stressor.attr('y'))) {
    move(stressor, 'ArrowUp');
  }

  // Otherwise, move stressor down
  else {
    move(stressor, 'ArrowDown');
  }

  // Assess if heart and stressor collided and raise blood pressure if so
  didCollide(heart, stressor, stressHeart);

  return;
}


/* Assess if object A collided with object B, and perform specified function
if so */
function didCollide(objA, objB, action) {
  /* If object A and object B are at the same x- and y-coordinates on the game
  board, return true and perform specified function */
  if (objA.attr('x') == objB.attr('x') && objA.attr('y') == objB.attr('y')) {
    action();
    return true;
  }

  // Otherwise, return false (object A and B did not collide)
  return false;
}


// If heart collided with reliever, lower heart's blood pressure
function relieveHeart() {
  // Remove reliever from and place a new reliever on game board
  reliever.remove();
  reliever = place(relievers);

  // If systolic is above starting value, lower systolic by 2
  if (systolic > 100) {
    systolic = systolic - 2;
  }

  // If diastolic is above starting value, lower diastolic by 1
  if (diastolic > 70) {
    diastolic--;
  }

  // If game speed is faster than starting speed, slow speed down
  if (speed < 200) {
    speed *= 1.01;
  }

  // Set new heart attributes
  setHeartAttr();

  return;
}


/* If stressor collided with reliever, remove reliever from and place a new
reliever on game board */
function replaceReliever() {
  reliever.remove();
  reliever = place(relievers);

  // Increase game speed
  speed /= 1.03;

  return;
}


// If heart collided with stressor, increase heart's blood pressure
function stressHeart() {
  // Increase systolic by 4
  systolic += 4;

  // Increase diastolic by 2
  diastolic += 2;

  // Remove stressor from and place a new stressor on game board
  stressor.remove();
  stressor = place(stressors);

  // Increase game speed
  speed /= 1.03;

  // Set new heart attributes
  setHeartAttr();

  return;
}


// Set heart attributes (blood pressure, color, heartbeat speed)
function setHeartAttr() {
  // Update systolic and diastolic values on screen
  systolicText.innerHTML = systolic;
  diastolicText.innerHTML = diastolic;

  /* If systolic and diastolic values are in normal range, set heart and BP to
  green color and normal heartbeat speed */
  if (systolic < 120 && diastolic < 80) {
    systolicText.style.color = '#56d056';
    diastolicText.style.color = '#56d056';
    heart.attr({fill: '#56d056'});
    heartbeat.rate(1.0);
    return;
  }

  /* If systolic and diastolic values are in prehypertension range, set heart
  and BP to yellow color and increase heartbeat speed */
  if (systolic >= 120 && systolic < 140 && diastolic >= 80 && diastolic < 90) {
    systolicText.style.color = '#ffff00';
    diastolicText.style.color = '#ffff00';
    heart.attr({fill: '#ffff00'});
    heartbeat.rate(1.3);
    return;
  }

  /* If systolic and diastolic values are in hypertension stage 1 range, set
  heart and BP to orange color and increase heartbeat speed */
  if (systolic >= 140 && systolic < 160 && diastolic >= 90 && diastolic < 100) {
    systolicText.style.color = '#ffc107';
    diastolicText.style.color = '#ffc107';
    heart.attr({fill: '#ffc107'});
    heartbeat.rate(1.6);
    return;
  }

  /* If systolic and diastolic values are in hypertension stage 2 range, set
  heart and BP to red color and increase heartbeat speed */
  if (systolic >= 160 && diastolic >= 100) {
    systolicText.style.color = '#ff2020';
    diastolicText.style.color = '#ff2020';
    heartbeat.rate(2.0);
    heart.attr({fill: '#ff2020'});
  }

  // If blood pressure is >= 164/102, end game
  if (systolic >= 164 && diastolic >= 102) {
    // Send game score to server if user is logged in
    if (localStorage.getItem('token') != null) {
      storeScore();
    }
    // Display Game Over screen
    gameOverScreen.style.visibility = 'visible';
    // Stop heartbeat sound
    heartbeat.stop();
  }

  return;
}


// Send score to server for logged-in users
function storeScore() {
  // Save score as time-based integer and lifespan in HH:MM:SS format
  var data = JSON.stringify({
    'score': parseInt(hours * 3600 + minutes * 60 + seconds),
    'lifespan': ('0' + hours).slice(-2) + ':' + ('0' + minutes)
      .slice(-2) + ':' + ('0' + seconds).slice(-2),
  });

  return fetch(api + '/rhythm-of-life', {
    headers: {'Authorization': 'Bearer ' + localStorage
    .getItem('token'), 'Content-Type': 'application/json'},
    method: 'POST',
    body: data,
  })

  .then(function(response) {
    // Display updated top 5 game leaders if server receives score successfully
    if (response.ok) {
      displayLeaders();
    }
  });
}


// Display top 5 game leaders
function displayLeaders() {
  // Request top 5 game leaders from server
  return fetch(api + '/rhythm-of-life').then(function(response) {
    response.json().then(function(leadersList) {

      for (var i = 0; i < leadersList.length; i++) {
        // Create cells for lifespan and player name in leaders list from server
        var lifespanCell = document.createElement('td');
        var playerCell = document.createElement('td');

        /* Clear current leader display on game board and replace with new
        player and score cells for mobile/desktop */
        if (mobile) {
          leadersMobile[i].innerHTML = '';
          leadersMobile[i].appendChild(lifespanCell);
          leadersMobile[i].appendChild(playerCell);
        } else {
          leaders[i].innerHTML = '';
          leaders[i].appendChild(lifespanCell);
          leaders[i].appendChild(playerCell);
        }

        // Display lifespan in lifespan cell
        lifespanCell.appendChild(document.createTextNode(leadersList[i]
          .lifespan));

        // Display link to player's user profile in player cell
        var userLink = document.createElement('a');
        userLink.href = '../user/index.html?username=' + leadersList[i].player;
        userLink.appendChild(document.createTextNode(leadersList[i].player));
        playerCell.appendChild(userLink);
      }
    });
  });
}


// Define additional button functions

/* Toggle Learn More screen when Learn More or close button is clicked on
mobile/desktop */
document.getElementById('learn-more-desktop').onclick = toggleLearnScreen;
document.getElementById('learn-more-mobile').onclick = toggleLearnScreen;
document.getElementById('learn-more-close').onclick = toggleLearnScreen;

function toggleLearnScreen() {
  /* Hide Pause and Leaders screens in case they were displayed so only one
  screen is showing at a time for mobile/desktop */
  if (mobile) {
    pauseScreenMobile.style.visibility = 'hidden';
    leaderScreen.style.visibility = 'hidden';
  } else {
    pauseScreenDesktop.style.visibility = 'hidden';
  }

  /* Hide Learn More screen if game hasn't started yet or is over and Learn
  More screen is currently visible */
  if ((startScreenDesktop.style.visibility == 'visible' || startScreenMobile
    .style.visibility == 'visible' || gameOver()) && learnScreen.style
    .visibility == 'visible') {
      learnScreen.style.visibility = 'hidden';
      return;
    }

  // If game hasn't started yet and Learn More screen isn't visible, display it
  else if (readyToStart() || gameOver()) {
    learnScreen.style.visibility = 'visible';
    return;
  }

  /* If game is paused and Learn More screen is currently visible, hide it and
  resume the game */
  else if (paused() && learnScreen.style.visibility == 'visible') {
    learnScreen.style.visibility = 'hidden';
    resume();
    return;
  }

  // Otherwise, pause the game and display the Learn More screen
  learnScreen.style.visibility = 'visible';
  heartbeat.stop();
  document.getElementById('pause').innerHTML = 'Resume';

  return;
}


// Toggle Leaders screen when Leaders or close button is clicked on mobile
document.getElementById('display-leaders').onclick = toggleLeaderScreen;
document.getElementById('leader-close').onclick = toggleLeaderScreen;

function toggleLeaderScreen() {
  /* Hide Pause and Learn More screens in case they were displayed so only one
  screen is showing at a time */
  pauseScreenMobile.style.visibility = 'hidden';
  learnScreen.style.visibility = 'hidden';

  /* Hide Leaders screen if game hasn't started yet or is over and Leaders
  screen is currently visible */
  if ((startScreenMobile.style.visibility == 'visible' || gameOver())
    && leaderScreen.style.visibility == 'visible') {
      leaderScreen.style.visibility = 'hidden';
      return;
    }

  // If game hasn't started yet and Leaders screen isn't visible, display it
  else if (readyToStart() || gameOver()) {
    leaderScreen.style.visibility = 'visible';
    return;
  }

  /* If game is paused and Leaders screen is currently visible, hide it and
  resume the game */
  else if (paused() && leaderScreen.style.visibility == 'visible') {
    leaderScreen.style.visibility = 'hidden';
    resume();
    return;
  }

  // Otherwise, pause the game and display the Leaders screen
  leaderScreen.style.visibility = 'visible';
  heartbeat.stop();
  document.getElementById('pause').innerHTML = 'Resume';

  return;
}


// Toggle sound if sound button is clicked
document.getElementById('sound').onclick = toggleSound;

function toggleSound() {
  // If sound is muted, unmute sound and display On icon
  if (heartbeat._muted) {
    heartbeat.mute(false);
    document.getElementById('sound').style
      .backgroundImage = 'url("images/on.svg")';
    return;
  }

  // Otherwise, mute sound and display Off icon
  heartbeat.mute(true);
  document.getElementById('sound').style
    .backgroundImage = 'url("images/off.svg")';

  return;
}
