// Define global variables
var profileLink;
var accountLink;
var signInLink;
var currentPath = window.location.href.split('/').slice(-2)[0];
var refreshed = false // If Refresh button was clicked for pingServer function
var scrolled = false // Stores if user scrolled down page with infinite scroll


// Determine API endpoint, domain and root URL based on window location
if (window.location.hostname == 'crystalprism.io') {
  var api = 'https://api.crystalprism.io/api';
  var domain = 'crystalprism.io';
  var root = 'https://' + domain;
} else {
  var api = 'http://localhost:5000/api';
  var domain = 'crystalprism.io';
  var root = window.location.href.split('crystalprism.io')[0] + domain;
}


// Create header to contain homepage link and account menu
function createPageHeader() {
  var header = document.createElement('div');
  header.id = 'header';
  var headerContainer = document.createElement('div');
  headerContainer.id = 'header-container';
  header.appendChild(headerContainer);

  /* Create link to homepage that has diamond icon if current page is not
  homepage */
  if (currentPath != domain) {
    var homepageLink = document.createElement('a');
    homepageLink.href = root;
    homepageLink.id = 'homepage-link';
    var homepageIcon = document.createElement('img');
    homepageIcon.id = 'homepage-icon';
    homepageIcon.src = root + '/images/homepage.png';
    headerContainer.appendChild(homepageLink);
    homepageLink.appendChild(homepageIcon);
  }

  // Otherwise, add theme container to header on homepage
  else {
    headerContainer.appendChild(document.getElementById('theme-container'));
  }

  /* Create account menu with links to profile, create account page, and sign
  in page */
  var accountMenu = document.createElement('div');
  accountMenu.id = 'account-menu';
  profileLink = document.createElement('a');
  profileLink.id = 'profile-link';
  accountLink = document.createElement('a');
  accountLink.id = 'account-link';
  accountLink.href = root + '/user/create-account/';
  signInLink = document.createElement('a');
  signInLink.id = 'sign-in-link';
  signInLink.href = root + '/user/sign-in/';
  headerContainer.appendChild(accountMenu);
  accountMenu.appendChild(profileLink);
  accountMenu.appendChild(accountLink);
  accountMenu.appendChild(signInLink);

  // Insert header before first element in body
  document.body.insertAdjacentElement('afterbegin', header);

  return;
}


// Create page footer with copyright and contact information
function createPageFooter() {
  // Create copyright display
  var copyright = document.createElement('div');
  copyright.innerHTML = '&copy; 2018 Crystal Prism';

  // Create contact information display
  var contact = document.createElement('div');
  contact.innerHTML = 'Find any bugs? Email <a href="admin@crystalprism.io">' +
    'admin@crystalprism.io</a> with details.';

  // Create footer to contain copyright and contact information
  var footer = document.createElement('div');
  footer.id = 'footer';
  footer.appendChild(copyright);
  footer.appendChild(contact);

  // Insert footer at end of body element
  document.body.insertAdjacentElement('beforeend', footer);

  return;
}


/* Check if API is online and run optional action function if so (and if
Refresh button was clicked) */
function pingServer(action) {
  // Remove server down banner if it is already displayed
  if (header.contains(document.getElementById('banner'))) {
    document.getElementById('header').removeChild(document
      .getElementById('banner'));
  }

  /* Remove audio container margin (added if banner is added when server is
  down) */
  if (document.body.contains(document.getElementById('audio-container'))) {
    document.getElementById('audio-container').style.marginTop = '';
  }

  /* Remove Vicarious title link margin (added if banner is added when server
  is down) */
  if (currentPath == 'vicarious') {
    document.getElementById('title-link').style.marginTop = '';
  }

  return fetch(api + '/ping')

    // Display error banner if server is down
    .catch(function(error) {
      var banner = document.createElement('div');
      banner.id = 'banner';
      var bannerText = document.createElement('div');
      bannerText.id = 'banner-text';
      bannerText.innerHTML = 'Server is offline. Some features and content ' +
        'may be unavailable. ';
      banner.appendChild(bannerText);

      // Display Refresh button to allow user to re-ping the server
      var refresh = document.createElement('text');
      refresh.id = 'refresh';
      refresh.innerHTML = 'Refresh.';
      refresh.onclick = function() {
        refreshed = true;
        pingServer(action);
        return;
      }
      bannerText.appendChild(refresh);

      // Add audio container margin to allow space for banner
      if (document.body.contains(document.getElementById('audio-container'))) {
        document.getElementById('audio-container').style.marginTop = '20px';
      }

      // Add Vicarious title link margin to allow space for banner
      if (currentPath == 'vicarious') {
        document.getElementById('title-link').style.marginTop = '11px';
      }

      document.getElementById('header')
        .insertAdjacentElement('afterbegin', banner);
    })

    // Run action function if server is online and Refresh button was clicked
    .then(function(response) {
      if (response.ok && refreshed) {
        action();
        refreshed = false;
      }
    });
}


