// Define global variables
var requestStart = 0; // Range start for number of drawings to request
var requestEnd = 12; // Range end for number of drawings to request
var errorMessage;
var moreDrawingsToDisplay = false;
var loadingDrawings = false; // True while a request for drawings is in flight
var gallery = document.getElementById('gallery');
var continueOption = document.getElementById('continue-option');
var menuOpen = false;


// Define load functions
window.onload = function() {
  // Load preview of in-progress drawing if one is stored locally
  if (localStorage.getItem('drawing-source')) {
    // Unhide continue option in drawing menu
    continueOption.classList.remove('hidden');

    // Go to easel page if continue option is clicked
    continueOption.onclick = function() {
      // Add click animation to create pop effect
      this.classList.add('clicked');

      /* Remove clicked class from clicked menu option to allow animation to
      play if clicked again */
      this.addEventListener('animationend', function() {
        this.classList.remove('clicked');
        return;
      }, false);

      window.location = 'easel/';

      return;
    };

    /* Add preview of locally stored in-progress drawing to continue option
    button */
    document.getElementById('drawing-draft').src = localStorage
      .getItem('drawing-source');
  }

  // Set quote that appears when hovering over gallery title
  setHoverTitle();

  // Create page header (from common.js script)
  createPageHeader();

  /* Check if user is logged in (from common.js script), then load drawings:
  the stored username decides which hearts show as liked, and a first visit
  to this subdomain has none until the session check writes it */
  Promise.resolve(checkIfLoggedIn()).then(loadDrawings);

  // Check if Crystal Prism API is online (from common.js script)
  pingServer(retryFunctions);

  // Create page footer (from common.js script)
  createPageFooter();

  return;
}


// Functions to run when Retry button is clicked from server down banner
function retryFunctions() {
  // Clear gallery to display most up-to-date server drawings
  gallery.innerHTML = '';
  requestStart = 0;
  requestEnd = 12;

  Promise.resolve(checkIfLoggedIn()).then(loadDrawings);

  return;
}


// Set quote that appears when hovering over gallery title
function setHoverTitle() {
  // Define array of quotes about canvases
  var hoverTitles = ['"The world is but a canvas to our imagination." -Henry' +
    ' David Thoreau',
    '"Life is a great big canvas; throw all the paint you can at it." -Danny' +
    ' Kaye',
    '"A great artist can paint a great picture on a small canvas." -Charles ' +
    'Dudley Warner',
    '"I put on the canvas whatever comes into my mind." -Frida Kahlo',
    '"An empty canvas is a living wonder... far lovelier than certain ' +
    'pictures." -Wassily Kandinsky',
    '"I never know what I\'m going to put on the canvas. The canvas paints ' +
    'itself. I\'m just the middleman." -Peter Max',
    '"Cover the canvas at the first go, then work at it until you see ' +
    'nothing more to add." -Camille Pissarro',
    '"All I try to do is put as many colors as I can on the canvas every ' +
    'night." -Leslie Odom, Jr.',
    '"I was blown away by being able to color. Then I started to draw... ' +
    'bringing a blank white canvas to life was fascinating." James De La ' +
    'Vega'];

  // Select a random quote to display as hover title
  var randomNumber = Math.floor(Math.random() * hoverTitles.length);
  document.getElementById('gallery-title').title = hoverTitles[randomNumber];

  return;
}


