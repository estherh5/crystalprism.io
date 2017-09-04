// Define variables
var logout = document.getElementById('logout');
var submit = document.getElementById('submit');
var usernameInput = document.getElementById('username');
var passwordInput = document.getElementById('password');
var blanks = document.getElementById('blanks');
var credFail = document.getElementById('cred-fail');
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

function assessUsername() {
  var username = usernameInput.value;
  if (username.length == 0) {
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

function checkAccount() {
  var username = usernameInput.value;
  var password = passwordInput.value;
  if (!assessUsername() || !assessPassword()) {
    return;
  }
  return fetch(server + '/login', {
    method: 'GET',
    headers: {'Authorization': 'Basic ' + btoa(username + ':' + password)}
  }).then(function (response) {
    if (response.status != 200) {
      $(credFail).modal('show');
      usernameInput.value = '';
      passwordInput.value = '';
      return;
    }
    if (response.status == 200) {
      response.json().then(function (json_token) {
        localStorage.setItem('cpusername', username);
        localStorage.setItem('cptoken', json_token['token']);
        if (sessionStorage.getItem('cppreviouswindow') != null) {
          window.location = sessionStorage.getItem('cppreviouswindow');
          sessionStorage.removeItem('cppreviouswindow');
        } else {
          window.location = '../my-account/index.html';
        }
      })
    }
  })
}
