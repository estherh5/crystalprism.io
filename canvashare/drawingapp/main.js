// Define variables
var canvas;
var context;
var startingImage;
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
var brushCanvas;
var ctx;
var XMLS;
var brushCursor;
var brushSVG;
var drawingTitle;
var server;
var enteredTitle;
var data;
if (window.location.hostname == 'crystalprism.io') {
  server = 'http://13.58.175.191/api';
} else {
  server = 'http://localhost:5000/api';
}

// Define functions
function checkAccountStatus() {
  var profileLink = document.getElementById('profile-link');
  var accountLink = document.getElementById('account-link');
  var signInLink = document.getElementById('sign-in-link');
  return fetch(server + '/user/verify', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
    method: 'GET',
  }).catch(function(error) {
    accountLink.innerHTML = 'Create Account';
    signInLink.innerHTML = 'Sign In';
    signInLink.onclick = function() {
      sessionStorage.setItem('previous-window', '../../canvashare/drawingapp/index.html');
    }
  }).then(function(response) {
    if (response.ok) {
      profileLink.innerHTML = localStorage.getItem('username');
      profileLink.href = '../../user/index.html?username=' + localStorage.getItem('username');
      accountLink.innerHTML = 'My Account';
      accountLink.href = '../../user/my-account/index.html';
      signInLink.innerHTML = 'Sign Out';
      signInLink.onclick = function() {
        sessionStorage.setItem('account-request', 'logout');
      }
    } else {
      localStorage.removeItem('username');
      localStorage.removeItem('token');
      accountLink.innerHTML = 'Create Account';
      signInLink.innerHTML = 'Sign In';
      signInLink.onclick = function() {
        sessionStorage.setItem('previous-window', '../../canvashare/drawingapp/index.html');
      }
    }
  })
}

function setStage() {
  canvas = document.getElementById('canvas');
  context = canvas.getContext('2d');
  startingImage = new Image();
  startingImage.crossOrigin = 'Anonymous';
  drawingTitle = document.getElementById('drawing-title');
  if (sessionStorage.getItem('drawing-source') != null) {
    startingImage.src = sessionStorage.getItem('drawing-source');
    drawingTitle.value = sessionStorage.getItem('drawing-title');
  } else {
    startingImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQCAYAAACAvzbMAAAFlElEQVR4nO3VMQ0AMAzAsPInvXLIM1WyEeTLPAAI5ncAADcZCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQLKMezedbhVKrAAAAAElFTkSuQmCC';
    drawingTitle.value = '[title]';
  }
  setTimeout(function() {
    context.drawImage(startingImage, 0, 0);
  }, 500);
  stageCanvas = new createjs.Stage(canvas);
  stageCanvas.autoClear = false;
  stageCanvas.enableDOMEvents(true);
  createjs.Touch.enable(stageCanvas);
  createjs.Ticker.setFPS(24);
  drawing = new createjs.Shape();
  stageCanvas.addEventListener('stagemousedown', whenMouseDown);
  stageCanvas.addEventListener('stagemouseup', whenMouseUp);
  stageCanvas.addEventListener('stagemouseup', saveData);
  drawingTitle.onkeyup = saveData;
  stageCanvas.addChild(drawing);
  stageCanvas.update();
  stroke = 10;
  stagePalette = Snap('#current-palette');
  basic = ['#ff0000', '#ffa500', '#ffff00', '#008000', '#0000ff', '#800080'];
  pastel = ['#ffe4e7', '#ffc5a7', '#fff0a5', '#ffffa9', '#d2ffc5', '#cffeff'];
  seashore = ['#594f4f', '#547980', '#45ada8', '#9de0ad', '#e5fcc2', '#f9ebc2'];
  bold = ['#00a0b0', '#6a4a3c', '#cc333f', '#eb6841', '#edc951', '#a1ad1a'];
  oblique = ['#ca8484', '#ff3d7f', '#ff9e9d', '#8484ca', '#3fb8af', '#7fc7af'];
  contrast = ['#e3d1ff', '#cbe86b', '#f2e9e1', '#1c140d', '#f9abab', '#95d8e5'];
  calico = ['#f5f5c7', '#dce9be', '#555152', '#2e2633', '#99173c', '#46c2dd'];
  mauve = ['#413e4a', '#73626e', '#b38184', '#f0b49e', '#f7e4be', '#bce4bf'];
  grayscale = ['#ffffff', '#999999', '#666666', '#333333', '#111111', '#000000'];
  currentPalette = basic;
  document.getElementById('palette-options').onclick = updatePalette;
  currentPaint = stagePalette.circle('30%', '50%', '4%').attr({fill: currentPalette[0], 'data-color': currentPalette[0]}).node;
  for (var i = 1; i < currentPalette.length; i++) {
    paintChoice = currentPaint.cloneNode(true);
    paintChoice.setAttribute('cx', parseInt(currentPaint.getAttribute('cx')) + 8*i + '%');
    paintChoice.setAttribute('fill', currentPalette[i]);
    paintChoice.setAttribute('data-color', currentPalette[i]);
    stagePalette.append(paintChoice);
  }
  currentPaint.classList.add('clicked');
  document.getElementById('current-palette').onclick = updatePaint;
  clickedButton = document.getElementsByTagName('button')[0];
  clickedButton.classList.add('clicked');
  brushCanvas = document.getElementById('brush');
  ctx = brushCanvas.getContext('2d');
  XMLS = new XMLSerializer();
  updateBrush();
  window.onclick = enterTitle;
  document.getElementById('clear').onclick = clearImage;
  document.getElementById('post').onclick = postImage;
  document.getElementById('download').onclick = downloadImage;
}

