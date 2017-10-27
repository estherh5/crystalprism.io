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
var diamond;
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
var editingPersonal = false; // Variable to track if user is editing information in Personal menu

// Define global variables for Scores menu
var rhythmScores = []; // Array of user's Rhythm of Life scores
var shapesScores = []; // Array of user's Shapes in Rain scores
var displayedScores = []; // Array of displayed scores (sliced from rhythmScores or shapesScores)
var rhythmScoresStart = 0; // Range start for number of scores to display from array
var rhythmScoresEnd = 11; // Range end for number of scores to display from array
var shapesScoresStart = 0; // Range start for number of scores to display from array
var shapesScoresEnd = 11; // Range end for number of scores to display from array
var moreScoresToDisplay = false; // Variable to track if there are more scores that can be displayed
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
var drawingStart = 0; // Range start for number of drawings to request from server / display from array
var drawingEnd = 7; // Range end for number of drawings to request from server / display from array
var moreDrawingsToDisplay = false; // Variable to track if there are more drawings that can be displayed
var canvashareLinkOne = document.getElementById('canvashare-link-container-one');
var canvashareLinkTwo = document.getElementById('canvashare-link-container-two');
var canvashareLinkThree = document.getElementById('canvashare-link-container-three');
var drawingArea = document.getElementById('drawing-area');
var drawingRightArrow = document.getElementById('drawings-right-arrow');
var drawingLeftArrow = document.getElementById('drawings-left-arrow');
var mine = document.getElementById('mine');
var liked = document.getElementById('liked');

// Define global variables for Posts menu
var thoughtWriterLinkOne = document.getElementById('thought-writer-link-container-one');
var thoughtWriterLinkTwo = document.getElementById('thought-writer-link-container-two');
var postStart = 0; // Range start for number of posts to request from server / display from array
var postEnd = 7; // Range end for number of posts to request from server / display from array
var morePostsExist = false; // Variable to track if there are more posts that can be displayed
var postArea = document.getElementById('post-area');
var postRightArrow = document.getElementById('posts-right-arrow');
var postLeftArrow = document.getElementById('posts-left-arrow');

// Determine server based on window location
if (window.location.hostname == 'crystalprism.io') {
  var server = 'http://13.58.175.191/api';
} else {
  var server = 'http://localhost:5000/api';
}


// Define load functions
window.onload = function() {
  // Create page header (from common.js script)
  createPageHeader();
  // If user is not logged in, redirect to Sign In page
  if (localStorage.getItem('token') == null || !checkIfLoggedIn()) {
    window.location = '../sign-in/index.html';
    return;
  }
  // Display confirmation of account creation if user redirected from Create Account page
  if (sessionStorage.getItem('account-request') == 'create') {
    confirmCreation();
  }
  // Get SVG from diamond object once it loads
  diamond = document.getElementById('diamond').contentDocument.getElementById('diamond-svg');
  // Load user's personal information from server
  loadPersonal();
  // Load user's drawings from server
  loadDrawings();
  // Load user's posts from server
  loadPosts();
  return;
}

// Display confirmation of account creation
function confirmCreation() {
  // Display successful account creation modal with new username as title
  document.getElementById('success-title').innerHTML = localStorage.getItem('username');
  $(success).modal('show');
  // Focus on Okay button to close modal
  document.getElementById('okay').focus();
  // Remove account creation request from sessionStorage
  sessionStorage.removeItem('account-request');
  return;
}

