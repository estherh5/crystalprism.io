// Define game settings
var stylesheet = document.getElementById('stylesheet');
var mobile = false;
var sizeX = document.getElementById('game').offsetWidth;
var sizeY = document.getElementById('game').offsetHeight;
var scale = 60;
var speed = 200;
var hours = 0;
var minutes = 0;
var seconds = 0;
var systolic = 100;
var diastolic = 70;
var direction = '';
var xDown = null;
var yDown = null;
var name = '';
var relievers = [Snap('#bicycle'), Snap('#yoga'), Snap('#fruit'), Snap('#pill')];
var stressors = [Snap('#alcohol'), Snap('#salt'), Snap('#cigarette'), Snap('#stress')];
var heartbeat = new Howl({
  src: ['sounds/heartbeat.m4a'],
  loop: true,
});
if (window.location.hostname == 'crystalprism.io') {
  var server = 'http://13.58.175.191/api';
} else {
  var server = 'http://localhost:5000/api';
}

// Define game pieces
var profileLink = document.getElementById('profile-link');
var accountLink = document.getElementById('account-link');
var signInLink = document.getElementById('sign-in-link');
var anonymous = document.getElementById('anonymous');
var loggedIn = document.getElementById('logged-in');
var canvas = Snap('#canvas');
var heart = Snap('#heart').attr({fill: '#56d056', 'x': 0, 'y': 0, width: scale, height: scale});
canvas.append(heart);
var game = document.getElementById('game');
var startScreenDesktop = document.getElementById('start-screen-desktop');
var startScreenMobile = document.getElementById('start-screen-mobile');
var pauseScreenDesktop = document.getElementById('pause-screen-desktop');
var pauseScreenMobile = document.getElementById('pause-screen-mobile');
var infoScreen = document.getElementById('information-screen');
var leaderScreen = document.getElementById('leader-screen');
var gameOverScreen = document.getElementById('game-over-screen');
var nameInput = document.getElementById('name-input');
var submit = document.getElementById('submit');
var retry = document.getElementById('retry');
var reliever = place(relievers);
var stressor = place(stressors);
var systolicText = document.getElementById('systolic');
var diastolicText = document.getElementById('diastolic');
var lifespan = document.getElementById('lifespan');
var leaders = document.getElementsByClassName('leaders');
var leadersMobile = document.getElementsByClassName('leaders-mobile');

// Define game states
function readyToStart() {
  if ((startScreenMobile.style.visibility == 'visible' || startScreenDesktop.style.visibility == 'visible') && (infoScreen.style.visibility != 'visible' && leaderScreen.style.visibility != 'visible')) {
    return true;
  }
}

function paused() {
  if (pauseScreenDesktop.style.visibility == 'visible' || pauseScreenMobile.style.visibility == 'visible' || infoScreen.style.visibility == 'visible' || leaderScreen.style.visibility == 'visible') {
    return true;
  }
}

function gameOver() {
  if (gameOverScreen.style.visibility == 'visible') {
    return true;
  }
}

// Define events
window.mobileStyle = function() {
  (function(a) {if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) mobile = true;})(navigator.userAgent||navigator.vendor||window.opera);
  if (mobile) {
    stylesheet.href = 'style-mobile.css';
    startScreenMobile.style.visibility = 'visible';
    startScreenDesktop.style.visibility = 'hidden';
  } else {
    startScreenDesktop.style.visibility = 'visible';
    startScreenMobile.style.visibility = 'hidden';
  }
  return mobile;
};

document.body.onkeydown = function(e) {
  if (e.key == ' ') {
    e.preventDefault();
    if (gameOver() || readyToStart()) {
      return;
    } else {
      if (paused()) {
        resume();
      } else {
        pause();
      }
    }
  } else if (e.key == 'ArrowUp' || e.key == 'ArrowDown' || e.key == 'ArrowRight' || e.key == 'ArrowLeft') {
    e.preventDefault();
    direction = e.key;
    if (readyToStart() || paused()) {
      resume();
    }
  }
}

