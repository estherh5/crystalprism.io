// Game settings
var sizeX = 500;
var sizeY = 500;
var scale = 50;
var speed = 200;
var score = 0;
var canvas = Snap('#canvas');
var game = document.getElementById('game');
var scoreboard = document.getElementById('scoreboard');
var leaders = document.getElementsByClassName('leaders');
var direction = 'ArrowDown';
var paused = false;

// Define pieces
var snake = canvas.rect(0, 0, scale, scale);
snake.attr({fill: '#fffa92'});
var food = placeFood();
var enemy = canvas.rect(sizeX / 2 + scale * 2, sizeY / 2 + scale * 2, scale, scale);
enemy.attr({fill: '#f11111'});
canvas.attr({width: sizeX, height: sizeY});
var scoresNames = [];
var input = document.createElement("input");
var submit = document.createElement("button");
var div = document.createElement("div");
var breakOne = document.createElement("br");
var text = document.createElement("h1");
var breakTwo = document.createElement("br");
var breakThree = document.createElement("br");
var name = "";

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
      document.getElementById('pause').innerHTML = "Pause";
    } else if (!paused) {
      paused = true;
      document.getElementById('pause').innerHTML = "Resume";
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

submit.onclick = function () {
  if (input.value == "") {
    return;
  } else {
    name = input.value;
    var scoreName = {
      score: score,
      name: name,
    };
    scoresNames.push(scoreName);
    updateLeaderboard();
    div.remove();
    div = null;
    paused = false;
    input.value = "";
    document.getElementById('pause').className = "button";
    document.getElementById('restart').className = "button";
  }
}

input.oninput = function () {
  if (input.value == "") {
    submit.className = "inactive";
  } else {
    submit.className = "button";
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
      score++;
      speed /= 1.01;
      food = placeFood();
    }
    if (didCollide(enemy, food)) {
      food.remove();
      food = null;
      score--;
      speed /= 1.01;
      food = placeFood();
    }
    if (didCollide(snake, enemy)) {
      paused = true;
      div = document.createElement("div");
      game.appendChild(div);
      div.id = "game-over";
      div.appendChild(text);
      text.id = "game-over-text";
      text.innerHTML = "Game Over.";
      text.appendChild(breakOne);
      text.appendChild(document.createTextNode("What is your name?"));
      div.appendChild(breakTwo);
      div.appendChild(input);
      div.appendChild(breakThree);
      div.appendChild(submit);
      submit.className = "inactive";
      document.getElementById('pause').className = "inactive";
      document.getElementById('restart').className = "inactive";
      submit.innerHTML = "Submit";
    }
  }
  scoreboard.innerHTML = "Score: " + score;
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

function restartGame() {
  paused = false;
  document.getElementById('pause').innerHTML = "Pause";
  snake.attr({'x': 0, 'y': 0});
  enemy.attr({'x': sizeX / 2 + scale * 2, 'y': sizeY / 2 + scale * 2});
  speed = 200;
  direction = 'ArrowDown';
  food.remove();
  food = null;
  score = 0;
  food = placeFood();
}

function updateLeaderboard() {
  scoresNames.sort(function (a, b) {
    return b.score - a.score;
  }
  );
  if (scoresNames.length <= 5) {
    for (var i = 0; i < scoresNames.length; i++) {
      var tableContainerOne = document.createElement("td");
      var tableContainerTwo = document.createElement("td");
      leaders[i].innerHTML = "";
      leaders[i].appendChild(tableContainerOne);
      tableContainerOne.appendChild(document.createTextNode(scoresNames[i].score));
      leaders[i].appendChild(tableContainerTwo);
      tableContainerTwo.appendChild(document.createTextNode(scoresNames[i].name));
    }
  } else {
      for (var i = 0; i <= 4; i++) {
      var tableContainerOne = document.createElement("td");
      var tableContainerTwo = document.createElement("td");
      leaders[i].innerHTML = "";
      leaders[i].appendChild(tableContainerOne);
      tableContainerOne.appendChild(document.createTextNode(scoresNames[i].score));
      leaders[i].appendChild(tableContainerTwo);
      tableContainerTwo.appendChild(document.createTextNode(scoresNames[i].name));
    }
  }
  restartGame();
}