// Load user's personal information from server
function loadPersonal() {
  return fetch(server + '/user', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
    method: 'GET',
  }).catch(function(error) {
    // If server is down, display error banners in Scores menu
    rhythmLink.classList.add('hidden');
    rhythmHeader.classList.add('hidden');
    rhythmNoScores.classList.add('hidden');
    rhythmError.classList.remove('hidden');
    shapesLink.classList.add('hidden');
    shapesHeader.classList.add('hidden');
    shapesNoScores.classList.add('hidden');
    shapesError.classList.remove('hidden');
    return;
  }).then(function(response) {
    if (response.ok) {
      response.json().then(function(info) {
        // Fill in user's personal information to Personal menu and stats to Stats menu
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
        // Convert UTC timestamp from server to local timestamp in 'MM/DD/YYYY' format
        var dateTime = new Date(info['member_since']);
        document.getElementById('member-stat').innerHTML = dateTime.toLocaleDateString();
        document.getElementById('rhythm-plays-stat').innerHTML = info['rhythm_plays'];
        rhythmScores = info['rhythm_scores'];
        // Load Rhythm of Life scores to Scores menu with array from server
        displayScores('rhythm');
        document.getElementById('shapes-plays-stat').innerHTML = info['shapes_plays'];
        shapesScores = info['shapes_scores'];
        // Load Shapes in Rain scores to Scores menu with array from server
        displayScores('shapes');
        likedDrawings = info['liked_drawings'];
        document.getElementById('drawings-stat').innerHTML = info['drawing_number'];
        document.getElementById('liked-stat').innerHTML = likedDrawings.length;
        document.getElementById('posts-stat').innerHTML = info['post_number'];
        document.getElementById('comments-stat').innerHTML = info['comment_number'];
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

// Display user's scores for passed game variable
function displayScores(game) {
  // If game variable is for Rhythm of Life, set score variables as appropriate
  if (game == 'rhythm') {
    // If there are no scores, display link to play Rhythm of Life game
    if (rhythmScores.length == 0) {
      rhythmLink.classList.add('hidden');
      rhythmHeader.classList.add('hidden');
      rhythmError.classList.add('hidden');
      rhythmNoScores.classList.remove('hidden');
      return;
    }
    // Otherwise, set displayed scores as scores array sliced to requested number of scores
    displayedScores = rhythmScores.slice(rhythmScoresStart, rhythmScoresEnd);
    var scoresStart = rhythmScoresStart;
    var scoresEnd = rhythmScoresEnd;
    // Unhide Scores menu header for Rhythm of Life scores and hide error and no score banners
    rhythmLink.classList.remove('hidden');
    rhythmHeader.classList.remove('hidden');
    rhythmError.classList.add('hidden');
    rhythmNoScores.classList.add('hidden');
    // Clear score area to replace with requested scores
    rhythmScoreData.innerHTML = '';
    var scoreData = rhythmScoreData;
    var upArrow = rhythmUpArrow;
    var downArrow = rhythmDownArrow;
  }
  // If game variable is for Shapes in Rain, set score variables as appropriate
  else if (game == 'shapes') {
    // If there are no scores, display link to play Shapes in Rain game
    if (shapesScores.length == 0) {
      shapesLink.classList.add('hidden');
      shapesHeader.classList.add('hidden');
      shapesError.classList.add('hidden');
      shapesNoScores.classList.remove('hidden');
      return;
    }
    // Otherwise, set displayed scores as scores array sliced to requested number of scores
    displayedScores = shapesScores.slice(shapesScoresStart, shapesScoresEnd);
    var scoresStart = shapesScoresStart;
    var scoresEnd = shapesScoresEnd;
    // Unhide Scores menu header for Shapes in Rain scores and hide error and no score banners
    shapesLink.classList.remove('hidden');
    shapesHeader.classList.remove('hidden');
    shapesError.classList.add('hidden');
    shapesNoScores.classList.add('hidden');
    // Clear score area to replace with requested scores
    shapesScoreData.innerHTML = '';
    var scoreData = shapesScoreData;
    var upArrow = shapesUpArrow;
    var downArrow = shapesDownArrow;
  }
  // If there are scores to display in array, assess if there are more than sliced scores - 1 (number of displayed scores) in array
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
      // Set data-number attribute to track the score number for displaying more scores later
      scoreRow.dataset.number = scoresStart + i;
      // Create column for displaying star next to first score in total scores array (high score)
      var starCol = document.createElement('div');
      starCol.classList.add('col-1');
      if (scoreRow.dataset.number == 0) {
        var star = document.createElement('i');
        star.classList.add('fa');
        star.classList.add('fa-star');
        starCol.append(star);
      }
      // Create column for score
      var scoreCol = document.createElement('div');
      scoreCol.classList.add('col-3');
      // If game is Rhythm of Life, display lifespan as score
      if (game == 'rhythm') {
        scoreCol.innerHTML = displayedScores[i].lifespan;
      }
      // Otherwise, display score
      else {
        scoreCol.innerHTML = displayedScores[i].score;
      }
      // Create column for score timestamp
      var scoreTimestampCol = document.createElement('div');
      scoreTimestampCol.classList.add('col-6');
      // Convert UTC timestamp from server to local timestamp in 'MM/DD/YYYY, HH:MM AM/PM' format
      var dateTime = new Date(displayedScores[i].timestamp);
      scoreTimestampCol.innerHTML = dateTime.toLocaleString().replace(/:\d{2}\s/,' ');
      scoreData.append(scoreRow);
      scoreRow.append(starCol);
      scoreRow.append(scoreCol);
      scoreRow.append(scoreTimestampCol);
    }
    // If first score displayed in score area is not score 0 (i.e., there are lower-numbered scores to display), display up navigation arrow
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

// Load user's drawings from server
function loadDrawings() {
  return fetch(server + '/canvashare/gallery/' + encodeURIComponent(localStorage
    .getItem('username')) + '?start=' + drawingStart + '&end=' + drawingEnd, {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
    method: 'GET',
  }).catch(function(error) {
    // If server is down, clear drawing area and hide navigation arrows
    drawingArea.innerHTML = '';
    drawingLeftArrow.classList.remove('display');
    drawingRightArrow.classList.remove('display');
    // Display error banner with CanvaShare link
    canvashareLinkOne.classList.remove('hidden');
    canvashareLinkTwo.classList.add('hidden');
    canvashareLinkThree.classList.add('hidden');
    return;
  }).then(function(response) {
    if (response.ok) {
      response.json().then(function(userDrawings) {
        // Display user's drawings in drawing area
        displayDrawings(userDrawings);
      });
      return;
    }
    // Otherwise, if server responds with error, clear drawing area and hide navigation arrows
    drawingArea.innerHTML = '';
    drawingLeftArrow.classList.remove('display');
    drawingRightArrow.classList.remove('display');
    // Display error banner with CanvaShare link
    canvashareLinkOne.classList.remove('hidden');
    canvashareLinkTwo.classList.add('hidden');
    canvashareLinkThree.classList.add('hidden');
    return;
  });
}

// Display passed array of drawings in drawing area
function displayDrawings(drawings) {
  // If there are no drawings sent from server, clear drawing area and display CanvaShare link
  if (drawings.length == 0) {
    drawingArea.innerHTML = '';
    // Hide left and right navigation arrows
    drawingLeftArrow.classList.remove('display');
    drawingRightArrow.classList.remove('display');
    // If user is on the "Mine" view in the Drawings menu, display link to create drawings
    if (mine.classList.contains('selected')) {
      canvashareLinkOne.classList.add('hidden');
      canvashareLinkTwo.classList.remove('hidden');
      canvashareLinkThree.classList.add('hidden');
      return;
    }
    // Otherwise, display link to like drawings
    canvashareLinkOne.classList.add('hidden');
    canvashareLinkTwo.classList.add('hidden');
    canvashareLinkThree.classList.remove('hidden');
    return;
  }
  // Otherwise, hide CanvaShare links
  canvashareLinkOne.classList.add('hidden');
  canvashareLinkTwo.classList.add('hidden');
  canvashareLinkThree.classList.add('hidden');
  // Clear drawing area to populate with passed array of drawings
  drawingArea.innerHTML = '';
  // Assess if there are more than requested drawings - 1 (number of loaded drawings) in array
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
    // Set data-number attribute to track the drawing number for displaying more drawings later
    drawingContainer.dataset.number = drawingStart + i;
    // Create container for drawing title
    var drawingTitle = document.createElement('div');
    drawingTitle.classList.add('drawing-title');
    // Set data-drawing attribute as drawing file name for later identification, with URI-encoded characters
    drawingTitle.dataset.drawing = encodeURIComponent(drawings[i]);
    // Create drawing image
    var drawing = document.createElement('img');
    drawing.classList.add('drawing');
    drawing.src = server + '/canvashare/drawing/' + encodeURIComponent(drawings[i]);
    drawing.title = 'View drawing';
    // Create container for drawing artist and number of likes and views
    var drawingInfo = document.createElement('div');
    drawingInfo.classList.add('drawing-info');
    // Create container for number of drawing likes
    var drawingLikes = document.createElement('div');
    drawingLikes.classList.add('drawing-likes');
    drawingLikes.title = 'Likes';
    // Set data-drawing attribute as drawing file name for later identification, with URI-encoded characters
    drawingLikes.dataset.drawing = encodeURIComponent(drawings[i]);
    // Create text to display number of likes
    var likeText = document.createElement('text');
    // Set data-drawing attribute as drawing file name for later identification, with URI-encoded characters
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
    // Set data-drawing attribute as drawing file name for later identification, with URI-encoded characters
    viewText.dataset.drawing = encodeURIComponent(drawings[i]);
    drawingArea.append(drawingContainer);
    drawingContainer.append(drawingTitle);
    drawingContainer.append(drawing);
    drawingContainer.append(drawingInfo);
    drawingInfo.append(drawingLikes);
    drawingLikes.append(likeText);
    drawingInfo.append(drawingViews);
    drawingViews.append(viewsIcon);
    drawingViews.append(viewText);
    // Redirect to easel page and display drawing when user clicks drawing
    drawing.onclick = function() {
      sessionStorage.setItem('drawing-source', this.src);
      window.location = '../canvashare/easel/index.html';
      return;
    }
    // Fill in drawing title, views, and likes
    getDrawingInfo(encodeURIComponent(drawings[i]));
  }
  // If first drawing displayed in drawing area is not drawing 0 (i.e., there are lower-numbered drawings to display), display left navigation arrow
  if (drawingArea.getElementsByClassName('drawing-container')[0].dataset.number != 0) {
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

// Get title and number of views and likes for passed drawing file
function getDrawingInfo(drawingFile) {
  return fetch(server + '/canvashare/drawing-info/' + drawingFile.split('.png')[0])
  .then(function(response) {
    response.json().then(function(drawingInfo) {
      // Get elements that have data-drawing attribute set as file name
      var fileElements = document.querySelectorAll('[data-drawing="' + drawingFile + '"]');
      // Set title and number of likes and views for drawing
      fileElements[0].innerHTML = drawingInfo['title'];
      fileElements[2].innerHTML = drawingInfo['likes'];
      fileElements[3].innerHTML = drawingInfo['views'];
      // Display a filled-in red heart in likes container
      var likedHeart = document.createElement('i');
      likedHeart.classList.add('heart');
      likedHeart.classList.add('fa');
      likedHeart.classList.add('fa-heart');
      fileElements[1].insertBefore(likedHeart, fileElements[1].firstChild);
    });
  });
}

// Load user's posts from server
function loadPosts() {
  return fetch(server + '/thought-writer/post-board/' + encodeURIComponent(localStorage
    .getItem('username')) + '?start=' + postStart + '&end=' + postEnd, {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
    method: 'GET',
  }).catch(function(error) {
    // If server is down, clear post area and hide navigation arrows
    postArea.innerHTML = '';
    postLeftArrow.classList.remove('display');
    postRightArrow.classList.remove('display');
    // Display error banner with Thought Writer link
    thoughtWriterLinkOne.classList.remove('hidden');
    thoughtWriterLinkTwo.classList.add('hidden');
    return;
  }).then(function(response) {
    if (response.ok) {
      response.json().then(function(posts) {
        // If there are no posts sent from server, clear post area and hide navigation arrows
        if (posts.length == 0) {
          postArea.innerHTML = '';
          postLeftArrow.classList.remove('display');
          postRightArrow.classList.remove('display');
          // Display Thought Writer link to create posts
          thoughtWriterLinkOne.classList.add('hidden');
          thoughtWriterLinkTwo.classList.remove('hidden');
          return;
        }
        // Otherwise, clear post area to display new posts from server
        postArea.innerHTML = '';
        thoughtWriterLinkOne.classList.add('hidden');
        thoughtWriterLinkTwo.classList.add('hidden');
        // Assess if there are more than requested posts - 1 (number of loaded posts) on server
        if (posts.length > (postEnd - postStart - 1)) {
          morePostsExist = true;
          postsLoadNumber = postEnd - postStart - 1;
        }
        // If there are not, load all posts sent from server
        else {
          morePostsExist = false;
          postsLoadNumber = posts.length;
        }
        for (var i = 0; i < postsLoadNumber; i++) {
          // Create container for post and its components
          var postContainer = document.createElement('div');
          postContainer.classList.add('post-container');
          // Set data-number attribute to track the post number for displaying more posts later
          postContainer.dataset.number = postStart + i;
          // Create container for post title
          var postTitle = document.createElement('div');
          postTitle.classList.add('post-title');
          postTitle.innerHTML = posts[i].title;
          postTitle.title = 'Edit post';
          // Set data-timestamp attribute to save in sessionStorage when clicked
          postTitle.dataset.timestamp = posts[i].timestamp;
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
          // Convert UTC timestamp from server to local timestamp in 'MM/DD/YYYY, HH:MM AM/PM' format
          var dateTime = new Date(posts[i].timestamp);
          postTimestamp.innerHTML = dateTime.toLocaleString().replace(/:\d{2}\s/,' ');
          // Create container for number of post comments if post is public
          if (posts[i].public) {
            var postComments = document.createElement('div');
            postComments.classList.add('post-comments');
            postComments.title = 'View post comments';
            if (posts[i].comments.length == 1) {
              postComments.innerHTML = posts[i].comments.length + ' comment';
            } else {
              postComments.innerHTML = posts[i].comments.length + ' comments';
            }
            // Set data-writer and data-timestamp attributes to save in sessionStorage when clicked
            postComments.dataset.writer = localStorage.getItem('username');
            postComments.dataset.timestamp = posts[i].timestamp;
            // Set sessionStorage items when post comment number is clicked and go to post page's comments
            postComments.onclick = function() {
              sessionStorage.setItem('writer', this.dataset.writer);
              sessionStorage.setItem('timestamp', this.dataset.timestamp);
              window.location = '../../thought-writer/post/index.html#comments';
              return;
            }
          }
          // Otherwise, display post as private
          else {
            var postComments = document.createElement('div');
            postComments.innerHTML = 'Private post';
          }
          postArea.append(postContainer);
          postContainer.append(postTitle);
          postContainer.append(postBoard);
          postBoard.append(postContent);
          postContainer.append(postInfo);
          postInfo.append(postTimestamp);
          postInfo.append(postComments);
          // Set sessionStorage timestamp item when post title is clicked and go to editor page
          postTitle.onclick = function() {
            sessionStorage.setItem('timestamp', this.dataset.timestamp);
            window.location = '../../thought-writer/editor/index.html';
            return;
          }
        }
        // If first post displayed in post area is not post 0 (i.e., there are lower-numbered posts to display), display left navigation arrow
        if (postArea.getElementsByClassName('post-container')[0].dataset.number != 0) {
          postLeftArrow.classList.add('display');
        }
        // Otherwise, hide left arrow
        else {
          postLeftArrow.classList.remove('display');
        }
        // If there are more posts on the server, display right navigation arrow
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
    // Otherwise, if server responds with error, clear post area and hide navigation arrows
    postArea.innerHTML = '';
    postLeftArrow.classList.remove('display');
    postRightArrow.classList.remove('display');
    // Display error banner with Thought Writer link
    thoughtWriterLinkOne.classList.remove('hidden');
    thoughtWriterLinkTwo.classList.add('hidden');
    return;
  });
}


// Define menu navigation functions

// Flip menu from front to back view and vice versa when front menus and back buttons are clicked respectively
for (var i = 0; i < document.getElementsByClassName('front-menu').length; i++) {
  document.getElementsByClassName('front-menu')[i].addEventListener('click', flipMenu, false);
}

for (var i = 0; i < document.getElementsByClassName('back-button').length; i++) {
  document.getElementsByClassName('back-button')[i].addEventListener('click', flipMenu, false);
}

function flipMenu() {
  // If menu is not already flipped, flip it to back view
  if (document.getElementById(this.dataset.section).dataset.flipped == 'false') {
    document.getElementById(this.dataset.section).classList.add('flip');
    document.getElementById(this.dataset.section).dataset.flipped = 'true';
    return;
  }
  // Otherwise, flip menu to front view
  document.getElementById(this.dataset.section).classList.remove('flip');
  document.getElementById(this.dataset.section).dataset.flipped = 'false';
  return;
}

// ?
rhythmUpArrow.onclick = function() {
  if (this.classList.contains('display')) {
    rhythmScoresStart = rhythmScoresStart - 10;
    rhythmScoresEnd = rhythmScoresEnd - 10;
    displayScores('rhythm');
  }
  return;
}

rhythmDownArrow.onclick = function() {
  if (this.classList.contains('display')) {
    rhythmScoresStart = rhythmScoresStart + 10;
    rhythmScoresEnd = rhythmScoresEnd + 10;
    displayScores('rhythm');
  }
  return;
}

shapesUpArrow.onclick = function() {
  if (this.classList.contains('display')) {
    shapesScoresStart = shapesScoresStart - 10;
    shapesScoresEnd = shapesScoresEnd - 10;
    displayScores('shapes');
  }
  return;
}

shapesDownArrow.onclick = function() {
  if (this.classList.contains('display')) {
    shapesScoresStart = shapesScoresStart + 10;
    shapesScoresEnd = shapesScoresEnd + 10;
    displayScores('shapes');
  }
  return;
}

// Request lower-numbered drawings if left arrow is clicked in Drawings menu
drawingLeftArrow.onclick = function() {
  if (this.classList.contains('display')) {
    // If user is on Mine view in Drawings menu, request lower-numbered drawings from server
    if (mine.classList.contains('selected')) {
      drawingStart = drawingStart - 6;
      drawingEnd = drawingEnd - 6;
      loadDrawings();
      return;
    }
    // Otherwise, display lower-numbered drawings in likedDrawings array
    drawingStart = drawingStart - 6;
    drawingEnd = drawingEnd - 6;
    displayDrawings(likedDrawings.slice(drawingStart, drawingEnd));
  }
  return;
}

// Request higher-numbered drawings if right arrow is clicked in Drawings menu
drawingRightArrow.onclick = function() {
  if (this.classList.contains('display')) {
    // If user is on Mine view in Drawings menu, request higher-numbered drawings from server
    if (mine.classList.contains('selected')) {
      drawingStart = drawingStart + 6;
      drawingEnd = drawingEnd + 6;
      loadDrawings();
      return;
    }
    // Otherwise, display higher-numbered drawings in likedDrawings array
    drawingStart = drawingStart + 6;
    drawingEnd = drawingEnd + 6;
    displayDrawings(likedDrawings.slice(drawingStart, drawingEnd));
  }
  return;
}

// Request lower-numbered posts from server if left arrow is clicked in Posts menu
postLeftArrow.onclick = function() {
  if (this.classList.contains('display')) {
    postStart = postStart - 6;
    postEnd = postEnd - 6;
    loadPosts();
  }
  return;
}

// Request higher-numbered posts from server if right arrow is clicked in Posts menu
postRightArrow.onclick = function() {
  if (this.classList.contains('display')) {
    postStart = postStart + 6;
    postEnd = postEnd + 6;
    loadPosts();
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
  // If the Liked button is clicked, set the button as selected and display requested drawings
  if (this == liked) {
    liked.classList.add('selected');
    mine.classList.remove('selected');
    displayDrawings(likedDrawings.slice(drawingStart, drawingEnd));
    return;
  }
  // Otherwise, set the Mine button as selected and request drawings from server
  mine.classList.add('selected');
  liked.classList.remove('selected');
  loadDrawings();
  return;
}


// Define Personal menu functions

// Delete account when user confirms deletion in modal
document.getElementById('confirm').onclick = deleteAccount;

function deleteAccount() {
  return fetch(server + '/user', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json'},
    method: 'DELETE',
  }).catch(function(error) {
    // Display warning if server is down
    window.alert('Your request did not go through. Please try again soon.');
    return;
  }).then(function(response) {
    // Take user to Create Account page with request to delete account if server responds without error
    if (response.ok) {
      sessionStorage.setItem('account-request', 'delete');
      window.location.href = '../create-account/index.html';
      return;
    }
    // Otherwise, display warning if server responds with error
    window.alert('Your request did not go through. Please try again soon.');
    return;
  });
}

// Click hidden color picker input when profile background is clicked (must focus first to open)
profileBackground.onclick = function(e) {
  if (e.target == this) {
    backgroundColorPicker.focus();
    backgroundColorPicker.click();
  }
  return;
}

// Click hidden color picker input when profile rows are clicked (must focus first to open)
for (var i = 0; i < profileBackground.getElementsByClassName('row').length; i++) {
  profileBackground.getElementsByClassName('row')[i].addEventListener('click', function(e) {
    if (e.target == this) {
      backgroundColorPicker.focus();
      backgroundColorPicker.click();
    }
    return;
  }, false);
}

// Assess darkness of user's profile background color and adjust font color of menu items to light/dark in response
function updateFontColors() {
  var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(backgroundColorPicker
    .value);
  var r = parseInt(rgb[1], 16);
  var g = parseInt(rgb[2], 16);
  var b = parseInt(rgb[3], 16);
  // If user is editing information in Personal menu, only change color of title elements for inputs and Delete Account button
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
    aboutInput.classList.remove('light');
    usernameInput.classList.remove('light');
    passwordInput.classList.remove('light');
    confirmPassInput.classList.remove('light');
    firstNameInput.classList.remove('light');
    lastNameInput.classList.remove('light');
    emailInput.classList.remove('light');
    profileBackground.classList.add('dark');
    deleteButton.classList.add('dark');
    aboutInput.classList.add('dark');
    usernameInput.classList.add('dark');
    passwordInput.classList.add('dark');
    confirmPassInput.classList.add('dark');
    firstNameInput.classList.add('dark');
    lastNameInput.classList.add('dark');
    emailInput.classList.add('dark');
  } else {
    profileBackground.classList.remove('dark');
    deleteButton.classList.remove('dark');
    aboutInput.classList.remove('dark');
    usernameInput.classList.remove('dark');
    passwordInput.classList.remove('dark');
    confirmPassInput.classList.remove('dark');
    firstNameInput.classList.remove('dark');
    lastNameInput.classList.remove('dark');
    emailInput.classList.remove('dark');
    profileBackground.classList.add('light');
    deleteButton.classList.add('light');
    usernameInput.classList.add('light');
    aboutInput.classList.add('light');
    passwordInput.classList.add('light');
    confirmPassInput.classList.add('light');
    firstNameInput.classList.add('light');
    lastNameInput.classList.add('light');
    emailInput.classList.add('light');
  }
  return;
}

// Click hidden color picker input when profile icon is clicked (must focus first to open)
diamond.onclick = function() {
  iconColorPicker.focus();
  iconColorPicker.click();
  return;
}

// Click hidden color picker input when profile icon container is clicked (must focus first to open)
profileIcon.onclick = function() {
  iconColorPicker.focus();
  iconColorPicker.click();
  return;
}

// Change color of profile background when user selects color from background color picker
backgroundColorPicker.oninput = function() {
  profileBackground.style.backgroundColor = this.value;
  // Update field font colors based on background color
  updateFontColors();
  return;
}

// Change diamond profile icon color when user selects color from icon color picker
iconColorPicker.oninput = function() {
  diamond.style.fill = this.value;
  return;
}

// Determine if username input has errors when user focuses out of field
usernameInput.onfocusout = assessUsername;

function assessUsername() {
  var username = usernameInput.value;
  // Display warning that username cannot be blank if input has no non-space characters
  if (!/\S/.test(username)) {
    document.getElementById('user-warning-two').style.display = 'none';
    document.getElementById('user-warning-three').style.display = 'none';
    document.getElementById('user-warning-one').style.display = 'block';
    return false;
  }
  // Display warning that username has unacceptable characters if there are non-alphanumeric, underscore, or dash characters
  if (!username.match(/^[a-zA-Z0-9_-]+$/)) {
    document.getElementById('user-warning-one').style.display = 'none';
    document.getElementById('user-warning-three').style.display = 'none';
    document.getElementById('user-warning-two').style.display = 'block';
    return false;
  }
  // Otherwise, hide warnings
  document.getElementById('user-warning-one').style.display = 'none';
  document.getElementById('user-warning-three').style.display = 'none';
  document.getElementById('user-warning-two').style.display = 'none';
  return true;
}

// Determine if password input has errors when user focuses out of field
passwordInput.onfocusout = assessPassword;

function assessPassword() {
  var password = passwordInput.value;
  // Display warning that password is too short if input is less than 8 characters
  if (password.length > 0 && password.length < 8) {
    document.getElementById('pass-warning-one').style.display = 'block';
    return false;
  }
  // Otherwise, hide warning
  document.getElementById('pass-warning-one').style.display = 'none';
  return true;
}

// Determine if confirmation password matches original password when user focuses out of field
confirmPassInput.onfocusout = assessPasswordMatch;

function assessPasswordMatch() {
  var password = passwordInput.value;
  var confirmPassword = confirmPassInput.value;
  // If passwords do not match, display warning
  if (password != confirmPassword) {
    document.getElementById('pass-warning-two').style.display = 'block';
    return false;
  }
  // Otherwise, hide warning
  document.getElementById('pass-warning-two').style.display = 'none';
  return true;
}

// Determine if email address has errors when user focuses out of field or public checkbox
emailInput.onfocusout = assessEmail;
emailPublicInput.onfocusout = assessEmail;

function assessEmail() {
  var email = emailInput.value;
  // If email address is marked as public or is not blank and is missing an "@" symbol, display warning
  if ((email.length > 0 || emailPublicInput.checked) && !email.match('@')) {
    document.getElementById('email-warning').style.display = 'block';
    return false;
  }
  // Otherwise, hide warning
  document.getElementById('email-warning').style.display = 'none';
  return true;
}

// Enter edit mode when Edit button is clicked or save edits when in edit mode in Personal menu
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
  // Add editing style to fields and enable inputs that were previously disabled
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

// If user is in edit mode, check that username, password, confirm password, and email address fields have no errors when user clicks Save button
saveButton.onclick = function() {
  if (editingPersonal) {
    // Do nothing if errors are present
    if (!assessUsername() || !assessPassword() || !assessPasswordMatch() || !assessEmail()) {
      return;
    }
    // If user requests to change username or password, prompt user to enter password to verify changes in modal
    if (usernameInput.value != localStorage.getItem('username') || passwordInput
    .value != '') {
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

// Click Submit button when enter key is clicked in verify password input when submitting edits to personal information
verifyPassInput.addEventListener('keyup', function(e) {
  if (e.keyCode == 13) {
    e.preventDefault();
    document.getElementById('submit').click();
  }
  return;
}, false);

// Check that password is correct in verify password input when submitting edits to personal information
document.getElementById('submit').onclick = checkPassword;

function checkPassword() {
  verifyPassword = verifyPassInput.value;
  // Clear verify password input in case user needs to verify edits again
  verifyPassInput.value = '';
  return fetch(server + '/login', {
    headers: {'Authorization': 'Basic ' + btoa(localStorage.getItem('username') + ':' + verifyPassword)},
    method: 'GET',
  }).catch(function(error) {
    // Display warning if server is down
    window.alert('Your request did not go through. Please try again soon.');
    return;
  }).then(function(response) {
    // If user's password was incorrect, display modal with verify password field to try again
    if (response.status == 400) {
      response.text().then(function(text) {
        if (text == 'Incorrect password') {
          $(verify).modal('show');
          verifyPassInput.focus();
          return;
        }
      });
    }
    // If server responds successfully, submit edits to server
    if (response.status == 200) {
      submitEdits();
      return;
    }
    // Otherwise, display warning if server responds with error
    window.alert('Your request did not go through. Please try again soon.');
    return;
  });
}

// Submit requested edits to user's personal information to server
function submitEdits() {
  var data = JSON.stringify({
    'username': usernameInput.value,
    'password': passwordInput.value,
    'first_name': firstNameInput.value,
    'last_name': lastNameInput.value,
    'name_public': namePublicInput.checked,
    'email': emailInput.value,
    'email_public': emailPublicInput.checked,
    'background_color': backgroundColorPicker.value,
    'icon_color': iconColorPicker.value,
    'about': aboutInput.value
  });
  return fetch(server + '/user', {
    headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token')},
    method: 'PUT',
    body: data,
  }).catch(function(error) {
    // Display error if server is down
    window.alert('Your request did not go through. Please try again soon.');
    return;
  }).then(function(response) {
    if (response.ok) {
      // If server responds that username already exists, display warning
      response.text().then(function(text) {
        if (text == 'Username already exists') {
          document.getElementById('user-warning-three').style.display = 'block';
          return;
        }
        // Otherwise, if username is now different, update localStorage username and token and profile link
        if (usernameInput.value != localStorage.getItem('username')) {
          localStorage.removeItem('username');
          localStorage.setItem('username', usernameInput.value);
          localStorage.removeItem('token');
          localStorage.setItem('token', text);
          document.getElementById('profile-link').innerHTML = localStorage
          .getItem('username');
          document.getElementById('profile-link')
          .href = '../index.html?username=' + localStorage.getItem('username');
        }
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
    // Otherwise, display warning if server responds with error
    window.alert('Your request did not go through. Please try again soon.');
    return;
  });
}

// Cancel edits when user clicks Cancel button
cancelButton.onclick = cancelEdits;

function cancelEdits() {
  // Return Personal menu fields to initial values set when user clicked Edit button
  iconColorPicker.value = iconColor;
  diamond.style.fill = iconColor;
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
  document.getElementById('user-warning-one').style.display = 'none';
  document.getElementById('user-warning-two').style.display = 'none';
  document.getElementById('user-warning-three').style.display = 'none';
  document.getElementById('pass-warning-one').style.display = 'none';
  document.getElementById('pass-warning-two').style.display = 'none';
  document.getElementById('email-warning').style.display = 'none';
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
