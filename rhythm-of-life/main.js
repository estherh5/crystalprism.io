// Game settings
var sizeX = 600;
var sizeY = 600;
var scale = 60;
var speed = 200;
var hours = 0;
var minutes = 0;
var seconds = 0;
var systolic = 100;
var diastolic = 70;
var paused = true;
var direction = '';
var name = '';
var scoresNames = [];
var sound = new Howl({
  src: ['sounds/heartbeat.mp3'],
  loop: true,
});

// Define pieces
var canvas = Snap('#canvas');
canvas.attr({width: sizeX, height: sizeY});
var heart = Snap('#heart');
canvas.append(heart);
heart.attr({'x': 0, 'y': 0, width: scale, height: scale});
var startScreen = document.getElementById('start-screen');
var pauseScreen = document.getElementById('pause-screen');
var gameOverScreen = document.getElementById('game-over-screen');
var input = document.getElementById('input');
var submit = document.getElementById('submit');
var reliever = placeReliever();
var stressor = placeStressor();
var game = document.getElementById('game');
var systolicText = document.getElementById('systolic');
var diastolicText = document.getElementById('diastolic');
var lifespan = document.getElementById('lifespan');
var leaders = document.getElementsByClassName('leaders');
startScreen.style.visibility = 'visible';

// Define events
document.body.onkeydown = function (e) {
  if (e.key == 'ArrowUp' || e.key == 'ArrowDown' || e.key == 'ArrowRight' || e.key == 'ArrowLeft') {
    direction = e.key;
    if (startScreen.style.visibility == 'visible') {
      startScreen.style.visibility = 'hidden';
      sound.play();
      restartGame();
    }
    if (pauseScreen.style.visibility == 'visible') {
      paused = false;
      pauseScreen.style.visibility = 'hidden';
      document.getElementById('pause').innerHTML = 'Pause';
      sound.play();
    }
  }
}

document.getElementById('pause').onclick = function () {
  if (gameOverScreen.style.visibility == 'visible' || startScreen.style.visibility == 'visible') {
    return;
  } else {
    if (paused) {
      paused = false;
      pauseScreen.style.visibility = 'hidden';
      document.getElementById('pause').innerHTML = 'Pause';
      sound.play();
    } else if (!paused) {
      paused = true;
      pauseScreen.style.visibility = 'visible';
      document.getElementById('pause').innerHTML = 'Resume';
      sound.stop();
    }
  }
}

document.getElementById('restart').onclick = function() {
  if (gameOverScreen.style.visibility == 'visible' || startScreen.style.visibility == 'visible') {
    return;
  } else {
    hours = 0;
    minutes = 0;
    seconds = 0;
    systolic = 100;
    diastolic = 70;
    systolicText.innerHTML = systolic;
    diastolicText.innerHTML = diastolic;
    lifespan.innerHTML = 'Lifespan: ' + ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2);
    paused = true;
    startScreen.style.visibility = 'visible';
    pauseScreen.style.visibility = 'hidden';
    document.getElementById('pause').innerHTML = 'Pause';
    systolicText.style.color = '#56d056';
    diastolicText.style.color = '#56d056';
  }
}

input.oninput = function () {
  if (input.value == '') {
    submit.className = 'inactive';
  } else {
    submit.className = '';
  }
}

submit.onclick = function () {
  if (input.value == '') {
    return;
  } else {
    name = input.value;
    var scoreName = {
      score: hours * 3600 + minutes * 60 + seconds,
      lifespan: ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2),
      name: name,
    };
    scoresNames.push(scoreName);
    updateLeaderboard();
    gameOverScreen.style.visibility = 'hidden';
    input.value = '';
    document.getElementById('pause').className = '';
    document.getElementById('restart').className = '';
    startScreen.style.visibility = 'visible';
    hours = 0;
    minutes = 0;
    seconds = 0;
    systolic = 100;
    diastolic = 70;
    systolicText.innerHTML = systolic;
    diastolicText.innerHTML = diastolic;
    lifespan.innerHTML = 'Lifespan: ' + ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2);
    systolicText.style.color = '#56d056';
    diastolicText.style.color = '#56d056';
  }
}

