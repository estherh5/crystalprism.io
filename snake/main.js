// Game settings
var sizeX = 500;
var sizeY = 500;
var scale = 50;
var speed = 200;
var score = 0;
var canvas = Snap('#canvas');
var scoreboard = document.getElementById('scoreboard');
var leaders = [document.getElementById('first'), document.getElementById('second'), document.getElementById('third'), document.getElementById('fourth'), document.getElementById('fifth')];
var direction = 'ArrowDown';
var paused = false;

// Define pieces
var snake = canvas.rect(0, 0, scale, scale);
snake.attr({fill: '#fffa92'});
var food = placeFood();
var enemy = canvas.rect(sizeX - scale, sizeY - scale, scale, scale);
enemy.attr({fill: '#f11111'});
canvas.attr({width: sizeX, height: sizeY});
var scoresNames = [];

// Define events
document.body.onkeydown = function (e) {
  if (e.key == 'ArrowUp' || e.key == 'ArrowDown' || e.key == 'ArrowRight' || e.key == 'ArrowLeft') {
    direction = e.key;
  }
}

document.getElementById('pause').onclick = function () {
  if (paused) {
    paused = false;
    document.getElementById('pause').innerHTML = "Pause";
  } else if (!paused) {
    paused = true;
    document.getElementById('pause').innerHTML = "Resume";
  }
}

document.getElementById('restart').onclick = function () {
  paused = false;
  document.getElementById('pause').innerHTML = "Pause";
  score = 0;
  snake.attr({'x': 0, 'y': 0});
  enemy.attr({'x': sizeX - scale, 'y': sizeY - scale});
  speed = 200;
  direction = 'ArrowDown';
  food.remove();
  food = null;
}

// Game loop
function gameLoop() {
  setTimeout(gameLoop, speed);
  if (paused) {
    return;
  } else if (!paused) {
    move(snake, direction);
    if (!food) {food = placeFood();}
    if (didSnakeCollide(food)) {
      food.remove();
      food = null;
      score++;
      speed /= 1.01;
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

function updateLeaderboard() {
  if (didSnakeCollide(enemy)) {
    var name = prompt("Game over. What is your name?");
    var scoreName = {
      score: score,
      name: name,
    };
    scoresNames.push(scoreName);
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
    score = 0;
    snake.attr({'x': 0, 'y': 0});
    enemy.attr({'x': sizeX - scale, 'y': sizeY - scale});
    speed = 200;
    direction = 'ArrowDown';
  }
  setTimeout(updateLeaderboard, speed);
}

setTimeout(gameLoop, speed);

setTimeout(updateLeaderboard, speed);

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

function didSnakeCollide(a) {
  if (snake.attr('x') == a.attr('x') && snake.attr('y') == a.attr('y')) {
    return true;
  }
  return false;
}