game.addEventListener('touchstart', function(e) {
  e.preventDefault();
  xDown = e.touches[0].clientX;
  yDown = e.touches[0].clientY;
}, false);

game.addEventListener('touchmove', function(e) {
  e.preventDefault();
  if (!xDown || !yDown) {
    return;
  }
  var xUp = e.touches[0].clientX;
  var yUp = e.touches[0].clientY;
  var xDiff = xDown - xUp;
  var yDiff = yDown - yUp;
  if (Math.abs(xDiff) > Math.abs(yDiff)) {
    if (xDiff > 0) {
      direction = 'ArrowLeft';
    } else {
      direction = 'ArrowRight';
    }
  } else if (yDiff > 0) {
    direction = 'ArrowUp';
  } else {
    direction = 'ArrowDown';
  }
  if (readyToStart() || paused()) {
    resume();
  }
  xDown = null;
  yDown = null;
}, false);

document.getElementById('pause').onclick = function() {
  if (gameOver() || readyToStart()) {
    return;
  } else {
    if (paused()) {
      resume();
    } else {
      pause();
    }
  }
}

document.getElementById('restart').onclick = function() {
  if (gameOver() || readyToStart()) {
    return;
  }
  reset();
}

document.getElementById('display-info-desktop').onclick = displayInfo;

document.getElementById('display-info-mobile').onclick = displayInfo;

document.getElementById('display-leaders').onclick = displayLeaders;

document.getElementById('info-close').onclick = displayInfo;

document.getElementById('leader-close').onclick = displayLeaders;

document.getElementById('sound').onclick = toggleSound;

nameInput.oninput = function() {
  if (nameInput.value == '') {
    submit.classList.add('inactive');
  } else {
    submit.classList.remove('inactive');
  }
}

submit.onclick = function() {
  if (nameInput.value == '') {
    return;
  } else if (mobile) {
    updateLeaderboard();
    leaderScreen.style.visibility = 'visible';
    reset();
  } else {
    updateLeaderboard();
    reset();
  }
}

retry.onclick = reset;

// Game loop
function gameLoop() {
  setTimeout(gameLoop, speed);
  sizeX = document.getElementById('game').offsetWidth;
  sizeY = document.getElementById('game').offsetHeight;
  if (readyToStart() || paused() || gameOver()) {
    return;
  } else {
    move(heart, direction);
    didCollide(heart, reliever, relieveHeart);
    didCollide(stressor, reliever, replaceReliever);
    didCollide(heart, stressor, stressHeart);
  }
  lifespan.innerHTML = 'Lifespan: ' + ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2);
}

setTimeout(gameLoop, speed);

setTimeout(moveStressor, speed * 1.5)

setInterval(getHours, 3600000);

setInterval(getMinutes, 60000);

setInterval(getSeconds, 1000);

// Define game functions
function checkAccountStatus() {
  return fetch(server + '/user/verify', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
    method: 'GET',
  }).catch(function(error) {
    accountLink.innerHTML = 'Create Account';
    signInLink.innerHTML = 'Sign In';
    signInLink.onclick = function() {
      sessionStorage.setItem('previous-window', '../../rhythm-of-life/index.html');
    }
    anonymous.style.display = 'block';
    loggedIn.style.display = 'none';
  }).then(function(response) {
    if (response.ok) {
      profileLink.innerHTML = localStorage.getItem('username');
      profileLink.href = '../user/index.html?username=' + localStorage.getItem('username');
      accountLink.innerHTML = 'My Account';
      accountLink.href = '../user/my-account/index.html';
      signInLink.innerHTML = 'Sign Out';
      signInLink.onclick = function() {
        sessionStorage.setItem('account-request', 'logout');
      }
      anonymous.style.display = 'none';
      loggedIn.style.display = 'block';
    } else {
      localStorage.removeItem('username');
      localStorage.removeItem('token');
      accountLink.innerHTML = 'Create Account';
      signInLink.innerHTML = 'Sign In';
      signInLink.onclick = function() {
        sessionStorage.setItem('previous-window', '../../rhythm-of-life/index.html');
      }
      anonymous.style.display = 'block';
      loggedIn.style.display = 'none';
    }
  })
}