// Load drawings from server
function loadDrawings() {
  var start = requestStart;
  loadingDrawings = true;
  moreDrawingsToDisplay = false;

  // Remove the empty-gallery message if it is displayed
  if (errorMessage && errorMessage.parentNode == gallery) {
    gallery.removeChild(errorMessage);
  }

  // Loading shows in the gallery from the first frame, below any drawings
  slotLoading(gallery, start == 0 ? 'Loading drawings…' :
    'Loading more drawings…');

  return fetchWithTimeout(api + '/canvashare/drawings?start=' + start +
    '&end=' + requestEnd)

    .then(function(response) {
      if (!response.ok) {
        throw new Error('Server answered ' + response.status);
      }

      // Remove server down banner from page (from common.js script)
      pingServer();

      return response.json();
    })

    .then(function(drawings) {
      loadingDrawings = false;
      clearSlotStatus(gallery);

      // An empty gallery says so, and how to fill it
      if (drawings.length == 0) {
        if (start == 0) {
          errorMessage = document.createElement('text');
          errorMessage.id = 'error-message';
          errorMessage.textContent = 'No drawings yet. Click the plus ' +
            'button to make the first one.';
          gallery.appendChild(errorMessage);
        }

        return;
      }

      /* Assess if there are more than requested drawings - 1 (number of
      drawings that will be displayed in gallery) on server */
      if (drawings.length > (requestEnd - start - 1)) {
        moreDrawingsToDisplay = true;
        var loadNumber = requestEnd - start - 1;
      }

      // If there are not, display all drawings sent from server
      else {
        var loadNumber = drawings.length;
      }

      displayDrawings(drawings.slice(0, loadNumber));

      /* Replace locally stored drawings if this is the initial request, or
      add to them otherwise */
      try {
        var localDrawings = start == 0 ? [] : JSON.parse(localStorage
          .getItem('canvashare-gallery-drawings')) || [];

        for (var i = 0; i < drawings.length; i++) {
          localDrawings[start + i] = drawings[i];
        }

        // Store drawings in localStorage for offline loading
        localStorage.setItem('canvashare-gallery-drawings', JSON
          .stringify(localDrawings));
      } catch (e) {}

      return;
    })

    .catch(function() {
      loadingDrawings = false;

      // On first load, cached drawings stand in if they are stored
      if (start == 0 && !gallery.getElementsByClassName('drawing-container')
        .length) {
          try {
            var drawings = JSON.parse(localStorage
              .getItem('canvashare-gallery-drawings') || '[]');
          } catch (e) {
            var drawings = [];
          }

          if (drawings.length) {
            clearSlotStatus(gallery);
            displayDrawings(drawings.slice(0, requestEnd - 1));
            return;
          }
        }

      /* Otherwise the failure shows below any drawings already in the
      gallery, and Retry asks for the same drawings again */
      slotFailure(gallery, start == 0 ? "Couldn't load the gallery." :
        "Couldn't load more drawings.", loadDrawings);

      return;
    });
}


// Display passed drawings in gallery
function displayDrawings(drawings) {
  for (var i = 0; i < drawings.length; i++) {
    // Create container for drawing and its components
    var drawingContainer = document.createElement('div');
    drawingContainer.classList.add('drawing-container');

    // Create container for drawing title
    var drawingTitle = document.createElement('a');
    drawingTitle.classList.add('drawing-title');
    drawingTitle.href = 'easel/?drawing=' + drawings[i]['drawing_id'];
    drawingTitle.textContent = drawings[i]['title'];

    // Create drawing image
    var drawing = document.createElement('img');
    drawing.classList.add('drawing');
    drawing.src = drawings[i]['url'];

    // Set data-drawing attribute as drawing id for later identification
    drawing.dataset.drawing = drawings[i]['drawing_id'];

    // Go to easel page for drawing if user clicks drawing
    drawing.onclick = function() {
      window.location = 'easel/?drawing=' + this.dataset.drawing;
      return;
    }

    // Create container for drawing artist and number of likes and views
    var drawingInfo = document.createElement('div');
    drawingInfo.classList.add('drawing-info');

    // Create container for number of drawing likes
    var drawingLikes = document.createElement('div');
    drawingLikes.classList.add('drawing-likes');
    drawingLikes.title = 'Likes';

    // Create text to display number of likes
    var likeText = document.createElement('text');
    likeText.textContent = String(Number(drawings[i]['like_count']) || 0);

    // Set data-drawing attribute as drawing id for later identification
    likeText.dataset.drawing = 'likes' + drawings[i]['drawing_id'];

    // Set likers to list of users who liked drawing
    var likers = drawings[i]['likers'];

    // Create drawing views container
    var drawingViews = document.createElement('div');
    drawingViews.classList.add('drawing-views');
    drawingViews.title = 'Views';

    // Create eye icon to display with drawing views
    var viewsIcon = document.createElement('i');
    viewsIcon.classList.add('far');
    viewsIcon.classList.add('fa-eye');

    // Create text to display number of views
    var viewText = document.createElement('text');
    viewText.textContent = String(Number(drawings[i]['views']) || 0);

    // Create container for drawing artist
    var drawingArtist = document.createElement('div');
    drawingArtist.classList.add('drawing-artist');
    drawingArtist.title = 'Artist';

    // Create link to artist's profile
    var artistLink = document.createElement('a');
    artistLink.href = appUrl('account', '?username=' + encodeURIComponent(drawings[i].username));
    artistLink.textContent = drawings[i].username;

    gallery.appendChild(drawingContainer);
    drawingContainer.appendChild(drawingTitle);
    drawingContainer.appendChild(drawing);
    drawingContainer.appendChild(drawingInfo);
    drawingInfo.appendChild(drawingLikes);
    drawingLikes.appendChild(likeText);
    drawingInfo.appendChild(drawingViews);
    drawingViews.appendChild(viewsIcon);
    drawingViews.appendChild(viewText);
    drawingInfo.appendChild(drawingArtist);
    drawingArtist.appendChild(artistLink);

    // Display drawing like hearts
    displayDrawingLikes(drawings[i]['drawing_id'], likers);
  }

  return;
}


