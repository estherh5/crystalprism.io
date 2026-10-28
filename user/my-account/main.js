// Define global variables for Personal menu
var aboutInput = document.getElementById('about-input');
var usernameInput = document.getElementById('username-input');
var passwordInput = document.getElementById('password-input');
var confirmPassInput = document.getElementById('confirm-password-input');
var firstNameInput = document.getElementById('first-name-input');
var lastNameInput = document.getElementById('last-name-input');
var namePublicInput = document.getElementById('name-public-input');
var emailInput = document.getElementById('email-input');
var emailPublicInput = document.getElementById('email-public-input');
var profileBackground = document.getElementById('profile-background');
var backgroundColorPicker = document.getElementById('background-color-picker');
var profileIcon = document.getElementById('profile-icon');
var diamond = document.getElementById('diamond');
var iconColorPicker = document.getElementById('icon-color-picker');
var aboutBlurb = aboutInput.value;
var username = usernameInput.value;
var password = passwordInput.value;
var firstName = firstNameInput.value;
var lastName = lastNameInput.value;
var namePublic = namePublicInput.checked;
var email = emailInput.value;
var emailPublic = emailPublicInput.checked;
var backgroundColor = backgroundColorPicker.value;
var iconColor = iconColorPicker.value;
var fields = document.getElementsByTagName('input');
var checkboxContainers = document.getElementsByTagName('label');
var checkboxes = document.getElementsByClassName('public');
var userDrawings = []; // Array of drawings created by user
var likedDrawings = []; // Array of drawings liked by user
var accountButtons = document.getElementsByClassName('account-button');
var editButton = document.getElementById('edit');
var saveButton = document.getElementById('save');
var cancelButton = document.getElementById('cancel');
var buttonRow = document.getElementById('button-row');
var submitButton = document.getElementById('submit');
var verifyPassInput = document.getElementById('verify-password-input');
var editingPersonal = false; // If user is editing information in Personal menu


// Define global variables for Scores menu
var displayedScores = []; // Array of displayed scores
var rhythmRequestStart = 0; // Range start for number of scores to display
var rhythmRequestEnd = 11; // Range end for number of scores to display
var shapesRequestStart = 0; // Range start for number of scores to display
var shapesRequestEnd = 11; // Range end for number of scores to display
var moreScoresToDisplay = false; // If there are more scores to display in array
var rhythmLink = document.getElementById('rhythm-link');
var rhythmHeader = document.getElementById('rhythm-header');
var rhythmNoScores = document.getElementById('rhythm-no-scores');
var rhythmScoreData = document.getElementById('rhythm-score-data');
var rhythmUpArrow = document.getElementById('rhythm-up-arrow');
var rhythmDownArrow = document.getElementById('rhythm-down-arrow');
var shapesLink = document.getElementById('shapes-link');
var shapesHeader = document.getElementById('shapes-header');
var shapesNoScores = document.getElementById('shapes-no-scores');
var shapesScoreData = document.getElementById('shapes-score-data');
var shapesUpArrow = document.getElementById('shapes-up-arrow');
var shapesDownArrow = document.getElementById('shapes-down-arrow');


// Define global variables for Drawings menu
var drawingRequestStart = 0; // Range start for number of drawings to request/display
var drawingRequestEnd = 7; // Range end for number of drawings to request/display
var moreDrawingsToDisplay = false; // If there are more drawings to display in array
var csMainLink = document.getElementById('canvashare-main-link');
var csDrawLink = document.getElementById('canvashare-link-draw');
var csLikeLink = document.getElementById('canvashare-link-like');
var gallery = document.getElementById('gallery');
var drawingRightArrow = document.getElementById('drawings-right-arrow');
var drawingLeftArrow = document.getElementById('drawings-left-arrow');
var mine = document.getElementById('mine');
var liked = document.getElementById('liked');


// Define global variables for Posts menu
var twMainLink = document.getElementById('thought-writer-main-link');
var twEditorLink = document.getElementById('thought-writer-link-editor');
var twBoardLink = document.getElementById('thought-writer-link-post-board');
var postRequestStart = 0; // Range start for number of posts to request/display
var postRequestEnd = 7; // Range end for number of posts to request/display
var morePostsToDisplay = false; // If there are more posts to display in array
var postList = document.getElementById('post-list');
var postRightArrow = document.getElementById('posts-right-arrow');
var postLeftArrow = document.getElementById('posts-left-arrow');
var commentRequestStart = 0; // Range start for number of comments to request/display
var commentRequestEnd = 7; // Range end for number of comments to request/display
var moreCommentsToDisplay = false; // If there are more comments to display in array
var postsButton = document.getElementById('posts');
var commentsButton = document.getElementById('comments');


// Define load functions
window.onload = function() {
  // Create page header (from common.js script)
  createPageHeader();

  /* Wait for the session check (and any one-time token migration) before
  loading anything: until it lands the cookie may not exist yet */
  Promise.resolve(checkIfLoggedIn()).then(function() {
    /* No username means signed out (a 401 clears it); a server outage keeps
    it, so the page still shows cached content under the down banner */
    if (!localStorage.getItem('username')) {
      window.location = '../sign-in/';
      return;
    }

    loadAccount();
  });

  // Create page footer (from common.js script)
  createPageFooter();

  return;
}


// Load the signed-in user's account page
function loadAccount() {
  /* Display confirmation of account creation if user redirected from Create
  Account page */
  if (sessionStorage.getItem('account-request') == 'create') {
    confirmCreation();
  }

  // Scroll to specified menu if hash is in URL
  if (window.location.hash) {
    $('#menu-scroll-area').animate({
      scrollTop: $(window.location.hash).offset().top + $('#menu-scroll-area')
        .scrollTop() - $('#menu-scroll-area').offset().top
    }, 0);

    // Flip specified menu to back view
    setFlipped(document.getElementById(window.location.hash.split('#')[1]),
      true);
  }

  // Display profile link in Personal menu
  document.getElementById('profile-main-link').textContent = localStorage
    .getItem('username');
  document.getElementById('profile-main-link')
    .href = '../?username=' + encodeURIComponent(localStorage.getItem('username'));

  // Load user's personal information from server
  loadPersonalInfo();

  // Load user's game scores from server
  loadScores('rhythm-of-life');
  loadScores('shapes-in-rain');

  // Load user's drawings from server
  loadDrawings('drawings');

  // Load user's posts from server
  loadPosts();

  // Check if Crystal Prism API is online (from common.js script)
  pingServer(retryFunctions);

  return;
}


// Functions to run when Retry button is clicked from server down banner
function retryFunctions() {
  checkIfLoggedIn();

  loadPersonalInfo();

  loadScores('rhythm-of-life');

  loadScores('shapes-in-rain');

  if (mine.classList.contains('selected')) {
    loadDrawings('drawings');
  } else {
    loadDrawings('drawing-likes/user');
  }

  if (postsButton.classList.contains('selected')) {
    loadPosts();
  } else {
    loadComments();
  }

  return;
}


// Display confirmation of account creation
function confirmCreation() {
  // Display successful account creation banner
  document.getElementById('success').style.display = 'block';

  // Remove account creation request from sessionStorage
  sessionStorage.removeItem('account-request');

  /* If user clicks anywhere on page and success banner is displayed, clear the
  banner */
  window.addEventListener('click', function() {
    if (document.getElementById('success').style.display == 'block') {
      document.getElementById('success').style.display = 'none';
    }

    return;
  });

  return;
}


// Load user's personal information from server
function loadPersonalInfo() {
  return slotFetch(buttonRow, 'Loading your info…', api + '/user/' +
    encodeURIComponent(localStorage.getItem('username')), {
      credentials: 'include',
      method: 'GET',
    })

    .catch(function(error) {
      // Add server down banner to page (from common.js script)
      pingServer(retryFunctions);

      // Display cached user information if it is stored in localStorage
      if (localStorage.getItem('my-account-personal-info')) {
        displayPersonalInfo(JSON.parse(localStorage
          .getItem('my-account-personal-info')));
      }

      // Otherwise, say so in the Personal menu, with Retry
      else {
        personalInfoFailed();
      }

      return;
    })

    .then(function(response) {
      if (response) {
        // Remove server down banner from page (from common.js script)
        pingServer();

        // Display info in Personal menu if server responds without error
        if (response.ok) {
          response.json().then(function(info) {
            displayPersonalInfo(info);

            // Store info in localStorage for offline loading
            localStorage.setItem('my-account-personal-info', JSON
              .stringify(info));
          });
          return;
        }

        // A server error with nothing cached says so too
        if (!localStorage.getItem('my-account-personal-info')) {
          personalInfoFailed();
        }
      }
    });
}


/* Personal info failed with nothing cached: say so under the card, with Retry,
in place of Edit (an unloaded form must not be edited and saved blank) */
function personalInfoFailed() {
  editButton.style.display = 'none';
  slotFailure(buttonRow, "Couldn't load your info.", loadPersonalInfo);

  return;
}


// Display passed info in Personal and Stats menus
function displayPersonalInfo(info) {
  // Edit comes back once there is info to edit (personalInfoFailed hid it)
  if (!editingPersonal) {
    editButton.style.display = '';
  }

  /* Fill in user's personal information to Personal menu and stats to
  Stats menu */
  aboutInput.value = info['about'];
  usernameInput.value = info['username'];
  firstNameInput.value = info['first_name'];
  lastNameInput.value = info['last_name'];
  namePublicInput.checked = info['name_public'];
  emailInput.value = info['email'];
  emailPublicInput.checked = info['email_public'];
  backgroundColorPicker.value = info['background_color'];
  profileBackground.style.backgroundColor = info['background_color'];

  // Update field font colors based on background color
  updateFontColors();
  iconColorPicker.value = info['icon_color'];
  diamond.style.fill = info['icon_color'];

  // Update icon background color based on icon color
  updateIconBackground();

  /* Convert UTC timestamp from server to local timestamp in
  'MM/DD/YYYY' format */
  document.getElementById('member-stat').innerHTML = moment(info['created'])
    .format('MM/DD/YYYY');

  document.getElementById('rhythm-plays-stat')
    .textContent = String(Number(info['rhythm_score_count']) || 0);

  document.getElementById('shapes-plays-stat')
    .textContent = String(Number(info['shapes_score_count']) || 0);

  document.getElementById('drawings-stat')
    .textContent = String(Number(info['drawing_count']) || 0);

  document.getElementById('liked-stat')
    .textContent = String(Number(info['drawing_like_count']) || 0);

  document.getElementById('posts-stat')
    .textContent = String(Number(info['post_count']) || 0);

  document.getElementById('comments-stat')
    .textContent = String(Number(info['comment_count']) || 0);

  return;
}