// Game loop
function gameLoop() {
  setTimeout(gameLoop, speed);
  if (paused) {
    return;
  } else if (!paused) {
    move(heart, direction);
    if (didCollide(heart, reliever)) {
      reliever.remove();
      reliever = null;
      reliever = placeReliever();
      if (systolic > 100) {
        systolic = systolic - 2;
      }
      if (diastolic > 70) {
        diastolic--;
      }
      if (speed < 200) {
        speed *= 1.01;
      }
    }
    if (didCollide(stressor, reliever)) {
      reliever.remove();
      reliever = null;
      speed /= 1.03;
      reliever = placeReliever();
    }
    if (didCollide(heart, stressor)) {
      systolic = systolic + 4;
      diastolic = diastolic + 2;
      stressor.remove();
      stressor = null;
      speed /= 1.03;
      stressor = placeStressor();
    }
    if (systolic < 120 && diastolic < 80) {
      systolicText.style.color = '#56d056';
      diastolicText.style.color = '#56d056';
      heart.attr({fill: '#56d056'});
      sound.rate(1.0);
    }
    if (systolic >= 120 && systolic < 140) {
      systolicText.style.color = '#ffff00';
    }
    if (diastolic >= 80 && diastolic < 90) {
      diastolicText.style.color = '#ffff00';
    }
    if (systolic >= 120 && systolic < 140 || diastolic >= 80 && diastolic < 90) {
      heart.attr({fill: '#ffff00'});
      sound.rate(1.3);
    }
    if (systolic >= 140 && systolic < 160) {
      systolicText.style.color = '#ffc107';
    }
    if (diastolic >= 90 && diastolic < 100) {
      diastolicText.style.color = '#ffc107';
    }
    if (systolic >= 140 && systolic < 160 || diastolic >= 90 && diastolic < 100) {
      heart.attr({fill: '#ffc107'});
      sound.rate(1.6);
    }
    if (systolic >= 160) {
      systolicText.style.color = '#ff2020';
    }
    if (diastolic >= 100) {
      diastolicText.style.color = '#ff2020';
    }
    if (systolic >= 160 || diastolic >= 100) {
      sound.rate(2.0);
      heart.attr({fill: '#ff2020'});
    }
    if (systolic > 160 || diastolic > 100) {
      systolicText.style.color = '#ff2020';
      diastolicText.style.color = '#ff2020';
      heart.attr({fill: '##ff2020'});
      paused = true;
      gameOverScreen.style.visibility = 'visible';
      submit.className = 'inactive';
      document.getElementById('pause').className = 'inactive';
      document.getElementById('restart').className = 'inactive';
      sound.stop();
    }
  }
  systolicText.innerHTML = systolic;
  diastolicText.innerHTML = diastolic;
  lifespan.innerHTML = 'Lifespan: ' + ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2);
}

function moveStressor() {
  setTimeout(moveStressor, speed * 2);
  var possibleDirections = ['ArrowUp', 'ArrowDown', 'ArrowRight', 'ArrowLeft'];
  z = Math.floor(Math.random() * 4);
  var randDirection = possibleDirections[z];
  if (paused) {
    return;
  } else if (!paused) {
  move(stressor, randDirection);
  }
}

setTimeout(gameLoop, speed);

setTimeout(moveStressor, speed * 2)

setInterval(getHours, 3600000);

setInterval(getMinutes, 60000);

setInterval(getSeconds, 1000);