function whenMouseDown(event) {
  if (!event.primary) {
    return;
  }
  oldPt = new createjs.Point(stageCanvas.mouseX, stageCanvas.mouseY);
  oldMidPt = oldPt.clone();
  drawing.graphics.clear().setStrokeStyle(stroke, 'round', 'round').beginStroke(currentPaint.dataset.color).moveTo(oldPt.x, oldPt.y).curveTo(oldPt.x - 1, oldPt.y, oldPt.x, oldPt.y);
  stageCanvas.update();
  stageCanvas.addEventListener('stagemousemove', whenMouseMove);
}

function whenMouseMove(event) {
  if (!event.primary) {
    return;
  }
  var midPt = new createjs.Point(oldPt.x + stageCanvas.mouseX >> 1, oldPt.y + stageCanvas.mouseY >> 1);
  drawing.graphics.clear().setStrokeStyle(stroke, 'round', 'round').beginStroke(currentPaint.dataset.color).moveTo(midPt.x, midPt.y).curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);
  oldPt.x = stageCanvas.mouseX;
  oldPt.y = stageCanvas.mouseY;
  oldMidPt.x = midPt.x;
  oldMidPt.y = midPt.y;
  stageCanvas.update();
}

function whenMouseUp(event) {
  if (!event.primary) {
    return;
  }
  stageCanvas.removeEventListener('stagemousemove', whenMouseMove);
}

function updatePalette(e) {
  if (e.target.nodeName.toLowerCase() == 'button') {
    stagePalette.node.innerHTML = '';
    clickedButton.classList.remove('clicked');
    clickedButton = e.target;
    clickedButton.classList.add('clicked');
    currentPalette = eval(clickedButton.dataset.palette);
    currentPaint.classList.remove('clicked');
    for (var i = 0; i < currentPalette.length; i++) {
      paintChoice = currentPaint.cloneNode(true);
      paintChoice.setAttribute('cx', parseInt(30 + 8*i) + '%');
      paintChoice.setAttribute('fill', currentPalette[i]);
      paintChoice.setAttribute('data-color', currentPalette[i]);
      if (currentPalette[i] == '#ffffff') {
        paintChoice.classList.add('outline');
      }
      stagePalette.append(paintChoice);
    }
    currentPaint = stagePalette.circle('30%', '50%', '4%').attr({fill: currentPalette[0], 'data-color': currentPalette[0]}).node;
    currentPaint.classList.add('clicked');
    updateBrush();
  }
}

function updatePaint(e) {
  if (e.target.nodeName.toLowerCase() == 'circle') {
    currentPaint.classList.remove('clicked');
    currentPaint = e.target;
    currentPaint.classList.add('clicked');
    updateBrush();
  }
}