/* Load user's scores from server, specifying game ('rhythm-of-life' or
'shapes-in-rain') */
function loadScores(game) {
  if (game == 'rhythm-of-life') {
    // Clear score area to replace with requested scores
    rhythmScoreData.innerHTML = '';

    scoreStart = rhythmRequestStart;
    scoreEnd = rhythmRequestEnd;
  } else {
    // Clear score area to replace with requested scores
    shapesScoreData.innerHTML = '';

    scoreStart = shapesRequestStart;
    scoreEnd = shapesRequestEnd;
  }

  return slotFetch(game == 'rhythm-of-life' ? rhythmScoreData : shapesScoreData,
    'Loading scores…', api + '/' + game + '/scores/' +
    encodeURIComponent(localStorage.getItem('username')) + '?start=' + scoreStart + '&end=' +
    scoreEnd, {
      credentials: 'include',
      method: 'GET',
    })

    // If server is down, display error banners in Scores menu
    .catch(function(error) {
      // Add server down banner to page (from common.js script)
      pingServer(retryFunctions);

      // Display cached scores if they are stored in localStorage
      if (localStorage.getItem('my-account-' + game + '-scores')) {
        displayScores(JSON.parse(localStorage
          .getItem('my-account-' + game + '-scores'))
          .slice(scoreStart, scoreEnd), game);
      }

      // Otherwise, display error message
      else {
        scoresFailed(game);
      }

      return;
    })

    .then(function(response) {
      if (response) {
        // Remove server down banner from page (from common.js script)
        pingServer();

        // Display scores in scores area if server responds without error
        if (response.ok) {
          response.json().then(function(scores) {
            displayScores(scores, game);

            /* Remove locally stored scores if this is the initial request
            to replace with latest scores from server */
            if (scoreStart == 0) {
              localStorage.removeItem('my-account-' + game + '-scores');
              var localScores = [];
            }

            // Otherwise, get locally stored scores list
            else {
              var localScores = JSON.parse(localStorage
                .getItem('my-account-' + game + '-scores'));
            }

            /* Add each score to locally stored scores list based on
            scoreStart and scoreEnd values */
            for (var i = 0; i < scores.length; i++) {
              localScores[scoreStart + i] = scores[i];
            }

            // Store scores in localStorage for offline loading
            localStorage.setItem('my-account-' + game + '-scores', JSON
              .stringify(localScores));
          });
          return;
        }

        // If server responds with error, display error banners in Scores menu
        scoresFailed(game);

        return;
      }
    });
}


/* A list fetch shows Loading in its own slot from the first frame and clears
it on any answer; the caller decides between content, cache and failure */
function slotFetch(slot, label, url, options) {
  slotLoading(slot, label);

  return fetchWithTimeout(url, options).then(function(response) {
    clearSlotStatus(slot);
    return response;
  }, function(error) {
    clearSlotStatus(slot);
    throw error;
  });
}


// A game's scores failed with nothing cached: say so there, with Retry
function scoresFailed(game) {
  var rhythm = game == 'rhythm-of-life';
  (rhythm ? rhythmLink : shapesLink).classList.add('hidden');
  (rhythm ? rhythmHeader : shapesHeader).classList.add('hidden');
  (rhythm ? rhythmNoScores : shapesNoScores).classList.add('hidden');
  slotFailure(rhythm ? rhythmScoreData : shapesScoreData,
    "Couldn't load your scores.", function() {
      loadScores(game);
    });

  return;
}


// Display user's scores for passed game ('rhythm-of-life' or 'shapes-in-rain')
function displayScores(scores, game) {
  // If game is Rhythm of Life, set score variables as appropriate
  if (game == 'rhythm-of-life') {

    // If there are no scores, display link to play Rhythm of Life game
    if (scores.length == 0) {
      rhythmLink.classList.add('hidden');
      rhythmHeader.classList.add('hidden');
      rhythmNoScores.classList.remove('hidden');
      return;
    }

    /* Otherwise, set displayed scores as scores array sliced to requested
    number of scores */
    displayedScores = scores.slice(rhythmRequestStart, rhythmRequestEnd);
    var scoreStart = rhythmRequestStart;
    var scoreEnd = rhythmRequestEnd;

    /* Unhide Scores menu header for Rhythm of Life scores and hide error and
    no score banners */
    rhythmLink.classList.remove('hidden');
    rhythmHeader.classList.remove('hidden');
    rhythmNoScores.classList.add('hidden');

    var scoreData = rhythmScoreData;
    var upArrow = rhythmUpArrow;
    var downArrow = rhythmDownArrow;
  }

  // If game variable is for Shapes in Rain, set score variables as appropriate
  else if (game == 'shapes-in-rain') {

    // If there are no scores, display link to play Shapes in Rain game
    if (scores.length == 0) {
      shapesLink.classList.add('hidden');
      shapesHeader.classList.add('hidden');
      shapesNoScores.classList.remove('hidden');
      return;
    }

    /* Otherwise, set displayed scores as scores array sliced to requested
    number of scores */
    displayedScores = scores.slice(shapesRequestStart, shapesRequestEnd);
    var scoreStart = shapesRequestStart;
    var scoreEnd = shapesRequestEnd;

    /* Unhide Scores menu header for Shapes in Rain scores and hide error and
    no score banners */
    shapesLink.classList.remove('hidden');
    shapesHeader.classList.remove('hidden');
    shapesNoScores.classList.add('hidden');

    var scoreData = shapesScoreData;
    var upArrow = shapesUpArrow;
    var downArrow = shapesDownArrow;
  }

  /* If there are scores to display in array, assess if there are more than
  sliced scores - 1 (number of displayed scores) in array */
  if (displayedScores.length != 0) {

    if (displayedScores.length > (scoreEnd - scoreStart - 1)) {
      moreScoresToDisplay = true;
      var loadNumber = scoreEnd - scoreStart - 1;
    }

    // If there are not, load all scores in array
    else {
      moreScoresToDisplay = false;
      var loadNumber = displayedScores.length;
    }

    for (var i = 0; i < loadNumber; i++) {
      // Create row for score data
      var scoreRow = document.createElement('div');
      scoreRow.classList.add('row');
      scoreRow.classList.add('no-gutters');
      scoreRow.classList.add('w-100');
      scoreRow.classList.add('d-flex');
      scoreRow.classList.add('justify-content-center');

      /* Set data-number attribute to track the score number for displaying
      more scores later */
      scoreRow.dataset.number = scoreStart + i;

      // Add button to delete score
      var deleteScoreButton = document.createElement('button');
      deleteScoreButton.classList.add('delete-button');
      deleteScoreButton.title = 'Delete score';
      deleteScoreButton.innerHTML = 'X';
      deleteScoreButton.type = 'button';
      deleteScoreButton.dataset.toggle = 'modal';
      deleteScoreButton.dataset.target = '#confirm-delete-content';
      deleteScoreButton.dataset.scoreid = scores[i].score_id;

      /* Set confirmation modal title and content deletion function to
      run upon confirmation when delete button is clicked */
      deleteScoreButton.onclick = function() {
        document.getElementById('modal-title-content')
          .innerHTML = 'Are you sure you want to delete this score?';

        document.getElementById('confirm-delete-content-button')
          .dataset.contentid = this.dataset.scoreid;

        document.getElementById('confirm-delete-content-button')
          .onclick = function() {
            deleteContent(game + '/score', this.dataset.contentid, function() {
              loadScores(game);
              return;
            });

            return;
          }

        return;
      }

      /* Create column for displaying star next to first score in total scores
      array (high score) */
      var starCol = document.createElement('div');
      starCol.classList.add('col-1');

      if (scoreRow.dataset.number == 0) {
        var star = document.createElement('i');
        star.classList.add('fas');
        star.classList.add('fa-star');
        starCol.appendChild(star);
      }

      // If game is Rhythm of Life, display lifespan as score
      if (game == 'rhythm-of-life') {
        // Create column for score
        var scoreCol = document.createElement('div');
        scoreCol.classList.add('col-3');

        var sec_num = Number(displayedScores[i].score) || 0;
        var score_hours = Math.floor(sec_num / 3600);
        var score_minutes = Math.floor((sec_num - (score_hours * 3600)) / 60);
        var score_seconds = sec_num - (score_hours * 3600) -
          (score_minutes * 60);
        var lifespan_value = ('0' + score_hours).slice(-2) + ':' +
          ('0' + score_minutes).slice(-2) + ':' + ('0' + score_seconds)
          .slice(-2);

        scoreCol.textContent = lifespan_value;
      }

      // Otherwise, display score
      else {
        // Create column for score
        var scoreCol = document.createElement('div');
        scoreCol.classList.add('col-2');

        scoreCol.textContent = String(Number(displayedScores[i].score) || 0);
      }

      // Create column for score timestamp
      var scoreTimestampCol = document.createElement('div');
      scoreTimestampCol.classList.add('col-6');

      /* Convert UTC timestamp from server to local timestamp in 'MM/DD/YYYY,
      HH:MM AM/PM' format */
      scoreTimestampCol.innerHTML = moment(displayedScores[i].created)
        .format('MM/DD/YYYY, LT');
      scoreData.appendChild(scoreRow);
      scoreRow.appendChild(deleteScoreButton);
      scoreRow.appendChild(starCol);
      scoreRow.appendChild(scoreCol);
      scoreRow.appendChild(scoreTimestampCol);
    }

    /* If first score displayed in score area is not score 0 (i.e., there are
    lower-numbered scores to display), display up navigation arrow */
    if (scoreData.getElementsByClassName('row')[0].dataset.number != 0) {
      upArrow.classList.add('display');
    }

    // Otherwise, hide up arrow
    else {
      upArrow.classList.remove('display');
    }

    // If there are more scores in the array, display down navigation arrow
    if (moreScoresToDisplay) {
      downArrow.classList.add('display');
    }

    // Otherwise, hide down arrow
    else {
      downArrow.classList.remove('display');
    }
  }

  return;
}