function getLeaders() {
  return fetch(server + '/rhythm-of-life').then(function(response) {
    response.json().then(function(leadersList) {
      for (var i = 0; i < leadersList.length; i++) {
        var tableContainerOne = document.createElement('td');
        var tableContainerTwo = document.createElement('td');
        leaders[i].innerHTML = '';
        leaders[i].append(tableContainerOne);
        tableContainerOne.append(document.createTextNode(leadersList[i].lifespan));
        leaders[i].append(tableContainerTwo);
        if (leadersList[i].status == 'user') {
          var userLink = document.createElement('a');
          userLink.href = '../user/index.html?username=' + leadersList[i].name;
          userLink.append(document.createTextNode(leadersList[i].name));
          tableContainerTwo.append(userLink);
        } else {
          tableContainerTwo.append(document.createTextNode(leadersList[i].name));
        }
      }
      for (var i = 0; i < leadersList.length; i++) {
        var tableContainerOne = document.createElement('td');
        var tableContainerTwo = document.createElement('td');
        leadersMobile[i].innerHTML = '';
        leadersMobile[i].append(tableContainerOne);
        tableContainerOne.append(document.createTextNode(leadersList[i].lifespan));
        leadersMobile[i].append(tableContainerTwo);
        if (leadersList[i].status == 'user') {
          var userLink = document.createElement('a');
          userLink.href = '../user/index.html?username=' + leadersList[i].name;
          userLink.append(document.createTextNode(leadersList[i].name));
          tableContainerTwo.append(userLink);
        } else {
          tableContainerTwo.append(document.createTextNode(leadersList[i].name));
        }
      }
    })
  })
}

function place(objs) {
  randNum = Math.floor(Math.random() * 4);
  if (objs == relievers) {
    var obj = objs[randNum].clone();
    var ratioX = sizeX/scale;
    var ratioY = sizeY/scale;
  } else {
    var obj = objs[randNum].clone();
    var ratioX = sizeX/2/scale;
    var ratioY = sizeY/2/scale;
  }
  var randX = Math.floor(ratioX * Math.random()) * scale;
  var randY = Math.floor(ratioY * Math.random()) * scale;
  obj.attr({'x': randX, 'y': randY, width: scale, height: scale});
  canvas.append(obj);
  return obj;
}

function resume() {
  if (mobile) {
    startScreenMobile.style.visibility = 'hidden';
    pauseScreenMobile.style.visibility = 'hidden';
  } else {
    startScreenDesktop.style.visibility = 'hidden';
    pauseScreenDesktop.style.visibility = 'hidden';
  }
  infoScreen.style.visibility = 'hidden';
  leaderScreen.style.visibility = 'hidden';
  heartbeat.play();
  document.getElementById('pause').innerHTML = 'Pause';
}

function pause() {
  if (mobile) {
    pauseScreenMobile.style.visibility = 'visible';
  } else {
    pauseScreenDesktop.style.visibility = 'visible';
  }
  heartbeat.stop();
  document.getElementById('pause').innerHTML = 'Resume';
}

function reset() {
  hours = 0;
  minutes = 0;
  seconds = 0;
  systolic = 100;
  diastolic = 70;
  speed = 200;
  systolicText.innerHTML = systolic;
  diastolicText.innerHTML = diastolic;
  lifespan.innerHTML = 'Lifespan: ' + ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2);
  systolicText.style.color = '#56d056';
  diastolicText.style.color = '#56d056';
  heart.attr({'x': 0, 'y': 0, fill: '#56d056'});
  stressor.remove();
  stressor = place(stressors);
  reliever.remove();
  reliever = place(relievers);
  gameOverScreen.style.visibility = 'hidden';
  infoScreen.style.visibility = 'hidden';
  if (mobile) {
    pauseScreenMobile.style.visibility = 'hidden';
    startScreenMobile.style.visibility = 'visible';
    document.getElementById('display-info-mobile').classList.remove('inactive');
  } else {
    pauseScreenDesktop.style.visibility = 'hidden';
    startScreenDesktop.style.visibility = 'visible';
    document.getElementById('display-info-desktop').classList.remove('inactive');
  }
  nameInput.value = '';
  document.getElementById('pause').innerHTML = 'Pause';
  document.getElementById('pause').classList.remove('inactive');
  document.getElementById('restart').classList.remove('inactive');
  document.getElementById('display-leaders').classList.remove('inactive');
  heartbeat.stop();
}

