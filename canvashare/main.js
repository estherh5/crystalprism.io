var canvas;
var stageCanvas;
var stagePallet;
var basicPallet;
var drawing;
var oldPt;
var oldMidPt;
var paint;
var paintClone;
var stroke;
var cursorCanvas;
var cursorSVG;
var cursorCircle;
var ctx;
var XMLS;

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
  basicPallet = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
  paint = stagePallet.circle(115, 20, 10).attr({fill: basicPallet[0], 'data-color': basicPallet[0]}).node;
  for (var i = 1; i < basicPallet.length; i++) {
    paintClone = paint.cloneNode(true);
    paintClone.setAttribute('cx', parseInt(paint.getAttribute('cx')) + 30*i);
    paintClone.setAttribute('fill', basicPallet[i]);
    paintClone.setAttribute('data-color', basicPallet[i]);
    stagePallet.append(paintClone);
  }
  paint.classList.add('stroke');
  document.getElementById('pallet').onclick = updatePaint;
  stroke = 10;
  updateCursor();
}

function updateCursor() {
  cursorCanvas = document.getElementById('cursor');
  ctx = cursorCanvas.getContext('2d');
  XMLS = new XMLSerializer();
  cursorCircle = document.getElementById('circle');
  cursorCircle.style.fill = paint.dataset.color;
  cursorCircle.setAttribute('r', stroke/2);
  cursorSVG = XMLS.serializeToString(document.getElementById('svg'));
  canvg(cursorCanvas, cursorSVG);
  canvas.style.cursor = 'url(' + cursorCanvas.toDataURL() + ') ' + stroke + ' ' + stroke + ', auto';
}

function updatePaint(e) {
  if (e.target.nodeName == 'circle') {
    paint.classList.remove('stroke');
    paint = e.target;
    paint.classList.add('stroke');
    updateCursor();
  }
}

function whenMouseDown(event) {
  if (!event.primary) { return; }
  oldPt = new createjs.Point(stageCanvas.mouseX, stageCanvas.mouseY);
  oldMidPt = oldPt.clone();
  stageCanvas.addEventListener('stagemousemove', whenMouseMove);
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
