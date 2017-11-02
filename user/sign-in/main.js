// Define global variables
var usernameInput = document.getElementById('username-input');
var passwordInput = document.getElementById('password-input');


// Define load functions
window.onload = function() {
  // Create page header (from common.js script)
  createPageHeader();
  // Check if user is logged in (from common.js script)
  checkIfLoggedIn();
  // Display confirmation of account logout if user requested it from another
  // page
  if (sessionStorage.getItem('account-request') == 'logout') {
    confirmLogout();
  }
  return;
}

// Display confirmation of account logout
function confirmLogout() {
  // Display successful logout modal
  $(logout).modal('show');
  // Focus on Okay button to close modal
  document.getElementById('logout-okay').focus();
  // Remove username and token from localStorage and logout request from
  // sessionStorage
  localStorage.removeItem('username');
  localStorage.removeItem('token');
  sessionStorage.removeItem('account-request');
  return;
}


// Define login functions

// Determine if username input is not blank
function assessUsername() {
  var username = usernameInput.value;
  // Display warning that username cannot be blank if input has no non-space
  // characters
  if (!/\S/.test(username)) {
    document.getElementById('user-warning').style.display = 'block';
    return false;
  }
  // Otherwise, hide warning
  document.getElementById('user-warning').style.display = 'none';
  return true;
}

// Determine if password input is not blank
function assessPassword() {
  var password = passwordInput.value;
  // Display warning that password cannot be blank if input is empty
  if (password.length == 0) {
    document.getElementById('pass-warning').style.display = 'block';
    return false;
  }
  // Otherwise, hide warning
  document.getElementById('pass-warning').style.display = 'none';
  return true;
}

// Call requestLogin function when user clicks enter key in username field
usernameInput.addEventListener('keyup', function(e) {
  if (e.keyCode == 13) {
    e.preventDefault();
    requestLogin();
  }
  return;
}, false);

// Call requestLogin function when user clicks enter key in password field
passwordInput.addEventListener('keyup', function(e) {
  if (e.keyCode == 13) {
    e.preventDefault();
    requestLogin();
  }
  return;
}, false);

// Call requestLogin function when user clicks Submit button
document.getElementById('submit').onclick = requestLogin;

// Send request to log into account to server
function requestLogin() {
  var username = usernameInput.value;
  var password = passwordInput.value;
  // Do nothing if username or password inputs are blank
  if (!assessUsername() || !assessPassword()) {
    return;
  }
  // Determine server based on window location
  if (window.location.hostname == 'crystalprism.io') {
    var server = 'http://13.58.175.191/api';
  } else {
    var server = 'http://localhost:5000/api';
  }
  return fetch(server + '/login', {
    headers: {'Authorization': 'Basic ' + btoa(username + ':' + password)},
    method: 'GET',
  })
  // Display warning if server is down
  .catch(function(error) {
    window.alert('Your request did not go through. Please try again soon.');
    return;
  }).then(function(response) {
    // If server responds with error, display warning that credentials are
    // incorrect
    if (response.status != 200) {
      $(incorrect).modal('show');
      // Focus on Okay button to close modal
      document.getElementById('incorrect-okay').focus();
      // Clear username and password inputs
      usernameInput.value = '';
      passwordInput.value = '';
      return;
    }
    // Otherwise, save username and returned token from server to localStorage
    response.json().then(function(json_token) {
      localStorage.removeItem('username');
      localStorage.setItem('username', username);
      localStorage.removeItem('token');
      localStorage.setItem('token', json_token['token']);
      // Take user to previous page if stored in sessionStorage
      if (sessionStorage.getItem('previous-window') != null) {
        window.location = sessionStorage.getItem('previous-window');
        sessionStorage.removeItem('previous-window');
        return;
      }
      // Otherwise, take user to My Account page
      window.location = '../my-account/index.html';
      return;
    });
  });
}
