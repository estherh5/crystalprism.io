// Define variables
var submit = document.getElementById('submit');
var usernameInput = document.getElementById('username');
var passwordInput = document.getElementById('password');
var fixUser = document.getElementById('fix-user');
var fixChar = document.getElementById('fix-char');
var fixPass = document.getElementById('fix-pass');
var retry = document.getElementById('retry');
var retryTitle = document.getElementById('retry-title');
var success = document.getElementById('success');
var successTitle = document.getElementById('success-title');
if (window.location.hostname == 'crystalprism.io') {
  var server = 'http://13.58.175.191/api';
} else {
  var server = 'http://localhost:5000/api';
}

// Define events
submit.onclick = createAccount;

// Define functions
$(function () {
  $('[data-toggle="tooltip"]').tooltip();
})

function createAccount() {
  var username = usernameInput.value;
  var password = passwordInput.value;
  if (username.length == 0) {
    $(fixUser).modal('show');
    return;
  }
  if (!username.match(/^[a-zA-Z0-9_-]+$/)) {
    $(fixChar).modal('show');
    return;
  }
  if (password.length < 8) {
    $(fixPass).modal('show');
    return;
  } else {
    var data = {'username': username.toLowerCase(), 'password': password};
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
          $(success).modal('show');
          successTitle.innerHTML = username.toLowerCase();
          setTimeout(function() {
            window.location = '../index.html';
          }, 3000);
        }
      })
    })
  }
}
