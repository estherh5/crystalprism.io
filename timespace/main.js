// Define variables
var profileLink = document.getElementById('profile-link');
var accountLink = document.getElementById('account-link');
var signInLink = document.getElementById('sign-in-link');
var timeDisplay = document.getElementById('time');
var circleOne = document.getElementById('circle-one');
var circleTwo = document.getElementById('circle-two');
var circleThree = document.getElementById('circle-three');
var circleFour = document.getElementById('circle-four');
if (window.location.hostname == 'crystalprism.io') {
  var server = 'http://13.58.175.191/api';
} else {
  var server = 'http://localhost:5000/api';
}

// Define events
setInterval(everySecond, 1000);

// Define functions
function checkAccountStatus() {
  return fetch(server + '/user/verify', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
    method: 'GET',
  }).catch(function(error) {
    accountLink.innerHTML = 'Create Account';
    signInLink.innerHTML = 'Sign In';
    signInLink.onclick = function() {
      sessionStorage.setItem('previous-window', '../../timespace/index.html');
    }
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
    } else {
      localStorage.removeItem('username');
      localStorage.removeItem('token');
      accountLink.innerHTML = 'Create Account';
      signInLink.innerHTML = 'Sign In';
      signInLink.onclick = function() {
        sessionStorage.setItem('previous-window', '../../timespace/index.html');
      }
    }
  })
}

function everySecond() {
  var now = new Date();
  var time = now.getTime().toString();
  var circleOneColor = time.slice(-6);
  var circleTwoColor = time.slice(-7,-1);
  var circleThreeColor = time.slice(-8,-2);
  var circleFourColor = time.slice(-9,-3);
  var digitOne = time.slice(-1);
  var digitTwo = time.slice(-2,-1);
  var digitThree = time.slice(-3,-2);
  var digitFour = time.slice(-4,-3);
  var digitFive = time.slice(-5,-4);
  var hours = ('0' + now.getHours()).slice(-2);
  var minutes = ('0' + now.getMinutes()).slice(-2);
  var seconds = ('0' + now.getSeconds()).slice(-2);
  timeDisplay.innerHTML = hours + ':' + minutes + ':' + seconds;
  circleOne.style.bottom = digitTwo + digitFour + '.' + digitFour + '%';
  circleOne.style.right = digitFour + digitTwo + '.' + digitOne + '%';
  circleOne.style.backgroundColor = '#' + circleOneColor;
  circleTwo.style.top = digitThree + digitFour + '.' + digitTwo + '%';
  circleTwo.style.right = digitFour + digitFive + '.' + digitTwo + '%';
  circleTwo.style.backgroundColor = '#' + circleTwoColor;
  circleThree.style.bottom = digitFive + digitFour + '.' + digitThree + '%';
  circleThree.style.left = digitFour + digitTwo + '.' + digitFive + '%';
  circleThree.style.backgroundColor = '#' + circleThreeColor;
  circleFour.style.top = digitFour + digitOne + '.' + digitThree + '%';
  circleFour.style.left = digitOne + digitFour + '.' + digitThree + '%';
  circleFour.style.backgroundColor = '#' + circleFourColor;
}
