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
var deleteButton = document.getElementById('delete');
var editButton = document.getElementById('edit');
var saveButton = document.getElementById('save');
var cancelButton = document.getElementById('cancel');
var verifyPassInput = document.getElementById('verify-password-input');
var editingPersonal = false; // If user is editing information in Personal menu


// Define global variables for Scores menu
var displayedScores = []; // Array of displayed scores
var rhythmScoresStart = 0; // Range start for number of scores to display
var rhythmScoresEnd = 11; // Range end for number of scores to display
var shapesScoresStart = 0; // Range start for number of scores to display
var shapesScoresEnd = 11; // Range end for number of scores to display
var moreScoresToDisplay = false; // If there are more scores to display in array
var rhythmLink = document.getElementById('rhythm-link');
var rhythmHeader = document.getElementById('rhythm-header');
var rhythmNoScores = document.getElementById('rhythm-no-scores');
var rhythmError = document.getElementById('rhythm-error');
var rhythmScoreData = document.getElementById('rhythm-score-data');
var rhythmUpArrow = document.getElementById('rhythm-up-arrow');
var rhythmDownArrow = document.getElementById('rhythm-down-arrow');
var shapesLink = document.getElementById('shapes-link');
var shapesHeader = document.getElementById('shapes-header');
var shapesNoScores = document.getElementById('shapes-no-scores');
var shapesError = document.getElementById('shapes-error');
var shapesScoreData = document.getElementById('shapes-score-data');
var shapesUpArrow = document.getElementById('shapes-up-arrow');
var shapesDownArrow = document.getElementById('shapes-down-arrow');


// Define global variables for Drawings menu
var drawingStart = 0; // Range start for number of drawings to request/display
var drawingEnd = 7; // Range end for number of drawings to request/display
var moreDrawingsToDisplay = false; // If there are more drawings to display in array
var csMainLink = document.getElementById('canvashare-main-link');
var csErrorLink = document.getElementById('canvashare-link-error');
var csDrawLink = document.getElementById('canvashare-link-draw');
var csLikeLink = document.getElementById('canvashare-link-like');
var gallery = document.getElementById('gallery');
var drawingRightArrow = document.getElementById('drawings-right-arrow');
var drawingLeftArrow = document.getElementById('drawings-left-arrow');
var mine = document.getElementById('mine');
var liked = document.getElementById('liked');


// Define global variables for Posts menu
var twMainLink = document.getElementById('thought-writer-main-link');
var twErrorLink = document.getElementById('thought-writer-link-error');
var twEditorLink = document.getElementById('thought-writer-link-editor');
var twBoardLink = document.getElementById('thought-writer-link-post-board');
var postStart = 0; // Range start for number of posts to request/display
var postEnd = 7; // Range end for number of posts to request/display
var morePostsExist = false; // If there are more posts to display in array
var postList = document.getElementById('post-list');
var postRightArrow = document.getElementById('posts-right-arrow');
var postLeftArrow = document.getElementById('posts-left-arrow');
var commentStart = 0; // Range start for number of comments to request/display
var commentEnd = 7; // Range end for number of comments to request/display
var moreCommentsExist = false; // If there are more comments to display in array
var postsButton = document.getElementById('posts');
var commentsButton = document.getElementById('comments');


// Define load functions
window.onload = function() {
  // Create page header (from common.js script)
  createPageHeader();

  // Create page footer (from common.js script)
  createPageFooter();

  // If user is not logged in, redirect to Sign In page
  if (localStorage.getItem('token') == null || !checkIfLoggedIn()) {
    window.location = '../sign-in/';
    return;
  }

  // Display profile link in Personal menu
  document.getElementById('profile-main-link').innerHTML = localStorage
    .getItem('username');
  document.getElementById('profile-main-link')
    .href = '../?username=' + localStorage.getItem('username');

  /* Display confirmation of account creation if user redirected from Create
  Account page */
  if (sessionStorage.getItem('account-request') == 'create') {
    confirmCreation();
  }

  // Check if Crystal Prism API is online (from common.js script)
  pingServer(function() {
    checkIfLoggedIn();
    loadPersonalInfo();
    loadDrawings('drawings');
    loadPosts();
    loadScores('rhythm-of-life');
    loadScores('shapes-in-rain');
    return;
  });

  // Load user's personal information from server
  loadPersonalInfo();

  // Load user's drawings from server
  loadDrawings('drawings');

  // Load user's posts from server
  loadPosts();

  // Load user's game scores from server
  loadScores('rhythm-of-life');
  loadScores('shapes-in-rain');

  // Scroll to specified menu if hash is in URL
  if (window.location.hash) {
    $('#menu-scroll-area').animate({
      scrollTop: $(window.location.hash).offset().top + $('#menu-scroll-area')
        .scrollTop() - $('#menu-scroll-area').offset().top
    }, 0);
  }

  return;
}


