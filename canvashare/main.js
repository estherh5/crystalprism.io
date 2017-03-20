var canvas;
var stageCanvas;
var oldPt;
var oldMidPt;
var drawing;
var stroke;
var stagePalette;
var basic;
var pastel;
var seashore;
var bold;
var oblique;
var contrast;
var calico;
var mauve;
var currentPalette;
var currentPaint;
var paintChoice;
var clickedButton;
var cursorCanvas;
var ctx;
var XMLS;
var cursorCircle;
var cursorSVG;

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
  stroke = 10;
  stagePalette = Snap('#current-palette');
  basic = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
  pastel = ['#FFE4E7', '#FFC5A7', '#FFFFA9', '#FFF0A5', '#D2FFC5', '#CFFEFF'];
  seashore = ['#594F4F', '#547980', '#45ADA8', '#9DE0AD', '#E5FCC2', '#F9EBC2'];
  bold = ['#00A0B0', '#6A4A3C', '#CC333F', '#EB6841', '#EDC951', '#A1AD1A'];
  oblique = ['#3FB8AF', '#6A4A3C', '#7FC7AF', '#FF9E9D', '#FF3D7F', '#8484CA'];
  contrast = ['#E3D1FF', '#CBE86B', '#F2E9E1', '#1C140D', '#F9ABAB', '#95D8E5'];
  calico = ['#F5F5C7', '#DCE9BE', '#555152', '#2E2633', '#99173C', '#46C2DD'];
  mauve = ['#413E4A', '#73626E', '#B38184', '#F0B49E', '#F7E4BE', '#BCE4BF'];
  currentPalette = basic;
  document.getElementById('palette-choices').onclick = updatePalette;
  currentPaint = stagePalette.circle(125, 20, 10).attr({fill: currentPalette[0], 'data-color': currentPalette[0]}).node;
  for (var i = 1; i < currentPalette.length; i++) {
    paintChoice = currentPaint.cloneNode(true);
    paintChoice.setAttribute('cx', parseInt(currentPaint.getAttribute('cx')) + 30*i);
    paintChoice.setAttribute('fill', currentPalette[i]);
    paintChoice.setAttribute('data-color', currentPalette[i]);
    stagePalette.append(paintChoice);
  }
  currentPaint.classList.add('chosen');
  document.getElementById('current-palette').onclick = updatePaint;
  clickedButton = document.getElementsByTagName('button')[0];
  clickedButton.classList.add('clicked');
  cursorCanvas = document.getElementById('cursor');
  ctx = cursorCanvas.getContext('2d');
  XMLS = new XMLSerializer();
  updateCursor();
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
  drawing.graphics.clear().setStrokeStyle(stroke, 'round', 'round').beginStroke(currentPaint.dataset.color).moveTo(midPt.x, midPt.y).curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);
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

function updatePalette(e) {
  if (e.target.nodeName == 'BUTTON') {
    clickedButton.classList.remove('clicked');
    clickedButton = e.target;
    clickedButton.classList.add('clicked');
    currentPalette = eval(clickedButton.dataset.palette);
    currentPaint.classList.remove('chosen');
    for (var i = 0; i < currentPalette.length; i++) {
      paintChoice = currentPaint.cloneNode(true);
      paintChoice.setAttribute('cx', parseInt(125 + 30*i));
      paintChoice.setAttribute('fill', currentPalette[i]);
      paintChoice.setAttribute('data-color', currentPalette[i]);
      stagePalette.append(paintChoice);
    }
    currentPaint = stagePalette.circle(125, 20, 10).attr({fill: currentPalette[0], 'data-color': currentPalette[0]}).node;
    currentPaint.classList.add('chosen');
    updateCursor();
  }
}

function updatePaint(e) {
  if (e.target.nodeName == 'circle') {
    currentPaint.classList.remove('chosen');
    currentPaint = e.target;
    currentPaint.classList.add('chosen');
    updateCursor();
  }
}

function updateCursor() {
  cursorCircle = document.getElementById('circle');
  cursorCircle.style.fill = currentPaint.dataset.color;
  cursorCircle.setAttribute('r', stroke/2);
  cursorSVG = XMLS.serializeToString(document.getElementById('svg'));
  canvg(cursorCanvas, cursorSVG);
  canvas.style.cursor = 'url(' + cursorCanvas.toDataURL() + ') ' + stroke + ' ' + stroke + ', auto';
}
