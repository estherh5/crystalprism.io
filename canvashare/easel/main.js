// Define global variables
var drawingTitle = document.getElementById('drawing-title');
var canvasContext;
var initialDrawing; // Starting drawing on canvas
var drawingCanvas;
var stroke = 10; // Set size of drawing dot on canvas
var startPoint; // Starting point for user's drawing movement on the canvas
var drawing; // Drawing that user adds to canvas
var currentPaint;
var currentPalette;
var currentPaletteButton;
var enteredTitle;


// Define palettes of colors for drawing
var basic = ['#ff0000', '#ffa500', '#ffff00', '#008000', '#0000ff',
  '#800080'];
var pastel = ['#ffe4e7', '#ffc5a7', '#fff0a5', '#ffffa9', '#d2ffc5',
  '#cffeff'];
var seashore = ['#594f4f', '#547980', '#45ada8', '#9de0ad', '#e5fcc2',
  '#f9ebc2'];
var bold = ['#00a0b0', '#6a4a3c', '#cc333f', '#eb6841', '#edc951',
  '#a1ad1a'];
var oblique = ['#ca8484', '#ff3d7f', '#ff9e9d', '#8484ca', '#3fb8af',
  '#7fc7af'];
var contrast = ['#e3d1ff', '#cbe86b', '#f2e9e1', '#1c140d', '#f9abab',
  '#95d8e5'];
var calico = ['#f5f5c7', '#dce9be', '#555152', '#2e2633', '#99173c',
  '#46c2dd'];
var mauve = ['#413e4a', '#73626e', '#b38184', '#f0b49e', '#f7e4be',
  '#bce4bf'];
var grayscale = ['#ffffff', '#999999', '#666666', '#333333', '#111111',
  '#000000'];


// Define load functions
window.onload = function() {
  // Create page header (from common.js script)
  createPageHeader();

  // Create page footer (from common.js script)
  createPageFooter();

  // Check if user is logged in (from common.js script)
  checkIfLoggedIn();

  // Set up drawing space
  assembleEasel();

  return;
}

// Set up drawing space
function assembleEasel() {
  /* Create new image as initial starting drawing and set CORS requests as
  anonymous (no credentials required to display image) */
  initialDrawing = new Image();
  initialDrawing.crossOrigin = 'Anonymous';

  /* Set initial drawing source as sessionStorage item if not null (i.e., if
  user came from gallery) */
  if (sessionStorage.getItem('drawing-source') != null) {
    initialDrawing.src = sessionStorage.getItem('drawing-source');
    sessionStorage.removeItem('drawing-source');

    /* Set drawing title as sessionStorage item if not null (i.e., if user is
    continuing previous drawing from gallery) */
    if (sessionStorage.getItem('drawing-title') != null) {
      drawingTitle.value = sessionStorage.getItem('drawing-title');
      sessionStorage.removeItem('drawing-title');
    }

    // Otherwise, set drawing title to blank
    else {
      drawingTitle.value = '';
    }
  }

  /* Otherwise, set initial drawing source as localStorage item if not null
  (i.e., if user came to easel page directly) */
  else if (localStorage.getItem('drawing-source') != null) {
    initialDrawing.src = localStorage.getItem('drawing-source');

    // Set drawing title as localStorage item if not null
    if (localStorage.getItem('drawing-title') != null) {
      drawingTitle.value = localStorage.getItem('drawing-title');
    }

    // Otherwise, set drawing title to blank
    else {
      drawingTitle.value = '';
    }
  }

  /* Otherwise, set initial drawing source to blank white canvas with blank
  title */
  else {
    initialDrawing.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAA' +
      'AAGQCAYAAACAvzbMAAAFlElEQVR4nO3VMQ0AMAzAsPInvXLIM1WyEeTLPAAI5ncAADcZC' +
      'ACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiY' +
      'EAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJA' +
      'YCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgA' +
      'iYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBA' +
      'JAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGA' +
      'gAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAIm' +
      'BAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQ' +
      'GAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIA' +
      'ImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQ' +
      'CQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBg' +
      'IAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJ' +
      'gQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAk' +
      'BgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCA' +
      'CJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYE' +
      'AkBgIAImBAJAYCACJgQCQGAgAiYEkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYC' +
      'ACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiY' +
      'EAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJA' +
      'YCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgA' +
      'iYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBA' +
      'JAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGA' +
      'gAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAIm' +
      'BAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQ' +
      'GAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIA' +
      'ImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQ' +
      'CQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBg' +
      'IAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJ' +
      'gQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQLKMezedbh' +
      'VKrAAAAAElFTkSuQmCC';
    drawingTitle.value = '';
  }

  // Add initial drawing to HTML canvas
  canvasContext = document.getElementById('canvas').getContext('2d');
  setTimeout(function() {
    canvasContext.drawImage(initialDrawing, 0, 0);
    return;
  }, 500);

  // Create EaselJS stage to render to canvas
  drawingCanvas = new createjs.Stage(document.getElementById('canvas'));

  // Prevent stage from automatically clearing after each drawing mark on canvas
  drawingCanvas.autoClear = false;

  // Enable event listeners that stage adds to DOM events
  drawingCanvas.enableDOMEvents(true);

  // Enable touch interaction with stage/canvas
  createjs.Touch.enable(drawingCanvas);

  // Add event listeners for clicking canvas to draw and save drawing
  drawingCanvas.addEventListener('stagemousedown', startBrushStroke, false);
  drawingCanvas.addEventListener('stagemouseup', endBrushStroke, false);
  drawingCanvas.addEventListener('stagemouseup', saveData, false);

  // Add EaselJS shape to canvas to add vector graphics as user draws
  drawing = new createjs.Shape();
  drawingCanvas.addChild(drawing);
  drawingCanvas.update();

  // Create SVG palette and set starting palette as basic
  var svgPalette = Snap('#current-palette');
  currentPalette = basic;

  // Create colored circles for each color in the palette
  for (var i = 0; i < currentPalette.length; i++) {
    var paint = svgPalette.circle(30 + (8 * i) + '%', '50%', '4%')
      .attr({fill: currentPalette[i], 'data-color': currentPalette[i]}).node;
    paint.classList.add('paint');
    svgPalette.append(paint);

    // Update user's paint color on canvas when color is clicked
    paint.onclick = updatePaint;
  }

  // Set user's current paint color as first color in palette
  currentPaint = document.getElementsByClassName('paint')[0];
  currentPaint.classList.add('selected');

  // Update user's cursor on canvas with current paint color
  updateBrush();

  // Display current palette's button as selected
  currentPaletteButton = document.getElementsByClassName('palette')[0];
  currentPaletteButton.classList.add('selected');

  return;
}


