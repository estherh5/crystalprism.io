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
var brushCircle;
var brushSVG;
var filename;
var server;
var enteredName;
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
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('cptoken')},
    method: 'GET',
  }).catch(function (error) {
    accountLink.innerHTML = 'Create Account';
    signInLink.innerHTML = 'Sign In';
    signInLink.onclick = function() {
      sessionStorage.setItem('cppreviouswindow', '../../canvashare/drawingapp/index.html');
    }
  }).then(function (response) {
    if (response.ok) {
      profileLink.innerHTML = localStorage.getItem('cpusername');
      profileLink.href = '../../user/index.html?username=' + localStorage.getItem('cpusername');
      accountLink.innerHTML = 'My Account';
      accountLink.href = '../../user/my-account/index.html';
      signInLink.innerHTML = 'Sign Out';
      signInLink.onclick = function() {
        sessionStorage.setItem('cprequest', 'logout');
      }
    } else {
      localStorage.removeItem('cpusername');
      localStorage.removeItem('cptoken');
      accountLink.innerHTML = 'Create Account';
      signInLink.innerHTML = 'Sign In';
      signInLink.onclick = function() {
        sessionStorage.setItem('cppreviouswindow', '../../canvashare/drawingapp/index.html');
      }
    }
  })
}

function setStage() {
  canvas = document.getElementById('canvas');
  context = canvas.getContext('2d');
  startingImage = new Image();
  startingImage.crossOrigin = 'Anonymous';
  filename = document.getElementById('file-name');
  if (sessionStorage.getItem('imageSrc') != null) {
    startingImage.src = sessionStorage.getItem('imageSrc');
    filename.value = '[title]';
  } else if (sessionStorage.getItem('imageSrc') == null && localStorage.getItem('imageSrc') != null) {
    startingImage.src = localStorage.getItem('imageSrc');
    filename.value = localStorage.getItem('imageName');
  } else {
    startingImage.src = '';
    filename.value = '[title]';
  }
  setTimeout(function() {
    context.drawImage(startingImage, 0, 0);
  }, 10);
  stageCanvas = new createjs.Stage(canvas);
  stageCanvas.autoClear = false;
  stageCanvas.enableDOMEvents(true);
  createjs.Touch.enable(stageCanvas);
  createjs.Ticker.setFPS(24);
  drawing = new createjs.Shape();
  stageCanvas.addEventListener('stagemousedown', whenMouseDown);
  stageCanvas.addEventListener('stagemouseup', whenMouseUp);
  stageCanvas.addEventListener('stagemouseup', saveData);
  stageCanvas.addChild(drawing);
  stageCanvas.update();
  stroke = 10;
  stagePalette = Snap('#current-palette');
  basic = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
  pastel = ['#FFE4E7', '#FFC5A7', '#FFF0A5', '#FFFFA9', '#D2FFC5', '#CFFEFF'];
  seashore = ['#594F4F', '#547980', '#45ADA8', '#9DE0AD', '#E5FCC2', '#F9EBC2'];
  bold = ['#00A0B0', '#6A4A3C', '#CC333F', '#EB6841', '#EDC951', '#A1AD1A'];
  oblique = ['#CA8484', '#FF3D7F', '#FF9E9D', '#8484CA', '#3FB8AF', '#7FC7AF'];
  contrast = ['#E3D1FF', '#CBE86B', '#F2E9E1', '#1C140D', '#F9ABAB', '#95D8E5'];
  calico = ['#F5F5C7', '#DCE9BE', '#555152', '#2E2633', '#99173C', '#46C2DD'];
  mauve = ['#413E4A', '#73626E', '#B38184', '#F0B49E', '#F7E4BE', '#BCE4BF'];
  currentPalette = basic;
  document.getElementById('palette-choices').onclick = updatePalette;
  currentPaint = stagePalette.circle('30%', '50%', '4%').attr({fill: currentPalette[0], 'data-color': currentPalette[0]}).node;
  for (var i = 1; i < currentPalette.length; i++) {
    paintChoice = currentPaint.cloneNode(true);
    paintChoice.setAttribute('cx', parseInt(currentPaint.getAttribute('cx')) + 8*i + '%');
    paintChoice.setAttribute('fill', currentPalette[i]);
    paintChoice.setAttribute('data-color', currentPalette[i]);
    stagePalette.append(paintChoice);
  }
  currentPaint.classList.add('chosen');
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
  if (!event.primary) { return; }
  oldPt = new createjs.Point(stageCanvas.mouseX, stageCanvas.mouseY);
  oldMidPt = oldPt.clone();
  drawing.graphics.clear().setStrokeStyle(stroke, 'round', 'round').beginStroke(currentPaint.dataset.color).moveTo(oldPt.x, oldPt.y).curveTo(oldPt.x - 1, oldPt.y, oldPt.x, oldPt.y);
  stageCanvas.update();
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
    stagePalette.node.innerHTML = '';
    clickedButton.classList.remove('clicked');
    clickedButton = e.target;
    clickedButton.classList.add('clicked');
    currentPalette = eval(clickedButton.dataset.palette);
    currentPaint.classList.remove('chosen');
    for (var i = 0; i < currentPalette.length; i++) {
      paintChoice = currentPaint.cloneNode(true);
      paintChoice.setAttribute('cx', parseInt(30 + 8*i) + '%');
      paintChoice.setAttribute('fill', currentPalette[i]);
      paintChoice.setAttribute('data-color', currentPalette[i]);
      stagePalette.append(paintChoice);
    }
    currentPaint = stagePalette.circle('30%', '50%', '4%').attr({fill: currentPalette[0], 'data-color': currentPalette[0]}).node;
    currentPaint.classList.add('chosen');
    updateBrush();
  }
}

