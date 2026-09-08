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

  /* Offer a one-click continue if this visitor already holds a Crystal Prism
  ring session */
  checkRingSession();

  // Check if Crystal Prism API is online (from common.js script)
  pingServer(checkIfLoggedIn);

  // Create page footer (from common.js script)
  createPageFooter();

  return;
}


// The ring-session bridge. auth.crystalprism.io holds the Crystal Prism
// password accounts; if this visitor already has a ring session, it can mint a
// legacy token for them and they never retype their 2017 password.
//
// A 401 renders NOTHING. Almost every visitor here has no ring session, and
// this page's job is to accept a password - an error banner for a convenience
// nobody asked for is noise. 429, 503 and a network failure are the same: the
// form below works unaided and is the fallback.
//
// A 200 does NOT sign anyone in by itself. Appearing already-authenticated on a
// page that is asking for a password is the wrong surprise, and it removes the
// visitor's chance to sign in as somebody else.
function checkRingSession() {
  var bridge = document.getElementById('ring-bridge');

  if (!bridge) {
    return;
  }

  fetch('https://auth.crystalprism.io/api/legacy-token', {
    method: 'POST',
    credentials: 'include'
  })

    .then(function(response) {
      if (response.status == 409) {
        var note = document.createElement('p');
        note.textContent = "Your Crystal Prism account isn't linked to a site " +
          'username yet. Sign in below with your original username and ' +
          'password.';
        bridge.appendChild(note);
        return null;
      }

      if (response.status != 200) {
        return null;
      }

      return response.json();
    })

    .then(function(data) {
      if (!data || !data.token || !data.username) {
        return;
      }

      var note = document.createElement('p');
      note.textContent = 'Signed in to Crystal Prism as ' + data.username + '.';

      var button = document.createElement('button');
      button.id = 'ring-continue';
      button.textContent = 'Continue';

      button.onclick = function() {
        button.disabled = true;
        document.body.style.cursor = 'wait';

        /* Written exactly as requestLogin() writes it: `token` is the bare JWT
        string, and `username` is the claim its payload carries. Six other files
        read these two keys directly. */
        localStorage.removeItem('username');
        localStorage.setItem('username', data.username);
        localStorage.removeItem('token');
        localStorage.setItem('token', data.token);

        /* The same redirect requestLogin() uses, so a deep link that bounced
        the visitor here still lands them where they were going. */
        if (sessionStorage.getItem('previous-window')) {
          var previousWindow = sessionStorage.getItem('previous-window');
          sessionStorage.removeItem('previous-window');
          window.location = previousWindow;
          return;
        }

        window.location = '../my-account/';

        return;
      };

      bridge.appendChild(note);
      bridge.appendChild(button);

      return;
    })

    .catch(function() {
      /* auth.crystalprism.io unreachable. The legacy form below is the fallback
      and needs no announcement. */
      return;
    });

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
