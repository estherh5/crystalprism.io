// Define variables
var usernameInput = document.getElementById('username');
var passwordInput = document.getElementById('password');
var confirmPasswordInput = document.getElementById('confirm-password');
var submit = document.getElementById('submit');
var retry = document.getElementById('retry');
var retryTitle = document.getElementById('retry-title');
if (window.location.hostname == 'crystalprism.io') {
  var server = 'http://13.58.175.191/api';
} else {
  var server = 'http://localhost:5000/api';
}

// Define events
usernameInput.onfocusout = assessUsername;
passwordInput.onfocusout = assessPassword;
confirmPasswordInput.onfocusout = assessPasswordMatch;
submit.onclick = createAccount;

// Define functions
$(function () {
  $('[data-toggle="tooltip"]').tooltip();
})

function assessUsername() {
  var username = usernameInput.value;
  if (username.length == 0) {
    document.getElementById('user-warning-two').style.display = 'none';
    document.getElementById('user-warning-one').style.display = 'block';
    return false;
  }
  if (!username.match(/^[a-zA-Z0-9_-]+$/)) {
    document.getElementById('user-warning-one').style.display = 'none';
    document.getElementById('user-warning-two').style.display = 'block';
    return false;
  }
  document.getElementById('user-warning-one').style.display = 'none';
  document.getElementById('user-warning-two').style.display = 'none';
  return true;
}

function assessPassword() {
  var password = passwordInput.value;
  if (password.length == 0) {
    document.getElementById('pass-warning-two').style.display = 'none';
    document.getElementById('pass-warning-one').style.display = 'block';
    return false;
  }
  if (password.length < 8) {
    document.getElementById('pass-warning-one').style.display = 'none';
    document.getElementById('pass-warning-two').style.display = 'block';
    return false;
  }
  document.getElementById('pass-warning-one').style.display = 'none';
  document.getElementById('pass-warning-two').style.display = 'none';
  return true;
}

function assessPasswordMatch() {
  var password = passwordInput.value;
  var confirmPassword = confirmPasswordInput.value;
  if (password != confirmPassword) {
    document.getElementById('pass-warning-three').style.display = 'block';
    return false;
  }
  document.getElementById('pass-warning-three').style.display = 'none';
  return true;
}

function createAccount() {
  var username = usernameInput.value;
  var password = passwordInput.value;
  if (!assessUsername() || !assessPassword() || !assessPasswordMatch()) {
    return;
  } else {
    var data = {'username': username, 'password': password};
    data = JSON.stringify(data);
    return fetch(server + '/user', {
      headers: {'Content-Type': 'application/json'},
      method: 'POST',
      body: data,
    }).then(function(response) {
      response.text().then(function (text) {
        if (text == 'Username already exists') {
          $(retry).modal('show');
          retryTitle.innerHTML = 'Username "' + username + '" already exists';
        } else if (text == 'Success') {
          return fetch(server + '/login', {
            method: 'GET',
            headers: {'Authorization': 'Basic ' + btoa(username + ':' + password)}
          }).then(function (response) {
            if (response.status == 200) {
              response.json().then(function (json_token) {
                localStorage.setItem('cpusername', username);
                localStorage.setItem('cptoken', json_token['token']);
                sessionStorage.setItem('cprequest', 'createaccount');
                window.location = '../my-account/index.html';
              })
            }
          })
        }
      })
    })
  }
}