/* Load user's drawings from server, specifying type ('drawings' for
user-created drawings or 'drawing-likes/user' for drawings the user liked) */
function loadDrawings(type) {
  return slotFetch(gallery, 'Loading drawings…', api + '/canvashare/' + type + '/' +
    encodeURIComponent(localStorage.getItem('username')) + '?start=' + drawingRequestStart +
    '&end=' + drawingRequestEnd)

      // If server is down, clear drawing area and hide navigation arrows
      .catch(function(error) {
        // Add server down banner to page (from common.js script)
        pingServer(retryFunctions);

        // Display cached drawings if they are stored in localStorage
        if (localStorage.getItem('my-account-' + type)) {
          displayDrawings(type, JSON.parse(localStorage
            .getItem('my-account-' + type))
            .slice(drawingRequestStart, drawingRequestEnd));
        }

        // Otherwise, display error message
        else {

          // The failure shows in the list, below any page already showing
          slotFailure(gallery, "Couldn't load your drawings.", function() { loadDrawings(type); });

          csMainLink.classList.add('hidden');
          csDrawLink.classList.add('hidden');
          csLikeLink.classList.add('hidden');
        }

        return;
      })

      .then(function(response) {
        if (response) {
          // Remove server down banner from page (from common.js script)
          pingServer();

          // Display drawings in drawing area if server responds without error
          if (response.ok) {
            response.json().then(function(drawings) {
              displayDrawings(type, drawings);

              /* Remove locally stored drawings if this is the initial request
              to replace with latest drawings from server */
              if (drawingRequestStart == 0) {
                localStorage.removeItem('my-account-' + type);
                var localDrawings = [];
              }

              // Otherwise, get locally stored drawings list
              else {
                var localDrawings = JSON.parse(localStorage
                  .getItem('my-account-' + type));
              }

              /* Add each drawing to locally stored drawings list based on
              drawingRequestStart and drawingRequestEnd values */
              for (var i = 0; i < drawings.length; i++) {
                localDrawings[drawingRequestStart + i] = drawings[i];
              }

              // Store drawings in localStorage for offline loading
              localStorage.setItem('my-account-' + type, JSON
                .stringify(localDrawings));
            });
            return;
          }

          /* Otherwise, if server responds with error, clear drawing area and
          hide navigation arrows */

          // The failure shows in the list, below any page already showing
          slotFailure(gallery, "Couldn't load your drawings.", function() { loadDrawings(type); });

          csMainLink.classList.add('hidden');
          csDrawLink.classList.add('hidden');
          csLikeLink.classList.add('hidden');

          return;
        }
      });
}


