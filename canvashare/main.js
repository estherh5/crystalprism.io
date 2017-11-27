// Define global variables
var requestStart = 0; // Range start for number of drawings to request
var requestEnd = 12; // Range end for number of drawings to request
var errorMessage = null;
var moreDrawingsOnServer = false;
var gallery = document.getElementById('gallery');
var continueOption = document.getElementById('continue-option');
var menuOpen = false;


// Define load functions
window.onload = function() {
  /* Remove sessionStorage items from previous drawing clicks so user can
  select new or blank drawing to start from */
  sessionStorage.removeItem('drawing-title');
  sessionStorage.removeItem('drawing-source');

  // Create page header (from common.js script)
  createPageHeader();

  // Check if user is logged in (from common.js script)
  checkIfLoggedIn();

  // Set quote that appears when hovering over gallery title
  setHoverTitle();

  // Load drawings to gallery from server
  loadDrawings();

  // Load preview of in-progress drawing if one is stored locally
  if (localStorage.getItem('drawing-source') != null) {
    // Unhide continue option in drawing menu
    continueOption.classList.remove('hidden');

    // Set drawing source as in-progress drawing when option is clicked
    continueOption.onclick = setDrawingSource;

    /* Add preview of locally stored in-progress drawing to continue option
    button */
    document.getElementById('drawing-draft').src = localStorage
      .getItem('drawing-source');
  }

  return;
}


// Set quote that appears when hovering over gallery title
function setHoverTitle() {
  // Define array of quotes about canvases
  var hoverTitles = ['"The world is but a canvas to our imagination." -Henry David Thoreau',
  '"Life is a great big canvas; throw all the paint you can at it." -Danny Kaye',
  '"A great artist can paint a great picture on a small canvas." -Charles Dudley Warner',
  '"I put on the canvas whatever comes into my mind." -Frida Kahlo',
  '"An empty canvas is a living wonder... far lovelier than certain pictures." -Wassily Kandinsky',
  '"I never know what I\'m going to put on the canvas. The canvas paints itself. I\'m just the middleman." -Peter Max',
  '"Cover the canvas at the first go, then work at it until you see nothing more to add." -Camille Pissarro',
  '"All I try to do is put as many colors as I can on the canvas every night." -Leslie Odom, Jr.',
  '"I was blown away by being able to color. Then I started to draw... bringing a blank white canvas to life was fascinating." James De La Vega'];

  // Select a random quote to display as hover title
  var randomNumber = Math.floor(Math.random() * hoverTitles.length);
  document.getElementById('gallery-title').title = hoverTitles[randomNumber];

  return;
}