// Check if user is logged in by assessing JWT token's validity
function checkIfLoggedIn() {
  // If user does not have a token stored locally, set account menu to default
  if (!localStorage.getItem('token')) {
    accountLink.innerHTML = 'Create Account';
    signInLink.innerHTML = 'Sign In';

    /* Store current window for user to return to after logging in, if current
    window is not homepage, Create Account, or Sign In pages */
    if (currentPath != domain && currentPath != 'create-account'
      && currentPath != 'sign-in') {
        signInLink.onclick = function() {
          sessionStorage.setItem('previous-window', window.location.href);
          return;
        }
      }

    return;
  }

  /* Otherwise, check if the user is logged in by sending their token to the
  server */
  return fetch(api + '/user/verify', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
    method: 'GET',
  })

    // Set account menu to default if server is down
    .catch(function(error) {
      accountLink.innerHTML = 'Create Account';
      signInLink.innerHTML = 'Sign In';

      /* Store current window for user to return to after logging in, if
      current window is not homepage, Create Account, or Sign In pages */
      if (currentPath != domain && currentPath != 'create-account'
        && currentPath != 'sign-in') {
          signInLink.onclick = function() {
            sessionStorage.setItem('previous-window', window.location.href);
            return;
          }
        }

      return false;
    })

    .then(function(response) {
      /* If server verifies token is correct, display link to profile, My
      Account page, and Sign In page (with "Sign Out" title) */
      if (response.ok) {
        profileLink.innerHTML = localStorage.getItem('username');
        profileLink.href = root + '/user/?username=' + localStorage
          .getItem('username');
        accountLink.innerHTML = 'My Account';
        accountLink.href = root + '/user/my-account/';
        signInLink.innerHTML = 'Sign Out';

        /* Send request to log user out when Sign In page link ("Sign Out"
        title) is clicked */
        signInLink.onclick = function() {
          sessionStorage.setItem('account-request', 'logout');
          return;
        }

        return true;
      }

      /* If server responds with unauthorized status, set account menu to
      default and remove username and token from localStorage */
      if (response.status == 401) {
        localStorage.removeItem('username');
        localStorage.removeItem('token');
        accountLink.innerHTML = 'Create Account';
        signInLink.innerHTML = 'Sign In';

        /* Store current window for user to return to after logging in, if
        current window is not homepage, Create Account, or Sign In pages */
        if (currentPath != domain && currentPath != 'create-account'
          && currentPath != 'sign-in') {
            signInLink.onclick = function() {
              sessionStorage.setItem('previous-window', window.location.href);
              return;
            }
          }

        // Redirect to Sign In page if user is on My Account page
        if (currentPath == 'my-account') {
          window.location = '../sign-in/';
        }
      }

      return false;
    });
}


// Assess percentage that user has scrolled down page
function percentScrolled() {
  // Determine document height (different for different browsers)
  var documentHeight = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
      document.body.clientHeight, document.documentElement.clientHeight);

  // Determine window height (different for different browsers)
  var windowHeight = window.innerHeight || (document
    .documentElement || document.body).clientHeight;

  // Determine how far from top user has scrolled down page
  var scrollTop = window.pageYOffset || (document.documentElement || document
    .body.parentNode || document.body).scrollTop;

  // Determine length scrollbar can travel down
  var scrollLength = documentHeight - windowHeight;

  // Return percentage scrolled down page
  return Math.floor((scrollTop / scrollLength) * 100);
}


/* Reset scrolled variable when infinite scrolling to maintain smooth
frame-per-second scrolling rate */
window.addEventListener('scroll', function scroll() {
  setTimeout(function() {
    if (scrolled) {
      scrolled = false;
      scroll();
      return;
    }

    scrolled = true;
    scroll();
    return;
  }, 500);
}, false);
