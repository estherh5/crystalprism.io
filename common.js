// Define global variables
var profileLink;
var accountLink;
var signInLink;
// Determine server and root URL based on window location
if (window.location.hostname == 'crystalprism.io') {
  var server = 'https://13.58.175.191/api';
  var root = 'https://crystalprism.io';
} else {
  var server = 'http://localhost:5000/api';
  var root = window.location.href.split('estherh5.github.io')[0] + 'estherh5.github.io';
}


// Create page header
function createPageHeader() {
  // Create header to contain homepage link and account menu
  var header = document.createElement('div');
  header.id = 'header';
  // Create link to homepage that has diamond icon
  var homepageLink = document.createElement('a');
  homepageLink.href = root + '/index.html';
  homepageLink.id = 'homepage-link';
  var homepageIcon = document.createElement('img');
  homepageIcon.id = 'homepage-icon';
  homepageIcon.src = root + '/images/homepage.png';
  // Create account menu with links to profile, create account page, and sign in page
  var accountMenu = document.createElement('div');
  accountMenu.id = 'account-menu';
  profileLink = document.createElement('a');
  profileLink.id = 'profile-link';
  accountLink = document.createElement('a');
  accountLink.id = 'account-link';
  accountLink.href = root + '/user/create-account/index.html';
  signInLink = document.createElement('a');
  signInLink.id = 'sign-in-link';
  signInLink.href = root + '/user/sign-in/index.html';
  header.append(homepageLink);
  homepageLink.append(homepageIcon);
  header.append(accountMenu);
  accountMenu.append(profileLink);
  accountMenu.append(accountLink);
  accountMenu.append(signInLink);
  // Insert header before first element in body
  document.body.insertAdjacentElement('afterbegin', header);
  return;
}


// Check if user is logged in
function checkIfLoggedIn() {
  // If user does not have a token stored locally, set account menu to default
  if (localStorage.getItem('token') == null) {
    accountLink.innerHTML = 'Create Account';
    signInLink.innerHTML = 'Sign In';
    // Store current window for user to return to after logging in, if current window is not homepage, Create Account, or Sign In pages
    if (window.location.href != root + '/index.html' && window.location.href != root + '/user/create-account/index.html' && window.location.href != root + '/user/sign-in/index.html') {
      signInLink.onclick = function() {
        sessionStorage.setItem('previous-window', window.location.href);
        return;
      }
    }
  }
  // Otherwise, check if the user is logged in by sending their token to the server
  else {
    return fetch(server + '/user/verify', {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
      method: 'GET',
    }).catch(function(error) {
      // Set account menu to default if server is down
      accountLink.innerHTML = 'Create Account';
      signInLink.innerHTML = 'Sign In';
      // Store current window for user to return to after logging in, if current window is not homepage, Create Account, or Sign In pages
      if (window.location.href != root + '/index.html' && window.location.href != root + '/user/create-account/index.html' && window.location.href != root + '/user/sign-in/index.html') {
        signInLink.onclick = function() {
          sessionStorage.setItem('previous-window', window.location.href);
          return;
        }
      }
      return false;
    }).then(function(response) {
      // If server verifies token is correct, display link to profile, My Account page, and Sign In page (with "Sign Out" title)
      if (response.ok) {
        profileLink.innerHTML = localStorage.getItem('username');
        profileLink.href = root + '/user/index.html?username=' + localStorage.getItem('username');
        accountLink.innerHTML = 'My Account';
        accountLink.href = root + '/user/my-account/index.html';
        signInLink.innerHTML = 'Sign Out';
        // Send request to log user out when Sign In page link ("Sign Out" title) is clicked
        signInLink.onclick = function() {
          sessionStorage.setItem('account-request', 'logout');
          return;
        }
        return true;
      }
      // Otherwise, set account menu to default and remove username and token from localStorage
      else {
        localStorage.removeItem('username');
        localStorage.removeItem('token');
        accountLink.innerHTML = 'Create Account';
        signInLink.innerHTML = 'Sign In';
        // Store current window for user to return to after logging in, if current window is not homepage, Create Account, or Sign In pages
        if (window.location.href != root + '/index.html' && window.location.href != root + '/user/create-account/index.html' && window.location.href != root + '/user/sign-in/index.html') {
          signInLink.onclick = function() {
            sessionStorage.setItem('previous-window', window.location.href);
            return;
          }
        }
      }
    });
  }
  return false;
}
