// Define variables
var logout = document.getElementById('logout');
var submit = document.getElementById('submit');
var usernameInput = document.getElementById('username');
var passwordInput = document.getElementById('password');
var blanks = document.getElementById('blanks');
var userFail = document.getElementById('user-fail');
var userFailTitle = document.getElementById('user-fail-title');
var passwordFail = document.getElementById('password-fail');
var success = document.getElementById('success');
var successTitle = document.getElementById('success-title');
if (window.location.hostname == 'crystalprism.io') {
  var server = 'http://13.58.175.191/api';
} else {
  var server = 'http://localhost:5000/api';
}

// Define events
submit.onclick = checkAccount;

// Define functions
function displayLogout() {
  if (sessionStorage.getItem('cprequest') == 'logout') {
    $(logout).modal('show');
    localStorage.removeItem('cpusername');
    localStorage.removeItem('cptoken');
    sessionStorage.removeItem('cprequest');
  }
}

function checkAccount() {
  var username = usernameInput.value.toLowerCase();
  var password = passwordInput.value;
  if (username == '' || password == '') {
    $(blanks).modal('show');
    return;
  }
  return fetch(server + '/login', {
    method: 'GET',
    headers: {'Authorization': 'Basic ' + btoa(username + ':' + password)}
  }).then(function (response) {
    if (response.status == 400) {
      response.text().then(function (text) {
        if (text == 'Username does not exist') {
          $(userFail).modal('show');
          userFailTitle.innerHTML = 'Username "' + username + '" does not exist';
          usernameInput.value = '';
          passwordInput.value = '';
          return;
        }
        if (text == 'Incorrect password') {
          $(passwordFail).modal('show');
          usernameInput.value = '';
          passwordInput.value = '';
          return;
        }
      })
    }
    if (response.status == 200) {
      response.json().then(function (json_token) {
        localStorage.setItem('cpusername', username);
        localStorage.setItem('cptoken', json_token['token']);
        $(success).modal('show');
        successTitle.innerHTML = username.toLowerCase();
        setTimeout(function() {
          window.location = '../my-account/index.html';
        }, 3000);
      })
    }
  })
}