// Define game functions
function move(obj, direction) {
  var possibleDirections = {
    'ArrowUp': {'y': parseFloat(obj.attr('y')) - scale},
    'ArrowDown': {'y': parseFloat(obj.attr('y')) + scale},
    'ArrowRight': {'x': parseFloat(obj.attr('x')) + scale},
    'ArrowLeft' : {'x': parseFloat(obj.attr('x')) - scale},
  };
  if (possibleDirections[direction] === undefined) {
    return null;
  }
  obj.attr(possibleDirections[direction]);
  if (obj.attr('x') >= sizeX) {
    obj.attr({'x': 0});
  }
  if (obj.attr('x') < 0) {
    obj.attr({'x': sizeX});
  }
  if (obj.attr('y') >= sizeY) {
    obj.attr({'y': 0});
  }
  if (obj.attr('y') < 0) {
    obj.attr({'y': sizeY});
  }
}

function placeReliever() {
  var relievers = [Snap('#bicycle'), Snap('#yoga'), Snap('#fruit'), Snap('#pill')];
  var randX = Math.floor((sizeX/scale) * Math.random()) * scale;
  var randY = Math.floor((sizeY/scale) * Math.random()) * scale;
  a = Math.floor(Math.random() * 4);
  b = Math.floor(Math.random() * 3);
  var reliever = relievers[a].clone();
  canvas.append(reliever);
  reliever.attr({'x': randX, 'y': randY, width: scale, height: scale});
  return reliever;
}

function placeStressor() {
  var stressors = [Snap('#alcohol'), Snap('#salt'), Snap('#cigarette'), Snap('#stress')];
  var randX = Math.floor((sizeX/2/scale) * Math.random()) * scale;
  var randY = Math.floor((sizeY/2/scale) * Math.random()) * scale;
  a = Math.floor(Math.random() * 4);
  b = Math.floor(Math.random() * 3);
  var stressor = stressors[a].clone();
  canvas.append(stressor);
  stressor.attr({'x': randX + 3 * scale, 'y': randY + 3 * scale, width: scale, height: scale});
  return stressor;
}

function didCollide(objA, objB) {
  if (objA.attr('x') == objB.attr('x') && objA.attr('y') == objB.attr('y')) {
    return true;
  }
  return false;
}

function getHours() {
  if (paused) {
    return;
  } else {
    hours++;
  }
}

function getMinutes() {
  if (paused) {
    return;
  } else if (minutes < 59) {
    minutes++;
  } else if (minutes >= 59) {
    minutes = 0;
  }
}

function getSeconds() {
  if (paused) {
    return;
  } else if (seconds < 59) {
    seconds++;
  } else if (seconds >= 59) {
    seconds = 0;
  }
}

function updateLeaderboard() {
  scoresNames.sort(function (a, b) {
    return b.score - a.score;
  });
  if (scoresNames.length <= 5) {
    for (var i = 0; i < scoresNames.length; i++) {
      var tableContainerOne = document.createElement('td');
      var tableContainerTwo = document.createElement('td');
      leaders[i].innerHTML = '';
      leaders[i].appendChild(tableContainerOne);
      tableContainerOne.appendChild(document.createTextNode(scoresNames[i].lifespan));
      leaders[i].appendChild(tableContainerTwo);
      tableContainerTwo.appendChild(document.createTextNode(scoresNames[i].name));
    }
  } else {
      for (var i = 0; i <= 4; i++) {
      var tableContainerOne = document.createElement('td');
      var tableContainerTwo = document.createElement('td');
      leaders[i].innerHTML = '';
      leaders[i].appendChild(tableContainerOne);
      tableContainerOne.appendChild(document.createTextNode(scoresNames[i].lifespan));
      leaders[i].appendChild(tableContainerTwo);
      tableContainerTwo.appendChild(document.createTextNode(scoresNames[i].name));
    }
  }
}

function restartGame() {
  if (sound.playing() == false) {
    sound.play();
  }
  hours = 0;
  minutes = 0;
  seconds = 0;
  systolic = 100;
  diastolic = 70;
  paused = false;
  pauseScreen.style.visibility = 'hidden';
  heart.attr({'x': 0, 'y': 0});
  speed = 200;
  reliever.remove();
  reliever = null;
  reliever = placeReliever();
  stressor.remove();
  stressor = null;
  stressor = placeStressor();
}
