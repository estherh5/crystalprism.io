// Define variables
var logoutOkay = document.getElementById('logout-okay');
var usernameInput = document.getElementById('username-input');
var passwordInput = document.getElementById('password-input');
var submit = document.getElementById('submit');
var incorrectOkay = document.getElementById('incorrect-okay');
if (window.location.hostname == 'crystalprism.io') {
  var server = 'http://13.58.175.191/api';
} else {
  var server = 'http://localhost:5000/api';
}

// Define events
window.addEventListener('load', confirmLogout, false);

usernameInput.addEventListener('keyup', function(event) {
  // Call requestLogin function when enter key is pressed
  if (event.keyCode == 13) {
    event.preventDefault();
    requestLogin();
  }
}, false);

passwordInput.addEventListener('keyup', function(event) {
  // Call requestLogin function when enter key is pressed
  if (event.keyCode == 13) {
    event.preventDefault();
    requestLogin();
  }
}, false);

submit.onclick = requestLogin;

// Define functions
function confirmLogout() {
  if (sessionStorage.getItem('account-request') == 'logout') {
    $(logout).modal('show');
    logoutOkay.focus();
    localStorage.removeItem('username');
    localStorage.removeItem('token');
    sessionStorage.removeItem('account-request');
  }
}

function assessUsername() {
  var username = usernameInput.value;
  if (!/\S/.test(username)) {
    document.getElementById('user-warning').style.display = 'block';
    return false;
  }
  document.getElementById('user-warning').style.display = 'none';
  return true;
}

function assessPassword() {
  var password = passwordInput.value;
  if (password.length == 0) {
    document.getElementById('pass-warning').style.display = 'block';
    return false;
  }
  document.getElementById('pass-warning').style.display = 'none';
  return true;
}

function requestLogin() {
  var username = usernameInput.value;
  var password = passwordInput.value;
  if (!assessUsername() || !assessPassword()) {
    return;
  }
  return fetch(server + '/login', {
    method: 'GET',
    headers: {'Authorization': 'Basic ' + btoa(username + ':' + password)}
  }).catch(function(error) {
    window.alert('Your request did not go through. Please try again soon.');
  }).then(function(response) {
    if (response.status != 200) {
      $(incorrect).modal('show');
      incorrectOkay.focus();
      usernameInput.value = '';
      passwordInput.value = '';
      return;
    }
    if (response.status == 200) {
      response.json().then(function(json_token) {
        localStorage.removeItem('username');
        localStorage.setItem('username', username);
        localStorage.removeItem('token');
        localStorage.setItem('token', json_token['token']);
        if (sessionStorage.getItem('previous-window') != null) {
          window.location = sessionStorage.getItem('previous-window');
          sessionStorage.removeItem('previous-window');
        } else {
          window.location = '../my-account/index.html';
        }
      })
    }
  })
}