// Display drawing like hearts for passed drawing
function displayDrawingLikes(drawingId, likers) {
  // Get likes text that has data-drawing attribute set as drawing id
  var likeText = document
    .querySelectorAll('[data-drawing="likes' + drawingId + '"]')[0];

  /* If current user liked the drawing, display a filled-in red heart in
  likes container */
  for (var i = 0; i < likers.length; i++) {

    if (likers[i]['username'] == localStorage.getItem('username')) {
      var likedHeart = document.createElement('i');
      likedHeart.classList.add('fas');
      likedHeart.classList.add('fa-heart');
      likedHeart.dataset.drawinglike = likers[i]['drawing_like_id'];
      likedHeart.dataset.drawing = drawingId;
      likeText.parentNode.insertBefore(likedHeart, likeText);

      // Update like count when user clicks heart
      likedHeart.onclick = updateLikes;
      keyboardButton(likedHeart, 'Like');
      likedHeart.setAttribute('aria-pressed', 'true');

      return;
    }
  }

  // Otherwise, display an empty heart outline
  var unlikedHeart = document.createElement('i');
  unlikedHeart.classList.add('far');
  unlikedHeart.classList.add('fa-heart');
  likeText.parentNode.insertBefore(unlikedHeart, likeText);
  unlikedHeart.dataset.drawing = drawingId;

  // Update like count when user clicks heart
  unlikedHeart.onclick = updateLikes;
  keyboardButton(unlikedHeart, 'Like');
  unlikedHeart.setAttribute('aria-pressed', 'false');

  return;
}


// Update drawing's like count
function updateLikes() {
  var heart = this;

  // Ignore clicks while this heart's last request is still in flight
  if (heart.dataset.pending) {
    return;
  }

  clearInlineError(heart);

  // Add click animation to create pop effect
  heart.classList.add('clicked');

  /* Remove clicked class from heart to allow animation to play when clicked
  again */
  heart.addEventListener('animationend', function() {
    heart.classList.remove('clicked');
    return;
  }, false);

  var likeText = heart.nextSibling;
  var previousCount = likeText.textContent;
  var wasLiked = heart.classList.contains('fas');

  // The heart and count change at once, and change back if the request fails
  heart.dataset.pending = 'true';
  setHeart(heart, !wasLiked);
  likeText.textContent = (parseInt(previousCount) || 0) + (wasLiked ? -1 : 1);

  function settle() {
    delete heart.dataset.pending;
    return;
  }

  function revert(message, signInLink) {
    setHeart(heart, wasLiked);
    likeText.textContent = previousCount;
    settle();

    // The reason shows under this drawing's likes, with a way to sign in
    var note = inlineError(heart, message, heart.parentNode.parentNode);
    if (signInLink) {
      var link = document.createElement('a');
      link.href = signInHref();
      link.textContent = 'Sign in';
      note.appendChild(document.createTextNode(' '));
      note.appendChild(link);
    }
    return;
  }

  function networkFailure() {
    // Add server down banner to page (from common.js script)
    pingServer(retryFunctions);
    revert("Your like didn't go through. Check your connection and try again.");
    return;
  }

  // If heart was filled in, decrease drawing like count
  if (wasLiked) {
    return fetchWithTimeout(api + '/canvashare/drawing-like/' + heart.dataset
      .drawinglike, {
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        method: 'DELETE',
      })

      .then(function(response) {
        // Remove server down banner from page (from common.js script)
        pingServer();

        if (response.ok) {
          delete heart.dataset.drawinglike;
          settle();
          return;
        }

        revert('Only signed-in visitors can like drawings.', true);
        return;
      }, networkFailure);
  }

  // Otherwise, send request to server to increase like count
  var data = JSON.stringify({'drawing_id': heart.dataset.drawing});

  return fetchWithTimeout(api + '/canvashare/drawing-like', {
    credentials: 'include',
    headers: {'Content-Type': 'application/json'},
    method: 'POST',
    body: data,
  })

    .then(function(response) {
      // Remove server down banner from page (from common.js script)
      pingServer();

      if (response.ok) {
        return response.text().then(function(drawingLikeId) {
          heart.dataset.drawinglike = drawingLikeId;
          settle();
          return;
        });
      }

      revert('Only signed-in visitors can like drawings.', true);
      return;
    }, networkFailure)

    .catch(function() {
      // The like went through but its id did not arrive: ask again on reload
      settle();
      return;
    });
}


