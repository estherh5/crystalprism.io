// Game settings
var sizeX = 500;
var sizeY = 500;
var scale = 50;
var speed = 200;
var score = 0;
var canvas = Snap('#canvas');
var scoreboard = document.getElementById('scoreboard');
var direction = 'ArrowDown';

// Define pieces
var snake = canvas.rect(0, 0, scale, scale);
snake.attr({fill: '#fffa92'});
var food = placeFood();
canvas.attr({width: sizeX, height: sizeY});

// Define events
document.body.onkeydown = function (e) {
  direction = e.key;
}

// Game loop
function gameLoop() {
  move(snake, direction);
  if (!food) {food = placeFood();}
  if (didSnakeEat(food)) {
    food.remove();
    food = null;
    score++;
    speed = speed/1.01;
  }
  scoreboard.innerHTML = "Score: " + score;
  setTimeout(gameLoop, speed);
}

setTimeout(gameLoop, speed);

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

function didSnakeEat() {
  if (snake.attr('x') == food.attr('x') && snake.attr('y') == food.attr('y')) {
    return true;
  }
  return false;
}






// var circle = canvas.circle(100, 100, 30, 30);
// circle.animate({cx: 300, cy: 300, r: 5}, 5000);