function displayInfo() {
  if (gameOver()) {
    return;
  } else if ((startScreenDesktop.style.visibility == 'visible' || startScreenMobile.style.visibility == 'true') && infoScreen.style.visibility == 'visible') {
    infoScreen.style.visibility = 'hidden';
    leaderScreen.style.visibility = 'hidden';
    return;
  } else if (readyToStart()) {
    infoScreen.style.visibility = 'visible';
    leaderScreen.style.visibility = 'hidden';
    return;
  } else if (paused()) {
    infoScreen.style.visibility = 'hidden';
    leaderScreen.style.visibility = 'hidden';
    resume();
    return;
  } else {
    if (mobile) {
      pauseScreenMobile.style.visibility = 'hidden';
    } else {
      pauseScreenDesktop.style.visibility = 'hidden';
    }
    infoScreen.style.visibility = 'visible';
    leaderScreen.style.visibility = 'hidden';
    heartbeat.stop();
    document.getElementById('pause').innerHTML = 'Resume';
  }
}

function displayLeaders() {
  if (gameOver()) {
    return;
  } else if (readyToStart() && leaderScreen.style.visibility == 'visible') {
    leaderScreen.style.visibility = 'hidden';
    infoScreen.style.visibility = 'hidden';
  } else if (paused() && leaderScreen.style.visibility == 'visible') {
    leaderScreen.style.visibility = 'hidden';
    infoScreen.style.visibility = 'hidden';
    resume();
  } else if (readyToStart()) {
    leaderScreen.style.visibility = 'visible';
    infoScreen.style.visibility = 'hidden';
  } else {
    if (mobile) {
      pauseScreenMobile.style.visibility = 'hidden';
    } else {
      pauseScreenDesktop.style.visibility = 'hidden';
    }
    leaderScreen.style.visibility = 'visible';
    infoScreen.style.visibility = 'hidden';
    heartbeat.stop();
    document.getElementById('pause').innerHTML = 'Resume';
  }
}

