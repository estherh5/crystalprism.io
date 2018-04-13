// Define global variables
var usernameInput = document.getElementById('username-input');
var passwordInput = document.getElementById('password-input');
var confirmPassInput = document.getElementById('confirm-password-input');


// Define load functions
window.onload = function() {
  /* Display confirmation of account deletion if user requested it from My
  Account page */
  if (sessionStorage.getItem('account-request') == 'delete') {
    confirmDeletion();
  }

  // Create page header (from common.js script)
  createPageHeader();

  // If user is logged in, redirect to My Account page
  if (checkIfLoggedIn()) {
    window.location = '../my-account/';
  }

  // Enable Bootstrap tooltips
  $('[data-toggle="tooltip"]').tooltip();

  // Check if Crystal Prism API is online (from common.js script)
  pingServer(checkIfLoggedIn);

  // Create page footer (from common.js script)
  createPageFooter();

  return;
}


// Display confirmation of account deletion
function confirmDeletion() {
  // Display successful account deletion modal
  $(deleted).modal('show');

  // Focus on Okay button to close modal
  document.getElementById('okay').focus();

  /* Remove username and token from localStorage and logout request from
  sessionStorage */
  localStorage.removeItem('username');
  localStorage.removeItem('token');
  sessionStorage.removeItem('account-request');

  return;
}


// Define account creation functions

// Determine if username input has errors
function validateUsername() {
  var username = usernameInput.value;

  /* Display warning that username cannot be blank if input has no non-space
  characters */
  if (!/\S/.test(username)) {
    document.getElementById('user-chars').style.display = 'none';
    document.getElementById('user-exists').style.display = 'none';
    document.getElementById('user-blank').style.display = 'block';
    return false;
  }

  /* Display warning that username has unacceptable characters if there are
  non-alphanumeric, underscore, or dash characters */
  if (!username.match(/^[a-zA-Z0-9_-]+$/)) {
    document.getElementById('user-blank').style.display = 'none';
    document.getElementById('user-exists').style.display = 'none';
    document.getElementById('user-chars').style.display = 'block';
    return false;
  }

  // Otherwise, hide warnings
  document.getElementById('user-blank').style.display = 'none';
  document.getElementById('user-chars').style.display = 'none';
  document.getElementById('user-exists').style.display = 'none';

  return true;
}


// Determine if password input has errors when user focuses out of field
passwordInput.onfocusout = validatePassword;

function validatePassword() {
  var password = passwordInput.value;

  // Display warning that password cannot be blank if input is empty
  if (!/\S/.test(password)) {
    document.getElementById('pass-short').style.display = 'none';
    document.getElementById('pass-blank').style.display = 'block';
    return false;
  }

  /* Display warning that password is too short if input is less than 8
  characters */
  if (password.length < 8) {
    document.getElementById('pass-blank').style.display = 'none';
    document.getElementById('pass-short').style.display = 'block';
    return false;
  }

  // Otherwise, hide warnings
  document.getElementById('pass-blank').style.display = 'none';
  document.getElementById('pass-short').style.display = 'none';

  return true;
}


/* Determine if confirmation password matches original password when user
focuses out of field */
confirmPassInput.onfocusout = validatePasswordMatch;

function validatePasswordMatch() {
  var password = passwordInput.value;
  var confirmPassword = confirmPassInput.value;

  // If passwords do not match, display warning
  if (password != confirmPassword) {
    document.getElementById('pass-mismatch').style.display = 'block';
    return false;
  }

  // Otherwise, hide warning
  document.getElementById('pass-mismatch').style.display = 'none';

  return true;
}


// Call createAccount function when user clicks enter key in input fields
for (var i = 0; i < document.getElementsByTagName('input').length; i++) {
  document.getElementsByTagName('input')[i].addEventListener('keyup',
    function(e) {
      if (e.keyCode == 13) {
        e.preventDefault();
        createAccount();
      }
      return;
    }, false);
}


// Call createAccount function when user clicks Submit button
document.getElementById('submit').onclick = createAccount;


// Send request to create account to server
function createAccount() {
  var username = usernameInput.value;
  var password = passwordInput.value;

  // Do nothing if username or password inputs have errors
  if (!validateUsername() || !validatePassword() || !validatePasswordMatch()) {
    return;
  }

  /* Disable Submit button and set cursor style to waiting until server request
  goes through */
  document.getElementById('submit').disabled = true;
  document.body.style.cursor = 'wait';

  var data = JSON.stringify({'username': username, 'password': password});

  return fetch(api + '/user', {
    headers: {'Content-Type': 'application/json'},
    method: 'POST',
    body: data,
  })

    // Display warning if server is down
    .catch(function(error) {
      window.alert('Your request did not go through. Please try again soon.');

      // Reset Submit button and cursor style
      document.getElementById('submit').disabled = false;
      document.body.style.cursor = '';

      return;
    })

    .then(function(response) {
      /* Display warning that username already exists if server responds with
      error */
      if (response.status == 409) {
        document.getElementById('user-exists').style.display = 'block';

        // Reset Submit button and cursor style
        document.getElementById('submit').disabled = false;
        document.body.style.cursor = '';

        return;
      }

      // If account is created successfully, send request to log into account
      if (response.status == 201) {
        return fetch(api + '/login', {
          headers: {
            'Authorization': 'Basic ' + btoa(username + ':' + password)
          },
          method: 'GET',
        })

          /* If server responds successfully, save username and returned token
          from server to localStorage */
          .then(function(response) {

            if (response.status == 200) {
              response.text().then(function(token) {
                localStorage.removeItem('username');
                localStorage.setItem('username', username);
                localStorage.removeItem('token');
                localStorage.setItem('token', token);

                // Save request to create account to sessionStorage to display
                // success modal on next page (My Account page)
                sessionStorage.setItem('account-request', 'create');

                // Clear username and password inputs
                usernameInput.value = '';
                passwordInput.value = '';
                confirmPassInput.value = '';

                // Reset Submit button and cursor style
                document.getElementById('submit').disabled = false;
                document.body.style.cursor = '';

                // Take user to My Account page
                window.location = '../my-account/';
              });
            }
          });

        return;
      }

      // Otherwise, display warning if server responds with other error
      window.alert('Your request did not go through. Please try again soon.');

      // Reset Submit button and cursor style
      document.getElementById('submit').disabled = false;
      document.body.style.cursor = '';

      return;
    });
}