// Load drawings to gallery from server
function loadDrawings() {
  return fetch(server + '/canvashare/gallery?start=' + requestStart + '&end=' + requestEnd)

    /* Display error message if server is down and error isn't already
    displayed (i.e., prevent multiple errors when scrolling to load more
    drawings) */
    .catch(function(error) {
      if (errorMessage == null) {
        errorMessage = document.createElement('text');
        errorMessage.id = 'error-message';
        errorMessage.innerHTML = 'There was an error loading the gallery. Please refresh the page.';
        gallery.appendChild(errorMessage);
        return;
      }
    })

    .then(function(response) {
      if (response.ok) {
        response.json().then(function(drawings) {
          // Add drawings to gallery if there is at least 1 sent from server

          if (drawings.length != 0) {

            /* Assess if there are more than requested drawings - 1 (number of
            loaded drawings) on server */
            if (drawings.length > (requestEnd - requestStart - 1)) {
              moreDrawingsOnServer = true;
              var drawingLoadNumber = requestEnd - requestStart - 1;
            }

            // If there are not, load all drawings sent from server
            else {
              moreDrawingsOnServer = false;
              var drawingLoadNumber = drawings.length;
            }

            for (var i = 0; i < drawingLoadNumber; i++) {
              // Create container for drawing and its components
              var drawingContainer = document.createElement('div');
              drawingContainer.classList.add('drawing-container');

              // Create container for drawing title
              var drawingTitle = document.createElement('div');
              drawingTitle.classList.add('drawing-title');

              /* Set data-drawing attribute as drawing file name for later
              identification, with URI-encoded characters */
              drawingTitle.dataset.drawing = encodeURIComponent(drawings[i]);

              // Create drawing image
              var drawing = document.createElement('img');
              drawing.classList.add('drawing');
              drawing.src = server + '/canvashare/drawing/' + encodeURIComponent(drawings[i]);

              // Create container for drawing artist and number of likes and views
              var drawingInfo = document.createElement('div');
              drawingInfo.classList.add('drawing-info');

              // Create container for number of drawing likes
              var drawingLikes = document.createElement('div');
              drawingLikes.classList.add('drawing-likes');
              drawingLikes.title = 'Likes';

              /* Set data-drawing attribute as drawing file name for later
              identification, with URI-encoded characters */
              drawingLikes.dataset.drawing = encodeURIComponent(drawings[i]);

              // Create text to display number of likes
              var likeText = document.createElement('text');

              /* Set data-drawing attribute as drawing file name for later
              identification, with URI-encoded characters */
              likeText.dataset.drawing = encodeURIComponent(drawings[i]);

              // Create drawing views container
              var drawingViews = document.createElement('div');
              drawingViews.classList.add('drawing-views');
              drawingViews.title = 'Views';

              // Create eye icon to display with drawing views
              var viewsIcon = document.createElement('i');
              viewsIcon.classList.add('fa');
              viewsIcon.classList.add('fa-eye');

              // Create text to display number of views
              var viewText = document.createElement('text');

              /* Set data-drawing attribute as drawing file name for later
              identification, with URI-encoded characters */
              viewText.dataset.drawing = encodeURIComponent(drawings[i]);

              // Create container for drawing artist
              var drawingArtist = document.createElement('div');
              drawingArtist.classList.add('drawing-artist');
              drawingArtist.title = 'Artist';

              // Create link to artist's profile
              var artistLink = document.createElement('a');
              artistLink.href = '../user/index.html?username=' + drawings[i]
                .substr(0, drawings[i].indexOf('/'));
              artistLink.innerHTML = drawings[i].substr(0, drawings[i]
                .indexOf('/'));
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

              // Update number of views when user clicks drawing
              drawing.onclick = updateViews;

              // Fill in drawing title, views, and likes
              getDrawingInfo(encodeURIComponent(drawings[i]));
            }
          }

          // If there are no drawings sent from server, set variable to false
          else {
            moreDrawingsOnServer = false;
          }
        });
        return;
      }

      // Display error message if the server sends an error
      if (errorMessage == null) {
        errorMessage = document.createElement('text');
        errorMessage.id = 'error-message';
        errorMessage.innerHTML = 'There was an error loading the gallery. Please refresh the page.';
        gallery.appendChild(errorMessage);
        return;
      }
    });
}


// Get title and number of views and likes for passed drawing file
function getDrawingInfo(drawingFile) {
  var filename = drawingFile.split('.png')[0];
  return fetch(server + '/canvashare/drawing-info/' + filename)
    .then(function(response) {
      response.json().then(function(drawingInfo) {
        // Get elements that have data-drawing attribute set as file name
        var fileElements = document
          .querySelectorAll('[data-drawing="' + drawingFile + '"]');

        // Set title and number of likes and views for drawing
        fileElements[0].innerHTML = drawingInfo['title'];
        fileElements[2].innerHTML = drawingInfo['likes'];
        fileElements[3].innerHTML = drawingInfo['views'];

        /* If current user liked the drawing, display a filled-in red heart in
        likes container */
        if (drawingInfo['liked_users'].includes(localStorage
          .getItem('username'))) {
            var likedHeart = document.createElement('i');
            likedHeart.classList.add('fa');
            likedHeart.classList.add('fa-heart');
            fileElements[1].insertBefore(likedHeart, fileElements[1].firstChild);
            // Update like count when user clicks heart
            likedHeart.onclick = updateLikes;
            return;
          }

        // Otherwise, display an empty heart outline
        var unlikedHeart = document.createElement('i');
        unlikedHeart.classList.add('fa');
        unlikedHeart.classList.add('fa-heart-o');
        fileElements[1].insertBefore(unlikedHeart, fileElements[1].firstChild);

        // Update like count when user clicks heart
        unlikedHeart.onclick = updateLikes;

        return;
      });
    });
}