// Update palette colors when user clicks palette option
for (var i = 0; i < document.getElementsByClassName('palette').length; i++) {
  document.getElementsByClassName('palette')[i].addEventListener('click',
    updatePalette, false);
}

function updatePalette() {
  /* Remove selected class from previous palette button and add it to clicked
  palette button */
  currentPaletteButton.classList.remove('selected');
  currentPaletteButton = this;
  currentPaletteButton.classList.add('selected');

  // Set current palette as data-palette item from clicked button
  currentPalette = eval(currentPaletteButton.dataset.palette);

  // Remove selected class from previously selected paint color
  currentPaint.classList.remove('selected');

  // Update palette colors with new palette's colors
  for (var i = 0; i < document.getElementsByClassName('paint').length; i++) {
    document.getElementsByClassName('paint')[i].setAttribute('fill',
      currentPalette[i]);
    document.getElementsByClassName('paint')[i].setAttribute('data-color',
      currentPalette[i]);
    document.getElementsByClassName('paint')[i].classList.remove('outline');
    // Add outline around white color in palette
    if (currentPalette[i] == '#ffffff') {
      document.getElementsByClassName('paint')[i].classList.add('outline');
    }
  }

  /* Set first paint color as selected paint and update user's cursor on canvas
  to reflect color */
  currentPaint = document.getElementsByClassName('paint')[0];
  currentPaint.classList.add('selected');
  updateBrush();

  return;
}


// Update current paint color to paint user clicks
function updatePaint() {
  /* Remove selected class from previously selected paint color and add it to
  clicked paint color */
  currentPaint.classList.remove('selected');
  currentPaint = this;
  currentPaint.classList.add('selected');

  // Update user's cursor on canvas to reflect color
  updateBrush();

  return;
}


// Update user's cursor on canvas to clicked paint color in palette
function updateBrush() {
  // Remove previous cursor color
  document.getElementById('canvas').style.cursor = '';

  /* Turn cursor color circle SVG into string and append to cursor canvas using
  canvg */
  var brushCanvas = document.getElementById('brush');
  var brushCursor = document.getElementById('brush-cursor');
  brushCursor.setAttribute('fill', currentPaint.dataset.color);
  brushCursor.setAttribute('r', stroke/2);
  var XMLS = new XMLSerializer();
  var brushSVG = XMLS.serializeToString(document.getElementById('brush-svg'));
  canvg(brushCanvas, brushSVG);

  // Set cursor style as data URI of cursor canvas that is size of stroke
  document.getElementById('canvas').style.cursor = 'url(' + brushCanvas
    .toDataURL() + ') ' + stroke + ' ' + stroke + ', auto';

  return;
}


