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
  // Create page header (from common.js script)
  createPageHeader();

  // Create page footer (from common.js script)
  createPageFooter();

  // Check if Crystal Prism API is online (from common.js script)
  pingServer(function() {
    checkIfLoggedIn();
    loadDrawings();
    return;
  });

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

    // Go to easel page if continue option is clicked
    continueOption.onclick = function() {
      // Add click animation to create pop effect
      this.classList.add('clicked');

      /* Remove clicked class from clicked menu option to allow animation to play
      if clicked again */
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

  return;
}


// Set quote that appears when hovering over gallery title
function setHoverTitle() {
  // Define array of quotes about canvases
  var hoverTitles = ['"The world is but a canvas to our imagination." -Henry ' +
    'David Thoreau',
  '"Life is a great big canvas; throw all the paint you can at it." -Danny ' +
    'Kaye',
  '"A great artist can paint a great picture on a small canvas." -Charles ' +
    'Dudley Warner',
  '"I put on the canvas whatever comes into my mind." -Frida Kahlo',
  '"An empty canvas is a living wonder... far lovelier than certain ' +
    'pictures." -Wassily Kandinsky',
  '"I never know what I\'m going to put on the canvas. The canvas paints ' +
    'itself. I\'m just the middleman." -Peter Max',
  '"Cover the canvas at the first go, then work at it until you see nothing ' +
    'more to add." -Camille Pissarro',
  '"All I try to do is put as many colors as I can on the canvas every ' +
    'night." -Leslie Odom, Jr.',
  '"I was blown away by being able to color. Then I started to draw... ' +
    'bringing a blank white canvas to life was fascinating." James De La Vega'];

  // Select a random quote to display as hover title
  var randomNumber = Math.floor(Math.random() * hoverTitles.length);
  document.getElementById('gallery-title').title = hoverTitles[randomNumber];

  return;
}


// Load drawings to gallery from server
function loadDrawings() {
  return fetch(api + '/canvashare/drawings?start=' + requestStart + '&end=' +
    requestEnd)

    /* Display error message if server is down and error isn't already
    displayed (i.e., prevent multiple errors when scrolling to load more
    drawings) */
    .catch(function(error) {
      if (errorMessage == null) {
        errorMessage = document.createElement('text');
        errorMessage.id = 'error-message';
        errorMessage.innerHTML = 'There was an error loading the gallery. ' +
          'Please refresh the page.';
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
              drawingTitle.innerHTML = drawings[i]['title'];

              // Create drawing image
              var drawing = document.createElement('img');
              drawing.classList.add('drawing');
              drawing.src = drawings[i]['url'];

              /* Set data-drawing attribute as drawing id for later
              identification */
              drawing.dataset.drawing = drawings[i]['drawing_id'];

              /* Create container for drawing artist and number of likes and
              views */
              var drawingInfo = document.createElement('div');
              drawingInfo.classList.add('drawing-info');

              // Create container for number of drawing likes
              var drawingLikes = document.createElement('div');
              drawingLikes.classList.add('drawing-likes');
              drawingLikes.title = 'Likes';

              // Create text to display number of likes
              var likeText = document.createElement('text');
              likeText.innerHTML = drawings[i]['like_count'];

              /* Set data-drawing attribute as drawing id for later
              identification */
              likeText.dataset.drawing = 'likes' + drawings[i]['drawing_id'];

              // Set likers to list of users who liked drawing
              var likers = drawings[i]['likers'];

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
              viewText.innerHTML = drawings[i]['views'];

              /* Set data-drawing attribute as drawing id for later
              identification */
              viewText.dataset.drawing = 'views' + drawings[i]['drawing_id'];

              // Create container for drawing artist
              var drawingArtist = document.createElement('div');
              drawingArtist.classList.add('drawing-artist');
              drawingArtist.title = 'Artist';

              // Create link to artist's profile
              var artistLink = document.createElement('a');
              artistLink.href = '../user/?username=' + drawings[i].username;
              artistLink.innerHTML = drawings[i].username;

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

              // Display drawing like hearts
              displayDrawingLikes(drawings[i]['drawing_id'], likers);
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
        errorMessage.innerHTML = 'There was an error loading the gallery. ' +
          'Please refresh the page.';
        gallery.appendChild(errorMessage);
        return;
      }
    });
}


// Display drawing like hearts for passed drawing
function displayDrawingLikes(drawingId, likers) {
  // Get likes text that has data-drawing attribute set as drawing id
  var likeText = document
    .querySelectorAll('[data-drawing="likes' + drawingId + '"]')[0];

  // Check if user liked drawing if user is logged in
  if (checkIfLoggedIn()) {
    /* If current user liked the drawing, display a filled-in red heart in
    likes container */
    for (var i = 0; i < likers.length; i++) {

      if (likers[i]['username'] == localStorage.getItem('username')) {
        var likedHeart = document.createElement('i');
        likedHeart.classList.add('fa');
        likedHeart.classList.add('fa-heart');
        likedHeart.dataset.drawinglike = likers[i]['drawing_like_id'];
        likedHeart.dataset.drawing = drawingId;
        likeText.parentNode.insertBefore(likedHeart, likeText);

        // Update like count when user clicks heart
        likedHeart.onclick = updateLikes;

        return;
      }
    }
  }

  // Otherwise, display an empty heart outline
  var unlikedHeart = document.createElement('i');
  unlikedHeart.classList.add('fa');
  unlikedHeart.classList.add('fa-heart-o');
  likeText.parentNode.insertBefore(unlikedHeart, likeText);
  unlikedHeart.dataset.drawing = drawingId;

  // Update like count when user clicks heart
  unlikedHeart.onclick = updateLikes;

  return;
}


// Update drawing's view count
function updateViews() {
  var clickedDrawing = this;

  // Send request to server to update view count
  return fetch(api + '/canvashare/drawing/' + clickedDrawing.dataset.drawing, {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
    method: 'PATCH',
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
        var viewText = document.querySelectorAll('[data-drawing="views' +
          clickedDrawing.dataset.drawing + '"]')[0];
        viewText.innerHTML = parseInt(viewText.innerHTML) + 1;
        window.location = 'easel/?drawing=' + clickedDrawing.dataset.drawing;
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

  // If heart is already filled in, decrease drawing like count
  if (this.classList.contains('fa-heart')) {

    return fetch(api + '/canvashare/drawing-like/' + this.dataset.drawinglike, {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'),
        'Content-Type': 'application/json'},
      method: 'DELETE'
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
          delete heart.dataset.drawinglike;
          likeText.innerHTML = parseInt(currentLikes) - 1;
          return;
        }

        // Otherwise, display error message
        window.alert('You must log in to like a drawing.');

        return;
      });
  }

  // Otherwise, send request to server to increase like count
  var data = JSON.stringify({'drawing_id': this.dataset.drawing});

  return fetch(api + '/canvashare/drawing-like', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'),
      'Content-Type': 'application/json'},
    method: 'POST',
    body: data,
  })

    // Display error message if server is down
    .catch(function(error) {
      window.alert('Your like did not go through. Please try again soon.');
      return;
    })

    /* If server responds without error, fill in heart and increase like count
    user sees */
    .then(function(response) {
      if (response.ok) {
        response.text().then(function(drawingLikeId) {
          var likeText = heart.nextSibling;
          var currentLikes = likeText.innerHTML;
          likeText.innerHTML = parseInt(currentLikes) + 1;
          heart.classList.remove('fa-heart-o');
          heart.classList.add('fa-heart');
          heart.dataset.drawinglike = drawingLikeId;
        });
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