function updatePaint(e) {
  if (e.target.nodeName == 'circle') {
    currentPaint.classList.remove('chosen');
    currentPaint = e.target;
    currentPaint.classList.add('chosen');
    updateBrush();
  }
}

function updateBrush() {
  brushCircle = document.getElementById('circle');
  brushCircle.style.fill = currentPaint.dataset.color;
  brushCircle.setAttribute('r', stroke/2);
  brushSVG = XMLS.serializeToString(document.getElementById('svg'));
  canvg(brushCanvas, brushSVG);
  canvas.style.cursor = 'url(' + brushCanvas.toDataURL() + ') ' + stroke + ' ' + stroke + ', auto';
}

function enterTitle(e) {
  if (filename.contains(e.target)) {
    if (filename.value == '[title]') {
      filename.value = '';
    }
  } else {
    if (filename.value == '') {
      filename.value = '[title]';
    }
  }
}

function clearImage() {
  stageCanvas.clear();
  sessionStorage.removeItem('imageName');
  sessionStorage.removeItem('imageSrc');
  localStorage.removeItem('imageSrc');
  localStorage.removeItem('imageName');
}

function postImage() {
  while (filename.value == '[title]' || filename.value == '') {
    enteredName = prompt('Enter a title for your drawing.');
    if (enteredName == '') {
      enteredName = prompt('Enter a title for your drawing.');
    } else if (enteredName == null) {
      return;
    } else {
      filename.value = enteredName;
    }
  }
  if (filename.value != '[title]' && filename.value != '' && filename.value != null) {
    if (localStorage.getItem('cptoken') == null) {
      window.alert('You must log in to create a post.');
    } else {
      data = {image: stageCanvas.toDataURL(), likes: '0', views: '0'};
      data = JSON.stringify(data);
      fetch(server + '/canvashare/drawing/' + localStorage.getItem('cpusername') + '/' + filename.value, {
        headers: {'Authorization': 'Bearer ' + localStorage.getItem('cptoken'), 'Content-Type': 'application/json'},
        method: 'POST',
        body: data,
      }).catch(function (error) {
        window.alert('Your post did not go through. Please try again soon.');
      }).then(function (response) {
        if (response.ok) {
          setTimeout(function () {
            localStorage.removeItem('imageSrc');
            localStorage.removeItem('imageName');
            window.location.href = '../index.html'
          }, 700);
        } else {
          window.alert('You must log in to create a post.');
        }
      })
    }
  }
}

function downloadImage(e) {
  while (filename.value == '[title]' || filename.value == '') {
    enteredName = prompt('Enter a title for your drawing.');
    if (enteredName == '') {
      enteredName = prompt('Enter a title for your drawing.');
    } else if (enteredName == null) {
      return;
    } else {
      filename.value = enteredName;
    }
  }
  if (filename.value != '[title]' && filename.value != '' && filename.value != null) {
    e.target.href = stageCanvas.toDataURL();
    e.target.download = filename.value;
  }
}

function saveData() {
  localStorage.setItem('imageSrc', stageCanvas.toDataURL());
  localStorage.setItem('imageName', filename.value);
}
