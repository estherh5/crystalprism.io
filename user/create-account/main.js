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
  Promise.resolve(checkIfLoggedIn()).then(function(loggedIn) {
    if (loggedIn) {
      window.location = '../my-account/';
    }
  });

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

  /* Clear the deleted account's session cookie and stored username (from
  common.js script), and the request from sessionStorage */
  requestLogout();
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
  var submitButton = document.getElementById('submit');
  var submitRow = submitButton.parentNode.parentNode;
  var username = usernameInput.value;
  var password = passwordInput.value;
  clearInlineError(submitButton);

  // Do nothing if username or password inputs have errors
  if (!validateUsername() || !validatePassword() || !validatePasswordMatch()) {
    return;
  }

  /* Busy state on Create and a waiting cursor until the server request goes
  through */
  var restoreSubmit = setBusy(submitButton, 'Creating…');
  document.body.style.cursor = 'wait';

  function settle() {
    restoreSubmit();
    document.body.style.cursor = '';
    return;
  }

  var data = JSON.stringify({'username': username, 'password': password});

  return fetchWithTimeout(api + '/user', {
    headers: {'Content-Type': 'application/json'},
    method: 'POST',
    body: data,
  })

    .then(function(response) {
      // Remove server down banner from page (from common.js script)
      pingServer();

      /* Display warning that username already exists if server responds with
      error */
      if (response.status == 409) {
        document.getElementById('user-exists').style.display = 'block';
        settle();
        return;
      }

      // Too many attempts: say so beside Submit (message from common.js)
      if (response.status == 429) {
        settle();
        inlineError(submitButton, RATE_LIMITED_MESSAGE);
        return;
      }

      // If account is created successfully, send request to log into account
      if (response.status == 201) {
        return fetchWithTimeout(api + '/login', {
          credentials: 'include',
          headers: {
            'Authorization': 'Basic ' + btoa(username + ':' + password)
          },
          method: 'GET',
        })

          // Network error: handled below with any other failed sign-in
          .catch(function(error) {
            return;
          })

          /* If server responds successfully, it has set the HttpOnly session
          cookie; save the username to localStorage */
          .then(function(response) {

            // Account exists but sign-in was throttled
            if (response && response.status == 429) {
              sessionStorage.setItem('account-request', 'created-signed-out');
              window.location = '../sign-in/';
              return;
            }

            if (response && response.status == 200) {
              response.text().then(function() {
                localStorage.removeItem('username');
                localStorage.setItem('username', username);

                /* Save request to create account to sessionStorage to display
                success modal on next page (My Account page) */
                sessionStorage.setItem('account-request', 'create');

                // Clear username and password inputs
                usernameInput.value = '';
                passwordInput.value = '';
                confirmPassInput.value = '';
                settle();

                // Take user to My Account page
                window.location = '../my-account/';
              });
              return;
            }

            /* Otherwise the account exists but sign-in did not go through, so
            creating it again would fail: Sign In says so when it opens */
            sessionStorage.setItem('account-request', 'created-signed-out');
            window.location = '../sign-in/';
            return;
          });
      }

      // Otherwise the failure shows under Create
      settle();
      inlineError(submitButton, "Your account wasn't created. Try again in " +
        'a moment.', submitRow);
      return;
    }, function() {
      // Add server down banner to page (from common.js script)
      pingServer(checkIfLoggedIn);
      settle();
      inlineError(submitButton, "Couldn't reach the server. Check your " +
        'connection and try again.', submitRow);
      return;
    });
}


/* A failure shows next to the control that failed, as a role="alert" line,
and the next attempt clears it */
function inlineError(control, message, anchor) {
  clearInlineError(control);
  var note = document.createElement('p');
  note.className = 'inline-error';
  note.setAttribute('role', 'alert');
  note.textContent = message;
  (anchor || control).insertAdjacentElement('afterend', note);
  control.inlineErrorNote = note;
  return note;
}

function clearInlineError(control) {
  var note = control.inlineErrorNote;
  if (note && note.parentNode) {
    note.parentNode.removeChild(note);
  }
  control.inlineErrorNote = null;
  return;
}
