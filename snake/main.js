// Game settings
var sizeX = 500;
var sizeY = 500;
var scale = 10;
var speed = 100;
var canvas = Snap('#canvas');
var direction = 'ArrowDown';

// Define pieces
var snake = canvas.rect(0, 0, scale, scale);
snake.attr({fill: 'lightblue'});
var food = placeFood();

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
  }
}

setInterval(gameLoop, speed);

// Define game functions
function move(obj, direction) {
  var possibleDirections = {
    'ArrowUp': {'y': parseFloat(obj.attr('y')) - scale},
    'ArrowDown': {'y': parseFloat(obj.attr('y')) + scale},
    'ArrowRight': {'x': parseFloat(obj.attr('x')) + scale},
    'ArrowLeft' : {'x': parseFloat(obj.attr('x')) - scale},
  };
  obj.attr(possibleDirections[direction]);
}
function placeFood() {
  var randX = Math.floor((sizeX/scale) * Math.random()) * scale;
  var randY = Math.floor((sizeY/scale) * Math.random()) * scale;
  var food = canvas.rect(randX, randY, scale, scale, 3, 3);
  food.attr({fill: 'green'});
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