// Begin brush stroke when user clicks on canvas
function startBrushStroke(event) {
  /* Do nothing if this is not the first touch on touchscreen (always true for
  mouse event) */
  if (!event.primary) {
    return;
  }

  // Get the point the user clicked on the canvas
  startPoint = new createjs.Point(drawingCanvas.mouseX, drawingCanvas.mouseY);

  /* Clone start point to have as middle point when drawing curve in moveBrush
  function */
  midPoint = startPoint.clone();

  // Draw a circle at the point the user clicked on the canvas
  drawing.graphics.clear().beginFill(currentPaint.dataset.color)
    .drawCircle(drawingCanvas.mouseX, drawingCanvas.mouseY, stroke/2);
  drawingCanvas.update();

  // Add mouse movement listener as user drags mouse to draw on canvas
  drawingCanvas.addEventListener('stagemousemove', moveBrush);

  return;
}


// Continue brush stroke as user drags mouse across canvas
function moveBrush(event) {
  /* Do nothing if this is not the first touch on touchscreen (always true for
  mouse event) */
  if (!event.primary) {
    return;
  }

  /* Set the end point for the stroke (start point + point the user moves to
  on the canvas, shifted 1 bit) */
  var endPoint = new createjs.Point(startPoint.x + drawingCanvas
    .mouseX >> 1, startPoint.y + drawingCanvas.mouseY >> 1);

  // Draw curve from start point to end point, through mid point
  drawing.graphics.clear().setStrokeStyle(stroke, 'round', 'round')
    .beginStroke(currentPaint.dataset.color).moveTo(endPoint.x, endPoint.y)
    .curveTo(startPoint.x, startPoint.y, midPoint.x, midPoint.y);

  // Set new start point as current mouse location for next time function runs
  startPoint.x = drawingCanvas.mouseX;
  startPoint.y = drawingCanvas.mouseY;

  // Set mid point to end point for next time function runs
  midPoint.x = endPoint.x;
  midPoint.y = endPoint.y;
  drawingCanvas.update();

  return;
}


// Remove mouse movement listener when user releases mouse on canvas
function endBrushStroke(event) {
  /* Do nothing if this is not the first touch on touchscreen (always true for
  mouse event) */
  if (!event.primary) {
    return;
  }

  drawingCanvas.removeEventListener('stagemousemove', moveBrush);

  return;
}


/* Save drawing source and title to localStorage when user draws on canvas and
types in drawing title */
drawingTitle.onkeyup = saveData;

function saveData() {
  localStorage.setItem('drawing-source', drawingCanvas.toDataURL());
  localStorage.setItem('drawing-title', drawingTitle.value);
  return;
}


// Clear drawing title if it contains no non-space characters
window.onclick = clearEmptyTitle;

function clearEmptyTitle(e) {
  /* If user clicks anywhere on page that is not the drawing title, clear the
  drawing title if there are no non-space characters */
  if (!drawingTitle.contains(e.target)) {
    if (!/\S/.test(drawingTitle.value)) {
      drawingTitle.value = '';
      // Save drawing title as blank
      saveData();
    }
  }

  return;
}


// Clear drawing when user clicks Clear button
document.getElementById('clear').onclick = clearDrawing;

function clearDrawing() {
  // Clear drawing canvas
  drawingCanvas.clear();

  // Set initial drawing source as blank white canvas
  initialDrawing.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAA' +
    'AAGQCAYAAACAvzbMAAAFlElEQVR4nO3VMQ0AMAzAsPInvXLIM1WyEeTLPAAI5ncAADcZC' +
    'ACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiY' +
    'EAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJA' +
    'YCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgA' +
    'iYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBA' +
    'JAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGA' +
    'gAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAIm' +
    'BAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQ' +
    'GAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIA' +
    'ImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQ' +
    'CQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBg' +
    'IAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJ' +
    'gQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAk' +
    'BgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCA' +
    'CJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYE' +
    'AkBgIAImBAJAYCACJgQCQGAgAiYEkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYC' +
    'ACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiY' +
    'EAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJA' +
    'YCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgA' +
    'iYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBA' +
    'JAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGA' +
    'gAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAIm' +
    'BAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQ' +
    'GAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIA' +
    'ImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQ' +
    'CQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBg' +
    'IAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJ' +
    'gQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQLKMezedbh' +
    'VKrAAAAAElFTkSuQmCC';

  // Add initial drawing to canvas
  canvasContext.drawImage(initialDrawing, 0, 0);

  // Set title to default
  drawingTitle.value = '';

  // Remove session and localStorage items for drawing title and source
  sessionStorage.removeItem('drawing-title');
  sessionStorage.removeItem('drawing-source');
  localStorage.removeItem('drawing-source');
  localStorage.removeItem('drawing-title');

  return;
}