// Display confirmation of account creation
function confirmCreation() {
  // Display successful account creation modal with new username as title
  document.getElementById('success-title').innerHTML = localStorage
    .getItem('username');
  $(success).modal('show');

  // Focus on Okay button to close modal
  document.getElementById('okay').focus();

  // Remove account creation request from sessionStorage
  sessionStorage.removeItem('account-request');

  return;
}


// Load user's personal information from server
function loadPersonalInfo() {
  return fetch(api + '/user', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
    method: 'GET',
  })

    .then(function(response) {
      if (response.ok) {
        response.json().then(function(info) {
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
          document.getElementById('member-stat')
            .innerHTML = moment(info['created']).format('MM/DD/YYYY');

          document.getElementById('rhythm-plays-stat')
            .innerHTML = info['rhythm_score_count'];

          document.getElementById('shapes-plays-stat')
            .innerHTML = info['shapes_score_count'];

          document.getElementById('drawings-stat')
            .innerHTML = info['drawing_count'];

          document.getElementById('liked-stat')
            .innerHTML = info['drawing_like_count'];

          document.getElementById('posts-stat').innerHTML = info['post_count'];

          document.getElementById('comments-stat')
            .innerHTML = info['comment_count'];
        });

        return;
      }
    });
}


/* Load user's scores from server, specifying game ('rhythm-of-life' or
'shapes-in-rain') */
function loadScores(game) {
  if (game == 'rhythm-of-life') {
    // Clear score area to replace with requested scores
    rhythmScoreData.innerHTML = '';

    scoresStart = rhythmScoresStart;
    scoresEnd = rhythmScoresEnd;
  } else {
    // Clear score area to replace with requested scores
    shapesScoreData.innerHTML = '';

    scoresStart = shapesScoresStart;
    scoresEnd = shapesScoresEnd;
  }

  return fetch(api + '/' + game + '/scores/' +
    localStorage.getItem('username') + '?start=' + scoresStart + '&end=' +
    scoresEnd, {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
      method: 'GET',
    })

    // If server is down, display error banners in Scores menu
    .catch(function(error) {
      rhythmLink.classList.add('hidden');
      rhythmHeader.classList.add('hidden');
      rhythmNoScores.classList.add('hidden');
      rhythmError.classList.remove('hidden');
      shapesLink.classList.add('hidden');
      shapesHeader.classList.add('hidden');
      shapesNoScores.classList.add('hidden');
      shapesError.classList.remove('hidden');
      return;
    })

    .then(function(response) {
      if (response.ok) {
        response.json().then(function(scores) {
          // Display scores in scores area
          displayScores(scores, game);
        });
        return;
      }

      // If server responds with error, display error banners in Scores menu
      rhythmLink.classList.add('hidden');
      rhythmHeader.classList.add('hidden');
      rhythmNoScores.classList.add('hidden');
      rhythmError.classList.remove('hidden');
      shapesLink.classList.add('hidden');
      shapesHeader.classList.add('hidden');
      shapesNoScores.classList.add('hidden');
      shapesError.classList.remove('hidden');

      return;
    });
}