// Update drawing's view count
function updateViews() {
  var clickedDrawing = this;

  /* Set sessionStorage items for drawing's source, used to populate easel on
  redirected webpage */
  sessionStorage.setItem('drawing-source', clickedDrawing.src);

  // Send request to server to update view count
  var data = JSON.stringify({'request': 'view'});
  var filename = clickedDrawing.src.split('/canvashare/drawing/')[1]
    .split('.png')[0];

  return fetch(server + '/canvashare/drawing-info/' + filename, {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'),
      'Content-Type': 'application/json'},
    method: 'PATCH',
    body: data,
  })

    // Display error message if server is down
    .catch(function(error) {
      window.alert('Your request did not go through. Please try again soon.');
      return;
    })

    .then(function(response) {
      /* If server responds without error, update view count and redirect to
      easel page */
      if (response.ok) {
        var viewText = document.querySelectorAll('[data-drawing="' + clickedDrawing
          .src.split('/canvashare/drawing/')[1] + '"]')[3];
        viewText.innerHTML = parseInt(viewText.innerHTML) + 1;
        window.location = 'easel/index.html';
        return;
      }

      // Otherwise, display error message
      window.alert('Your request did not go through. Please try again soon.');

      return;
    });
}


// Update drawing's like count
function updateLikes() {
  var heart = this;

  // Add click animation to create pop effect
  heart.classList.add('clicked');

  /* Remove clicked class from heart to allow animation to play when clicked
  again */
  heart.addEventListener('animationend', function() {
    heart.classList.remove('clicked');
    return;
  }, false);

  // Define filename for fetch request
  var filename = heart.nextSibling.dataset.drawing.split('.png')[0];

  // If heart is already filled in, decrease drawing like count
  if (this.classList.contains('fa-heart')) {

    // Send request to server to decrease like count
    var data = JSON.stringify({'request': 'unlike'});

    return fetch(server + '/canvashare/drawing-info/' + filename, {
        headers: {'Authorization': 'Bearer ' + localStorage
        .getItem('token'), 'Content-Type': 'application/json'},
        method: 'PATCH',
        body: data,
      })

      // Display error message if server is down
      .catch(function(error) {
        window.alert('Your like did not go through. Please try again soon.');
        return;
      })

      .then(function(response) {
        /* If server responds without error, remove heart fill and decrease like
        count user sees */
        if (response.ok) {
          var likeText = heart.nextSibling;
          var currentLikes = likeText.innerHTML;
          heart.classList.remove('fa-heart');
          heart.classList.add('fa-heart-o');
          likeText.innerHTML = parseInt(currentLikes) - 1;
          return;
        }

        // Otherwise, display error message
        window.alert('You must log in to like a drawing.');

        return;
      });
  }

  // Otherwise, send request to server to increase like count
  var data = JSON.stringify({'request': 'like'});

  return fetch(server + '/canvashare/drawing-info/' + filename, {
      headers: {'Authorization': 'Bearer ' + localStorage
      .getItem('token'), 'Content-Type': 'application/json'},
      method: 'PATCH',
      body: data,
    })

    // Display error message if server is down
    .catch(function(error) {
      window.alert('Your like did not go through. Please try again soon.');
      return;
    })

    .then(function(response) {
      /* If server responds without error, fill in heart and increase like count
      user sees */
      if (response.ok) {
        var likeText = heart.nextSibling;
        var currentLikes = likeText.innerHTML;
        likeText.innerHTML = parseInt(currentLikes) + 1;
        heart.classList.remove('fa-heart-o');
        heart.classList.add('fa-heart');
        return;
      }

      // Otherwise, display error message
      window.alert('You must log in to like a drawing.');

      return;
    });
}


