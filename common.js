// Define global variables
var APP_DIRS = {
  'timespace': 'timespace', 'vicarious': 'vicarious',
  'canvashare': 'canvashare', 'thought-writer': 'thought-writer',
  'shapes-in-rain': 'shapes-in-rain', 'rhythm-of-life': 'rhythm-of-life',
  'account': 'user'
};
var onCrystalPrism = /(^|\.)crystalprism\.io$/.test(window.location.hostname);

// Each legacy app is served from <app>.crystalprism.io; locally the repo root
// is served as-is, so the same app lives under its directory
function appUrl(app, path) {
  path = path || '';
  if (onCrystalPrism) {
    return 'https://' + app + '.crystalprism.io/' + path;
  }
  return window.location.origin + '/' + APP_DIRS[app] + '/' + path;
}

function homeUrl(path) {
  path = path || '';
  return (onCrystalPrism ? 'https://crystalprism.io' : window.location.origin)
    + '/' + path;
}

/* Static HTML links to the legacy apps and the apex by their production URLs;
off crystalprism.io, point them at this origin so a dev session stays local.
Runs at load: every page includes common.js at the end of <body> */
function localizeAppLinks() {
  if (onCrystalPrism) {
    return;
  }
  var links = document.querySelectorAll('a[href^="https://"]');
  for (var i = 0; i < links.length; i++) {
    var url = new URL(links[i].href);
    var rest = url.pathname.slice(1) + url.search + url.hash;
    var app = url.hostname.replace(/\.crystalprism\.io$/, '');
    if (url.hostname == 'crystalprism.io') {
      links[i].href = homeUrl(rest);
    } else if (app != url.hostname && Object.hasOwn(APP_DIRS, app)) {
      links[i].href = appUrl(app, rest);
    }
  }
}

localizeAppLinks();

/* Where sign-in may send the visitor back to: a Crystal Prism page (or this
origin, locally) and nothing else */
function safeNext(url) {
  if (!url) {
    return null;
  }
  try {
    var parsed = new URL(url, window.location.href);
  } catch (error) {
    return null;
  }
  if (parsed.origin == window.location.origin && !onCrystalPrism) {
    return parsed.href;
  }
  if (parsed.protocol == 'https:'
    && /^([a-z0-9-]+\.)?crystalprism\.io$/.test(parsed.hostname)) {
      return parsed.href;
    }
  return null;
}

/* The path as it would read in the single-site layout, so a subdomain's root
still names its app (canvashare.crystalprism.io/easel/ -> /canvashare/easel/) */
var hostApp = window.location.hostname.split('.')[0];
var logicalPath = window.location.pathname;
if (onCrystalPrism && APP_DIRS[hostApp]) {
  logicalPath = '/' + APP_DIRS[hostApp] + logicalPath;
}
var domain = window.location.host;
var currentPath = logicalPath == '/' ? domain
  : logicalPath.split('/').slice(-2)[0];
var root = homeUrl().replace(/\/$/, '');
var profileLink;
var accountLink;
var signInLink;
var repinged = false // If Retry button was clicked for pingServer function
var scrolled = false // Stores if user scrolled down page with infinite scroll
var mobile = false; // Used to determine if user is on mobile device or desktop
var siteMenuOpen = false; // Stores if site menu is open or closed


var api = onCrystalPrism ? 'https://api.crystalprism.io/api'
  : 'http://localhost:5000/api';


/* Stored content written by other users never reaches innerHTML raw. Post and
comment bodies are rich text from Thought Writer's contenteditable editor, so
they keep exactly the markup that editor's toolbar emits (execCommand:
bold/italic/underline/strikeThrough/sub/superscript -> b i u strike sub sup,
foreColor -> font[color], justify* -> div[style=text-align] (Chrome) or
div[align] (Firefox), lists -> ol ul li, createLink -> a[href],
insertImage -> img[src], Enter -> div br) and nothing else. The same
allowlist is enforced on write by api.crystalprism.io
(utils/sanitize.py#clean_rich_text). Every other field is plain text and goes
in through textContent. */
var RICH_TEXT_CONFIG = {
  ALLOWED_TAGS: ['a', 'b', 'br', 'div', 'font', 'i', 'img', 'li', 'ol',
    'strike', 'sub', 'sup', 'u', 'ul'],
  ALLOWED_ATTR: ['align', 'color', 'href', 'src', 'style'],
  // href/src: http(s) and mailto only; DOMPurify separately admits any
  // data: URI for img src (pasted images) regardless of this regexp, so the
  // hook below narrows that to raster image mime types (no svg+xml, which
  // can carry a <script> or onload of its own)
  ALLOWED_URI_REGEXP: /^(?:https?|mailto):/i,
  // Validated by the hook below instead of the URI regexp
  ADD_URI_SAFE_ATTR: ['align', 'color']
};