// Show a heart as liked (filled red) or not (outline), for sight and sound
function setHeart(heart, liked) {
  heart.classList.toggle('fas', liked);
  heart.classList.toggle('far', !liked);
  heart.setAttribute('aria-pressed', liked ? 'true' : 'false');
  return;
}


/* Toggle shrink style on header when user scrolls and request more drawings
(infinite scroll) */
window.addEventListener('scroll', function() {
  if (scrolled) {
    // Add shrink style to header when user scrolls down page
    if (window.pageYOffset > 60) {
      document.getElementById('header').classList.add('shrink');
    }

    // Remove shrink style when user scrolls back to top of page
    else {
      document.getElementById('header').classList.remove('shrink');
    }

    requestMoreDrawings();
  }

  /* Otherwise, set scrolled variable to true to indicate user scrolled down
  infinite scroll page (used for smooth scrolling in common.js file) */
  scrolled = true;

  return;
}, false);

function requestMoreDrawings() {
  /* If user has scrolled more than 90% of way down page and the server has
  more drawings, update request numbers */
  if (percentScrolled() > 90 && moreDrawingsToDisplay && !loadingDrawings) {
    // Set drawing request start number to previous end number - 1
    requestStart = requestEnd - 1;

    // Set drawing request end number to previous end number + number of
    // drawings that can fit in one row of gallery
    requestEnd = requestEnd + Math.floor((gallery.offsetWidth) / (document
      .getElementsByClassName('drawing-container')[0].offsetWidth));

    // Load drawings with new request numbers
    loadDrawings();
  }

  return;
}


// Toggle drawing menu when user clicks plus icon
document.getElementById('plus-icon').onclick = toggleMenu;
keyboardButton(document.getElementById('plus-icon'), 'Drawing menu');
document.getElementById('plus-icon').setAttribute('aria-expanded', 'false');
document.getElementById('plus-icon').setAttribute('aria-controls', 'menu');
keyboardButton(document.getElementById('new-option'), 'Create new drawing');
keyboardButton(continueOption, 'Continue drawing');

// The closed menu sits off screen: keep it out of the tab order too
document.getElementById('menu').inert = true;

// Close drawing menu when user leaves page, if it is open
window.onbeforeunload = function() {
  if (menuOpen) {
    toggleMenu();
    return;
  }
}

function toggleMenu() {
  var menu = document.getElementById('menu');
  var plusIcon = document.getElementById('plus-icon');

  // Close menu if it is open
  if (menuOpen) {
    // Add click animation to create pop effect
    plusIcon.classList.add('clicked');
    plusIcon.classList.remove('open');
    menu.classList.remove('visible');

    // Set icon back to unopened view (plus sign)
    plusIcon.innerHTML = 'add_circle';
    menuOpen = false;
    plusIcon.setAttribute('aria-expanded', 'false');
    menu.inert = true;

    /* Remove clicked class from icon to allow animation to play when clicked
    again */
    plusIcon.addEventListener('animationend', function() {
      plusIcon.classList.remove('clicked');
      return;
    }, false);

    // Count number of style transitions that occur
    var transitions = 0

    // Hide menu after it moves down the page to close
    menu.addEventListener('transitionend', function hideMenu() {
      transitions++;

      // Only run menu function once, after first transition
      if (transitions == 1) {
        menu.classList.add('hidden');
        menu.removeEventListener('transitionend', hideMenu, false);
      }

      return;
    }, false);

    return;
  }

  // Otherwise, open menu
  plusIcon.classList.add('clicked');
  plusIcon.classList.add('open');
  menu.classList.remove('hidden');
  menu.classList.add('visible');

  // Set icon to opened view (minus sign)
  plusIcon.innerHTML = 'remove_circle';
  menuOpen = true;
  plusIcon.setAttribute('aria-expanded', 'true');
  menu.inert = false;

  /* Remove clicked class from icon to allow animation to play when clicked
  again */
  plusIcon.addEventListener('animationend', function() {
    plusIcon.classList.remove('clicked');
    return;
  }, false);

  return;
}


/* Set sessionStorage drawing request item for new drawing and go to easel page
when user clicks new option from menu */
document.getElementById('new-option').onclick = function() {
  // Add click animation to create pop effect
  this.classList.add('clicked');

  /* Remove clicked class from clicked menu option to allow animation to play
  if clicked again */
  this.addEventListener('animationend', function() {
    this.classList.remove('clicked');
    return;
  }, false);

  // Set sessionStorage item for create new drawing request
  sessionStorage.setItem('drawing-request', 'new');

  // Go to easel page
  window.location = 'easel/';

  return;
}
