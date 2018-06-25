// Define global variables
var profileLink;
var accountLink;
var signInLink;
var currentPath = window.location.href.split('/').slice(-2)[0];
var domain = window.location.origin.split('/').slice(-2)[1];
var root = window.location.origin;
var repinged = false // If Retry button was clicked for pingServer function
var scrolled = false // Stores if user scrolled down page with infinite scroll
var mobile = false; // Used to determine if user is on mobile device or desktop
var siteMenuOpen = false; // Stores if site menu is open or closed


// Determine API endpoint based on window location
if (window.location.hostname == 'crystalprism.io') {
  var api = 'https://api.crystalprism.io/api';
} else {
  var api = 'http://localhost:5000/api';
}


// Create header with navigation and account menus
function createPageHeader() {
  var header = document.createElement('div');
  header.id = 'header';
  var headerContainer = document.createElement('div');
  headerContainer.id = 'header-container';
  header.appendChild(headerContainer);

  // Create project navigation menu
  var iconContainer = document.createElement('div');
  iconContainer.id = 'site-menu-icon-container';

  var menuIcon = document.createElement('img');
  menuIcon.id = 'site-menu-icon';
  menuIcon.title = 'Site menu';
  menuIcon.src = root + '/images/site-menu-icon-shadow.svg';

  headerContainer.appendChild(iconContainer);
  iconContainer.appendChild(menuIcon);

  // Create site menu table
  var siteMenu = document.createElement('table');
  siteMenu.id = 'site-menu';
  siteMenu.classList.add('closed');

  var siteMenuSpacer = document.createElement('tr');
  siteMenuSpacer.id = 'site-menu-spacer-row';

  headerContainer.appendChild(siteMenu);
  siteMenu.appendChild(siteMenuSpacer);

  // Create menu rows with icons and links to each project
  var projectLinks = ['/', '/timespace/', '/shapes-in-rain/',
    '/rhythm-of-life/', '/canvashare/', '/thought-writer/', '/vicarious/',
    'https://hn-stats.crystalprism.io/', 'https://pause.crystalprism.io/',
    '/'];

  var projectTitles = ['Home', 'Timespace', 'Shapes In Rain',
    'Rhythm of Life', 'CanvaShare', 'Thought Writer', 'Vicarious',
    'Hacker News Stats', 'Pause', 'Account'];

  for (var i = 0; i < projectLinks.length; i++) {
    var menuRow = document.createElement('tr');
    menuRow.classList.add('site-menu-row');

    if (i == projectLinks.length - 1) {
      if (localStorage.getItem('token')) {
        menuRow.dataset.link = projectLinks[i] + 'user/my-account/';
      } else {
        menuRow.dataset.link = projectLinks[i] + 'user/sign-in/';
      }
    } else {
      menuRow.dataset.link = projectLinks[i];
    }

    menuRow.addEventListener('click', function() {
      window.location = this.dataset.link;
      return;
    }, false);

    var menuImageCell = document.createElement('td');
    menuImageCell.classList.add('site-menu-image-cell');

    var menuImage = document.createElement('img');
    menuImage.classList.add('site-menu-image');
    menuImage.src = projectLinks[i] + 'favicon.ico';

    var menuTextCell = document.createElement('td');
    menuTextCell.classList.add('site-menu-text-cell');

    var menuText = document.createElement('div');
    menuText.classList.add('site-menu-text');
    menuText.innerHTML = projectTitles[i];

    menuRow.appendChild(menuImageCell);
    menuImageCell.appendChild(menuImage);
    menuRow.appendChild(menuTextCell);
    menuTextCell.appendChild(menuText);
    siteMenu.appendChild(menuRow);
  }

  // Toggle site menu when user clicks menu icon
  menuIcon.onmousedown = toggleSiteMenu;

  // Add theme container to header on homepage
  if (currentPath == domain) {
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
  copyright.innerHTML = '&copy; 2018 <a href="' + root + '">Crystal Prism</a>';

  // Create footer to contain copyright information
  var footer = document.createElement('div');
  footer.id = 'footer';
  footer.appendChild(copyright);

  // Insert footer at end of body element
  document.body.insertAdjacentElement('beforeend', footer);

  return;
}


/* Check if API is online and run optional action function if so (and if
Retry button was clicked) */
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
      if (!header.contains(document.getElementById('banner'))) {
        var banner = document.createElement('div');
        banner.id = 'banner';
        var bannerText = document.createElement('div');
        bannerText.id = 'banner-text';
        bannerText.innerHTML = 'The server could not be reached. Some ' +
          'content may be unavailable. ';
        banner.appendChild(bannerText);

        // Display Retry button to allow user to re-ping the server
        var retry = document.createElement('text');
        retry.id = 'retry';
        retry.innerHTML = 'Retry.';
        retry.onclick = function() {
          repinged = true;
          pingServer(action);
          return;
        }
        bannerText.appendChild(retry);

        // Add audio container margin to allow space for banner
        if (document.body.contains(document
          .getElementById('audio-container'))) {
            document.getElementById('audio-container').style
              .marginTop = '20px';
        }

        // Add Vicarious title link margin to allow space for banner
        if (currentPath == 'vicarious') {
          document.getElementById('title-link').style.marginTop = '11px';
        }

        document.getElementById('header')
          .insertAdjacentElement('afterbegin', banner);
      }
    })

    // Run action function if server is online and Retry button was clicked
    .then(function(response) {
      if (response) {
        if (response.ok && repinged) {
          action();
          repinged = false;
        }
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

    return false;
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
        response.json().then(function(payload) {
          // Set localStorage username to payload username
          localStorage.setItem('username', payload['username']);

          profileLink.innerHTML = payload['username'];
          profileLink.href = root + '/user/?username=' + payload['username'];
          accountLink.innerHTML = 'My Account';
          accountLink.href = root + '/user/my-account/';
          signInLink.innerHTML = 'Sign Out';

          /* Send request to log user out when Sign In page link ("Sign Out"
          title) is clicked */
          signInLink.onclick = function() {
            sessionStorage.setItem('account-request', 'logout');
            return;
          }
        });
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
          sessionStorage.setItem('account-request', 'logout');
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


// Assess if user is on mobile device
function assessMobile() {
  (function(a) {
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) {
      mobile = true;
    } else {
      mobile = false;
    }
  }) (navigator.userAgent||navigator.vendor||window.opera);

  return;
}


// Open/close site menu
function toggleSiteMenu() {
  var siteMenu = document.getElementById('site-menu');

  // Close menu if it is open
  if (siteMenuOpen) {
    siteMenu.classList.remove('opened');
    siteMenu.classList.add('closed');

    // Set menu icon back to shadow version
    document.getElementById('site-menu-icon')
      .src = root + '/images/site-menu-icon-shadow.svg';

    // Set theme container color back to initial on homepage so it is visible
    if (currentPath == domain) {
      document.getElementById('theme-container').style.color = 'inherit';
    }

    siteMenuOpen = false;

    return;
  }

  // Otherwise, open menu
  siteMenu.classList.remove('closed');
  siteMenu.classList.add('opened');

  // Set menu icon to non-shadow version
  document.getElementById('site-menu-icon')
    .src = root + '/images/site-menu-icon.svg';

  // Set theme container color to black on homepage so it is visible
  if (currentPath == domain) {
    document.getElementById('theme-container').style.color = '#000000';
  }

  siteMenuOpen = true;

  return;
}


// Close site menu when user clicks outside of it
window.addEventListener('click', function(e) {
  if (siteMenuOpen && e.target != document.getElementById('site-menu-icon') &&
    !document.getElementById('site-menu').contains(e.target)) {
      toggleSiteMenu();
    }

  return;

}, false);