function updateBrush() {
  brushCursor = document.getElementById('brush-cursor');
  brushCursor.setAttribute('fill', currentPaint.dataset.color);
  brushCursor.setAttribute('r', stroke/2);
  brushSVG = XMLS.serializeToString(document.getElementById('brush-svg'));
  canvg(brushCanvas, brushSVG);
  canvas.style.cursor = '';
  canvas.style.cursor = 'url(' + brushCanvas.toDataURL() + ') ' + stroke + ' ' + stroke + ', auto';
}

function enterTitle(e) {
  if (drawingTitle.contains(e.target)) {
    if (drawingTitle.value == '[title]') {
      drawingTitle.value = '';
    }
  } else {
    if (drawingTitle.value == '' || !/\S/.test(drawingTitle.value)) {
      drawingTitle.value = '[title]';
    }
  }
}

function clearImage() {
  stageCanvas.clear();
  startingImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQCAYAAACAvzbMAAAFlElEQVR4nO3VMQ0AMAzAsPInvXLIM1WyEeTLPAAI5ncAADcZCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQLKMezedbhVKrAAAAAElFTkSuQmCC';
  context.drawImage(startingImage, 0, 0);
  drawingTitle.value = '[title]';
  sessionStorage.removeItem('drawing-title');
  sessionStorage.removeItem('drawing-source');
  localStorage.removeItem('drawing-source');
  localStorage.removeItem('drawing-title');
}

function postImage() {
  while (drawingTitle.value == '[title]' || drawingTitle.value == '' || !/\S/.test(drawingTitle.value)) {
    enteredTitle = prompt('Enter a title for your drawing.');
    if (enteredTitle == '[title]' || enteredTitle == '' || !/\S/.test(enteredTitle)) {
      enteredTitle = prompt('Enter a title for your drawing.');
    } else if (enteredTitle == null) {
      return;
    } else {
      drawingTitle.value = enteredTitle;
    }
  }
  while (drawingTitle.value.indexOf('`') != -1) {
    window.alert('Your title cannot contain "`" characters.');
    return;
  }
  while (startingImage.src == 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQCAYAAACAvzbMAAAFlElEQVR4nO3VMQ0AMAzAsPInvXLIM1WyEeTLPAAI5ncAADcZCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQGAgAiYEAkBgIAImBAJAYCACJgQCQLKMezedbhVKrAAAAAElFTkSuQmCC') {
    window.alert('Your drawing cannot be blank.');
    return;
  }
  if (drawingTitle.value != '[title]' && drawingTitle.value != '' && drawingTitle.value != null && /\S/.test(drawingTitle.value)) {
    if (localStorage.getItem('token') == null) {
      window.alert('You must log in to post your drawing to the gallery.');
    } else {
      data = {'drawing': stageCanvas.toDataURL()};
      data = JSON.stringify(data);
      fetch(server + '/canvashare/drawing/' + localStorage.getItem('username') + '/' + drawingTitle.value, {
        headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json'},
        method: 'POST',
        body: data,
      }).catch(function(error) {
        window.alert('Your drawing did not get posted. Please try again soon.');
      }).then(function(response) {
        if (response.ok) {
          setTimeout(function() {
            clearImage();
            window.location.href = '../index.html'
          }, 700);
        } else {
          window.alert('You must log in to post your drawing to the gallery.');
        }
      })
    }
  }
}

function downloadImage(e) {
  while (drawingTitle.value == '[title]' || drawingTitle.value == '') {
    enteredTitle = prompt('Enter a title for your drawing.');
    if (enteredTitle == '') {
      enteredTitle = prompt('Enter a title for your drawing.');
    } else if (enteredTitle == null) {
      return;
    } else {
      drawingTitle.value = enteredTitle;
    }
  }
  while (drawingTitle.value.indexOf('`') != -1) {
    window.alert('Your title cannot contain "`" characters.');
    return;
  }
  if (drawingTitle.value != '[title]' && drawingTitle.value != '' && drawingTitle.value != null) {
    document.getElementById('download-link').href = stageCanvas.toDataURL();
    document.getElementById('download-link').download = drawingTitle.value;
  }
}

function saveData() {
  sessionStorage.setItem('drawing-source', stageCanvas.toDataURL());
  sessionStorage.setItem('drawing-title', drawingTitle.value);
  localStorage.setItem('drawing-source', stageCanvas.toDataURL());
  localStorage.setItem('drawing-title', drawingTitle.value);
}