/* Display passed array of drawings in drawing area, specifying type
('drawings' for user-created drawings or 'drawing-likes/user' for drawings the
user liked) */
function displayDrawings(type, drawings) {
  /* If there are no drawings sent from server, clear drawing area and display
  CanvaShare link */
  if (drawings.length == 0) {
    gallery.innerHTML = '';

    // Hide left and right navigation arrows
    drawingLeftArrow.classList.remove('display');
    drawingRightArrow.classList.remove('display');

    /* If user is on the "Mine" view in the Drawings menu, display link to
    create drawings */
    if (mine.classList.contains('selected')) {
      csMainLink.classList.add('hidden');
      csDrawLink.classList.remove('hidden');
      csLikeLink.classList.add('hidden');
      return;
    }

    // Otherwise, display link to like drawings
    csMainLink.classList.add('hidden');
    csDrawLink.classList.add('hidden');
    csLikeLink.classList.remove('hidden');

    return;
  }

  // Otherwise, hide CanvaShare error links and display main link
  csMainLink.classList.remove('hidden');
  csDrawLink.classList.add('hidden');
  csLikeLink.classList.add('hidden');

  // Clear drawing area to populate with passed array of drawings
  gallery.innerHTML = '';

  /* Assess if there are more than requested drawings - 1 (number of loaded
  drawings) in array */
  if (drawings.length > (drawingRequestEnd - drawingRequestStart - 1)) {
    moreDrawingsToDisplay = true;
    var loadNumber = 6;
  }

  // If there are not, load all drawings sent from server
  else {
    moreDrawingsToDisplay = false;
    var loadNumber = drawings.length;
  }

  for (var i = 0; i < loadNumber; i++) {
    // Create container for drawing and its components
    var drawingContainer = document.createElement('div');
    drawingContainer.classList.add('drawing-container');

    /* Set data-number attribute to track the drawing number for displaying
    more drawings later */
    drawingContainer.dataset.number = drawingRequestStart + i;

    // Add button to delete drawing if displaying user's drawings
    if (type == 'drawings') {
      var deleteDrawingButton = document.createElement('button');
      deleteDrawingButton.classList.add('delete-button');
      deleteDrawingButton.title = 'Delete drawing';
      deleteDrawingButton.innerHTML = 'X';
      deleteDrawingButton.type = 'button';
      deleteDrawingButton.dataset.toggle = 'modal';
      deleteDrawingButton.dataset.target = '#confirm-delete-content';
      deleteDrawingButton.dataset.drawingid = drawings[i].drawing_id;

      /* Set confirmation modal title and content deletion function to
      run upon confirmation when delete button is clicked */
      deleteDrawingButton.onclick = function() {
        document.getElementById('modal-title-content')
          .innerHTML = 'Are you sure you want to delete this drawing?';

        document.getElementById('confirm-delete-content-button')
          .dataset.contentid = this.dataset.drawingid;

        document.getElementById('confirm-delete-content-button')
          .onclick = function() {
            deleteContent('canvashare/drawing', this.dataset.contentid,
            function() {
              loadDrawings('drawings');
              return;
            });
            return;
          }

        return;
      }

      drawingContainer.appendChild(deleteDrawingButton);
    }

    // Create container for drawing title
    var drawingTitle = document.createElement('a');
    drawingTitle.classList.add('drawing-title');
    drawingTitle.href = appUrl('canvashare', 'easel/?drawing=' +
      drawings[i]['drawing_id']);
    drawingTitle.textContent = drawings[i]['title'];

    // Create drawing image
    var drawing = document.createElement('img');
    drawing.classList.add('drawing');
    drawing.src = drawings[i]['url'];
    drawing.title = 'View drawing';

    // Set data-drawing attribute as drawing id for later identification
    drawing.dataset.drawing = drawings[i]['drawing_id'];

    // Go to easel page for drawing if user clicks drawing
    drawing.onclick = function() {
      window.location = appUrl('canvashare', 'easel/?drawing=' +
        this.dataset.drawing);
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

    gallery.appendChild(drawingContainer);
    drawingContainer.appendChild(drawingTitle);
    drawingContainer.appendChild(drawing);
    drawingContainer.appendChild(drawingInfo);
    drawingInfo.appendChild(drawingLikes);
    drawingLikes.appendChild(likeText);
    drawingInfo.appendChild(drawingViews);
    drawingViews.appendChild(viewsIcon);
    drawingViews.appendChild(viewText);

    // If displaying liked drawing, display artist name
    if (type == 'drawing-likes/user') {

      // Create container for drawing artist
      var drawingArtist = document.createElement('div');
      drawingArtist.classList.add('drawing-artist');
      drawingArtist.title = 'Artist';

      // Create link to artist's profile
      var artistLink = document.createElement('a');
      artistLink.href = appUrl('account', '?username=' +
        encodeURIComponent(drawings[i]['artist_name']));
      artistLink.textContent = drawings[i]['artist_name'];
      drawingInfo.appendChild(drawingArtist);
      drawingArtist.appendChild(artistLink);
    }

    // Display drawing like hearts
    displayDrawingLikes(drawings[i]['drawing_id'], likers);
  }

  /* If first drawing displayed in drawing area is not drawing 0 (i.e., there
  are lower-numbered drawings to display), display left navigation arrow */
  if (gallery.getElementsByClassName('drawing-container')[0].dataset
    .number != 0) {
      drawingLeftArrow.classList.add('display');
    }

  // Otherwise, hide left arrow
  else {
    drawingLeftArrow.classList.remove('display');
  }

  // If there are more drawings on the server, display right navigation arrow
  if (moreDrawingsToDisplay) {
    drawingRightArrow.classList.add('display');
  }

  // Otherwise, hide right arrow
  else {
    drawingRightArrow.classList.remove('display');
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
  var container = heart.closest('.drawing-container');
  clearInlineError(heart);

  // Ignore clicks while this heart's last request is still in flight
  if (heart.dataset.pending) {
    return;
  }

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

  function revert(message) {
    setHeart(heart, wasLiked);
    likeText.textContent = previousCount;
    settle();
    inlineError(heart, message, container);
    return;
  }

  function networkFailure() {
    // Add server down banner to page (from common.js script)
    pingServer(retryFunctions);
    revert("Your like didn't go through. Try again in a moment.");
    return;
  }

  // If heart was filled in, delete drawing like and decrease like count
  if (wasLiked) {
    return fetchWithTimeout(api + '/canvashare/drawing-like/' + heart.dataset
      .drawinglike, {
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        method: 'DELETE'
      })

      .then(function(response) {
        // Remove server down banner from page (from common.js script)
        pingServer();

        if (response.ok) {
          delete heart.dataset.drawinglike;
          settle();
          return;
        }

        revert("Your like didn't go through. Sign in again and retry.");
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

      revert("Your like didn't go through. Sign in again and retry.");
      return;
    }, networkFailure)

    .catch(function() {
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


// A clickable icon that keyboards and screen readers can use too
function keyboardButton(element, label) {
  element.setAttribute('role', 'button');
  element.tabIndex = 0;

  if (label) {
    element.setAttribute('aria-label', label);
  }

  element.addEventListener('keydown', function(e) {
    if (e.key == 'Enter' || e.key == ' ') {
      e.preventDefault();
      element.click();
    }

    return;
  }, false);

  return;
}


/* A failure shows next to the control that failed, as a role="alert" line,
and the next attempt clears it */
function inlineError(control, message, anchor, position) {
  clearInlineError(control);
  var note = document.createElement('p');
  note.className = 'inline-error';
  note.setAttribute('role', 'alert');
  note.textContent = message;
  (anchor || control).insertAdjacentElement(position ||
    (anchor ? 'beforeend' : 'afterend'), note);
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


// Load user's posts from server
function loadPosts() {
  return slotFetch(postList, 'Loading posts…', api + '/thought-writer/posts/' +
    encodeURIComponent(localStorage.getItem('username')) + '?start=' + postRequestStart + '&end=' +
    postRequestEnd, {
      credentials: 'include',
      method: 'GET',
    })

      // If server is down, clear post area and hide navigation arrows
      .catch(function(error) {
        // Add server down banner to page (from common.js script)
        pingServer(retryFunctions);

        // Display cached posts if they are stored in localStorage
        if (localStorage.getItem('my-account-posts')) {
          var posts = JSON.parse(localStorage.getItem('my-account-posts'));

          /* Assess if there are more than requested posts - 1 (number of
          loaded posts) */
          if (posts.length > (postRequestEnd - 1)) {
            morePostsToDisplay = true;
            var loadNumber = postRequestEnd - 1;
          }

          // If there are not, display all posts
          else {
            morePostsToDisplay = false;
            var loadNumber = posts.length;
          }

          displayPosts(posts.slice(postRequestStart, loadNumber));
        }

        // Otherwise, display error message
        else {

          // The failure shows in the list, below any page already showing
          slotFailure(postList, "Couldn't load your posts.", loadPosts);

          twMainLink.classList.add('hidden');
          twEditorLink.classList.add('hidden');
          twBoardLink.classList.add('hidden');
        }

        return;
      })

      .then(function(response) {
        if (response) {
          // Remove server down banner from page (from common.js script)
          pingServer();

          if (response.ok) {
            response.json().then(function(posts) {

              /* If there are no posts sent from server, clear post area and
              hide navigation arrows */
              if (posts.length == 0) {
                postList.innerHTML = '';
                postLeftArrow.classList.remove('display');
                postRightArrow.classList.remove('display');

                // Display Thought Writer link to create posts
                twMainLink.classList.add('hidden');
                twBoardLink.classList.add('hidden');
                twEditorLink.classList.remove('hidden');

                return;
              }

              /* Assess if there are more than requested posts - 1 (number of
              loaded posts) on server */
              if (posts.length > (postRequestEnd - postRequestStart - 1)) {
                morePostsToDisplay = true;
                var loadNumber = postRequestEnd - postRequestStart - 1;
              }

              // If there are not, display all posts sent from server
              else {
                morePostsToDisplay = false;
                var loadNumber = posts.length;
              }

              displayPosts(posts.slice(0, loadNumber));

              /* Remove locally stored posts if this is the initial request
              to replace with latest posts from server */
              if (postRequestStart == 0) {
                localStorage.removeItem('my-account-posts');
                var localPosts = [];
              }

              // Otherwise, get locally stored posts list
              else {
                var localPosts = JSON.parse(localStorage
                  .getItem('my-account-posts'));
              }

              /* Add each post to locally stored posts list based on
              postRequestStart and postRequestEnd values */
              for (var i = 0; i < posts.length; i++) {
                localPosts[postRequestStart + i] = posts[i];
              }

              // Store posts in localStorage for offline loading
              localStorage.setItem('my-account-posts', JSON
                .stringify(localPosts));
            });

            return;
          }

          /* Otherwise, if server responds with other error, clear post area
          and hide navigation arrows */

          // The failure shows in the list, below any page already showing
          slotFailure(postList, "Couldn't load your posts.", loadPosts);

          twMainLink.classList.add('hidden');
          twEditorLink.classList.add('hidden');
          twBoardLink.classList.add('hidden');

          return;
        }
      });
}


// Display passed posts in Posts menu
function displayPosts(posts) {
  // Clear post area to display passed posts
  postList.innerHTML = '';

  // Hide Thought Writer error links and display main link
  twMainLink.classList.remove('hidden');
  twEditorLink.classList.add('hidden');
  twBoardLink.classList.add('hidden');

  for (var i = 0; i < posts.length; i++) {
    // Create container for post and its components
    var postContainer = document.createElement('div');
    postContainer.classList.add('post-container');

    /* Set data-number attribute to track the post number for displaying more
    posts later */
    postContainer.dataset.number = postRequestStart + i;

    // Add button to delete post
    var deletePostButton = document.createElement('button');
    deletePostButton.classList.add('delete-button');
    deletePostButton.title = 'Delete post';
    deletePostButton.innerHTML = 'X';
    deletePostButton.type = 'button';
    deletePostButton.dataset.toggle = 'modal';
    deletePostButton.dataset.target = '#confirm-delete-content';
    deletePostButton.dataset.postid = posts[i].post_id;

    /* Set confirmation modal title and content deletion function to run upon
    confirmation when delete button is clicked */
    deletePostButton.onclick = function() {
      document.getElementById('modal-title-content')
        .innerHTML = 'Are you sure you want to delete this post?';

      document.getElementById('confirm-delete-content-button').dataset
        .contentid = this.dataset.postid;

      document.getElementById('confirm-delete-content-button')
        .onclick = function() {
          deleteContent('thought-writer/post',
          this.dataset.contentid, loadPosts);
          return;
        }

      return;
    }

    // Create container for post title
    var postTitle = document.createElement('div');
    postTitle.classList.add('post-title');
    postTitle.textContent = posts[i].title;
    postTitle.title = 'Edit post';

    // Set data-postid attribute to hand to the editor when clicked
    postTitle.dataset.postid = posts[i].post_id;

    /* Go to the editor page for the post when post title is clicked */
    postTitle.onclick = function() {
      window.location = appUrl('thought-writer', 'editor/?post=' +
        encodeURIComponent(this.dataset.postid));
      return;
    }

    // Create container for post background
    var postBoard = document.createElement('div');
    postBoard.classList.add('post-board');

    // Create container with post content
    var postContent = document.createElement('div');
    postContent.classList.add('post-content');
    setRichText(postContent, posts[i].content);

    // Create container for post timestamp and comment number
    var postInfo = document.createElement('div');
    postInfo.classList.add('post-info');

    // Create container for post timestamp
    var postTimestamp = document.createElement('div');
    postTimestamp.classList.add('post-time');

    /* Convert UTC timestamp from server to local timestamp in 'MM/DD/YYYY,
    HH:MM AM/PM' format */
    postTimestamp.innerHTML = moment(posts[i].created)
      .format('MM/DD/YYYY, LT');

    // Create container for number of post comments if post is public
    if (posts[i].public) {
      var postComments = document.createElement('a');
      postComments.classList.add('post-comments');
      postComments.title = 'View post comments';
      postComments.href = appUrl('thought-writer', 'post/?post=' +
        posts[i].post_id) + '#comments';

      if (posts[i].comment_count == 1) {
        postComments.textContent =
          (Number(posts[i].comment_count) || 0) + ' comment';
      } else {
        postComments.textContent =
          (Number(posts[i].comment_count) || 0) + ' comments';
      }
    }

    // Otherwise, display post as private
    else {
      var postComments = document.createElement('div');
      postComments.innerHTML = 'Private post';
    }

    postList.appendChild(postContainer);
    postContainer.appendChild(deletePostButton);
    postContainer.appendChild(postTitle);
    postContainer.appendChild(postBoard);
    postBoard.appendChild(postContent);
    postContainer.appendChild(postInfo);
    postInfo.appendChild(postTimestamp);
    postInfo.appendChild(postComments);
  }

  /* If first post displayed in post area is not post 0 (i.e., there are
  lower-numbered posts to display), display left navigation arrow */
  if (postList.getElementsByClassName('post-container')[0].dataset
    .number != 0) {
      postLeftArrow.classList.add('display');
    }

  // Otherwise, hide left arrow
  else {
    postLeftArrow.classList.remove('display');
  }

  // If there are more posts on the server, display right navigation arrow
  if (morePostsToDisplay) {
    postRightArrow.classList.add('display');
  }

  // Otherwise, hide right arrow
  else {
    postRightArrow.classList.remove('display');
  }

  return;
}


// Load user's comments from server
function loadComments() {
  return slotFetch(postList, 'Loading comments…', api + '/thought-writer/comments/user/' +
    encodeURIComponent(localStorage.getItem('username')) + '?start=' + commentRequestStart +
    '&end=' + commentRequestEnd)

      // If server is down, clear post area and hide navigation arrows
      .catch(function(error) {
        // Add server down banner to page (from common.js script)
        pingServer(retryFunctions);

        // Display cached comments if they are stored in localStorage
        if (localStorage.getItem('my-account-comments')) {
          var comments = JSON.parse(localStorage
            .getItem('my-account-comments'));

          /* Assess if there are more than requested comments - 1 (number of
          displayed comments) */
          if (comments.length > (commentRequestEnd - 1)) {
            moreCommentsToDisplay = true;
            var loadNumber = commentRequestEnd - 1;
          }

          // If there are not, display all comments
          else {
            moreCommentsToDisplay = false;
            var loadNumber = comments.length;
          }

          displayComments(comments.slice(commentRequestStart, loadNumber));
        }

        // Otherwise, display error message
        else {

          // The failure shows in the list, below any page already showing
          slotFailure(postList, "Couldn't load your comments.", loadComments);

          twMainLink.classList.add('hidden');
          twEditorLink.classList.add('hidden');
          twBoardLink.classList.add('hidden');
        }

        return;
      })

      .then(function(response) {
        if (response) {
          // Remove server down banner from page (from common.js script)
          pingServer();

          if (response.ok) {
            response.json().then(function(comments) {

              /* If there are no comments sent from server, clear post area and
              hide navigation arrows */
              if (comments.length == 0) {
                postList.innerHTML = '';
                postLeftArrow.classList.remove('display');
                postRightArrow.classList.remove('display');

                // Display Thought Writer link to create comments
                twMainLink.classList.add('hidden');
                twEditorLink.classList.add('hidden');
                twBoardLink.classList.remove('hidden');

                return;
              }

              /* Assess if there are more than requested comments - 1 (number
              of displayed comments) on server */
              if (comments.length > (commentRequestEnd - commentRequestStart -
                1)) {
                  moreCommentsToDisplay = true;
                  var loadNumber = commentRequestEnd - commentRequestStart - 1;
                }

              // If there are not, display all comments sent from server
              else {
                moreCommentsToDisplay = false;
                var loadNumber = comments.length;
              }

              displayComments(comments.slice(0, loadNumber));

              /* Remove locally stored comments if this is the initial request
              to replace with latest comments from server */
              if (commentRequestStart == 0) {
                localStorage.removeItem('my-account-comments');
                var localComments = [];
              }

              // Otherwise, get locally stored comments list
              else {
                var localComments = JSON.parse(localStorage
                  .getItem('my-account-comments'));
              }

              /* Add each comment to locally stored comments list based on
              commentRequestStart and commentRequestEnd values */
              for (var i = 0; i < comments.length; i++) {
                localComments[commentRequestStart + i] = comments[i];
              }

              // Store comments in localStorage for offline loading
              localStorage.setItem('my-account-comments', JSON
                .stringify(localComments));
            });

            return;
          }

          /* Otherwise, if server responds with other error, clear post area
          and hide navigation arrows */

          // The failure shows in the list, below any page already showing
          slotFailure(postList, "Couldn't load your comments.", loadComments);
          twMainLink.classList.add('hidden');
          twEditorLink.classList.add('hidden');
          twBoardLink.classList.add('hidden');

          return;
        }
      });
}


// Display passed comments in Posts menu
function displayComments(comments) {
  // Clear post area to display new comments from server
  postList.innerHTML = '';

  // Hide Thought Writer error links and display main link
  twMainLink.classList.remove('hidden');
  twEditorLink.classList.add('hidden');
  twBoardLink.classList.add('hidden');

  for (var i = 0; i < comments.length; i++) {
    // Create container for comment and its components
    var commentContainer = document.createElement('div');
    commentContainer.classList.add('comment-container');

    /* Set data-number attribute to track the comment number for displaying
    more comments later */
    commentContainer.dataset.number = commentRequestStart + i;

    // Create container for comment background
    var commentBoard = document.createElement('div');
    commentBoard.classList.add('comment-board');

    // Add button to delete comment
    var deleteCommentButton = document.createElement('button');
    deleteCommentButton.classList.add('delete-button');
    deleteCommentButton.title = 'Delete comment';
    deleteCommentButton.innerHTML = 'X';
    deleteCommentButton.type = 'button';
    deleteCommentButton.dataset.toggle = 'modal';
    deleteCommentButton.dataset.target = '#confirm-delete-content';
    deleteCommentButton.dataset.commentid = comments[i].comment_id;

    /* Set confirmation modal title and content deletion function to run upon
    confirmation when delete button is clicked */
    deleteCommentButton.onclick = function() {
      document.getElementById('modal-title-content')
        .innerHTML = 'Are you sure you want to delete this comment?';

      document.getElementById('confirm-delete-content-button')
        .dataset.contentid = this.dataset.commentid;

      document.getElementById('confirm-delete-content-button')
        .onclick = function() {
          deleteContent('thought-writer/comment',
          this.dataset.contentid, loadComments);
          return;
        }

      return;
    }

    // Create container with comment content
    var commentContent = document.createElement('div');
    commentContent.classList.add('comment-content');
    setRichText(commentContent, comments[i].content);

    // Create container for comment timestamp and link to parent post
    var commentInfo = document.createElement('div');
    commentInfo.classList.add('comment-info');

    // Create container for comment timestamp
    var commentTimestamp = document.createElement('div');
    commentTimestamp.classList.add('comment-time');

    /* Convert UTC timestamp from server to local timestamp in 'MM/DD/YYYY,
    HH:MM AM/PM' format */
    commentTimestamp.innerHTML = moment(comments[i].created)
      .format('MM/DD/YYYY, LT');

    // Create container for link to parent post
    var parentPost = document.createElement('a');
    parentPost.classList.add('parent-post');
    parentPost.title = 'View comment on post page';
    parentPost.href = appUrl('thought-writer', 'post/?post=' +
      comments[i].post_id) + '#comment' + comments[i].comment_id;
    parentPost.textContent = comments[i].title;

    postList.appendChild(commentContainer);
    commentContainer.appendChild(commentBoard);
    commentBoard.appendChild(deleteCommentButton);
    commentBoard.appendChild(commentContent);
    commentContainer.appendChild(commentInfo);
    commentInfo.appendChild(commentTimestamp);
    commentInfo.appendChild(parentPost);
  }

  /* If first comment displayed in post area is not comment 0 (i.e., there are
  lower-numbered comments to display), display left navigation arrow */
  if (postList.getElementsByClassName('comment-container')[0]
    .dataset.number != 0) {
      postLeftArrow.classList.add('display');
    }

  // Otherwise, hide left arrow
  else {
    postLeftArrow.classList.remove('display');
  }

  // If there are more comments on the server, display right navigation arrow
  if (moreCommentsToDisplay) {
    postRightArrow.classList.add('display');
  }

  // Otherwise, hide right arrow
  else {
    postRightArrow.classList.remove('display');
  }

  return;
}


// Define menu navigation functions

// Scroll smoothly to menu section when navbar link is clicked
$('#navbar li a[href^="#"]').on('click', function(e) {
  e.preventDefault();
  var menuHash = this.hash;

  // Flip specified menu to back view
  setFlipped(document.getElementById(menuHash.split('#')[1]), true);

  // Set scroll position in menu scrolling area to top of specified menu
  $('#menu-scroll-area').animate({
    scrollTop: $(menuHash).offset().top + $('#menu-scroll-area')
      .scrollTop() - $('#menu-scroll-area').offset().top
  }, 600,

  // Set window's URL hash to specified menu
  function() {
    return window.location.hash = menuHash;
  });

  return;
});


/* Flip menu from front to back view and vice versa when front menus and back
buttons are clicked respectively */
for (var i = 0; i < document.getElementsByClassName('front-menu')
  .length; i++) {
    document.getElementsByClassName('front-menu')[i].addEventListener('click',
      flipMenu, false);
    keyboardButton(document.getElementsByClassName('front-menu')[i],
      'Open ' + document.getElementsByClassName('front-menu')[i].textContent +
      ' menu');
  }

for (var i = 0; i < document.getElementsByClassName('back-button')
  .length; i++) {
    document.getElementsByClassName('back-button')[i].addEventListener('click',
      flipMenu, false);
  }

function flipMenu() {
  var section = document.getElementById(this.dataset.section);
  var toBack = section.dataset.flipped == 'false';
  setFlipped(section, toBack);

  /* The face just turned away is inert, so focus follows the card: to the
  back's Back button, or to the front face */
  var target = toBack ? section.querySelector('.back-menu .back-button') :
    section.querySelector('.front-menu');
  if (target) {
    target.focus();
  }

  return;
}

/* Turn a menu card to its back (true) or front (false). The face turned away
is opacity 0 and inert: nothing on it can be tabbed to or read out */
function setFlipped(section, flipped) {
  section.classList.toggle('flip', flipped);
  section.dataset.flipped = flipped ? 'true' : 'false';
  var front = section.querySelector(':scope > .front-menu');
  var back = section.querySelector(':scope > .back-menu');
  if (front) {
    front.inert = flipped;
  }
  if (back) {
    back.inert = !flipped;
  }
  return;
}

// Every card starts on its front
var menuSections = document.getElementsByClassName('menu-section');
for (var i = 0; i < menuSections.length; i++) {
  if (menuSections[i].dataset.flipped != 'true') {
    setFlipped(menuSections[i], false);
  }
}


/* Request lower-numbered scores for Rhythm of Life if up arrow is clicked in
Scores menu */
rhythmUpArrow.onclick = function() {
  if (this.classList.contains('display')) {
    rhythmRequestStart = rhythmRequestStart - 10;
    rhythmRequestEnd = rhythmRequestEnd - 10;
    loadScores('rhythm-of-life');
  }

  return;
}


/* Request higher-numbered scores for Rhythm of Life if down arrow is clicked
in Scores menu */
rhythmDownArrow.onclick = function() {
  if (this.classList.contains('display')) {
    rhythmRequestStart = rhythmRequestStart + 10;
    rhythmRequestEnd = rhythmRequestEnd + 10;
    loadScores('rhythm-of-life');
  }

  return;
}


/* Request lower-numbered scores for Shapes in Rain if up arrow is clicked in
Scores menu */
shapesUpArrow.onclick = function() {
  if (this.classList.contains('display')) {
    shapesRequestStart = shapesRequestStart - 10;
    shapesRequestEnd = shapesRequestEnd - 10;
    loadScores('shapes-in-rain');
  }

  return;
}


/* Request higher-numbered scores for Shapes in Rain if down arrow is clicked
in Scores menu */
shapesDownArrow.onclick = function() {
  if (this.classList.contains('display')) {
    shapesRequestStart = shapesRequestStart + 10;
    shapesRequestEnd = shapesRequestEnd + 10;
    loadScores('shapes-in-rain');
  }

  return;
}


// Request lower-numbered drawings if left arrow is clicked in Drawings menu
drawingLeftArrow.onclick = function() {
  if (this.classList.contains('display')) {

    /* If user is on Mine view in Drawings menu, request lower-numbered user
    drawings from server */
    if (mine.classList.contains('selected')) {
      drawingRequestStart = drawingRequestStart - 6;
      drawingRequestEnd = drawingRequestEnd - 6;
      loadDrawings('drawings');
      return;
    }

    // Otherwise, request lower-numbered drawings the user liked
    drawingRequestStart = drawingRequestStart - 6;
    drawingRequestEnd = drawingRequestEnd - 6;
    loadDrawings('drawing-likes/user');
  }

  return;
}


// Request higher-numbered drawings if right arrow is clicked in Drawings menu
drawingRightArrow.onclick = function() {
  if (this.classList.contains('display')) {

    /* If user is on Mine view in Drawings menu, request higher-numbered user
    drawings from server */
    if (mine.classList.contains('selected')) {
      drawingRequestStart = drawingRequestStart + 6;
      drawingRequestEnd = drawingRequestEnd + 6;
      loadDrawings('drawings');
      return;
    }

    // Otherwise, request higher-numbered drawings the user liked
    drawingRequestStart = drawingRequestStart + 6;
    drawingRequestEnd = drawingRequestEnd + 6;
    loadDrawings('drawing-likes/user');
  }

  return;
}


/* Request lower-numbered posts or comments from server if left arrow is
clicked in Posts menu */
postLeftArrow.onclick = function() {
  if (this.classList.contains('display')) {

    /* If user is on Posts view in Posts menu, request lower-numbered posts
    from server */
    if (postsButton.classList.contains('selected')) {
      postRequestStart = postRequestStart - 6;
      postRequestEnd = postRequestEnd - 6;
      loadPosts();
      return;
    }

    // Otherwise, request lower-numbered comments
    commentRequestStart = commentRequestStart - 6;
    commentRequestEnd = commentRequestEnd - 6;
    loadComments();
  }

  return;
}


/* Request higher-numbered posts or comments from server if right arrow is
clicked in Posts menu */
postRightArrow.onclick = function() {
  if (this.classList.contains('display')) {

    /* If user is on Posts view in Posts menu, request higher-numbered posts
    from server */
    if (postsButton.classList.contains('selected')) {
      postRequestStart = postRequestStart + 6;
      postRequestEnd = postRequestEnd + 6;
      loadPosts();
      return;
    }

    // Otherwise, request higher-numbered comments
    commentRequestStart = commentRequestStart + 6;
    commentRequestEnd = commentRequestEnd + 6;
    loadComments();
  }

  return;
}


// Toggle Mine/Liked views of Drawings menu when Mine/Liked buttons are clicked
mine.onclick = toggleDrawings;
liked.onclick = toggleDrawings;

function toggleDrawings() {
  // Set drawing request numbers to starting numbers
  drawingRequestStart = 0;
  drawingRequestEnd = 7;

  /* If the Liked button is clicked, set the button as selected and request
  liked drawings from server */
  if (this == liked) {
    liked.classList.add('selected');
    liked.setAttribute('aria-pressed', 'true');
    mine.classList.remove('selected');
    mine.setAttribute('aria-pressed', 'false');
    loadDrawings('drawing-likes/user');
    return;
  }

  /* Otherwise, set the Mine button as selected and request user drawings from
  server */
  mine.classList.add('selected');
  mine.setAttribute('aria-pressed', 'true');
  liked.classList.remove('selected');
  liked.setAttribute('aria-pressed', 'false');
  loadDrawings('drawings');

  return;
}


/* Toggle Posts/Comments views of Posts menu when Posts/Comments buttons are
clicked */
postsButton.onclick = togglePosts;
commentsButton.onclick = togglePosts;

function togglePosts() {
  // Set post/comment request numbers to starting numbers
  postRequestStart = 0;
  postRequestEnd = 7;
  commentRequestStart = 0;
  commentRequestEnd = 7;

  /* If the Comments button is clicked, set the button as selected and request
  comments from server */
  if (this == commentsButton) {
    commentsButton.classList.add('selected');
    commentsButton.setAttribute('aria-pressed', 'true');
    postsButton.classList.remove('selected');
    postsButton.setAttribute('aria-pressed', 'false');
    loadComments();
    return;
  }

  // Otherwise, set the Posts button as selected and request posts from server
  postsButton.classList.add('selected');
  postsButton.setAttribute('aria-pressed', 'true');
  commentsButton.classList.remove('selected');
  commentsButton.setAttribute('aria-pressed', 'false');
  loadPosts();

  return;
}


// Define Personal menu functions

// Suspend account when user confirms suspension in modal
document.getElementById('confirm-suspend-account-button')
  .addEventListener('click', function() {
    deleteAccount('', this, 'Suspending…');
    return;
  }, false);

// Delete account when user confirms deletion in modal
document.getElementById('confirm-delete-account-button')
  .addEventListener('click', function() {
    deleteAccount('data/', this, 'Deleting…');
    return;
  }, false);

/* Delete account, including user's data if specified ('data/'): the confirm
button that was pressed stays busy (its modal open) until the server answers,
and a failure says so in that modal */
function deleteAccount(data, button, busyLabel) {
  var modal = button.closest('.modal');
  var footer = modal.querySelector('.modal-footer');
  var noButton = footer.querySelector('button:not([id])');
  clearInlineError(button);
  var restoreButton = setBusy(button, busyLabel);
  noButton.disabled = true;

  function failed(message) {
    restoreButton();
    noButton.disabled = false;
    inlineError(button, message, footer, 'beforebegin');
    return;
  }

  return fetchWithTimeout(api + '/user/' + data + encodeURIComponent(localStorage
    .getItem('username')), {
      credentials: 'include',
      headers: {'Content-Type': 'application/json'},
      method: 'DELETE',
    })

    .then(function(response) {
      // Remove server down banner from page (from common.js script)
      pingServer();

      /* Take user to Create Account page with request to delete account if
      server responds without error */
      if (response.ok) {
        sessionStorage.setItem('account-request', 'delete');
        window.location.href = '../create-account/';
        return;
      }

      failed("That didn't go through. Sign in again and retry.");
      return;
    }, function() {
      // Add server down banner to page (from common.js script)
      pingServer(retryFunctions);
      failed("Couldn't reach the server. Try again in a moment.");
      return;
    });
}

// A confirm modal opens clean: no failure left from an earlier attempt
$('#confirm-suspend-account, #confirm-delete-account, #confirm-delete-content, #verify')
  .on('show.bs.modal', function() {
    var buttons = this.querySelectorAll('button[id]');
    for (var i = 0; i < buttons.length; i++) {
      clearInlineError(buttons[i]);
    }

    return;
  });


/* Download all user data in zip file when user clicks Download Data button.
One request at a time: the button is busy until it answers */
var downloadButton = document.getElementById('download-data');

downloadButton.addEventListener('click', function() {
  if (downloadButton.getAttribute('aria-busy')) {
    return;
  }

  clearInlineError(downloadButton);

  // Show zip modal to tell user that data is being retrieved
  $(zip).modal('show');

  downloadData();

  return;
}, false);

function downloadData() {
  var restoreDownload = setBusy(downloadButton, 'Preparing…');

  // A failure closes the modal and says so under Download Data
  function failed() {
    restoreDownload();
    $(zip).modal('hide');
    inlineError(downloadButton, "Your data couldn't be downloaded. Try " +
      'again in a moment.');
    return;
  }

  return fetchWithTimeout(api + '/user/data/' + encodeURIComponent(localStorage
    .getItem('username')) + '?preventCache=' + new Date().getTime(), {
      credentials: 'include',
      method: 'GET',
    }, 60000)

    .then(function(response) {
      // Remove server down banner from page (from common.js script)
      pingServer();

      if (!response.ok) {
        failed();
        return;
      }

      // Download zip file if server responds without error
      return response.blob().then(function(file) {
        restoreDownload();

        // Create anchor tag with link to zip file
        var fileLink = document.createElement('a');
        fileLink.innerHTML = '<i class="far fa-file-archive" aria-hidden="true"></i>';
        fileLink.setAttribute('aria-label', 'Download ' +
          localStorage.getItem('username') + '.zip');

        var url = window.URL.createObjectURL(file);
        fileLink.href = url;
        fileLink.download = localStorage.getItem('username') + '.zip';

        // Add link to modal
        document.getElementById('zip-container')
          .innerHTML = 'Click here to download your data: ';
        document.getElementById('zip-container').appendChild(fileLink);

        document.getElementById('zip-button').innerHTML = 'Close';
        return;
      });
    })

    .catch(function() {
      // Add server down banner to page (from common.js script)
      pingServer(retryFunctions);
      failed();
      return;
    });
}

// Reset zip modal text when modal is closed
$(zip).on('hidden.bs.modal', function() {
  document.getElementById('zip-container').innerHTML = 'Your data is being ' +
    'retrieved now. Do not close this popup.';

  document.getElementById('zip-button').innerHTML = 'Cancel';

  return;
});


// Click hidden color picker input when profile background is clicked
profileBackground.onclick = function(e) {
  if (e.target == this && !backgroundColorPicker.disabled) {
    backgroundColorPicker.jscolor.show();
  }

  return;
}


// Click hidden color picker input when profile rows are clicked
for (var i = 0; i < profileBackground.getElementsByClassName('row')
  .length; i++) {
    profileBackground.getElementsByClassName('row')[i]
      .addEventListener('click',
        function(e) {
          if (e.target == this && !backgroundColorPicker.disabled) {
            backgroundColorPicker.jscolor.show();
          }
          return;
        }, false);
  }


/* Change color of profile background when user selects color from background
color picker */
function updateBgColor(color) {
  profileBackground.style.backgroundColor = '#' + color;
  backgroundColorPicker.value = '#' + color;

  // Update field font colors based on background color
  updateFontColors();

  return;
}


/* Assess darkness of user's profile background color and adjust font color of
menu items to light/dark in response */
function updateFontColors() {
  var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i
    .exec(backgroundColorPicker.value);
  var r = parseInt(rgb[1], 16);
  var g = parseInt(rgb[2], 16);
  var b = parseInt(rgb[3], 16);

  /* If user is editing information in Personal menu, only change color of
  title elements for inputs and account buttons */
  if (editingPersonal) {
    if (r + g + b > 382) {
      for (var i = 0; i < accountButtons.length; i++) {
        accountButtons[i].classList.remove('light');
        accountButtons[i].classList.add('dark');
      }

      profileBackground.classList.remove('light');
      profileBackground.classList.add('dark');
    } else {
      for (var i = 0; i < accountButtons.length; i++) {
        accountButtons[i].classList.remove('dark');
        accountButtons[i].classList.add('light');
      }

      profileBackground.classList.remove('dark');
      profileBackground.classList.add('light');
    }

    return;
  }

  // Otherwise, change color of all elements in Personal menu
  if (r + g + b > 382) {
    for (var i = 0; i < accountButtons.length; i++) {
      accountButtons[i].classList.remove('light');
      accountButtons[i].classList.add('dark');
    }

    profileBackground.classList.remove('light');
    profileBackground.classList.add('dark');

    for (var i = 0; i < document.getElementsByClassName('form-control')
      .length; i++) {
        document.getElementsByClassName('form-control')[i].classList
          .remove('light');
        document.getElementsByClassName('form-control')[i].classList
          .add('dark');
      }

  }

  else {
    for (var i = 0; i < accountButtons.length; i++) {
      accountButtons[i].classList.remove('dark');
      accountButtons[i].classList.add('light');
    }

    profileBackground.classList.remove('dark');
    profileBackground.classList.add('light');

    for (var i = 0; i < document.getElementsByClassName('form-control')
      .length; i++) {
        document.getElementsByClassName('form-control')[i].classList
          .remove('dark');
        document.getElementsByClassName('form-control')[i].classList
          .add('light');
      }
  }

  return;
}


// Click hidden color picker input when profile icon container is clicked
profileIcon.onclick = function() {
  if (!iconColorPicker.disabled) {
    iconColorPicker.jscolor.show();
  }

  return;
}


/* Change diamond profile icon color when user selects color from icon color
picker */
function updateIconColor(color) {
  diamond.style.fill = '#' + color;
  iconColorPicker.value = '#' + color;

  // Update icon background color based on icon color
  updateIconBackground();

  // Refresh profile icon rendering to eliminate SVG artifacts in Safari
  document.getElementById('profile-icon').style.webkitTransform = 'scale(1)';

  return;
}


/* Assess darkness of user's profile icon color and adjust icon background
color to black/white in response */
function updateIconBackground() {
  var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(iconColorPicker
    .value);
  var r = parseInt(rgb[1], 16);
  var g = parseInt(rgb[2], 16);
  var b = parseInt(rgb[3], 16);

  if (r + g + b > 670) {
    profileIcon.style.backgroundColor = '#000000';
  } else {
    profileIcon.style.backgroundColor = '#ffffff';
  }

  return;
}


// Determine if username input has errors when user focuses out of field
usernameInput.onfocusout = validateUsername;

function validateUsername() {
  var username = usernameInput.value;

  /* Display warning that username cannot be blank if input has no non-space
  characters */
  if (!/\S/.test(username)) {
    document.getElementById('user-chars').style.display = 'none';
    document.getElementById('user-exists').style.display = 'none';
    document.getElementById('user-blank').style.display = 'block';
    return false;
  }

  /* Display warning that username has unacceptable characters if there are
  non-alphanumeric, underscore, or dash characters */
  if (!username.match(/^[a-zA-Z0-9_-]+$/)) {
    document.getElementById('user-blank').style.display = 'none';
    document.getElementById('user-exists').style.display = 'none';
    document.getElementById('user-chars').style.display = 'block';
    return false;
  }

  // Otherwise, hide warnings
  document.getElementById('user-blank').style.display = 'none';
  document.getElementById('user-exists').style.display = 'none';
  document.getElementById('user-chars').style.display = 'none';

  return true;
}


// Determine if password input has errors when user focuses out of field
passwordInput.onfocusout = function() {
  validatePassword();

  /* If password and confirm password fields are blank, remove confirm password
  error if displayed */
  if (!passwordInput.value && !confirmPassInput.value) {
    validatePasswordMatch();
  }
  return;
}

function validatePassword() {
  var password = passwordInput.value;

  /* Display warning that password is too short if input is less than 8
  characters */
  if (password.length > 0 && password.length < 8) {
    document.getElementById('pass-short').style.display = 'block';
    return false;
  }

  // Otherwise, hide warning
  document.getElementById('pass-short').style.display = 'none';

  return true;
}


/* Determine if confirmation password matches original password when user
focuses out of field */
confirmPassInput.onfocusout = validatePasswordMatch;

function validatePasswordMatch() {
  var password = passwordInput.value;
  var confirmPassword = confirmPassInput.value;

  // If passwords do not match, display warning
  if (password != confirmPassword) {
    document.getElementById('pass-mismatch').style.display = 'block';
    return false;
  }

  // Otherwise, hide warning
  document.getElementById('pass-mismatch').style.display = 'none';

  return true;
}


// Check name public checkbox if user clicks "Public?" text
document.getElementById('name-public-text').onclick = function() {
  if (!this.classList.contains('editing')) {
    return;
  }

  if (namePublicInput.checked) {
    namePublicInput.checked = false;
    namePublicInput.focus();
    return;
  }

  namePublicInput.checked = true;
  namePublicInput.focus();

  return;
}


/* Determine if name fields have errors when user focuses out of fields or
public checkbox */
firstNameInput.onfocusout = validateName;
lastNameInput.onfocusout = validateName;
namePublicInput.onfocusout = validateName;

function validateName() {
  var firstName = firstNameInput.value;

  // If name is marked as public and first name is blank, display warning
  if (firstName.length == 0 && namePublicInput.checked) {
    document.getElementById('first-name-blank').style.display = 'block';
    document.getElementById('last-name-blank').style.display = 'block';
    return false;
  }

  // Otherwise, hide warning
  document.getElementById('first-name-blank').style.display = 'none';
  document.getElementById('last-name-blank').style.display = 'none';

  return true;
}


// Check email public checkbox if user clicks "Public?" text
document.getElementById('email-public-text').onclick = function() {
  if (!this.classList.contains('editing')) {
    return;
  }

  if (emailPublicInput.checked) {
    emailPublicInput.checked = false;
    emailPublicInput.focus();
    return;
  }

  emailPublicInput.checked = true;
  emailPublicInput.focus();

  return;
}


/* Determine if email address has errors when user focuses out of field or
public checkbox */
emailInput.onfocusout = validateEmail;
emailPublicInput.onfocusout = validateEmail;

function validateEmail() {
  var email = emailInput.value;

  /* If email address is marked as public or is not blank and is missing an "@"
  symbol, display warning */
  if ((email.length > 0 || emailPublicInput.checked) && !email.match('@')) {
    document.getElementById('email-chars').style.display = 'block';
    document.getElementById('email-claimed').style.display = 'none';
    return false;
  }

  // Otherwise, hide warnings
  document.getElementById('email-chars').style.display = 'none';
  document.getElementById('email-claimed').style.display = 'none';

  return true;
}


/* Enter edit mode when Edit button is clicked or save edits when in edit mode
in Personal menu */
editButton.onclick = editPersonal;

function editPersonal() {
  // Enter edit mode by saving unedited values in case user cancels edits
  aboutBlurb = aboutInput.value;
  username = usernameInput.value;
  password = passwordInput.value;
  firstName = firstNameInput.value;
  lastName = lastNameInput.value;
  namePublic = namePublicInput.checked;
  email = emailInput.value;
  emailPublic = emailPublicInput.checked;
  backgroundColor = backgroundColorPicker.value;
  iconColor = iconColorPicker.value;

  /* Add editing style to fields and enable inputs that were previously
  disabled */
  profileBackground.classList.add('editing');
  profileIcon.classList.add('editing');
  diamond.classList.add('editing');
  aboutInput.classList.add('editing');
  aboutInput.disabled = false;

  for (var i = 0; i < fields.length; i++) {
    fields[i].classList.add('editing');
    fields[i].disabled = false;
  }

  for (var i = 0; i < document.getElementsByClassName('public-text')
    .length; i++) {
      document.getElementsByClassName('public-text')[i].classList
        .add('editing');
    }

  for (var i = 0; i < checkboxes.length; i++) {
    checkboxContainers[i].classList.add('editing');
    checkboxes[i].classList.add('editing');
  }

  // Set placeholder text for password fields
  passwordInput.placeholder = 'Enter new password here to change it';
  confirmPassInput.placeholder = 'Enter new password here to change it';

  // Set editingPersonal variable to true
  editingPersonal = true;

  // Display Cancel button to allow user to cancel edits
  cancelButton.style.display = 'block';

  // Display Save button to allow user to submit edits
  saveButton.style.display = 'block';

  // Hide Edit button
  editButton.style.display = 'none';

  return;
}


/* If user is in edit mode, check that username, password, confirm password,
and email address fields have no errors when user clicks Save button */
saveButton.onclick = function() {
  if (editingPersonal) {

    // Do nothing if errors are present
    if (!validateUsername() || !validatePassword() || !validatePasswordMatch()
      || !validateName() || !validateEmail()) {
        return;
      }

    /* If user requests to change username or password, prompt user to enter
    password to verify changes in modal */
    if (usernameInput.value != localStorage.getItem('username')
      || passwordInput.value != '') {
        $(verify).modal('show');
        // Focus on verify password input in modal
        verifyPassInput.focus();
        return;
      }

    // Otherwise, submit edits to server
    submitEdits();

    return;
  }

  return;
}


/* Click Submit button when enter key is clicked in verify password input when
submitting edits to personal information */
verifyPassInput.addEventListener('keyup', function(e) {
  if (e.keyCode == 13) {
    e.preventDefault();
    submitButton.click();
  }

  return;
}, false);


/* Check that password is correct in verify password input when submitting
edits to personal information */
submitButton.onclick = checkPassword;

function checkPassword() {
  // One check at a time
  if (submitButton.getAttribute('aria-busy')) {
    return;
  }

  verifyPassword = verifyPassInput.value;
  clearInlineError(submitButton);

  // Clear verify password input in case user needs to verify edits again
  verifyPassInput.value = '';

  var restoreSubmit = setBusy(submitButton, 'Checking…');

  return fetchWithTimeout(api + '/login', {
    headers: {'Authorization': 'Basic ' + btoa(localStorage
      .getItem('username') + ':' + verifyPassword)},
    credentials: 'include',
    method: 'GET',
  })

    .then(function(response) {
      // Remove server down banner from page (from common.js script)
      pingServer();
      restoreSubmit();

      /* If user's password was incorrect, keep the modal open to try again */
      if (response.status == 401) {
        document.getElementById('verify-title')
          .innerHTML = 'Password incorrect. Please try again:';
        verifyPassInput.focus();
        return;
      }

      // If server responds successfully, close the modal and submit edits
      if (response.status == 200) {
        $(verify).modal('hide');
        submitEdits();
        return;
      }

      // Too many password attempts: show the server's rate-limit message
      if (response.status == 429) {
        inlineError(submitButton, RATE_LIMITED_MESSAGE, verifyPassInput);
        return;
      }

      // Otherwise the failure shows in the modal, which stays open
      inlineError(submitButton, "Couldn't check your password. Try again " +
        'in a moment.', verifyPassInput);
      return;
    }, function() {
      // Add server down banner to page (from common.js script)
      pingServer(retryFunctions);
      restoreSubmit();
      inlineError(submitButton, "Couldn't reach the server. Try again in a " +
        'moment.', verifyPassInput);
      return;
    });
}


// Submit requested edits to user's personal information to server
function submitEdits() {
  /* Disable Save and Cancel buttons and set cursor style to waiting until
  server request goes through */
  clearInlineError(saveButton);
  var restoreSave = setBusy(saveButton, 'saving…');
  cancelButton.disabled = true;
  document.body.style.cursor = 'wait';

  // Set email value to null if blank to prevent uniqueness error on back-end
  if (emailInput.value) {
    var email = emailInput.value;
  } else {
    var email = null;
  }

  var data = JSON.stringify({
    'about': aboutInput.value,
    'background_color': backgroundColorPicker.value,
    'email': email,
    'email_public': emailPublicInput.checked,
    'first_name': firstNameInput.value,
    'icon_color': iconColorPicker.value,
    'last_name': lastNameInput.value,
    'name_public': namePublicInput.checked,
    'password': passwordInput.value,
    'username': usernameInput.value
  });

  return fetchWithTimeout(api + '/user/' + encodeURIComponent(localStorage.getItem('username')), {
    credentials: 'include',
    headers: {'Content-Type': 'application/json'},
    method: 'PATCH',
    body: data,
  })

    // Display error if server is down
    .catch(function(error) {
      // Add server down banner to page (from common.js script)
      pingServer(retryFunctions);

      // Reset Save and Cancel buttons and cursor style
      restoreSave();
      cancelButton.disabled = false;
      document.body.style.cursor = '';
      inlineError(saveButton, "Couldn't reach the server. Your changes " +
        "weren't saved; try again in a moment.", document.getElementById('button-row'));

      return;
    })

    .then(function(response) {
      if (response) {
        // Remove server down banner from page (from common.js script)
        pingServer();

        if (response.status == 409) {
          response.text().then(function(error) {
            // If server responds that username already exists, display warning
            if (error == 'Username already exists') {
              document.getElementById('user-exists').style.display = 'block';
            }

            /* If server responds that email address already claimed, display
            warning */
            if (error == 'Email address already claimed') {
              document.getElementById('email-claimed').style.display = 'block';
            }
          });

          // Reset Save and Cancel buttons and cursor style
          restoreSave();
          cancelButton.disabled = false;
          document.body.style.cursor = '';

          return;
        }

        if (response.status == 200) {
          /* If response is successful, update localStorage username
          and the menu (in case user updated username) */
          response.text().then(function() {
            localStorage.removeItem('username');
            localStorage.setItem('username', usernameInput.value);
            showSignedIn(localStorage.getItem('username'));

            // Return Personal menu fields to view-only mode and disable inputs
            profileBackground.classList.remove('editing');
            profileIcon.classList.remove('editing');
            diamond.classList.remove('editing');
            aboutInput.classList.remove('editing');
            aboutInput.disabled = true;

            for (var i = 0; i < fields.length; i++) {
              fields[i].classList.remove('editing');
              fields[i].disabled = true;
            }

            for (var i = 0; i < document.getElementsByClassName('public-text')
              .length; i++) {
                document.getElementsByClassName('public-text')[i].classList
                  .remove('editing');
              }

            for (var i = 0; i < checkboxes.length; i++) {
              checkboxContainers[i].classList.remove('editing');
              checkboxes[i].classList.remove('editing');
            }

            // Clear password and confirm password fields
            passwordInput.value = '';
            confirmPassInput.value = '';

            // Reset placeholder text for password fields
            passwordInput.placeholder = '';
            confirmPassInput.placeholder = '';

            // Set editingPersonal variable to false
            editingPersonal = false;

            // Display Edit button
            editButton.style.display = 'block';

            // Hide Cancel and Save buttons
            cancelButton.style.display = 'none';
            saveButton.style.display = 'none';

            // Update field font colors based on background color
            updateFontColors();

          });

          // Reset Save and Cancel buttons and cursor style
          restoreSave();
          cancelButton.disabled = false;
          document.body.style.cursor = '';

          return;
        }

        /* If server rejects a field (e.g. HTML in About), display the
        server's reason */
        if (response.status == 400) {
          response.text().then(function(reason) {
            inlineError(saveButton, reason, document.getElementById('button-row'));
          });

          // Reset Save and Cancel buttons and cursor style
          restoreSave();
          cancelButton.disabled = false;
          document.body.style.cursor = '';

          return;
        }

        // Otherwise the failure shows under Save
        restoreSave();
        cancelButton.disabled = false;
        document.body.style.cursor = '';
        inlineError(saveButton, "Your changes weren't saved. Try again in a " +
          'moment.', document.getElementById('button-row'));

        return;
      }
    });
}


// Set verify password modal title to original instructions when modal closes
$(verify).on('hidden.bs.modal', function () {
  document.getElementById('verify-title')
    .innerHTML = 'Please enter your password to verify changes:';
  return;
});


// Cancel edits when user clicks Cancel button
cancelButton.onclick = cancelEdits;

function cancelEdits() {
  // A failed save's message goes with the edits it was about
  clearInlineError(saveButton);

  /* Return Personal menu fields to initial values set when user clicked Edit
  button */
  iconColorPicker.value = iconColor;
  diamond.style.fill = iconColor;

  // Update icon background color based on icon color
  updateIconBackground();

  aboutInput.value = aboutBlurb;
  usernameInput.value = username;
  passwordInput.value = password;
  confirmPassInput.value = password;
  firstNameInput.value = firstName;
  lastNameInput.value = lastName;
  namePublicInput.checked = namePublic;
  emailInput.value = email;
  emailPublicInput.checked = emailPublic;
  backgroundColorPicker.value = backgroundColor;
  profileBackground.style.backgroundColor = backgroundColor;

  // Update field font colors based on background color
  updateFontColors();

  // Hide all username, password, and email input error warnings
  document.getElementById('user-blank').style.display = 'none';
  document.getElementById('user-chars').style.display = 'none';
  document.getElementById('user-exists').style.display = 'none';
  document.getElementById('pass-short').style.display = 'none';
  document.getElementById('pass-mismatch').style.display = 'none';
  document.getElementById('first-name-blank').style.display = 'none';
  document.getElementById('last-name-blank').style.display = 'none';
  document.getElementById('email-chars').style.display = 'none';
  document.getElementById('email-claimed').style.display = 'none';

  // Return Personal menu fields to view-only mode and disable inputs
  profileBackground.classList.remove('editing');
  profileIcon.classList.remove('editing');
  diamond.classList.remove('editing');
  aboutInput.classList.remove('editing');
  aboutInput.disabled = true;

  for (var i = 0; i < fields.length; i++) {
    fields[i].classList.remove('editing');
    fields[i].disabled = true;
  }

  for (var i = 0; i < document.getElementsByClassName('public-text')
    .length; i++) {
      document.getElementsByClassName('public-text')[i].classList
        .remove('editing');
    }

  for (var i = 0; i < checkboxes.length; i++) {
    checkboxContainers[i].classList.remove('editing');
    checkboxes[i].classList.remove('editing');
  }

  // Reset placeholder text for password fields
  passwordInput.placeholder = '';
  confirmPassInput.placeholder = '';

  // Set editingPersonal variable to false
  editingPersonal = false;

  // Display Edit button
  editButton.style.display = 'block';

  // Hide Cancel and Save buttons
  cancelButton.style.display = 'none';
  saveButton.style.display = 'none';

  return;
}


// Define content deletion functions

// Delete content when user confirms deletion in modal
document.getElementById('confirm-delete-content-button')
  .onclick = function() {
    deleteContent(
      this.dataset.contenttype, this.dataset.contentid, this.dataset.function
    );
    return;
  };

/* Delete content by specifying type (e.g., 'thought-writer/post'), id, and
function to run after deletion */
function deleteContent(contentType, contentId, afterFunction) {
  var yesButton = document.getElementById('confirm-delete-content-button');
  var footer = yesButton.parentNode;
  var noButton = footer.querySelector('button:not([id])');
  clearInlineError(yesButton);

  /* Busy state on Yes, and the Delete buttons disabled, until the server
  request goes through */
  var restoreYes = setBusy(yesButton, 'Deleting…');
  noButton.disabled = true;
  var deleteButtons = document.getElementsByClassName('delete-button');
  for (var i = 0; i < deleteButtons.length; i++) {
    deleteButtons[i].disabled = true;
  }
  document.body.style.cursor = 'wait';

  function settle() {
    restoreYes();
    noButton.disabled = false;
    for (var i = 0; i < deleteButtons.length; i++) {
      deleteButtons[i].disabled = false;
    }
    document.body.style.cursor = '';
    return;
  }

  return fetchWithTimeout(api + '/' + contentType + '/' + contentId, {
    credentials: 'include',
    headers: {'Content-Type': 'application/json'},
    method: 'DELETE',
  })

    .then(function(response) {
      // Remove server down banner from page (from common.js script)
      pingServer();
      settle();

      /* Close the modal, call specified function and reload personal info to
      refresh user stats if server responds without error */
      if (response.ok) {
        $('#confirm-delete-content').modal('hide');
        afterFunction();
        loadPersonalInfo();
        return;
      }

      // Otherwise the failure shows in the modal, which stays open
      inlineError(yesButton, "That wasn't deleted. Sign in again and retry.",
        footer, 'beforebegin');
      return;
    }, function() {
      // Add server down banner to page (from common.js script)
      pingServer(retryFunctions);
      settle();
      inlineError(yesButton, "Couldn't reach the server. Try again in a " +
        'moment.', footer, 'beforebegin');
      return;
    });
}

// jscolor's string-valued options are evaluated with new Function, which the
// site's Content-Security-Policy forbids, so its callbacks are set here as functions.
window.addEventListener('load', function() {
  document.getElementById('background-color-picker').jscolor.onFineChange = function() {
    updateBgColor(this);
  };
  document.getElementById('icon-color-picker').jscolor.onFineChange = function() {
    updateIconColor(this);
  };
});
