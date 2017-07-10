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
var relievers = [Snap('#bicycle'), Snap('#yoga'), Snap('#fruit'), Snap('#pill')];
var stressors = [Snap('#alcohol'), Snap('#salt'), Snap('#cigarette'), Snap('#stress')];
var sound = new Howl({
  src: ['sounds/heartbeat.mp3'],
  loop: true,
});

// Define pieces
var canvas = Snap('#canvas').attr({width: sizeX, height: sizeY});
var heart = Snap('#heart').attr({fill: '#56d056', 'x': 0, 'y': 0, width: scale, height: scale});
canvas.append(heart);
var game = document.getElementById('game');
var startScreen = document.getElementById('start-screen');
var pauseScreen = document.getElementById('pause-screen');
var gameOverScreen = document.getElementById('game-over-screen');
var input = document.getElementById('input');
var submit = document.getElementById('submit');
var reliever = place(relievers);
var stressor = place(stressors);
var systolicText = document.getElementById('systolic');
var diastolicText = document.getElementById('diastolic');
var lifespan = document.getElementById('lifespan');
var leaders = document.getElementsByClassName('leaders');

// Define events
document.body.onkeydown = function (e) {
  if (e.key == 'ArrowUp' || e.key == 'ArrowDown' || e.key == 'ArrowRight' || e.key == 'ArrowLeft') {
    e.preventDefault();
    direction = e.key;
    if (startScreen.style.visibility == 'visible' || startScreen.style.visibility == '' || pauseScreen.style.visibility == 'visible') {
      resume();
    }
  }
}

document.getElementById('pause').onclick = function () {
  if (gameOverScreen.style.visibility == 'visible' || startScreen.style.visibility == 'visible') {
    return;
  } else {
    if (paused) {
      resume();
    } else {
      pause();
    }
  }
}

document.getElementById('restart').onclick = function() {
  if (gameOverScreen.style.visibility == 'visible' || startScreen.style.visibility == 'visible') {
    return;
  }
  reset();
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
    updateLeaderboard();
    reset();
  }
}

// Game loop
function gameLoop() {
  setTimeout(gameLoop, speed);
  if (paused) {
    return;
  } else {
    move(heart, direction);
    didCollide(heart, reliever, relieveHeart);
    didCollide(stressor, reliever, replaceReliever);
    didCollide(heart, stressor, stressHeart);
  }
  lifespan.innerHTML = 'Lifespan: ' + ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2);
}

setTimeout(gameLoop, speed);

setTimeout(moveStressor, speed * 1.5)

setInterval(getHours, 3600000);

setInterval(getMinutes, 60000);

setInterval(getSeconds, 1000);

// Define game functions
function place(objs) {
  randNum = Math.floor(Math.random() * 4);
  if (objs == relievers) {
    var obj = objs[randNum].clone();
    var ratio = sizeX/scale;
  } else {
    var obj = objs[randNum].clone();
    var ratio = sizeX/2/scale;
  }
  var randX = Math.floor(ratio * Math.random()) * scale;
  var randY = Math.floor(ratio * Math.random()) * scale;
  obj.attr({'x': randX, 'y': randY, width: scale, height: scale});
  canvas.append(obj);
  return obj;
}

function resume() {
  paused = false;
  startScreen.style.visibility = 'hidden';
  pauseScreen.style.visibility = 'hidden';
  sound.play();
  document.getElementById('pause').innerHTML = 'Pause';
}

function pause() {
  paused = true;
  pauseScreen.style.visibility = 'visible';
  sound.stop();
  document.getElementById('pause').innerHTML = 'Resume';
}

function reset() {
  hours = 0;
  minutes = 0;
  seconds = 0;
  systolic = 100;
  diastolic = 70;
  speed = 200;
  systolicText.innerHTML = systolic;
  diastolicText.innerHTML = diastolic;
  lifespan.innerHTML = 'Lifespan: ' + ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2);
  systolicText.style.color = '#56d056';
  diastolicText.style.color = '#56d056';
  heart.attr({'x': 0, 'y': 0, fill: '#56d056'});
  stressor.remove();
  stressor = place(stressors);
  reliever.remove();
  reliever = place(relievers);
  paused = true;
  gameOverScreen.style.visibility = 'hidden';
  pauseScreen.style.visibility = 'hidden';
  startScreen.style.visibility = 'visible';
  input.value = '';
  document.getElementById('pause').innerHTML = 'Pause';
  document.getElementById('pause').className = '';
  document.getElementById('restart').className = '';
  sound.stop();
}

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

function moveStressor() {
  setTimeout(moveStressor, speed * 1.5);
  if (paused) {
    return;
  } else if (!paused) {
    if (parseFloat(heart.attr('x')) < parseFloat(stressor.attr('x'))) {
      move(stressor, 'ArrowLeft');
    } else if (parseFloat(heart.attr('x')) > parseFloat(stressor.attr('x'))) {
      move(stressor, 'ArrowRight');
    } else {
      if (parseFloat(heart.attr('y')) < parseFloat(stressor.attr('y'))) {
        move(stressor, 'ArrowUp');
      } else {
        move(stressor, 'ArrowDown');
      }
    }
  }
}

function didCollide(objA, objB, action) {
  if (objA.attr('x') == objB.attr('x') && objA.attr('y') == objB.attr('y')) {
    setHeartAttr();
    return action();
  }
  return false;
}

function setHeartAttr() {
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
  systolicText.innerHTML = systolic;
  diastolicText.innerHTML = diastolic;
}

function relieveHeart() {
  reliever.remove();
  reliever = place(relievers);
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

function replaceReliever() {
  reliever.remove();
  reliever = place(relievers);
  speed /= 1.03;
}

function stressHeart() {
  systolic += 4;
  diastolic += 2;
  stressor.remove();
  stressor = place(stressors);
  speed /= 1.03;
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
  name = input.value;
  var scoreName = {
    score: hours * 3600 + minutes * 60 + seconds,
    lifespan: ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2),
    name: name,
  };
  scoresNames.push(scoreName);
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