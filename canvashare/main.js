var canvas;
var stageCanvas;
var pallet;
var stagePallet;
var shape;
var red;
var orange;
var yellow;
var green;
var blue;
var purple;
var drawing;
var oldPt;
var oldMidPt;
var color;
var stroke;

function setStage() {
  canvas = document.getElementById('canvas');
  stageCanvas = new createjs.Stage(canvas);
  stageCanvas.autoClear = false;
  stageCanvas.enableDOMEvents(true);
  createjs.Touch.enable(stageCanvas);
  createjs.Ticker.setFPS(24);
  drawing = new createjs.Shape();
  stageCanvas.addEventListener('stagemousedown', whenMouseDown);
  stageCanvas.addEventListener('stagemouseup', whenMouseUp);
  stageCanvas.addChild(drawing);
  stageCanvas.update();
  stagePallet = Snap('#pallet');
  red = stagePallet.circle(10, 20, 10).attr('fill', 'red');
  orange = stagePallet.circle(40, 20, 10).attr('fill', 'orange');
  yellow = stagePallet.circle(70, 20, 10).attr('fill', 'yellow');
  green = stagePallet.circle(100, 20, 10).attr('fill', 'green');
  blue = stagePallet.circle(130, 20, 10).attr('fill', 'blue');
  purple = stagePallet.circle(160, 20, 10).attr('fill', 'purple');
  red.node.onclick = chooseRed;
  orange.node.onclick = chooseOrange;
  yellow.node.onclick = chooseYellow;
  green.node.onclick = chooseGreen;
  blue.node.onclick = chooseBlue;
  purple.node.onclick = choosePurple;
  color = 'red';
  stroke = 10;
}

function whenMouseDown(event) {
  if (!event.primary) { return; }
  oldPt = new createjs.Point(stageCanvas.mouseX, stageCanvas.mouseY);
  oldMidPt = oldPt.clone();
  stageCanvas.addEventListener('stagemousemove', whenMouseMove);
}

function chooseRed() {
  color = 'red';
}

function chooseOrange() {
  color = 'orange';
}

function chooseYellow() {
  color = 'yellow';
}

function chooseGreen() {
  color = 'green';
}

function chooseBlue() {
  color = 'blue';
}

function choosePurple() {
  color = 'purple';
}

function whenMouseMove(event) {
  if (!event.primary) { return; }
  var midPt = new createjs.Point(oldPt.x + stageCanvas.mouseX >> 1, oldPt.y + stageCanvas.mouseY >> 1);
  drawing.graphics.clear().setStrokeStyle(stroke, 'round', 'round').beginStroke(color).moveTo(midPt.x, midPt.y).curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);
  oldPt.x = stageCanvas.mouseX;
  oldPt.y = stageCanvas.mouseY;
  oldMidPt.x = midPt.x;
  oldMidPt.y = midPt.y;
  stageCanvas.update();
}

function whenMouseUp(event) {
  if (!event.primary) { return; }
  stageCanvas.removeEventListener('stagemousemove', whenMouseMove);
}
