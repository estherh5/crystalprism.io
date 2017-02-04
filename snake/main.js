// Game settings
var sizeX = 600;
var sizeY = 600;
var scale = 50;
var speed = 200;
var hours = 0;
var minutes = 0;
var seconds = 0;
var systolic = 110;
var diastolic = 70;
var paused = false;
var direction = 'ArrowDown';
var name = '';
var scoresNames = [];

// Define pieces
var items = Snap('#items');
items.attr({width: sizeX / 2, height: sizeY});
var canvas = Snap('#canvas');
canvas.attr({width: sizeX, height: sizeY});
var snake = canvas.rect(0, 0, scale, scale);
snake.attr({fill: '#fffa92'});
var food = placeFood();
var enemy = canvas.rect(sizeX / 2 + scale * 2, sizeY / 2 + scale * 2, scale, scale);
enemy.attr({fill: '#f11111'});
var game = document.getElementById('game');
var systolicText = document.getElementById('systolic');
var diastolicText = document.getElementById('diastolic');
var lifespan = document.getElementById('lifespan');
var leaders = document.getElementsByClassName('leaders');
var div = null;
var input = document.createElement('input');
var submit = document.createElement('button');
var breakOne = document.createElement('br');
var text = document.createElement('h1');
var breakTwo = document.createElement('br');
var breakThree = document.createElement('br');

// Define events
document.body.onkeydown = function (e) {
  if (e.key == 'ArrowUp' || e.key == 'ArrowDown' || e.key == 'ArrowRight' || e.key == 'ArrowLeft') {
    direction = e.key;
  }
}

document.getElementById('pause').onclick = function () {
  if (div != null) {
    return;
  } else {
    if (paused) {
      paused = false;
      document.getElementById('pause').innerHTML = 'Pause';
    } else if (!paused) {
      paused = true;
      document.getElementById('pause').innerHTML = 'Resume';
    }
  }
}

document.getElementById('restart').onclick = function() {
  if (div != null) {
    return;
  } else {
    restartGame();
  }
}

input.oninput = function () {
  if (input.value == '') {
    submit.className = 'inactive';
  } else {
    submit.className = 'button';
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
    div.remove();
    div = null;
    paused = false;
    input.value = '';
    document.getElementById('pause').className = 'button';
    document.getElementById('restart').className = 'button';
  }
}

// Game loop
function gameLoop() {
  setTimeout(gameLoop, speed);
  if (paused) {
    return;
  } else if (!paused) {
    move(snake, direction);
    if (didCollide(snake, food)) {
      food.remove();
      food = null;
      speed /= 1.01;
      food = placeFood();
      if (diastolic > 70) {
        diastolic--;
      }
      if (systolic > 110) {
        systolic--;
      }
    }
    if (didCollide(enemy, food)) {
      food.remove();
      food = null;
      speed /= 1.01;
      food = placeFood();
    }
    if (didCollide(snake, enemy)) {
      diastolic++;
      systolic++;
    }
    if (systolic < 120 && diastolic < 80) {
      systolicText.style.color = '#56d056';
      diastolicText.style.color = '#56d056';
    }
    if (systolic >= 120 && systolic < 140) {
      systolicText.style.color = '#ffff00';
    }
    if (diastolic >= 80 && diastolic < 90) {
      diastolicText.style.color = '#ffff00';
    }
    if (systolic >= 140 && systolic < 160) {
      systolicText.style.color = '#ffc107';
    }
    if (diastolic >= 90 && diastolic < 100) {
      diastolicText.style.color = '#ffc107';
    }
    if (systolic >= 160) {
      systolicText.style.color = '#ff2020';
    }
    if (diastolic >= 100) {
      diastolicText.style.color = '#ff2020';
    }
    if (systolic > 160 || diastolic > 100) {
      paused = true;
      div = document.createElement('div');
      game.appendChild(div);
      div.id = 'game-over';
      div.appendChild(text);
      text.id = 'game-over-text';
      text.innerHTML = 'Game Over.';
      text.appendChild(breakOne);
      text.appendChild(document.createTextNode('What is your name?'));
      div.appendChild(breakTwo);
      div.appendChild(input);
      div.appendChild(breakThree);
      div.appendChild(submit);
      submit.className = '';
      document.getElementById('pause').className = 'inactive';
      document.getElementById('restart').className = 'inactive';
      submit.innerHTML = 'Submit';
    }
  }
  systolicText.innerHTML = systolic;
  diastolicText.innerHTML = diastolic;
  lifespan.innerHTML = 'Lifespan: ' + ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2);
}

function moveEnemy() {
  var possibleDirections = ['ArrowUp', 'ArrowDown', 'ArrowRight', 'ArrowLeft'];
  z = Math.floor(Math.random() * 3);
  var randDirection = possibleDirections[z];
  setTimeout(moveEnemy, speed * 2);
  if (paused) {
    return;
  } else if (!paused) {
  move(enemy, randDirection);
  }
}

setTimeout(gameLoop, speed);

setTimeout(moveEnemy, speed * 2);

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

function placeFood() {
  var randX = Math.floor((sizeX/scale) * Math.random()) * scale;
  var randY = Math.floor((sizeY/scale) * Math.random()) * scale;
  var food = canvas.rect(randX, randY, scale, scale, scale/10, scale/10);
  food.attr({fill: '#ceffe8'});
  return food;
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
  restartGame();
}

function restartGame() {
  hours = 0;
  minutes = 0;
  seconds = 0;
  systolic = 110;
  diastolic = 70;
  paused = false;
  document.getElementById('pause').innerHTML = 'Pause';
  snake.attr({'x': 0, 'y': 0});
  enemy.attr({'x': sizeX / 2 + scale * 2, 'y': sizeY / 2 + scale * 2});
  speed = 200;
  direction = 'ArrowDown';
  food.remove();
  food = null;
  score = 0;
  food = placeFood();
}
