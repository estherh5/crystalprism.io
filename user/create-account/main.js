// Define variables
var okay = document.getElementById('okay');
var usernameInput = document.getElementById('username-input');
var passwordInput = document.getElementById('password-input');
var confirmPasswordInput = document.getElementById('confirm-password-input');
var submit = document.getElementById('submit');
if (window.location.hostname == 'crystalprism.io') {
  var server = 'http://13.58.175.191/api';
} else {
  var server = 'http://localhost:5000/api';
}

// Define events
window.addEventListener('load', confirmDeletion, false);

confirmPasswordInput.addEventListener('keyup', function(event) {
  // Call createAccount function when enter key is pressed
  if (event.keyCode == 13) {
    event.preventDefault();
    createAccount();
  }
}, false);

passwordInput.onfocusout = assessPassword;
confirmPasswordInput.onfocusout = assessPasswordMatch;
submit.onclick = createAccount;

// Define functions
$(function() {
  $('[data-toggle="tooltip"]').tooltip();
})

function confirmDeletion() {
  if (sessionStorage.getItem('account-request') == 'delete') {
    $(deleted).modal('show');
    okay.focus();
    localStorage.removeItem('username');
    localStorage.removeItem('token');
    sessionStorage.removeItem('account-request');
  }
}

function assessUsername() {
  var username = usernameInput.value;
  if (!/\S/.test(username)) {
    document.getElementById('user-warning-two').style.display = 'none';
    document.getElementById('user-warning-three').style.display = 'none';
    document.getElementById('user-warning-one').style.display = 'block';
    return false;
  }
  if (!username.match(/^[a-zA-Z0-9_-]+$/)) {
    document.getElementById('user-warning-one').style.display = 'none';
    document.getElementById('user-warning-three').style.display = 'none';
    document.getElementById('user-warning-two').style.display = 'block';
    return false;
  }
  document.getElementById('user-warning-one').style.display = 'none';
  document.getElementById('user-warning-two').style.display = 'none';
  document.getElementById('user-warning-three').style.display = 'none';
  return true;
}

function assessPassword() {
  var password = passwordInput.value;
  if (!/\S/.test(password)) {
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
    }).catch(function(error) {
      window.alert('Your request did not go through. Please try again soon.');
    }).then(function(response) {
      response.text().then(function(text) {
        if (text == 'Username already exists') {
          document.getElementById('user-warning-three').style.display = 'block';
        } else if (text == 'Success') {
          return fetch(server + '/login', {
            method: 'GET',
            headers: {'Authorization': 'Basic ' + btoa(username + ':' + password)}
          }).then(function(response) {
            if (response.status == 200) {
              response.json().then(function(json_token) {
                localStorage.removeItem('username');
                localStorage.setItem('username', username);
                localStorage.removeItem('token');
                localStorage.setItem('token', json_token['token']);
                sessionStorage.setItem('account-request', 'createaccount');
                usernameInput.value = '';
                passwordInput.value = '';
                confirmPasswordInput.value = '';
                window.location = '../my-account/index.html';
              })
            }
          })
        }
      })
    })
  }
}
