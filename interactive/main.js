var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
document.getElementById('text').oninput = displayMessage;
document.getElementById('space').onclick = createCircle;
function displayMessage() {
  document.getElementById('message').innerHTML = document.getElementById('text').value;
}
function createCircle(e) {
  var canvas = document.getElementById('space');
  var shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  var x = e.x - e.target.getBoundingClientRect().left;
  var y = e.y - e.target.getBoundingClientRect().top;
  shape.setAttribute('class', 'circle');
  shape.setAttribute('cx', x + 'px');
  shape.setAttribute('cy', y + 'px');
  shape.setAttribute('r', '10px');
  shape.setAttribute('fill', 'lightblue');
  canvas.appendChild(shape);
}
setInterval(function () {
  var circles = document.getElementsByClassName('circle');
  for(var i = 0; i < circles.length; i++){
    var intcx = parseInt(circles[i].getAttribute('cx'));
    var intcy = parseInt(circles[i].getAttribute('cy'));
    circles[i].setAttribute('cx', intcx + 1 + 'px');
    circles[i].setAttribute('cy', intcy - 1 + 'px');
  }
}, 1);