// Request more drawings as user scrolls down page (infinite scroll)
window.addEventListener('scroll', requestMoreDrawings, false);

function requestMoreDrawings() {
  /* If user has scrolled more than 90% of way down page and the server has
  more drawings, update request numbers */
  if (percentScrolled() > 90 && moreDrawingsOnServer) {
    // Set drawing request start number to previous end number
    requestStart = requestEnd;

    // Set drawing request end number to previous end number + number of
    // drawings that can fit in one row of gallery
    requestEnd = requestEnd + Math.floor((gallery.offsetWidth) / (document
      .getElementsByClassName('drawing-container')[0].offsetWidth));

    // Load drawings with new request numbers
    loadDrawings();
  }

  return;
}


// Assess percentage that user has scrolled down page
function percentScrolled(){
  // Determine document height (different for different browsers)
  var documentHeight = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
      document.body.clientHeight, document.documentElement.clientHeight);

  // Determine window height (different for different browsers)
  var windowHeight = window.innerHeight || (document.documentElement || document
    .body).clientHeight;

  // Determine how far from top user has scrolled down page
  var scrollTop = window.pageYOffset || (document.documentElement || document
    .body.parentNode || document.body).scrollTop;

  // Determine length scrollbar can travel down
  var scrollLength = documentHeight - windowHeight;

  // Return percentage scrolled down page
  return Math.floor((scrollTop / scrollLength) * 100);
}


// Toggle drawing menu when user clicks plus icon
document.getElementById('plus-icon').onclick = toggleMenu;

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

    /* Remove clicked class from icon to allow animation to play when clicked
    again */
    plusIcon.addEventListener('animationend', function() {
      plusIcon.classList.remove('clicked');
      return;
    }, false);

    // Hide menu after it moves down the page to close
    menu.addEventListener('transitionend', function hideMenu() {
      menu.classList.add('hidden');
      menu.removeEventListener('transitionend', hideMenu, false);
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

  /* Remove clicked class from icon to allow animation to play when clicked
  again */
  plusIcon.addEventListener('animationend', function() {
    plusIcon.classList.remove('clicked');
    return;
  }, false);

  return;
}


/* Set sessionStorage drawing source as source of previewed drawing and open
that drawing on easel page when user clicks menu option */
document.getElementById('new-option').onclick = setDrawingSource;

function setDrawingSource() {
  // Add click animation to create pop effect
  this.classList.add('clicked');

  /* Remove clicked class from clicked menu option to allow animation to play
  if clicked again */
  this.addEventListener('animationend', function() {
    this.classList.remove('clicked');
    return;
  }, false);

  // Set sessionStorage items for drawing source and title
  sessionStorage.setItem('drawing-source', this.getElementsByTagName('img')[0]
    .src);

  // Use locally stored drawing title if user clicks Continue option
  if (this == continueOption) {
    sessionStorage.setItem('drawing-title', localStorage
      .getItem('drawing-title'));
  }

  // Go to easel page
  window.location = 'easel/index.html';

  return;
}


// Toggle shrink style on header when user scrolls
window.addEventListener('scroll', function() {
  // Add shrink style to header when user scrolls down page
  if (window.pageYOffset > 60) {
    document.getElementById('header').classList.add('shrink');
    return;
  }

  // Remove shrink style when user scrolls back to top of page
  document.getElementById('header').classList.remove('shrink');

  return;
}, false);