var RICH_TEXT_STYLE = /^\s*(?:(?:text-align\s*:\s*(?:left|right|center|justify)|font-weight\s*:\s*(?:bold|normal|[1-9]00))\s*(?:;\s*|$))*$/i;
var RICH_TEXT_ALIGN = /^(?:left|right|center|justify)$/i;
var RICH_TEXT_COLOR = /^(?:#[0-9a-f]{3,8}|[a-z]+)$/i;
var RICH_TEXT_SRC = /^(?:https?:|data:image\/(?:png|jpe?g|gif|webp)[;,])/i;

if (window.DOMPurify) {
  DOMPurify.addHook('uponSanitizeAttribute', function(node, data) {
    var valid = {style: RICH_TEXT_STYLE, align: RICH_TEXT_ALIGN,
      color: RICH_TEXT_COLOR, src: RICH_TEXT_SRC}[data.attrName];
    if (valid && !valid.test(data.attrValue)) {
      data.keepAttr = false;
    }
  });
}

// Plain text of an HTML string, parsed in an inert document (no scripts run,
// no images load), so entities decode exactly as innerHTML would show them
function htmlToText(html) {
  return new DOMParser().parseFromString(String(html), 'text/html').body
    .textContent;
}

/* Render a stored post or comment body into element. Fails closed: if
DOMPurify did not load, the text shows without its formatting. */
function setRichText(element, html) {
  if (window.DOMPurify) {
    element.innerHTML = DOMPurify.sanitize(String(html), RICH_TEXT_CONFIG);
  } else {
    element.textContent = htmlToText(html);
  }
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
  var projectLinks = [homeUrl(),
    'https://methods.crystalprism.io/', 'https://giftme.crystalprism.io/',
    'https://passage.crystalprism.io/', 'https://restock.crystalprism.io/',
    'https://nexus.crystalprism.io/', 'https://space.crystalprism.io/',
    'https://savor.crystalprism.io/', 'https://idreamofneon.crystalprism.io/',
    'https://vantage.crystalprism.io/', 'https://vitals.crystalprism.io/',
    'https://tide.crystalprism.io/', 'https://flare.crystalprism.io/',
    'https://glimpse.crystalprism.io/', 'https://menagerie.crystalprism.io/',
    'https://toile.crystalprism.io/',
    appUrl('timespace'), appUrl('shapes-in-rain'),
    appUrl('rhythm-of-life'), appUrl('canvashare'), appUrl('thought-writer'),
    appUrl('vicarious'),
    'https://hn-stats.crystalprism.io/', 'https://pause.crystalprism.io/',
    'https://marian.crystalprism.io/', 'https://vroom.crystalprism.io/',
    appUrl('account', localStorage.getItem('username') ? 'my-account/'
      : 'sign-in/')];

  var projectTitles = ['Home',
    'Methods', 'GiftMe', 'Passage', 'Restock', 'Nexus', 'Space', 'Savor',
    'i dream of neon', 'Vantage', 'Vitals', 'Tide', 'flare', 'Glimpse',
    'Menagerie', 'Toile',
    'Timespace', 'Shapes In Rain',
    'Rhythm of Life', 'CanvaShare', 'Thought Writer', 'Vicarious',
    'Hacker News Stats', 'Pause', 'Marian', 'Vroom', 'Account'];

  // One row per menu entry; used by both the fallback list and apps.json
  function addMenuRow(link, title, iconSrc, isAccount) {
    var menuRow = document.createElement('tr');
    menuRow.classList.add('site-menu-row');

    menuRow.dataset.link = link;
    if (isAccount) {
      menuRow.id = 'site-menu-account';
    }

    menuRow.addEventListener('click', function() {
      window.location = this.dataset.link;
      return;
    }, false);

    var menuImageCell = document.createElement('td');
    menuImageCell.classList.add('site-menu-image-cell');

    var menuImage = document.createElement('img');
    menuImage.classList.add('site-menu-image');
    menuImage.src = iconSrc;

    var menuTextCell = document.createElement('td');
    menuTextCell.classList.add('site-menu-text-cell');

    var menuText = document.createElement('div');
    menuText.classList.add('site-menu-text');
    menuText.innerHTML = title;

    menuRow.appendChild(menuImageCell);
    menuImageCell.appendChild(menuImage);
    menuRow.appendChild(menuTextCell);
    menuTextCell.appendChild(menuText);
    siteMenu.appendChild(menuRow);
  }

  // Home first, the given apps, Account last
  function buildMenuRows(apps) {
    // Keep a corrected Account link (see setAccountMenuRow) across a rebuild
    var current = document.getElementById('site-menu-account');
    if (current) {
      apps[apps.length - 1].link = current.dataset.link;
    }
    var rows = siteMenu.querySelectorAll('.site-menu-row');
    for (var r = 0; r < rows.length; r++) {
      siteMenu.removeChild(rows[r]);
    }
    for (var i = 0; i < apps.length; i++) {
      var isAccount = i == apps.length - 1;
      addMenuRow(apps[i].link, apps[i].title,
        (isAccount ? homeUrl() : apps[i].link) + 'favicon.ico', isAccount);
    }
  }

  var fallbackApps = [];
  for (var i = 0; i < projectLinks.length; i++) {
    fallbackApps.push({ link: projectLinks[i], title: projectTitles[i] });
  }
  buildMenuRows(fallbackApps);

  // The hosted app list is the source of truth; the arrays above are the
  // fallback if it cannot be fetched
  fetch('/apps.json').then(function(response) {
    if (!response.ok) {
      throw new Error('apps.json ' + response.status);
    }
    return response.json();
  }).then(function(list) {
    var live = list.filter(function(app) {
      return app.status === 'live';
    }).map(function(app) {
      // Legacy apps stay on this origin in dev, as appUrl does
      var sub = app.url.replace(/^https:\/\/([a-z0-9-]+)\.crystalprism\.io\/$/,
        '$1');
      var local = !onCrystalPrism && Object.hasOwn(APP_DIRS, sub);
      return { link: local ? appUrl(sub) : app.url, title: app.name };
    });
    if (!live.length) {
      return;
    }
    buildMenuRows([fallbackApps[0]].concat(live,
      [fallbackApps[fallbackApps.length - 1]]));
  }).catch(function() {});

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
  accountLink.href = 'https://auth.crystalprism.io/register';
  signInLink = document.createElement('a');
  signInLink.id = 'sign-in-link';
  signInLink.href = appUrl('account', 'sign-in/');
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
  copyright.innerHTML = '&copy; Copyright 2017-' + new Date().getFullYear() +
    ' <a href="' + root + '">Crystal Prism</a>';

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


// Show the signed-out account menu
function showSignedOut() {
  setAccountMenuRow(false);
  accountLink.innerHTML = 'Create Account';
  signInLink.innerHTML = 'Sign In';

  /* Store current window for user to return to after logging in, if current
  window is not homepage, Create Account, or Sign In pages */
  signInLink.href = appUrl('account', 'sign-in/');
  if (currentPath != domain && currentPath != 'create-account'
    && currentPath != 'sign-in') {
      signInLink.href += '?next=' + encodeURIComponent(window.location.href);
    }
  signInLink.onclick = null;

  return;
}


/* Point the site menu's Account row at My Account or Sign In. The header is
built from the stored username, which a first visit to a subdomain lacks, so
the session check corrects it */
function setAccountMenuRow(signedIn) {
  var row = document.getElementById('site-menu-account');
  if (row) {
    row.dataset.link = appUrl('account', signedIn ? 'my-account/' : 'sign-in/');
  }

  return;
}


/* The API throttles /api/login and account creation with a 429; show its
message rather than the wrong-credentials warning */
function showRateLimited() {
  window.alert('Too many attempts. Try again later.');
  return;
}


/* Check if user is logged in. The session is an HttpOnly cookie
(cp_session) set by the API, so script never sees the token: the stored
username is only a cheap hint, and /api/user/verify is the answer. */
function checkIfLoggedIn() {
  /* One-time migration: browsers signed in before the cookie session kept
  the token in localStorage. Exchange it for the cookie, then drop it
  whatever the answer - a stale or pre-rotation token (401) simply leaves the
  visitor signed out */
  var legacyToken = localStorage.getItem('token');

  if (legacyToken) {
    return fetch(api + '/session', {
      credentials: 'include',
      headers: {'Authorization': 'Bearer ' + legacyToken},
      method: 'POST',
    })

      .catch(function(error) {
        return;
      })

      .then(function() {
        localStorage.removeItem('token');
        return verifySession();
      });
  }

  /* The stored username is a per-origin hint, so a first visit to a
  subdomain has none: always ask the server. Show the signed-out menu
  meanwhile. */
  showSignedOut();
  return verifySession();
}


// Ask the server whether the session cookie is valid. Pages wait on this
// before rendering, so a request that stalls is abandoned after 4s and the
// visitor is treated as signed out (the abort rejects into the .catch below)
function verifySession() {
  var controller = new AbortController();
  var timer = setTimeout(function() { controller.abort(); }, 4000);

  return fetch(api + '/user/verify', {
    credentials: 'include',
    method: 'GET',
    signal: controller.signal,
  })

    // Set account menu to default if server is down
    .catch(function(error) {
      showSignedOut();
      return false;
    })

    .then(function(response) {
      if (!response) {
        return false;
      }

      /* If server verifies the session, display link to profile, My Account
      page, and Sign In page (with "Sign Out" title) */
      if (response.ok) {
        return response.json().then(function(payload) {
          // Set localStorage username to payload username
          localStorage.setItem('username', payload['username']);

          profileLink.textContent = payload['username'];
          profileLink.href = appUrl('account', '?username=' + encodeURIComponent(payload['username']));
          setAccountMenuRow(true);
          accountLink.innerHTML = 'My Account';
          accountLink.href = appUrl('account', 'my-account/');
          signInLink.innerHTML = 'Sign Out';

          /* Sign out from this page with a POST, so no link anywhere can
          sign a visitor out; the Sign In page then says how it went */
          signInLink.href = appUrl('account', 'sign-in/');
          signInLink.onclick = signOut;

          return true;
        });
      }

      /* If server responds with unauthorized status, set account menu to
      default and remove username from localStorage */
      if (response.status == 401) {
        localStorage.removeItem('username');
        showSignedOut();

        // Redirect to Sign In page if user is on My Account page
        if (currentPath == 'my-account') {
          window.location = appUrl('account', 'sign-in/');
        }
      }

      return false;
    })

    /* A 200 whose body is not JSON (a captive portal, an intermediary's HTML
    page) rejects response.json(): settle to signed out so every caller's
    .then still runs */
    .catch(function(error) {
      showSignedOut();
      return false;
    })

    .finally(function() {
      clearTimeout(timer);
    });
}


// Sign out: clear the HttpOnly session cookie (only the server can) and the
// stored username. Resolves true only if the server cleared the cookie; on
// failure the cookie is still live, so the username stays and the UI keeps
// showing the visitor as signed in. A request that stalls is abandoned after
// 4s and counts as a failure
function requestLogout() {
  var controller = new AbortController();
  var timer = setTimeout(function() { controller.abort(); }, 4000);

  return fetch(api + '/logout', {
    credentials: 'include',
    method: 'POST',
    signal: controller.signal,
  })

    .then(function(response) {
      if (!response.ok) {
        return false;
      }
      localStorage.removeItem('username');
      return true;
    })

    .catch(function(error) {
      return false;
    })

    .finally(function() {
      clearTimeout(timer);
    });
}


// The account menu's Sign Out: ask the server to end the session, then show
// the Sign In page, which reads the outcome from the session check itself
function signOut(event) {
  event.preventDefault();
  if (signInLink.getAttribute('aria-disabled') == 'true') {
    return;
  }
  signInLink.setAttribute('aria-disabled', 'true');
  signInLink.textContent = 'Signing Out…';

  requestLogout().then(function() {
    window.location = appUrl('account', 'sign-in/?signed-out');
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