function move(obj, direction) {
  var possibleDirections = {
    'ArrowUp': {'y': parseFloat(obj.attr('y')) - scale},
    'ArrowDown': {'y': parseFloat(obj.attr('y')) + scale},
    'ArrowRight': {'x': parseFloat(obj.attr('x')) + scale},
    'ArrowLeft' : {'x': parseFloat(obj.attr('x')) - scale},
  };
  if (possibleDirections[direction] === undefined) {
    return null;
  }
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

function moveStressor() {
  setTimeout(moveStressor, speed * 1.5);
  if (readyToStart() || paused() || gameOver()) {
    return;
  } else {
    if (parseFloat(heart.attr('x')) < parseFloat(stressor.attr('x'))) {
      move(stressor, 'ArrowLeft');
    } else if (parseFloat(heart.attr('x')) > parseFloat(stressor.attr('x'))) {
      move(stressor, 'ArrowRight');
    } else {
      if (parseFloat(heart.attr('y')) < parseFloat(stressor.attr('y'))) {
        move(stressor, 'ArrowUp');
      } else {
        move(stressor, 'ArrowDown');
      }
    }
  }
}

function didCollide(objA, objB, action) {
  if (objA.attr('x') == objB.attr('x') && objA.attr('y') == objB.attr('y')) {
    action();
    setHeartAttr();
  }
  return false;
}

function setHeartAttr() {
  if (systolic < 120 && diastolic < 80) {
    systolicText.style.color = '#56d056';
    diastolicText.style.color = '#56d056';
    heart.attr({fill: '#56d056'});
    heartbeat.rate(1.0);
  }
  if (systolic >= 120 && systolic < 140) {
    systolicText.style.color = '#ffff00';
  }
  if (diastolic >= 80 && diastolic < 90) {
    diastolicText.style.color = '#ffff00';
  }
  if (systolic >= 120 && systolic < 140 || diastolic >= 80 && diastolic < 90) {
    heart.attr({fill: '#ffff00'});
    heartbeat.rate(1.3);
  }
  if (systolic >= 140 && systolic < 160) {
    systolicText.style.color = '#ffc107';
  }
  if (diastolic >= 90 && diastolic < 100) {
    diastolicText.style.color = '#ffc107';
  }
  if (systolic >= 140 && systolic < 160 || diastolic >= 90 && diastolic < 100) {
    heart.attr({fill: '#ffc107'});
    heartbeat.rate(1.6);
  }
  if (systolic >= 160) {
    systolicText.style.color = '#ff2020';
  }
  if (diastolic >= 100) {
    diastolicText.style.color = '#ff2020';
  }
  if (systolic >= 160 || diastolic >= 100) {
    heartbeat.rate(2.0);
    heart.attr({fill: '#ff2020'});
  }
  if (systolic > 160 || diastolic > 100) {
    systolicText.style.color = '#ff2020';
    diastolicText.style.color = '#ff2020';
    heart.attr({fill: '##ff2020'});
    gameOverScreen.style.visibility = 'visible';
    if (loggedIn.style.display != 'none') {
      updateLeaderboard();
    } else {
      submit.classList.add('inactive');
    }
    document.getElementById('pause').classList.add('inactive');
    document.getElementById('restart').classList.add('inactive');
    document.getElementById('display-info-desktop').classList.add('inactive');
    document.getElementById('display-info-mobile').classList.add('inactive');
    document.getElementById('display-leaders').classList.add('inactive');
    heartbeat.stop();
  }
  systolicText.innerHTML = systolic;
  diastolicText.innerHTML = diastolic;
}

function relieveHeart() {
  reliever.remove();
  reliever = place(relievers);
  if (systolic > 100) {
    systolic = systolic - 2;
  }
  if (diastolic > 70) {
    diastolic--;
  }
  if (speed < 200) {
    speed *= 1.01;
  }
}

function replaceReliever() {
  reliever.remove();
  reliever = place(relievers);
  speed /= 1.03;
}

function stressHeart() {
  systolic += 4;
  diastolic += 2;
  stressor.remove();
  stressor = place(stressors);
  speed /= 1.03;
}

function getHours() {
  if (readyToStart() || paused() || gameOver()) {
    return;
  } else {
    hours++;
  }
}

function getMinutes() {
  if (readyToStart() || paused() || gameOver()) {
    return;
  } else if (minutes < 59) {
    minutes++;
  } else if (minutes >= 59) {
    minutes = 0;
  }
}

function getSeconds() {
  if (readyToStart() || paused() || gameOver()) {
    return;
  } else if (seconds < 59) {
    seconds++;
  } else if (seconds >= 59) {
    seconds = 0;
  }
}

function updateLeaderboard() {
  if (loggedIn.style.display == 'none') {
    name = nameInput.value;
    var entry = {
      score: hours * 3600 + minutes * 60 + seconds,
      lifespan: ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2),
      name: name,
      status: 'anonymous',
    };
    data = JSON.stringify(entry);
    fetch(server + '/rhythm-of-life', {
      headers: {'Content-Type': 'application/json'},
      method: 'POST',
      body: data,
    })
  } else if (loggedIn.style.display != 'none') {
    var entry = {
      score: hours * 3600 + minutes * 60 + seconds,
      lifespan: ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2),
      status: 'user',
    };
    data = JSON.stringify(entry);
    fetch(server + '/rhythm-of-life', {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json'},
      method: 'POST',
      body: data,
    })
  }
  setTimeout(getLeaders, 500);
}

function toggleSound() {
  if (heartbeat._muted) {
    heartbeat.mute(false);
    document.getElementById('sound').style.backgroundImage = 'url("images/on.png")';
  } else {
    heartbeat.mute(true);
    document.getElementById('sound').style.backgroundImage = 'url("images/off.png")';
  }
}