// Display user's scores for passed game ('rhythm-of-life' or 'shapes-in-rain')
function displayScores(scores, game) {
  // If game is Rhythm of Life, set score variables as appropriate
  if (game == 'rhythm-of-life') {

    // If there are no scores, display link to play Rhythm of Life game
    if (scores.length == 0) {
      rhythmLink.classList.add('hidden');
      rhythmHeader.classList.add('hidden');
      rhythmError.classList.add('hidden');
      rhythmNoScores.classList.remove('hidden');
      return;
    }

    /* Otherwise, set displayed scores as scores array sliced to requested
    number of scores */
    displayedScores = scores.slice(rhythmScoresStart, rhythmScoresEnd);
    var scoresStart = rhythmScoresStart;
    var scoresEnd = rhythmScoresEnd;

    /* Unhide Scores menu header for Rhythm of Life scores and hide error and
    no score banners */
    rhythmLink.classList.remove('hidden');
    rhythmHeader.classList.remove('hidden');
    rhythmError.classList.add('hidden');
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
      shapesError.classList.add('hidden');
      shapesNoScores.classList.remove('hidden');
      return;
    }

    /* Otherwise, set displayed scores as scores array sliced to requested
    number of scores */
    displayedScores = scores.slice(shapesScoresStart, shapesScoresEnd);
    var scoresStart = shapesScoresStart;
    var scoresEnd = shapesScoresEnd;

    /* Unhide Scores menu header for Shapes in Rain scores and hide error and
    no score banners */
    shapesLink.classList.remove('hidden');
    shapesHeader.classList.remove('hidden');
    shapesError.classList.add('hidden');
    shapesNoScores.classList.add('hidden');

    var scoreData = shapesScoreData;
    var upArrow = shapesUpArrow;
    var downArrow = shapesDownArrow;
  }

  /* If there are scores to display in array, assess if there are more than
  sliced scores - 1 (number of displayed scores) in array */
  if (displayedScores.length != 0) {

    if (displayedScores.length > (scoresEnd - scoresStart - 1)) {
      moreScoresToDisplay = true;
      var scoreLoadNumber = scoresEnd - scoresStart - 1;
    }

    // If there are not, load all scores in array
    else {
      moreScoresToDisplay = false;
      var scoreLoadNumber = displayedScores.length;
    }

    for (var i = 0; i < scoreLoadNumber; i++) {
      // Create row for score data
      var scoreRow = document.createElement('div');
      scoreRow.classList.add('row');
      scoreRow.classList.add('no-gutters');
      scoreRow.classList.add('w-100');
      scoreRow.classList.add('d-flex');
      scoreRow.classList.add('justify-content-center');

      /* Set data-number attribute to track the score number for displaying
      more scores later */
      scoreRow.dataset.number = scoresStart + i;

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
        star.classList.add('fa');
        star.classList.add('fa-star');
        starCol.appendChild(star);
      }

      // If game is Rhythm of Life, display lifespan as score
      if (game == 'rhythm-of-life') {
        // Create column for score
        var scoreCol = document.createElement('div');
        scoreCol.classList.add('col-3');

        var sec_num = displayedScores[i].score;
        var score_hours = Math.floor(sec_num / 3600);
        var score_minutes = Math.floor((sec_num - (score_hours * 3600)) / 60);
        var score_seconds = sec_num - (score_hours * 3600) -
          (score_minutes * 60);
        var lifespan_value = ('0' + score_hours).slice(-2) + ':' +
          ('0' + score_minutes).slice(-2) + ':' + ('0' + score_seconds)
          .slice(-2);

        scoreCol.innerHTML = lifespan_value;
      }

      // Otherwise, display score
      else {
        // Create column for score
        var scoreCol = document.createElement('div');
        scoreCol.classList.add('col-2');

        scoreCol.innerHTML = displayedScores[i].score;
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
  return fetch(api + '/canvashare/' + type + '/' +
    localStorage.getItem('username') + '?start=' + drawingStart + '&end=' +
    drawingEnd)

      // If server is down, clear drawing area and hide navigation arrows
      .catch(function(error) {
        gallery.innerHTML = '';
        drawingLeftArrow.classList.remove('display');
        drawingRightArrow.classList.remove('display');

        // Display error banner with CanvaShare link
        csErrorLink.classList.remove('hidden');
        csMainLink.classList.add('hidden');
        csDrawLink.classList.add('hidden');
        csLikeLink.classList.add('hidden');
        return;
      })

      .then(function(response) {
        if (response.ok) {
          response.json().then(function(drawings) {
            // Display drawings in drawing area
            displayDrawings(type, drawings);
          });
          return;
        }

        /* Otherwise, if server responds with error, clear drawing area and
        hide navigation arrows */
        gallery.innerHTML = '';
        drawingLeftArrow.classList.remove('display');
        drawingRightArrow.classList.remove('display');

        // Display error banner with CanvaShare link
        csErrorLink.classList.remove('hidden');
        csMainLink.classList.add('hidden');
        csDrawLink.classList.add('hidden');
        csLikeLink.classList.add('hidden');

        return;
      });
}


/* Display passed array of drawings in drawing area,  specifying type
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
      csErrorLink.classList.add('hidden');
      csDrawLink.classList.remove('hidden');
      csLikeLink.classList.add('hidden');
      return;
    }

    // Otherwise, display link to like drawings
    csMainLink.classList.add('hidden');
    csErrorLink.classList.add('hidden');
    csDrawLink.classList.add('hidden');
    csLikeLink.classList.remove('hidden');

    return;
  }

  // Otherwise, hide CanvaShare error links and display main link
  csMainLink.classList.remove('hidden');
  csErrorLink.classList.add('hidden');
  csDrawLink.classList.add('hidden');
  csLikeLink.classList.add('hidden');

  // Clear drawing area to populate with passed array of drawings
  gallery.innerHTML = '';

  /* Assess if there are more than requested drawings - 1 (number of loaded
  drawings) in array */
  if (drawings.length > (drawingEnd - drawingStart - 1)) {
    moreDrawingsToDisplay = true;
    var drawingsLoadNumber = 6;
  }

  // If there are not, load all drawings sent from server
  else {
    moreDrawingsToDisplay = false;
    var drawingsLoadNumber = drawings.length;
  }

  for (var i = 0; i < drawingsLoadNumber; i++) {
    // Create container for drawing and its components
    var drawingContainer = document.createElement('div');
    drawingContainer.classList.add('drawing-container');

    /* Set data-number attribute to track the drawing number for displaying
    more drawings later */
    drawingContainer.dataset.number = drawingStart + i;

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
    var drawingTitle = document.createElement('div');
    drawingTitle.classList.add('drawing-title');
    drawingTitle.innerHTML = drawings[i]['title'];

    // Create drawing image
    var drawing = document.createElement('img');
    drawing.classList.add('drawing');
    drawing.src = drawings[i]['url'];
    drawing.title = 'View drawing';

    // Set data-drawing attribute as drawing id for later identification
    drawing.dataset.drawing = drawings[i]['drawing_id'];

    // Create container for drawing artist and number of likes and views
    var drawingInfo = document.createElement('div');
    drawingInfo.classList.add('drawing-info');

    // Create container for number of drawing likes
    var drawingLikes = document.createElement('div');
    drawingLikes.classList.add('drawing-likes');
    drawingLikes.title = 'Likes';

    // Create text to display number of likes
    var likeText = document.createElement('text');
    likeText.innerHTML = drawings[i]['like_count'];

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
    viewsIcon.classList.add('fa');
    viewsIcon.classList.add('fa-eye');

    // Create text to display number of views
    var viewText = document.createElement('text');
    viewText.innerHTML = drawings[i]['views'];

    // Set data-drawing attribute as drawing id for later identification
    viewText.dataset.drawing = 'views' + drawings[i]['drawing_id'];

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
      artistLink.href = '../../user/?username=' + drawings[i]['artist_name'];
      artistLink.innerHTML = drawings[i].username;
      drawingInfo.appendChild(drawingArtist);
      drawingArtist.appendChild(artistLink);
    }

    // Update number of views when user clicks drawing title or drawing
    drawingTitle.onclick = function() {
      updateViews(this.nextSibling);
      return;
    }

    drawing.onclick = function() {
      updateViews(this);
      return;
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


// Update passed drawing's view count
function updateViews(drawing) {
  return fetch(api + '/canvashare/drawing/' + drawing.dataset.drawing, {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
    method: 'PATCH',
  })

    // Display error message if server is down
    .catch(function(error) {
      window.alert('Your request did not go through. Please try again soon.')
    })

    /* If server responds without error, update view count and redirect to
    easel page */
    .then(function(response) {
      if (response.ok) {
        var viewText = document
          .querySelectorAll('[data-drawing="views' + drawing.dataset.drawing +
          '"]')[0];
        viewText.innerHTML = parseInt(viewText.innerHTML) + 1;
        window.location = '../../canvashare/easel/?drawing=' + drawing.dataset
          .drawing;
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

  /* If heart is already filled in, delete drawing like and decrease drawing
  like count */
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

      /* If server responds without error, remove heart fill and decrease like
      count user sees */
      .then(function(response) {
        if (response.ok) {
          response.text().then(function(drawingLikeId) {
            var likeText = heart.nextSibling;
            var currentLikes = likeText.innerHTML;
            heart.classList.remove('fa-heart');
            heart.classList.add('fa-heart-o');
            delete heart.dataset.drawinglike;
            likeText.innerHTML = parseInt(currentLikes) - 1;

            // Reload personal information to update user stats
            loadPersonalInfo();
          });
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

          // Reload personal information to update user stats
          loadPersonalInfo();
        });
        return;
      }

      // Otherwise, display error message
      window.alert('You must log in to like a drawing.');

      return;
    });
}


// Load user's posts from server
function loadPosts() {
  return fetch(api + '/thought-writer/posts/' +
    localStorage.getItem('username') + '?start=' +
    postStart + '&end=' + postEnd, {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
      method: 'GET',
    })

      // If server is down, clear post area and hide navigation arrows
      .catch(function(error) {
        postList.innerHTML = '';
        postLeftArrow.classList.remove('display');
        postRightArrow.classList.remove('display');

        // Display error banner with Thought Writer link
        twErrorLink.classList.remove('hidden');
        twMainLink.classList.add('hidden');
        twEditorLink.classList.add('hidden');
        twBoardLink.classList.add('hidden');
        return;
      })

      .then(function(response) {
        if (response.ok) {
          response.json().then(function(posts) {

            /* If there are no posts sent from server, clear post area and hide
            navigation arrows */
            if (posts.length == 0) {
              postList.innerHTML = '';
              postLeftArrow.classList.remove('display');
              postRightArrow.classList.remove('display');

              // Display Thought Writer link to create posts
              twMainLink.classList.add('hidden');
              twErrorLink.classList.add('hidden');
              twBoardLink.classList.add('hidden');
              twEditorLink.classList.remove('hidden');

              return;
            }

            // Otherwise, clear post area to display new posts from server
            postList.innerHTML = '';

            // Hide Thought Writer error links and display main link
            twMainLink.classList.remove('hidden');
            twErrorLink.classList.add('hidden');
            twEditorLink.classList.add('hidden');
            twBoardLink.classList.add('hidden');

            /* Assess if there are more than requested posts - 1 (number of
            loaded posts) on server */
            if (posts.length > (postEnd - postStart - 1)) {
              morePostsExist = true;
              var postsLoadNumber = postEnd - postStart - 1;
            }

            // If there are not, load all posts sent from server
            else {
              morePostsExist = false;
              var postsLoadNumber = posts.length;
            }

            for (var i = 0; i < postsLoadNumber; i++) {
              // Create container for post and its components
              var postContainer = document.createElement('div');
              postContainer.classList.add('post-container');

              /* Set data-number attribute to track the post number for
              displaying more posts later */
              postContainer.dataset.number = postStart + i;

              // Add button to delete post
              var deletePostButton = document.createElement('button');
              deletePostButton.classList.add('delete-button');
              deletePostButton.title = 'Delete post';
              deletePostButton.innerHTML = 'X';
              deletePostButton.type = 'button';
              deletePostButton.dataset.toggle = 'modal';
              deletePostButton.dataset.target = '#confirm-delete-content';
              deletePostButton.dataset.postid = posts[i].post_id;

              /* Set confirmation modal title and content deletion function to
              run upon confirmation when delete button is clicked */
              deletePostButton.onclick = function() {
                document.getElementById('modal-title-content')
                  .innerHTML = 'Are you sure you want to delete this post?';

                document.getElementById('confirm-delete-content-button')
                  .dataset.contentid = this.dataset.postid;

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
              postTitle.innerHTML = posts[i].title;
              postTitle.title = 'Edit post';

              /* Set data-postid attribute to save in sessionStorage when
              clicked */
              postTitle.dataset.postid = posts[i].post_id;

              /* Set sessionStorage post-id item when post title is clicked and
              go to editor page */
              postTitle.onclick = function() {
                sessionStorage.setItem('post-id', this.dataset.postid);
                window.location = '../../thought-writer/editor/';
                return;
              }

              // Create container for post background
              var postBoard = document.createElement('div');
              postBoard.classList.add('post-board');

              // Create container with post content
              var postContent = document.createElement('div');
              postContent.classList.add('post-content');
              postContent.innerHTML = posts[i].content;

              // Create container for post timestamp and comment number
              var postInfo = document.createElement('div');
              postInfo.classList.add('post-info');

              // Create container for post timestamp
              var postTimestamp = document.createElement('div');
              postTimestamp.classList.add('post-time');

              /* Convert UTC timestamp from server to local timestamp in
              'MM/DD/YYYY, HH:MM AM/PM' format */
              postTimestamp.innerHTML = moment(posts[i].created)
                .format('MM/DD/YYYY, LT');

              // Create container for number of post comments if post is public
              if (posts[i].public) {
                var postComments = document.createElement('a');
                postComments.classList.add('post-comments');
                postComments.title = 'View post comments';
                postComments.href = '../../thought-writer/post/?post=' +
                  posts[i].post_id + '#comments';

                if (posts[i].comment_count == 1) {
                  postComments.innerHTML = posts[i].comment_count + ' comment';
                } else {
                  postComments.innerHTML = posts[i].comment_count + ' comments';
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

            /* If first post displayed in post area is not post 0 (i.e., there
            are lower-numbered posts to display), display left navigation
            arrow */
            if (postList.getElementsByClassName('post-container')[0].dataset
              .number != 0) {
                postLeftArrow.classList.add('display');
              }

            // Otherwise, hide left arrow
            else {
              postLeftArrow.classList.remove('display');
            }

            /* If there are more posts on the server, display right navigation
            arrow */
            if (morePostsExist) {
              postRightArrow.classList.add('display');
            }

            // Otherwise, hide right arrow
            else {
              postRightArrow.classList.remove('display');
            }
          });

          return;
        }

        /* Otherwise, if server responds with other error, clear post area and
        hide navigation arrows */
        postList.innerHTML = '';
        postLeftArrow.classList.remove('display');
        postRightArrow.classList.remove('display');

        // Display error banner with Thought Writer link
        twErrorLink.classList.remove('hidden');
        twMainLink.classList.add('hidden');
        twEditorLink.classList.add('hidden');
        twBoardLink.classList.add('hidden');

        return;
      });
}


// Load user's comments from server
function loadComments() {
  return fetch(api + '/thought-writer/comments/user/' +
    localStorage.getItem('username') + '?start=' + commentStart + '&end=' +
    commentEnd)

      // If server is down, clear post area and hide navigation arrows
      .catch(function(error) {
        postList.innerHTML = '';
        postLeftArrow.classList.remove('display');
        postRightArrow.classList.remove('display');

        // Display error banner with Thought Writer link
        twErrorLink.classList.remove('hidden');
        twMainLink.classList.add('hidden');
        twEditorLink.classList.add('hidden');
        twBoardLink.classList.add('hidden');
        return;
      })

      .then(function(response) {
        if (response.ok) {
          response.json().then(function(comments) {

            /* If there are no comments sent from server, clear post area and
            hide navigation arrows */
            if (comments.length == 0) {
              postList.innerHTML = '';
              postLeftArrow.classList.remove('display');
              postRightArrow.classList.remove('display');

              // Display Thought Writer link to create comments
              twErrorLink.classList.add('hidden');
              twMainLink.classList.add('hidden');
              twEditorLink.classList.add('hidden');
              twBoardLink.classList.remove('hidden');

              return;
            }

            // Otherwise, clear post area to display new comments from server
            postList.innerHTML = '';

            // Hide Thought Writer error links and display main link
            twMainLink.classList.remove('hidden');
            twErrorLink.classList.add('hidden');
            twEditorLink.classList.add('hidden');
            twBoardLink.classList.add('hidden');

            /* Assess if there are more than requested comments - 1 (number of
            loaded comments) on server */
            if (comments.length > (commentEnd - commentStart - 1)) {
              moreCommentsExist = true;
              var commentsLoadNumber = commentEnd - commentStart - 1;
            }

            // If there are not, load all comments sent from server
            else {
              moreCommentsExist = false;
              var commentsLoadNumber = comments.length;
            }

            for (var i = 0; i < commentsLoadNumber; i++) {
              // Create container for comment and its components
              var commentContainer = document.createElement('div');
              commentContainer.classList.add('comment-container');

              /* Set data-number attribute to track the comment number for
              displaying more comments later */
              commentContainer.dataset.number = commentStart + i;

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

              /* Set confirmation modal title and content deletion function to
              run upon confirmation when delete button is clicked */
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
              commentContent.innerHTML = comments[i].content;

              // Create container for comment timestamp and link to parent post
              var commentInfo = document.createElement('div');
              commentInfo.classList.add('comment-info');

              // Create container for comment timestamp
              var commentTimestamp = document.createElement('div');
              commentTimestamp.classList.add('comment-time');

              /* Convert UTC timestamp from server to local timestamp in
              'MM/DD/YYYY, HH:MM AM/PM' format */
              commentTimestamp.innerHTML = moment(comments[i].created)
                .format('MM/DD/YYYY, LT');

              // Create container for link to parent post
              var parentPost = document.createElement('a');
              parentPost.classList.add('parent-post');
              parentPost.title = 'View post';
              parentPost.href = '../../thought-writer/post/?post=' +
                comments[i].post_id;
              parentPost.innerHTML = comments[i].title;

              postList.appendChild(commentContainer);
              commentContainer.appendChild(commentBoard);
              commentBoard.appendChild(deleteCommentButton);
              commentBoard.appendChild(commentContent);
              commentContainer.appendChild(commentInfo);
              commentInfo.appendChild(commentTimestamp);
              commentInfo.appendChild(parentPost);
            }

            /* If first comment displayed in post area is not comment 0 (i.e.,
            there are lower-numbered comments to display), display left
            navigation arrow */
            if (postList.getElementsByClassName('comment-container')[0].dataset
              .number != 0) {
                postLeftArrow.classList.add('display');
              }

            // Otherwise, hide left arrow
            else {
              postLeftArrow.classList.remove('display');
            }

            /* If there are more comments on the server, display right
            navigation arrow */
            if (moreCommentsExist) {
              postRightArrow.classList.add('display');
            }

            // Otherwise, hide right arrow
            else {
              postRightArrow.classList.remove('display');
            }
          });

          return;
        }

        /* Otherwise, if server responds with other error, clear post area and
        hide navigation arrows */
        postList.innerHTML = '';
        postLeftArrow.classList.remove('display');
        postRightArrow.classList.remove('display');

        // Display error banner with Thought Writer link
        twMainLink.classList.add('hidden');
        twErrorLink.classList.remove('hidden');
        twEditorLink.classList.add('hidden');
        twBoardLink.classList.add('hidden');

        return;
      });
}


// Define menu navigation functions

// Scroll smoothly to menu section when navbar link is clicked
$('#navbar li a[href^="#"]').on('click', function(e) {
  e.preventDefault();
  var menuHash = this.hash;

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
for (var i = 0; i < document.getElementsByClassName('front-menu').length; i++) {
  document.getElementsByClassName('front-menu')[i].addEventListener('click',
    flipMenu, false);
}

for (var i = 0; i < document.getElementsByClassName('back-button')
  .length; i++) {
    document.getElementsByClassName('back-button')[i].addEventListener('click',
      flipMenu, false);
  }

function flipMenu() {
  // If menu is not already flipped, flip it to back view
  if (document.getElementById(this.dataset.section).dataset
    .flipped == 'false') {
      document.getElementById(this.dataset.section).classList.add('flip');
      document.getElementById(this.dataset.section).dataset.flipped = 'true';
      return;
    }

  // Otherwise, flip menu to front view
  document.getElementById(this.dataset.section).classList.remove('flip');
  document.getElementById(this.dataset.section).dataset.flipped = 'false';

  return;
}


/* Request lower-numbered scores for Rhythm of Life if up arrow is clicked in
Scores menu */
rhythmUpArrow.onclick = function() {
  if (this.classList.contains('display')) {
    rhythmScoresStart = rhythmScoresStart - 10;
    rhythmScoresEnd = rhythmScoresEnd - 10;
    loadScores('rhythm-of-life');
  }

  return;
}


/* Request higher-numbered scores for Rhythm of Life if down arrow is clicked
in Scores menu */
rhythmDownArrow.onclick = function() {
  if (this.classList.contains('display')) {
    rhythmScoresStart = rhythmScoresStart + 10;
    rhythmScoresEnd = rhythmScoresEnd + 10;
    loadScores('rhythm-of-life');
  }

  return;
}


/* Request lower-numbered scores for Shapes in Rain if up arrow is clicked in
Scores menu */
shapesUpArrow.onclick = function() {
  if (this.classList.contains('display')) {
    shapesScoresStart = shapesScoresStart - 10;
    shapesScoresEnd = shapesScoresEnd - 10;
    loadScores('shapes-in-rain');
  }

  return;
}


/* Request higher-numbered scores for Shapes in Rain if down arrow is clicked
in Scores menu */
shapesDownArrow.onclick = function() {
  if (this.classList.contains('display')) {
    shapesScoresStart = shapesScoresStart + 10;
    shapesScoresEnd = shapesScoresEnd + 10;
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
      drawingStart = drawingStart - 6;
      drawingEnd = drawingEnd - 6;
      loadDrawings('drawings');
      return;
    }

    // Otherwise, request lower-numbered drawings the user liked
    drawingStart = drawingStart - 6;
    drawingEnd = drawingEnd - 6;
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
      drawingStart = drawingStart + 6;
      drawingEnd = drawingEnd + 6;
      loadDrawings('drawings');
      return;
    }

    // Otherwise, request higher-numbered drawings the user liked
    drawingStart = drawingStart + 6;
    drawingEnd = drawingEnd + 6;
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
      postStart = postStart - 6;
      postEnd = postEnd - 6;
      loadPosts();
      return;
    }

    // Otherwise, request lower-numbered comments
    commentStart = commentStart - 6;
    commentEnd = commentEnd - 6;
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
      postStart = postStart + 6;
      postEnd = postEnd + 6;
      loadPosts();
      return;
    }

    // Otherwise, request higher-numbered comments
    commentStart = commentStart + 6;
    commentEnd = commentEnd + 6;
    loadComments();
  }

  return;
}


// Toggle Mine/Liked views of Drawings menu when Mine/Liked buttons are clicked
mine.onclick = toggleDrawings;
liked.onclick = toggleDrawings;

function toggleDrawings() {
  // Set drawing request numbers to starting numbers
  drawingStart = 0;
  drawingEnd = 7;

  /* If the Liked button is clicked, set the button as selected and request
  liked drawings from server */
  if (this == liked) {
    liked.classList.add('selected');
    mine.classList.remove('selected');
    loadDrawings('drawing-likes/user');
    return;
  }

  /* Otherwise, set the Mine button as selected and request user drawings from
  server */
  mine.classList.add('selected');
  liked.classList.remove('selected');
  loadDrawings('drawings');

  return;
}


/* Toggle Posts/Comments views of Posts menu when Posts/Comments buttons are
clicked */
postsButton.onclick = togglePosts;
commentsButton.onclick = togglePosts;

function togglePosts() {
  // Set post/comment request numbers to starting numbers
  postStart = 0;
  postEnd = 7;
  commentStart = 0;
  commentEnd = 7;

  /* If the Comments button is clicked, set the button as selected and request
  comments from server */
  if (this == commentsButton) {
    commentsButton.classList.add('selected');
    postsButton.classList.remove('selected');
    loadComments();
    return;
  }

  // Otherwise, set the Posts button as selected and request posts from server
  postsButton.classList.add('selected');
  commentsButton.classList.remove('selected');
  loadPosts();

  return;
}


// Define Personal menu functions

// Delete account when user confirms deletion in modal
document.getElementById('confirm-delete-account-button')
  .onclick = deleteAccount;

function deleteAccount() {
  return fetch(api + '/user', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'),
      'Content-Type': 'application/json'},
    method: 'DELETE',
  })

    // Display warning if server is down
    .catch(function(error) {
      window.alert('Your request did not go through. Please try again soon.');
      return;
    })

    .then(function(response) {
      /* Take user to Create Account page with request to delete account if
      server responds without error */
      if (response.ok) {
        sessionStorage.setItem('account-request', 'delete');
        window.location.href = '../create-account/';
        return;
      }

      // Otherwise, display warning if server responds with error
      window.alert('Your request did not go through. Please try again soon.');

      return;
    });
}


/* Click hidden color picker input when profile background is clicked (must
focus first to open) */
profileBackground.onclick = function(e) {
  if (e.target == this) {
    backgroundColorPicker.focus();
    backgroundColorPicker.click();
  }

  return;
}


/* Click hidden color picker input when profile rows are clicked (must focus
first to open) */
for (var i = 0; i < profileBackground.getElementsByClassName('row')
  .length; i++) {
    profileBackground.getElementsByClassName('row')[i].addEventListener('click',
      function(e) {
        if (e.target == this) {
          backgroundColorPicker.focus();
          backgroundColorPicker.click();
        }
        return;
      }, false);
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
  title elements for inputs and Delete Account button */
  if (editingPersonal) {
    if (r + g + b > 382) {
      profileBackground.classList.remove('light');
      deleteButton.classList.remove('light');
      profileBackground.classList.add('dark');
      deleteButton.classList.add('dark');
    } else {
      profileBackground.classList.remove('dark');
      deleteButton.classList.remove('dark');
      profileBackground.classList.add('light');
      deleteButton.classList.add('light');
    }

    return;
  }

  // Otherwise, change color of all elements in Personal menu
  if (r + g + b > 382) {
    profileBackground.classList.remove('light');
    deleteButton.classList.remove('light');
    profileBackground.classList.add('dark');
    deleteButton.classList.add('dark');

    for (var i = 0; i < document.getElementsByClassName('form-control')
      .length; i++) {
      document.getElementsByClassName('form-control')[i].classList
        .remove('light');
        document.getElementsByClassName('form-control')[i].classList
          .add('dark');
      }

  }

  else {
    profileBackground.classList.remove('dark');
    deleteButton.classList.remove('dark');
    profileBackground.classList.add('light');
    deleteButton.classList.add('light');

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


/* Click hidden color picker input when profile icon container is clicked (must
focus first to open) */
profileIcon.onclick = function() {
  iconColorPicker.focus();
  iconColorPicker.click();
  return;
}


/* Change color of profile background when user selects color from background
color picker */
backgroundColorPicker.oninput = function() {
  profileBackground.style.backgroundColor = this.value;

  // Update field font colors based on background color
  updateFontColors();

  return;
}


/* Change diamond profile icon color when user selects color from icon color
picker */
iconColorPicker.oninput = function() {
  diamond.style.fill = this.value;

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
passwordInput.onfocusout = validatePassword;

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
    return false;
  }

  // Otherwise, hide warning
  document.getElementById('email-chars').style.display = 'none';

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

  for (var i = 0; i < checkboxes.length; i++) {
    checkboxContainers[i].classList.add('editing');
    checkboxes[i].classList.add('editing');
  }

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
      || !validateEmail()) {
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
    document.getElementById('submit').click();
  }

  return;
}, false);


/* Check that password is correct in verify password input when submitting
edits to personal information */
document.getElementById('submit').onclick = checkPassword;

function checkPassword() {
  verifyPassword = verifyPassInput.value;

  // Clear verify password input in case user needs to verify edits again
  verifyPassInput.value = '';

  return fetch(api + '/login', {
    headers: {'Authorization': 'Basic ' + btoa(localStorage
      .getItem('username') + ':' + verifyPassword)},
    method: 'GET',
  })

    // Display warning if server is down
    .catch(function(error) {
      window.alert('Your request did not go through. Please try again soon.');
      return;
    })

    .then(function(response) {
      /* If user's password was incorrect, display modal with verify password
      field to try again */
      if (response.status == 401) {
        document.getElementById('verify-title')
          .innerHTML = 'Password incorrect. Please try again:';
        $(verify).modal('show');
        verifyPassInput.focus();
        return;
      }

      // If server responds successfully, submit edits to server
      if (response.status == 200) {
        submitEdits();
        return;
      }

      // Otherwise, display warning if server responds with other error
      window.alert('Your request did not go through. Please try again soon.');

      return;
    });
}


// Submit requested edits to user's personal information to server
function submitEdits() {
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

  return fetch(api + '/user', {
    headers: {'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('token')},
    method: 'PATCH',
    body: data,
  })

    // Display error if server is down
    .catch(function(error) {
      window.alert('Your request did not go through. Please try again soon.');
      return;
    })

    .then(function(response) {
      // If server responds that username already exists, display warning
      if (response.status == 409) {
        document.getElementById('user-exists').style.display = 'block';
        return;
      }

      if (response.status == 200) {
        /* If response is successful, update localStorage username and token and
        profile link (in case user updated username) */
        response.text().then(function(token) {
          localStorage.removeItem('username');
          localStorage.setItem('username', usernameInput.value);
          localStorage.removeItem('token');
          localStorage.setItem('token', token);
          document.getElementById('profile-link').innerHTML = localStorage
            .getItem('username');
          document.getElementById('profile-link')
            .href = '../?username=' + localStorage.getItem('username');

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

          for (var i = 0; i < checkboxes.length; i++) {
            checkboxContainers[i].classList.remove('editing');
            checkboxes[i].classList.remove('editing');
          }

          // Clear password and confirm password fields
          passwordInput.value = '';
          confirmPassInput.value = '';

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
        return;
      }

      // Otherwise, display warning if server responds with other error
      window.alert('Your request did not go through. Please try again soon.');

      return;
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
  document.getElementById('email-chars').style.display = 'none';

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

  for (var i = 0; i < checkboxes.length; i++) {
    checkboxContainers[i].classList.remove('editing');
    checkboxes[i].classList.remove('editing');
  }

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
  return fetch(api + '/' + contentType + '/' + contentId, {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'),
      'Content-Type': 'application/json'},
    method: 'DELETE',
  })

    // Display warning if server is down
    .catch(function(error) {
      window.alert('Your request did not go through. Please try again soon.');
      return;
    })

    .then(function(response) {
      /* Call specified function and reload personal info to refresh user stats
      if server responds without error */
      if (response.ok) {
        afterFunction();
        loadPersonalInfo();
        return;
      }

      // Otherwise, display warning if server responds with error
      window.alert('Your request did not go through. Please try again soon.');

      return;
    });
}
