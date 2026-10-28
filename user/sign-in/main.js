// Define global variables
var usernameInput = document.getElementById('username-input');
var passwordInput = document.getElementById('password-input');

/* The page that sent the visitor here (?next=), read at load because
checkRingSession() strips the query string. A safe one is also kept in
sessionStorage (this origin's, which survives the Google round trip through
auth.crystalprism.io and back to ?via=google with no ?next=). */
var nextParam = new URLSearchParams(window.location.search).get('next');

/* The account menu's Sign Out has just asked the server to end the session
(signOut in common.js). Only says which banner to show: the session check
decides which one is true */
var justSignedOut = new URLSearchParams(window.location.search).has('signed-out');
if (safeNext(nextParam)) {
  sessionStorage.setItem('sign-in-next', nextParam);
}


// Define load functions
window.onload = function() {
  // Create page header (from common.js script)
  createPageHeader();

  /* Populate page header based on logged in status (from common.js), and
  redirect to My Account page if user is logged in - unless a sign-out just
  failed, so the warning stays on screen */
  // Create Account made the account but could not sign in: say so here
  try {
    if (sessionStorage.getItem('account-request') == 'created-signed-out') {
      sessionStorage.removeItem('account-request');
      document.getElementById('account-created').style.display = 'block';
    }
  } catch (e) {}

  Promise.resolve(checkIfLoggedIn()).then(function(loggedIn) {
    if (justSignedOut) {
      document.getElementById(loggedIn ? 'logout-failed' : 'logout')
        .style.display = 'block';
      return;
    }
    if (loggedIn) {
      window.location = nextTarget() || '../my-account/';
    }
  });

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
// password form stays the way in. It carries an id so the access-request notes
// below, which replace the bridge's contents, leave it standing.
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
    errorNote.id = 'google-error';
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
        clearInlineError(button);
        var restoreButton = setBusy(button, 'Continuing…');
        document.body.style.cursor = 'wait';

        /* The minted token is exchanged once for the API's HttpOnly session
        cookie and then dropped: script never keeps it. `username` is the
        claim its payload carries, stored as requestLogin() stores it. */
        fetchWithTimeout(api + '/session', {
          credentials: 'include',
          headers: {'Authorization': 'Bearer ' + data.token},
          method: 'POST',
        })

          .catch(function(error) {
            return;
          })

          .then(function(response) {
            if (!response || !response.ok) {
              restoreButton();
              document.body.style.cursor = '';
              inlineError(button, "Couldn't reach the server. Try again " +
                'in a moment.');
              return;
            }

            localStorage.removeItem('username');
            localStorage.setItem('username', data.username);

            /* The same redirect requestLogin() uses, so a deep link that
            bounced the visitor here still lands them where they were going. */
            var previousWindow = nextTarget();
            if (previousWindow) {
              window.location = previousWindow;
              return;
            }

            window.location = '../my-account/';
          });

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

      if (data.request && data.request.status == 'failed' &&
          data.request.failure != 'username_taken') {
        showAccessNotes(bridge, [handledNote(data.request.username)]);
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
// The ?google=error note is the visitor's to read, so it stays.
function showAccessNotes(bridge, notes, withoutSignIn) {
  Array.prototype.slice.call(bridge.childNodes).forEach(function(child) {
    if (child.id != 'google-error') {
      bridge.removeChild(child);
    }
  });

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


function requestNote(username, rest) {
  var note = document.createElement('p');
  var name = document.createElement('strong');
  name.textContent = username;
  note.appendChild(document.createTextNode('Your request for '));
  note.appendChild(name);
  note.appendChild(document.createTextNode(rest));
  return note;
}


function pendingNote(username) {
  return requestNote(username, " is waiting for approval. You'll get an email.");
}


// A failure that isn't a taken name (the link didn't attach, or the original
// site's answer was unclear) is finished by hand on auth.crystalprism.io, and
// asking again would only race that fix - so no form.
function handledNote(username) {
  return requestNote(username, ' hit a problem and is being fixed by hand. ' +
    "There's no need to ask again.");
}


// The request form. `last` is the visitor's previous request, if any; a
// declined one, or one whose name was taken, gets a line saying so above it.
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

        // The account got its username since this page loaded (approved in
        // another tab, or linked by hand), so ask again for the sign-in it now has.
        if (result.status == 409 && result.data.reason == 'already_linked') {
          showAccessNotes(bridge, [], true);
          checkRingSession();
          return;
        }

        if (result.status == 401) {
          showAccessNotes(bridge, [textNote("You've been signed out, so " +
            "that wasn't sent. Sign in below.")], true);
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


/* Where to send a signed-in visitor: the live ?next= page, else the one kept
across the Google round trip - null unless it is a Crystal Prism page (safeNext,
from common.js). Consumes the stored value. */
function nextTarget() {
  var stored = sessionStorage.getItem('sign-in-next');
  sessionStorage.removeItem('sign-in-next');
  return safeNext(nextParam) || safeNext(stored);
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
  var submitButton = document.getElementById('submit');
  var submitRow = submitButton.parentNode.parentNode;

  // Hide logout banners and any earlier failure
  document.getElementById('logout').style.display = 'none';
  document.getElementById('logout-failed').style.display = 'none';
  clearInlineError(submitButton);
  var username = usernameInput.value;
  var password = passwordInput.value;

  // Do nothing if username or password inputs are blank
  if (!validateUsername() || !validatePassword()) {
    return;
  }

  /* Busy state on Sign in and a waiting cursor until the server request goes
  through */
  var restoreSubmit = setBusy(submitButton, 'Signing in…');
  document.body.style.cursor = 'wait';

  function settle() {
    restoreSubmit();
    document.body.style.cursor = '';
    return;
  }

  return fetchWithTimeout(api + '/login', {
    credentials: 'include',
    headers: {'Authorization': 'Basic ' + btoa(username + ':' + password)},
    method: 'GET',
  })

    .then(function(response) {
      // Remove server down banner from page (from common.js script)
      pingServer();

      // Too many attempts: say so beside Submit (message from common.js)
      if (response.status == 429) {
        settle();
        inlineError(submitButton, RATE_LIMITED_MESSAGE, submitRow);
        return;
      }

      /* If server responds with error, display warning that credentials are
      incorrect */
      if (response.status != 200) {
        $(incorrect).modal('show');

        // Focus on Okay button to close modal
        document.getElementById('incorrect-okay').focus();

        // Clear username and password inputs
        usernameInput.value = '';
        passwordInput.value = '';
        settle();
        return;
      }

      /* Otherwise, the server has set the HttpOnly session cookie; save the
      token payload's username (its canonical casing) to localStorage and
      discard the token itself */
      return response.text().then(function(token) {
        localStorage.removeItem('username');
        var payload = JSON.parse(atob(token.split('.')[1]));
        localStorage.setItem('username', payload['username']);
        settle();

        // Take user to the page they came from, if ?next= names a safe one
        var previousWindow = nextTarget();
        if (previousWindow) {
          window.location = previousWindow;
          return;
        }

        // Otherwise, take user to My Account page
        window.location = '../my-account/';

        return;
      });
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
