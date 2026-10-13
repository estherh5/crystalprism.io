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
Runs at load (every page includes common.js at the end of <body>), and again
over the footer, which is built later */
function localizeAppLinks(scope) {
  if (onCrystalPrism) {
    return;
  }
  var links = (scope || document).querySelectorAll('a[href^="https://"]');
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
var repinged = false // If Retry button was clicked for pingServer function
var scrolled = false // Stores if user scrolled down page with infinite scroll
var mobile = false; // Used to determine if user is on mobile device or desktop


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


/* The fleet's app list, shaped like crystalprism.io/apps.json (the source of
truth, fetched by createPageHeader); this copy only covers an outage */
var FLEET_FALLBACK = [
  ['methods', 'Methods'], ['giftme', 'GiftMe'], ['passage', 'Passage'],
  ['restock', 'Restock'], ['nexus', 'Nexus'], ['space', 'Space'],
  ['savor', 'Savor'], ['idreamofneon', 'i dream of neon'],
  ['vantage', 'Vantage'], ['vitals', 'Vitals'], ['tide', 'Tide'],
  ['flare', 'flare'], ['glimpse', 'Glimpse'], ['menagerie', 'Menagerie'],
  ['toile', 'Toile'], ['timespace', 'Timespace'],
  ['shapes-in-rain', 'Shapes In Rain'], ['rhythm-of-life', 'Rhythm of Life'],
  ['canvashare', 'CanvaShare'], ['thought-writer', 'Thought Writer'],
  ['vicarious', 'Vicarious'], ['hn-stats', 'Hacker News Stats'],
  ['pause', 'Pause'], ['marian', 'Marian'], ['vroom', 'Vroom']
].map(function(app) {
  return { key: app[0], name: app[1], tagline: '', status: 'live',
    url: 'https://' + app[0] + '.crystalprism.io/',
    icon: 'https://crystalprism.io/images/' + app[0] + '-icon.png' };
});

// This page's apps.json key: the legacy app it belongs to, or none (apex)
var fleetKey = (function() {
  var dir = logicalPath.split('/')[1];
  for (var app in APP_DIRS) {
    if (APP_DIRS[app] == dir) {
      return app;
    }
  }
  return 'crystalprism';
})();

var fleetMenu = null; // FleetKit.mountMenu handle, set by createPageHeader
var signingOut = false;
var menuUsername = null; // The signed-in username the menu shows

// Legacy apps stay on this origin in dev, as appUrl does
function localizeFleet(apps) {
  return apps.map(function(app) {
    var sub = app.url.replace(/^https:\/\/([a-z0-9-]+)\.crystalprism\.io\/$/,
      '$1');
    if (!onCrystalPrism && Object.hasOwn(APP_DIRS, sub)) {
      app.url = appUrl(sub);
    }
    return app;
  });
}


/* Header: the diamond home mark at the leading end, the homepage's theme
toggle, and the fleet apps + account menu at the trailing end */
function createPageHeader() {
  var header = document.createElement('div');
  header.id = 'header';
  header.dataset.session = 'pending';
  var headerContainer = document.createElement('div');
  headerContainer.id = 'header-container';
  header.appendChild(headerContainer);

  var home = document.createElement('a');
  home.id = 'site-home';
  home.href = homeUrl();
  home.setAttribute('aria-label', 'Crystal Prism home');
  var homeIcon = document.createElement('img');
  homeIcon.src = root + '/images/site-menu-icon-shadow.svg';
  homeIcon.alt = '';
  home.appendChild(homeIcon);
  headerContainer.appendChild(home);

  // Add theme container to header on homepage
  if (currentPath == domain) {
    headerContainer.appendChild(document.getElementById('theme-container'));
  }

  var slot = document.createElement('div');
  slot.id = 'fleet-menu';
  headerContainer.appendChild(slot);

  // Insert header before first element in body
  document.body.insertAdjacentElement('afterbegin', header);

  fleetMenu = FleetKit.mountMenu(slot, {
    apps: localizeFleet(FleetKit.shapeFleet(null, fleetKey, FLEET_FALLBACK)),
    user: null,
    rows: signedOutRows(),
    placement: 'down-end',
    triggerClass: 'cp-fleet-trigger'
  });

  // Same-origin: every app host proxies /apps.json to the apex copy
  FleetKit.getFleetApps(fleetKey, { url: '/apps.json', fallback: FLEET_FALLBACK })
    .then(function(apps) {
      fleetMenu.setApps(localizeFleet(apps));
    });

  return;
}


// Create page footer: the fleet footer, in flow at the end of the page
function createPageFooter() {
  var footer = FleetKit.renderFooter(document.body);
  footer.id = 'footer';
  localizeAppLinks(footer);
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


/* The menu's signed-out rows: Sign In, carrying the current page as ?next=
unless this is the homepage or an account entry page */
function signedOutRows() {
  var href = appUrl('account', 'sign-in/');
  if (currentPath != domain && currentPath != 'create-account'
    && currentPath != 'sign-in') {
      href += '?next=' + encodeURIComponent(window.location.href);
    }
  return [{ label: 'Sign in', href: href }];
}


// Show the signed-out account menu
function showSignedOut() {
  if (fleetMenu) {
    fleetMenu.setUser(null, signedOutRows());
  }
  return;
}


// Show `username` as signed in (also after My Account renames them). While a
// sign-out is in flight the last row says so, and choosing it does nothing
function showSignedIn(username) {
  menuUsername = username;
  if (fleetMenu) {
    fleetMenu.setUser({ label: username }, [
      { label: 'Profile',
        href: appUrl('account', '?username=' + encodeURIComponent(username)) },
      { label: 'Settings', href: appUrl('account', 'my-account/') },
      signingOut ? { label: 'Signing out…', onSelect: function() {} }
        : { label: 'Sign out', onSelect: signOut }
    ]);
  }
  return;
}


/* Record the settled session on the header (data-session), once the server
has answered or the check was abandoned */
function settleSession(username) {
  var header = document.getElementById('header');
  if (header) {
    header.dataset.session = username ? 'signed-in' : 'signed-out';
  }
  if (username) {
    showSignedIn(username);
  } else {
    showSignedOut();
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
      settleSession(null);
      return false;
    })

    .then(function(response) {
      if (!response) {
        return false;
      }

      /* If server verifies the session, the menu shows the username with
      Profile, Settings (My Account) and Sign Out */
      if (response.ok) {
        return response.json().then(function(payload) {
          // Set localStorage username to payload username
          localStorage.setItem('username', payload['username']);
          settleSession(payload['username']);
          return true;
        });
      }

      /* If server responds with unauthorized status, set account menu to
      default and remove username from localStorage */
      if (response.status == 401) {
        localStorage.removeItem('username');
        settleSession(null);

        // Redirect to Sign In page if user is on My Account page
        if (currentPath == 'my-account') {
          window.location = appUrl('account', 'sign-in/');
        }
        return false;
      }

      // Any other answer (a 5xx): signed out for this page
      settleSession(null);
      return false;
    })

    /* A 200 whose body is not JSON (a captive portal, an intermediary's HTML
    page) rejects response.json(): settle to signed out so every caller's
    .then still runs */
    .catch(function(error) {
      settleSession(null);
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


/* The menu's Sign Out: a POST from this page, so no link anywhere can sign a
visitor out. Ask the server to end the session, then show the Sign In page,
which reads the outcome from the session check itself */
function signOut() {
  if (signingOut) {
    return;
  }
  signingOut = true;
  showSignedIn(menuUsername);
  document.body.style.cursor = 'progress';

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
