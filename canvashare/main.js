var canvas;
var stageCanvas;
var stagePallet;
var red;
var orange;
var yellow;
var green;
var blue;
var purple;
var drawing;
var oldPt;
var oldMidPt;
var paint;
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
  red = stagePallet.circle(115, 20, 10).attr({fill: 'red', 'data-color': 'red'}).addClass('stroke');
  orange = stagePallet.circle(145, 20, 10).attr({fill: 'orange', 'data-color': 'orange'});
  yellow = stagePallet.circle(175, 20, 10).attr({fill: 'yellow', 'data-color': 'yellow'});
  green = stagePallet.circle(205, 20, 10).attr({fill: 'green', 'data-color': 'green'});
  blue = stagePallet.circle(235, 20, 10).attr({fill: 'blue', 'data-color': 'blue'});
  purple = stagePallet.circle(265, 20, 10).attr({fill: 'purple', 'data-color': 'purple'});
  document.getElementById('pallet').onclick = updatePaint;
  paint = red.node;
  stroke = 10;
}

function whenMouseDown(event) {
  if (!event.primary) { return; }
  oldPt = new createjs.Point(stageCanvas.mouseX, stageCanvas.mouseY);
  oldMidPt = oldPt.clone();
  stageCanvas.addEventListener('stagemousemove', whenMouseMove);
}

function updatePaint(e) {
  if (e.target.nodeName == 'circle') {
    paint.classList.remove('stroke');
    paint = e.target;
    paint.classList.add('stroke');
  }
}

function whenMouseMove(event) {
  if (!event.primary) { return; }
  var midPt = new createjs.Point(oldPt.x + stageCanvas.mouseX >> 1, oldPt.y + stageCanvas.mouseY >> 1);
  drawing.graphics.clear().setStrokeStyle(stroke, 'round', 'round').beginStroke(paint.dataset.color).moveTo(midPt.x, midPt.y).curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);
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
