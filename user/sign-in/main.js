// Define global variables
var usernameInput = document.getElementById('username-input');
var passwordInput = document.getElementById('password-input');


// Define load functions
window.onload = function() {
  /* Display confirmation of account logout if user requested it from another
  page and populate page header based on logged out status (from common.js) */
  if (sessionStorage.getItem('account-request') == 'logout') {
    confirmLogout();
  }

  // Create page header (from common.js script)
  createPageHeader();

  // If user is logged in, redirect to My Account page
  if (checkIfLoggedIn()) {
    window.location = '../my-account/';
  }

  // Check if Crystal Prism API is online (from common.js script)
  pingServer(checkIfLoggedIn);

  // Create page footer (from common.js script)
  createPageFooter();

  return;
}


// Display confirmation of account logout
function confirmLogout() {
  // Display successful logout banner
  document.getElementById('logout').style.display = 'block';

  /* Remove username and token from localStorage and logout request from
  sessionStorage */
  localStorage.removeItem('username');
  localStorage.removeItem('token');
  sessionStorage.removeItem('account-request');

  return;
}


// Define login functions

// Determine if username input is not blank
function validateUsername() {
  var username = usernameInput.value;

  /*Display warning that username cannot be blank if input has no non-space
  characters */
  if (!/\S/.test(username)) {
    document.getElementById('user-blank').style.display = 'block';
    return false;
  }

  // Otherwise, hide warning
  document.getElementById('user-blank').style.display = 'none';

  return true;
}


// Determine if password input is not blank
function validatePassword() {
  var password = passwordInput.value;

  // Display warning that password cannot be blank if input is empty
  if (password.length == 0) {
    document.getElementById('pass-blank').style.display = 'block';
    return false;
  }

  // Otherwise, hide warning
  document.getElementById('pass-blank').style.display = 'none';

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
  // Hide logout banner
  document.getElementById('logout').style.display = 'none';
  var username = usernameInput.value;
  var password = passwordInput.value;

  // Do nothing if username or password inputs are blank
  if (!validateUsername() || !validatePassword()) {
    return;
  }

  /* Disable Submit button and set cursor style to waiting until server request
  goes through */
  document.getElementById('submit').disabled = true;
  document.body.style.cursor = 'wait';

  return fetch(api + '/login', {
    headers: {'Authorization': 'Basic ' + btoa(username + ':' + password)},
    method: 'GET',
  })

    // Display warning if server is down
    .catch(function(error) {
      // Add server down banner to page (from common.js script)
      pingServer(checkIfLoggedIn);

      window.alert('Your request did not go through. Please try again soon.');

      // Reset Submit button and cursor style
      document.getElementById('submit').disabled = false;
      document.body.style.cursor = '';

      return;
    })

    .then(function(response) {
      if (response) {
        // Remove server down banner from page (from common.js script)
        pingServer();

        /* If server responds with error, display warning that credentials are
        incorrect */
        if (response.status != 200) {
          $(incorrect).modal('show');

          // Focus on Okay button to close modal
          document.getElementById('incorrect-okay').focus();

          // Clear username and password inputs
          usernameInput.value = '';
          passwordInput.value = '';

          // Reset Submit button and cursor style
          document.getElementById('submit').disabled = false;
          document.body.style.cursor = '';

          return;
        }

        /* Otherwise, save returned token from server and decoded token's
        payload (username) to localStorage */
        response.text().then(function(token) {
          localStorage.removeItem('username');
          var payload = JSON.parse(atob(token.split('.')[1]));
          localStorage.setItem('username', payload['username']);
          localStorage.removeItem('token');
          localStorage.setItem('token', token);

          // Reset Submit button and cursor style
          document.getElementById('submit').disabled = false;
          document.body.style.cursor = '';

          // Take user to previous page if stored in sessionStorage
          if (sessionStorage.getItem('previous-window')) {
            window.location = sessionStorage.getItem('previous-window');
            sessionStorage.removeItem('previous-window');
            return;
          }

          // Otherwise, take user to My Account page
          window.location = '../my-account/';

          return;
        });
      }
    });
}
