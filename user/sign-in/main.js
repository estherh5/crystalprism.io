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
// visitor's chance to sign in as somebody else. The one exception is a return
// from Google sign-in on auth.crystalprism.io (?via=google): the visitor just
// asked to sign in, so the Continue button is pressed for them.
//
// ?google=error is that same round trip failing. It gets one note here and the
// password form stays the way in.
//
// Both flags are read once and the query is then stripped, so a reload or a
// bookmark does not replay an automatic sign-in or a stale error.
function checkRingSession() {
  var bridge = document.getElementById('ring-bridge');

  if (!bridge) {
    return;
  }

  var viaGoogle = /[?&]via=google(&|$)/.test(location.search);

  if (/[?&]google=error(&|$)/.test(location.search)) {
    var errorNote = document.createElement('p');
    errorNote.textContent = "Google sign-in didn't go through. Try again, or " +
      'use your username and password.';
    bridge.appendChild(errorNote);
  }

  if (location.search && window.history && history.replaceState) {
    history.replaceState(null, '', location.pathname + location.hash);
  }

  fetch('https://auth.crystalprism.io/api/legacy-token', {
    method: 'POST',
    credentials: 'include'
  })

    .then(function(response) {
      if (response.status == 409) {
        checkAccessRequest(bridge);
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

      if (viaGoogle) {
        button.click();
      }

      return;
    })

    .catch(function() {
      /* auth.crystalprism.io unreachable. The legacy form below is the fallback
      and needs no announcement. */
      return;
    });

  return;
}


// A ring session with no site username (the 409 above). Visitors who joined the
// ring after 2017 have nothing to sign in with here, so they ask for a username
// and Esther approves it by email on auth.crystalprism.io. Visitors who DO have
// a 2017 username still link it by signing in below, so every state keeps that
// line.
//
// If the lookup itself fails, the pre-request note is shown instead of a form:
// a form whose endpoint just failed would only fail again on submit.
//
// Every string the server returns goes in through textContent, never innerHTML.
var ACCESS_REQUEST_URL = 'https://auth.crystalprism.io/api/access-request';

// The server's USERNAME_PATTERN (auth.crystalprism.io lib/access-requests.ts),
// checked here only so a typo is caught without a round trip.
var ACCESS_USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

function checkAccessRequest(bridge) {
  fetch(ACCESS_REQUEST_URL, {credentials: 'include'})

    .then(function(response) {
      if (response.status != 200) {
        return null;
      }

      return response.json();
    })

    .then(function(data) {
      if (!data || !data.ok) {
        showAccessNotes(bridge, [unlinkedNote()], true);
        return;
      }

      if (data.request && data.request.status == 'pending') {
        showAccessNotes(bridge, [pendingNote(data.request.username)]);
        return;
      }

      showAccessForm(bridge, data.request);
      return;
    })

    .catch(function() {
      showAccessNotes(bridge, [unlinkedNote()], true);
      return;
    });

  return;
}


// Replace the bridge's contents with these notes, then the sign-in line.
// The unlinked note already says to sign in below, so it goes without one.
function showAccessNotes(bridge, notes, withoutSignIn) {
  while (bridge.firstChild) {
    bridge.removeChild(bridge.firstChild);
  }

  notes.forEach(function(note) {
    bridge.appendChild(note);
  });

  if (!withoutSignIn) {
    bridge.appendChild(textNote('Already have one? Sign in below.'));
  }

  return;
}


function textNote(text) {
  var note = document.createElement('p');
  note.textContent = text;
  return note;
}


function unlinkedNote() {
  return textNote("Your Crystal Prism account isn't linked to a site " +
    'username yet. Sign in below with your original username and password.');
}


function pendingNote(username) {
  var note = document.createElement('p');
  var name = document.createElement('strong');
  name.textContent = username;
  note.appendChild(document.createTextNode('Your request for '));
  note.appendChild(name);
  note.appendChild(document.createTextNode(
    " is waiting for approval. You'll get an email."));
  return note;
}


// The request form. `last` is the visitor's previous request, if any; a
// declined or failed one gets a line saying so above the form.
function showAccessForm(bridge, last) {
  var notes = [];

  if (last && last.status == 'declined') {
    notes.push(textNote('Your request for ' + last.username +
      " wasn't approved."));
  }

  if (last && last.status == 'failed') {
    notes.push(textNote(last.username + ' was taken — try another.'));
  }

  notes.push(textNote("You're signed in, but you don't have a username on " +
    'this site yet. Request one:'));

  var form = document.createElement('form');
  form.id = 'access-request';
  form.noValidate = true;

  var label = document.createElement('label');
  label.htmlFor = 'access-username';
  label.textContent = 'Username';

  var input = document.createElement('input');
  input.id = 'access-username';
  input.type = 'text';
  input.maxLength = 30;
  input.setAttribute('autocomplete', 'username');
  input.setAttribute('autocapitalize', 'none');
  input.spellcheck = false;

  // Every failure lands here: the house `.warning`, shown only when set
  var warning = document.createElement('p');
  warning.id = 'access-warning';
  warning.className = 'warning';
  warning.setAttribute('role', 'alert');

  var button = document.createElement('button');
  button.type = 'submit';
  button.textContent = 'Request username';

  function warn(text) {
    warning.textContent = text;
    warning.style.display = text ? 'block' : 'none';
    return;
  }

  form.onsubmit = function(e) {
    e.preventDefault();

    var username = input.value.trim();

    if (!ACCESS_USERNAME_PATTERN.test(username)) {
      warn('Letters, numbers, - and _ only.');
      input.focus();
      return;
    }

    warn('');
    button.disabled = true;

    fetch(ACCESS_REQUEST_URL, {
      method: 'POST',
      credentials: 'include',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({username: username})
    })

      .then(function(response) {
        return response.json()
          .catch(function() {
            return {};
          })
          .then(function(data) {
            return {status: response.status, data: data};
          });
      })

      .then(function(result) {
        if (result.status == 201) {
          showAccessNotes(bridge, [textNote("Request sent. You'll get an " +
            "email when it's approved.")]);
          return;
        }

        if (result.status == 409 && result.data.reason == 'already_pending') {
          showAccessNotes(bridge,
            [pendingNote(result.data.username || username)]);
          return;
        }

        button.disabled = false;

        if (result.status == 400) {
          warn('Letters, numbers, - and _ only.');
          input.focus();
          return;
        }

        if (result.status == 429) {
          warn('Too many tries. Wait a few minutes.');
          return;
        }

        warn("Couldn't send that. Try again.");
        return;
      })

      .catch(function() {
        button.disabled = false;
        warn("Couldn't send that. Try again.");
        return;
      });

    return;
  };

  form.appendChild(label);
  form.appendChild(input);
  form.appendChild(warning);
  form.appendChild(button);
  notes.push(form);

  showAccessNotes(bridge, notes);

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
