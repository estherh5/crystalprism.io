// Game settings
var sizeX = 500;
var sizeY = 500;
var scale = 50;
var speed = 200;
var score = 0;
var canvas = Snap('#canvas');
var scoreboard = document.getElementById('scoreboard');
var leaders = document.getElementById('leaders');
var direction = 'ArrowDown';

// Define pieces
var snake = canvas.rect(0, 0, scale, scale);
snake.attr({fill: '#fffa92'});
var food = placeFood();
var enemy = placeEnemy();
canvas.attr({width: sizeX, height: sizeY});
var scoresNames = [];

// Define events
document.body.onkeydown = function (e) {
  direction = e.key;
}

// Game loop
function gameLoop() {
  move(snake, direction);
  if (!food) {food = placeFood();}
  if (!enemy) {enemy = placeEnemy();}
  if (didSnakeEat(food)) {
    food.remove();
    food = null;
    score++;
    speed /= 1.01;
  }
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
    leaders.innerHTML = "";
    var tableHeaderOne = document.createElement("th");
    var tableHeaderTwo = document.createElement("th");
    var tableRow = document.createElement("tr");
    leaders.appendChild(tableRow);
    tableRow.appendChild(tableHeaderOne);
    tableHeaderOne.appendChild(document.createTextNode("Score"));
    tableRow.appendChild(tableHeaderTwo);
    tableHeaderTwo.appendChild(document.createTextNode("Name"));
    if (scoresNames.length < 5) {
      for (var i = 0; i < scoresNames.length; i++) {
        var tableRowNew = document.createElement("tr");
        var tableContainerOne = document.createElement("td");
        var tableContainerTwo = document.createElement("td");
        leaders.appendChild(tableRowNew);
        tableRowNew.appendChild(tableContainerOne);
        tableContainerOne.appendChild(document.createTextNode(scoresNames[i].score));
        tableRowNew.appendChild(tableContainerTwo);
        tableContainerTwo.appendChild(document.createTextNode(scoresNames[i].name));
      }
    } else {
      for (var i = 0; i < 5; i++) {
        var tableRowNew = document.createElement("tr");
        var tableContainerOne = document.createElement("td");
        var tableContainerTwo = document.createElement("td");
        leaders.appendChild(tableRowNew);
        tableRowNew.appendChild(tableContainerOne);
        tableContainerOne.appendChild(document.createTextNode(scoresNames[i].score));
        tableRowNew.appendChild(tableContainerTwo);
        tableContainerTwo.appendChild(document.createTextNode(scoresNames[i].name));
      }
    }
    score = 0;
    snake.attr({'x': 0, 'y': 0});
    speed = 200;
    direction = 'ArrowDown';
  }
  scoreboard.innerHTML = "Score: " + score;
  setTimeout(gameLoop, speed);
}

setTimeout(gameLoop, speed);

function moveEnemy() {
  var possibleDirections = ['ArrowUp', 'ArrowDown', 'ArrowRight', 'ArrowLeft'];
  z = Math.floor(Math.random() * 3);
  var randDirection = possibleDirections[z];
  move(enemy, randDirection);
  setTimeout(moveEnemy, speed * 2);
}

setTimeout(moveEnemy, speed * 2);

// Define game functions
function move(obj, direction) {
  var possibleDirections = {
    'ArrowUp': {'y': parseFloat(obj.attr('y')) - scale},
    'ArrowDown': {'y': parseFloat(obj.attr('y')) + scale},
    'ArrowRight': {'x': parseFloat(obj.attr('x')) + scale},
    'ArrowLeft' : {'x': parseFloat(obj.attr('x')) - scale},
  };
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

function placeEnemy() {
  var randX = Math.floor((sizeX/scale) * Math.random()) * scale;
  var randY = Math.floor((sizeY/scale) * Math.random()) * scale;
  var enemy = canvas.rect(randX, randY, scale, scale);
  enemy.attr({fill: '#f11111'});
  return enemy;
}

function didSnakeEat() {
  if (snake.attr('x') == food.attr('x') && snake.attr('y') == food.attr('y')) {
    return true;
  }
  return false;
}

function didSnakeCollide() {
  if (snake.attr('x') == enemy.attr('x') && snake.attr('y') == enemy.attr('y')) {
    return true;
  }
  return false;
}