// Post drawing to gallery when user clicks Post button
document.getElementById('post').onclick = postDrawing;

function postDrawing() {
  // If drawing is blank, warn user that blank drawing cannot be posted
  if (drawingCanvas
    .toDataURL() == 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAA' +
    'AAGQCAYAAACAvzbMAAAFlElEQVR4nO3VMQ0AMAzAsPInvXLIM1WyEeTLPAAI5ncAADcZC' +
    'ACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiY' +
    'EAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJA' +
    'YCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgA' +
    'iYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBA' +
    'JAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGA' +
    'gAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAIm' +
    'BAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQ' +
    'GAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIA' +
    'ImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQ' +
    'CQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBg' +
    'IAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJ' +
    'gQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAk' +
    'BgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCA' +
    'CJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYE' +
    'AkBgIAImBAJAYCACJgQCQGAgAiYEkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYC' +
    'ACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiY' +
    'EAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJA' +
    'YCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgA' +
    'iYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBA' +
    'JAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGA' +
    'gAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAIm' +
    'BAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQ' +
    'GAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIA' +
    'ImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQ' +
    'CQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBg' +
    'IAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJ' +
    'gQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQLKMezedbh' +
    'VKrAAAAAElFTkSuQmCC') {
    window.alert('Your drawing cannot be blank.');
    return;
  }

  /* While drawing title has no non-space characters, prompt user for title
  until they enter one or cancel */
  while (!/\S/.test(drawingTitle.value)) {
    enteredTitle = prompt('Enter a title for your drawing. Tip: Click ' +
      '"[title]" to enter a title at any time.');
    if (!/\S/.test(enteredTitle)) {
      enteredTitle = prompt('Enter a title for your drawing. Tip: Click ' +
        '"[title]" to enter a title at any time.');
    } else if (enteredTitle == null) {
      return;
    } else {
      drawingTitle.value = enteredTitle;
      // Save new drawing title to localStorage
      saveData();
    }
  }

  /* If user is not logged in, warn user that login is required to post to
  gallery */
  if (localStorage.getItem('token') == null) {
    window.alert('You must log in to post your drawing to the gallery.');
    return;
  }

  // Otherwise, send data URI of drawing to server
  var data = JSON.stringify({'drawing': drawingCanvas.toDataURL(),
    'title': drawingTitle.value});

  return fetch(api + '/canvashare/drawing', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'),
      'Content-Type': 'application/json'},
    method: 'POST',
    body: data,
  })

    // Display error message if server is down
    .catch(function(error) {
      window.alert('Your drawing did not get posted. Please try again soon.');
      return;
    })

    .then(function(response) {
      /* If drawing was posted successfully, clear drawing from easel and
      storage items and redirect to gallery page */
      if (response.status == 201) {
        clearDrawing();
        window.location = '../';
        return;
      }

      // Otherwise, display error message
      window.alert('You must log in to post your drawing to the gallery.');

      return;
    });
}


// Download drawing when user clicks Download button
document.getElementById('download').onclick = downloadDrawing;

function downloadDrawing() {
  /* While drawing title has no non-space characters, prompt user for title
  until they enter one or cancel */
  while (!/\S/.test(drawingTitle.value)) {
    enteredTitle = prompt('Enter a title for your drawing.');

    if (!/\S/.test(enteredTitle)) {
      enteredTitle = prompt('Enter a title for your drawing.');
    }

    else if (enteredTitle == null) {
      return;
    }

    else {
      drawingTitle.value = enteredTitle;
      // Save new drawing title to localStorage
      saveData();
    }
  }

  // Set download URL to data URI of drawing and file name to drawing title
  document.getElementById('download-link').href = drawingCanvas.toDataURL();
  document.getElementById('download-link').download = drawingTitle.value;

  return;
}
