// Define variables
var success = document.getElementById('success');
var okayButton = document.getElementById('okay');
var successTitle = document.getElementById('success-title');
var frontMenus = document.getElementsByClassName('front-menu');
var backButtons = document.getElementsByClassName('back-button');
var profileLink = document.getElementById('profile-link');
var signOutLink = document.getElementById('sign-out-link');
var confirmDeleteButton = document.getElementById('confirm');
var editButton = document.getElementById('edit');
var verifyPasswordInput = document.getElementById('verify-password-input');
var submitButton = document.getElementById('submit');
var deleteButton = document.getElementById('delete');
var aboutInput = document.getElementById('about-input');
var usernameInput = document.getElementById('username-input');
var passwordInput = document.getElementById('password-input');
var confirmPasswordInput = document.getElementById('confirm-password-input');
var firstNameInput = document.getElementById('first-name-input');
var lastNameInput = document.getElementById('last-name-input');
var namePublicInput = document.getElementById('name-public-input');
var emailInput = document.getElementById('email-input');
var emailPublicInput = document.getElementById('email-public-input');
var iconColorPicker = document.getElementById('icon-color-picker');
var backgroundColorPicker = document.getElementById('background-color-picker');
var memberStat = document.getElementById('member-stat');
var createdDrawings = [];
var likedDrawings = [];
var drawingsStat = document.getElementById('drawings-stat');
var likedStat = document.getElementById('liked-stat');
var postsStat = document.getElementById('posts-stat');
var rhythmPlaysStat = document.getElementById('rhythm-plays-stat');
var rhythmScores = [];
var shapesPlaysStat = document.getElementById('shapes-plays-stat');
var shapesScores = [];
var displayedScores = [];
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
var cancelButton = document.getElementById('cancel');
var fields = document.getElementsByTagName('input');
var checkboxContainers = document.getElementsByTagName('label');
var checkboxes = document.getElementsByClassName('public');
var profileBackground = document.getElementById('profile-background');
var profileBackgroundRows = profileBackground.getElementsByClassName('row');
var profileIcon = document.getElementById('profile-icon');
var diamond = document.getElementById('diamond');
var canvashareLinkOne = document.getElementById('canvashare-link-container-one');
var canvashareLinkTwo = document.getElementById('canvashare-link-container-two');
var thoughtWriterLink = document.getElementById('thought-writer-link-container');
var gallery = document.getElementById('gallery');
var drawingsStart = 0;
var drawingsEnd = 7;
var moreDrawingsExist = false;
var drawingRightArrow = document.getElementById('drawings-right-arrow');
var drawingLeftArrow = document.getElementById('drawings-left-arrow');
var mine = document.getElementById('mine');
var liked = document.getElementById('liked');
var postsStart = 0;
var postEnd = 7;
var morePostsExist = false;
var postArea = document.getElementById('post-area');
var postRightArrow = document.getElementById('posts-right-arrow');
var postLeftArrow = document.getElementById('posts-left-arrow');
var rhythmLink = document.getElementById('rhythm-link');
var rhythmHeader = document.getElementById('rhythm-header');
var rhythmNoScores = document.getElementById('rhythm-no-scores');
var shapesLink = document.getElementById('shapes-link');
var shapesHeader = document.getElementById('shapes-header');
var shapesNoScores = document.getElementById('shapes-no-scores');
var rhythmScoresStart = 0;
var rhythmScoresEnd = 11;
var shapesScoresStart = 0;
var shapesScoresEnd = 11;
var moreScoresExist = false;
var rhythmScoreData = document.getElementById('rhythm-score-data');
var rhythmUpArrow = document.getElementById('rhythm-up-arrow');
var rhythmDownArrow = document.getElementById('rhythm-down-arrow');
var shapesScoreData = document.getElementById('shapes-score-data');
var shapesUpArrow = document.getElementById('shapes-up-arrow');
var shapesDownArrow = document.getElementById('shapes-down-arrow');
if (window.location.hostname == 'crystalprism.io') {
  var server = 'http://13.58.175.191/api';
} else {
  var server = 'http://localhost:5000/api';
}

// Define events
window.addEventListener('load', confirmAccountCreation, false);
window.addEventListener('load', checkAccountStatus, false);
window.addEventListener('load', loadPersonal, false);
window.addEventListener('load', loadPosts, false);

for (var i = 0; i < frontMenus.length; i++) {
  frontMenus[i].addEventListener('click', flipMenu, false);
}

for (var i = 0; i < backButtons.length; i++) {
  backButtons[i].addEventListener('click', flipMenu, false);
}

signOutLink.onclick = function() {
  sessionStorage.setItem('account-request', 'logout');
}

profileBackground.onclick = function(e) {
  if (e.target == this) {
    backgroundColorPicker.focus();
    backgroundColorPicker.click();
  }
}

for (var i = 0; i < profileBackgroundRows.length; i++) {
  profileBackgroundRows[i].addEventListener('click', function(e) {
    if (e.target == this) {
      backgroundColorPicker.focus();
      backgroundColorPicker.click();
    }
  }, false);
}

profileIcon.onclick = function() {
  iconColorPicker.focus();
  iconColorPicker.click();
}

confirmDeleteButton.onclick = deleteAccount;
backgroundColorPicker.oninput = changeColor;
iconColorPicker.oninput = changeColor;
usernameInput.onfocusout = assessUsername;
passwordInput.onfocusout = assessPassword;
confirmPasswordInput.onfocusout = assessPasswordMatch;
emailInput.onfocusout = assessEmail;
emailPublicInput.onfocusout = assessEmail;
editButton.onclick = editPersonal;
submitButton.onclick = checkPassword;
cancelButton.onclick = cancelEdit;
rhythmUpArrow.onclick = loadMoreContent;
rhythmDownArrow.onclick = loadMoreContent;
shapesUpArrow.onclick = loadMoreContent;
shapesDownArrow.onclick = loadMoreContent;
mine.onclick = toggleDrawings;
liked.onclick = toggleDrawings;
drawingLeftArrow.onclick = loadMoreContent;
drawingRightArrow.onclick = loadMoreContent;
postLeftArrow.onclick = loadMoreContent;
postRightArrow.onclick = loadMoreContent;

// Define functions
function confirmAccountCreation() {
  if (sessionStorage.getItem('account-request') == 'createaccount') {
    successTitle.innerHTML = localStorage.getItem('username');
    $(success).modal('show');
    okayButton.focus();
    sessionStorage.removeItem('account-request');
  }
}

function checkAccountStatus() {
  if (localStorage.getItem('token') == null) {
    window.location.href = '../sign-in/index.html';
  } else {
    return fetch(server + '/user/verify', {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
      method: 'GET',
    }).catch(function(error) {
      window.location.href = '../sign-in/index.html';
    }).then(function(response) {
      if (!response.ok) {
        sessionStorage.setItem('account-request', 'logout');
        window.location.href = '../sign-in/index.html';
      } else {
        return;
      }
    })
  }
}

function loadPersonal() {
  if (localStorage.getItem('token') != null) {
    return fetch(server + '/user/' + localStorage.getItem('username'), {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
      method: 'GET',
    }).catch(function(error) {
      canvashareLinkOne.classList.remove('hidden');
      canvashareLinkTwo.classList.add('hidden');
      rhythmLink.classList.add('hidden');
      rhythmHeader.classList.add('hidden');
      rhythmNoScores.classList.remove('hidden');
      shapesLink.classList.add('hidden');
      shapesHeader.classList.add('hidden');
      shapesNoScores.classList.remove('hidden');
    }).then(function(response) {
      response.json().then(function(info) {
        profileLink.innerHTML = localStorage.getItem('username');
        profileLink.href = '../index.html?username=' + localStorage.getItem('username');
        aboutInput.value = info['about'];
        usernameInput.value = info['username'];
        firstNameInput.value = info['first_name'];
        lastNameInput.value = info['last_name'];
        namePublicInput.checked = info['name_public'];
        emailInput.value = info['email'];
        emailPublicInput.checked = info['email_public'];
        backgroundColorPicker.value = info['background_color'];
        profileBackground.style.backgroundColor = info['background_color'];
        var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(info['background_color']);
        var r = parseInt(rgb[1], 16);
        var g = parseInt(rgb[2], 16);
        var b = parseInt(rgb[3], 16);
        if (r + g + b > 382) {
          profileBackground.classList.add('dark');
          deleteButton.classList.add('dark');
          aboutInput.classList.add('dark');
          usernameInput.classList.add('dark');
          passwordInput.classList.add('dark');
          confirmPasswordInput.classList.add('dark');
          firstNameInput.classList.add('dark');
          lastNameInput.classList.add('dark');
          emailInput.classList.add('dark');
        } else {
          profileBackground.classList.add('light');
          deleteButton.classList.add('light');
          aboutInput.classList.add('light');
          usernameInput.classList.add('light');
          passwordInput.classList.add('light');
          confirmPasswordInput.classList.add('light');
          firstNameInput.classList.add('light');
          lastNameInput.classList.add('light');
          emailInput.classList.add('light');
        }
        iconColorPicker.value = info['icon_color'];
        diamond.style.fill = info['icon_color'];
        utcDateTime = JSON.parse(info['member_since']);
        var utcDate = utcDateTime.split(' ')[0];
        var utcTime = utcDateTime.split(' ')[1];
        var dateTime = new Date(utcDate + 'T' + utcTime);
        var hour = parseInt(dateTime.getHours());
        var ampm = hour >= 12 ? ' PM' : ' AM';
        var hour = hour % 12;
        if (hour == 0) {
          hour = 12;
        }
        memberStat.innerHTML = parseInt(dateTime.getMonth() + 1) + '/' + parseInt(dateTime.getDate()) + '/' + parseInt(dateTime.getFullYear()) + ', ' + hour + ':' + ('0' + parseInt(dateTime.getMinutes())).slice(-2) + ampm;
        rhythmPlaysStat.innerHTML = info['rhythm_plays'];
        rhythmScores = info['rhythm_scores'];
        loadScores('rhythm');
        shapesPlaysStat.innerHTML = info['shapes_plays'];
        shapesScores = info['shapes_scores'];
        loadScores('shapes');
        createdDrawings = info['drawings'];
        likedDrawings = info['liked_drawings'];
        drawingsStat.innerHTML = createdDrawings.length;
        likedStat.innerHTML = likedDrawings.length;
        loadDrawings();
        postsStat.innerHTML = info['post_number'];
      })
    })
  }
}

function loadDrawings() {
  if (mine.classList.contains('selected')) {
    drawings = createdDrawings.slice(drawingsStart, drawingsEnd);
  } else if (liked.classList.contains('selected')) {
    drawings = likedDrawings.slice(drawingsStart, drawingsEnd);
  }
  if (drawings.length == 0) {
    gallery.innerHTML = '';
    drawingLeftArrow.classList.remove('display');
    drawingRightArrow.classList.remove('display');
    if (mine.classList.contains('selected')) {
      canvashareLinkOne.classList.remove('hidden');
      canvashareLinkTwo.classList.add('hidden');
    } else if (liked.classList.contains('selected')) {
      drawings = likedDrawings.slice(drawingsStart, drawingsEnd);
      canvashareLinkOne.classList.add('hidden');
      canvashareLinkTwo.classList.remove('hidden');
    }
  }
  if (drawings.length != 0) {
    canvashareLinkOne.classList.add('hidden');
    canvashareLinkTwo.classList.add('hidden');
    gallery.innerHTML = '';
    if (drawings.length > 6) {
      moreDrawingsExist = true;
      var drawingsLoadNumber = 6;
    } else {
      moreDrawingsExist = false;
      var drawingsLoadNumber = drawings.length;
    }
    for (var i = 0; i < drawingsLoadNumber; i++) {
      var drawingLikes = document.createElement('div');
      drawingLikes.classList.add('drawing-likes');
      drawingLikes.title = 'Likes';
      drawingLikes.dataset.drawing = drawings[i];
      var drawingContainer = document.createElement('div');
      drawingContainer.classList.add('drawing-container');
      drawingContainer.dataset.number = drawingsStart + i;
      var drawingLink = document.createElement('a');
      drawingLink.classList.add('drawing-link');
      drawingLink.title = 'View drawing';
      drawingLink.dataset.source = server + '/canvashare/drawing/' + drawings[i];
      drawingLink.href = 'javascript:delay("../../canvashare/drawingapp/index.html")';
      var drawingTitle = document.createElement('div');
      drawingTitle.classList.add('drawing-title');
      drawingTitle.innerHTML = drawings[i].substr(drawings[i].indexOf('/')+1).split(/`|.png/)[0];
      var drawing = document.createElement('img');
      drawing.classList.add('drawing');
      drawing.src = server + '/canvashare/drawing/' + drawings[i];
      var drawingInfo = document.createElement('div');
      drawingInfo.classList.add('drawing-info');
      var drawingViews = document.createElement('div');
      drawingViews.classList.add('drawing-views');
      drawingViews.title = 'Views';
      drawingViews.innerHTML = '<i class="fa fa-eye" aria-hidden="true"></i>';
      gallery.append(drawingContainer);
      drawingContainer.append(drawingLink);
      drawingLink.append(drawingTitle);
      drawingContainer.append(drawing);
      drawingContainer.append(drawingInfo);
      drawingInfo.append(drawingLikes);
      var likeText = document.createElement('text');
      likeText.dataset.drawing = drawings[i];
      drawingLikes.append(likeText);
      drawingInfo.append(drawingViews);
      var viewText = document.createElement('text');
      viewText.dataset.drawing = drawings[i];
      drawingViews.append(viewText);
      drawingLink.onclick = function() {
        sessionStorage.setItem('drawing-source', this.dataset.source);
      }
      getDrawingInfo(drawings[i]);
    }
    if (gallery.getElementsByClassName('drawing-container')[0].dataset.number != 0) {
      drawingLeftArrow.classList.add('display');
    } else {
      drawingLeftArrow.classList.remove('display');
    }
    if (moreDrawingsExist) {
      drawingRightArrow.classList.add('display');
    } else {
      drawingRightArrow.classList.remove('display');
    }
  }
}

function getDrawingInfo(drawingFile) {
  return fetch(server + '/canvashare/drawinginfo/' + drawingFile.split('.png')[0]).then(function(response) {
    response.json().then(function(drawingInfo) {
      var parsed = JSON.parse(drawingInfo);
      var dataElements = document.querySelectorAll('[data-drawing="' + drawingFile + '"]');
      var likedHeart = document.createElement('i');
      likedHeart.classList.add('heart');
      likedHeart.classList.add('fa');
      likedHeart.classList.add('fa-heart');
      dataElements[0].insertBefore(likedHeart, dataElements[0].firstChild);
      dataElements[1].innerHTML = parsed['likes'];
      dataElements[2].innerHTML = parsed['views'];
    })
  });
}

function delay(URL) {
  setTimeout(function() {window.location = URL}, 800);
}

function loadMoreContent() {
  if (window.getComputedStyle(this).getPropertyValue('opacity') != 0) {
    if (this == drawingLeftArrow) {
      drawingsStart = drawingsStart - 6;
      drawingsEnd = drawingsEnd - 6;
      loadDrawings();
    } else if (this == drawingRightArrow) {
      drawingsStart = drawingsStart + 6;
      drawingsEnd = drawingsEnd + 6;
      loadDrawings();
    } else if (this == postLeftArrow) {
      postsStart = postsStart - 6;
      postEnd = postEnd - 6;
      loadPosts();
    } else if (this == postRightArrow) {
      postsStart = postsStart + 6;
      postEnd = postEnd + 6;
      loadPosts();
    } else if (this == rhythmUpArrow) {
      rhythmScoresStart = rhythmScoresStart - 10;
      rhythmScoresEnd = rhythmScoresEnd - 10;
      loadScores('rhythm');
    } else if (this == rhythmDownArrow) {
      rhythmScoresStart = rhythmScoresStart + 10;
      rhythmScoresEnd = rhythmScoresEnd + 10;
      loadScores('rhythm');
    } else if (this == shapesUpArrow) {
      shapesScoresStart = shapesScoresStart - 10;
      shapesScoresEnd = shapesScoresEnd - 10;
      loadScores('shapes');
    } else if (this == shapesDownArrow) {
      shapesScoresStart = shapesScoresStart + 10;
      shapesScoresEnd = shapesScoresEnd + 10;
      loadScores('shapes');
    }
  }
}

function toggleDrawings() {
  drawingsStart = 0;
  drawingsEnd = 7;
  if (this == liked) {
    liked.classList.add('selected');
    mine.classList.remove('selected');
  }
  if (this == mine) {
    mine.classList.add('selected');
    liked.classList.remove('selected');
  }
  loadDrawings();
}

function loadPosts() {
  if (localStorage.getItem('token') != null) {
    return fetch(server + '/thought-writer/entries/' + localStorage.getItem('username') + '?start=' + postsStart + '&end=' + postEnd, {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
      method: 'GET',
    }).catch(function(error) {
      thoughtWriterLink.classList.remove('hidden');
    }).then(function(response) {
      if (!response.ok) {
        thoughtWriterLink.classList.remove('hidden');
      } else {
        response.json().then(function(posts) {
          if (posts.length == 0) {
            thoughtWriterLink.classList.remove('hidden');
          }
          if (posts.length != 0) {
            thoughtWriterLink.classList.add('hidden');
            postArea.innerHTML = '';
            if (posts.length > 6) {
              morePostsExist = true;
              postsLoadNumber = 6;
            } else {
              morePostsExist = false;
              postsLoadNumber = posts.length;
            }
            for (var i = 0; i < postsLoadNumber; i++) {
              var postContainer = document.createElement('div');
              postContainer.classList.add('post-container');
              postContainer.dataset.number = postsStart + i;
              var postLink = document.createElement('a');
              postLink.classList.add('post-link');
              postLink.title = 'Edit post';
              postLink.href = 'javascript:delay("../../thought-writer/editor/index.html")';
              var postTitle = document.createElement('div');
              postTitle.classList.add('post-title');
              postTitle.innerHTML = posts[i].title;
              var post = document.createElement('div');
              post.classList.add('post');
              var postContent = document.createElement('div');
              postContent.classList.add('post-content');
              postContent.innerHTML = posts[i].content;
              var postInfo = document.createElement('div');
              postInfo.classList.add('post-info');
              if (posts[i].public == 'true') {
                var postComments = document.createElement('a');
                postComments.title = 'View post comments';
                if (posts[i].comments.length == 1) {
                  postComments.innerHTML = posts[i].comments.length + ' comment';
                } else {
                  postComments.innerHTML = posts[i].comments.length + ' comments';
                }
                postComments.href = 'javascript:delay("../../thought-writer/post/index.html#comments")';
              } else {
                var postComments = document.createElement('div');
                postComments.innerHTML = 'Private post';
              }
              var postTimeDisplay = document.createElement('div');
              postTimeDisplay.classList.add('post-time');
              var utcDateTime = JSON.parse(posts[i].timestamp);
              var utcDate = utcDateTime.split(' ')[0];
              var utcTime = utcDateTime.split(' ')[1];
              var dateTime = new Date(utcDate + 'T' + utcTime);
              var hour = parseInt(dateTime.getHours());
              var ampm = hour >= 12 ? ' PM' : ' AM';
              var hour = hour % 12;
              if (hour == 0) {
                hour = 12;
              }
              var postDate = parseInt(dateTime.getMonth() + 1) + '/' + parseInt(dateTime.getDate()) + '/' + parseInt(dateTime.getFullYear());
              var postTime = hour + ':' + ('0' + parseInt(dateTime.getMinutes())).slice(-2) + ampm;
              postTimeDisplay.innerHTML = postDate + ', ' + postTime;
              postArea.append(postContainer);
              postContainer.append(postLink);
              postLink.append(postTitle);
              postContainer.append(post);
              post.append(postContent);
              postContainer.append(postInfo);
              postInfo.append(postTimeDisplay);
              postInfo.append(postComments);
              postLink.dataset.timestamp = posts[i].timestamp;
              postComments.dataset.writer = posts[i].writer;
              postComments.dataset.timestamp = posts[i].timestamp;
              postLink.onclick = function() {
                sessionStorage.setItem('post-timestamp', this.dataset.timestamp);
              }
              postComments.onclick = function() {
                sessionStorage.setItem('writer', this.dataset.writer);
                sessionStorage.setItem('timestamp', this.dataset.timestamp);
              }
            }
            if (postArea.getElementsByClassName('post-container')[0].dataset.number != 0) {
              postLeftArrow.classList.add('display');
            } else {
              postLeftArrow.classList.remove('display');
            }
            if (morePostsExist) {
              postRightArrow.classList.add('display');
            } else {
              postRightArrow.classList.remove('display');
            }
          }
        })
      }
    })
  }
}

function loadScores(game) {
  if (game == 'rhythm') {
    if (rhythmScores.length == 0) {
      rhythmLink.classList.add('hidden');
      rhythmHeader.classList.add('hidden');
      rhythmNoScores.classList.remove('hidden');
    }
    if (rhythmScores.length != 0) {
      displayedScores = rhythmScores.slice(rhythmScoresStart, rhythmScoresEnd);
      var scoresStart = rhythmScoresStart;
      rhythmLink.classList.remove('hidden');
      rhythmHeader.classList.remove('hidden');
      rhythmNoScores.classList.add('hidden');
      rhythmScoreData.innerHTML = '';
      var scoreData = rhythmScoreData;
      var upArrow = rhythmUpArrow;
      var downArrow = rhythmDownArrow;
    }
  } else if (game == 'shapes') {
    if (shapesScores.length == 0) {
      shapesLink.classList.add('hidden');
      shapesHeader.classList.add('hidden');
      shapesNoScores.classList.remove('hidden');
    }
    if (shapesScores.length != 0) {
      displayedScores = shapesScores.slice(shapesScoresStart, shapesScoresEnd);
      var scoresStart = shapesScoresStart;
      shapesLink.classList.remove('hidden');
      shapesHeader.classList.remove('hidden');
      shapesNoScores.classList.add('hidden');
      shapesScoreData.innerHTML = '';
      var scoreData = shapesScoreData;
      var upArrow = shapesUpArrow;
      var downArrow = shapesDownArrow;
    }
  }
  if (displayedScores.length != 0) {
    if (displayedScores.length > 10) {
      moreScoresExist = true;
      var scoreLoadNumber = 10;
    } else {
      moreScoresExist = false;
      var scoreLoadNumber = displayedScores.length;
    }
    for (var i = 0; i < scoreLoadNumber; i++) {
      var scoreRow = document.createElement('div');
      scoreRow.classList.add('row');
      scoreRow.classList.add('no-gutters');
      scoreRow.classList.add('w-100');
      scoreRow.classList.add('d-flex');
      scoreRow.classList.add('justify-content-center');
      scoreRow.dataset.number = scoresStart + i;
      var starCol = document.createElement('div');
      starCol.classList.add('col-1');
      if (scoreRow.dataset.number == 0) {
        var star = document.createElement('i');
        star.classList.add('fa');
        star.classList.add('fa-star');
        starCol.append(star);
      }
      var scoreCol = document.createElement('div');
      scoreCol.classList.add('col-3');
      if (game == 'rhythm') {
        scoreCol.innerHTML = displayedScores[i].lifespan;
      } else {
        scoreCol.innerHTML = displayedScores[i].score;
      }
      var scoreDateCol = document.createElement('div');
      scoreDateCol.classList.add('col-6');
      utcDateTime = JSON.parse(displayedScores[i].timestamp);
      var utcDate = utcDateTime.split(' ')[0];
      var utcTime = utcDateTime.split(' ')[1];
      var dateTime = new Date(utcDate + 'T' + utcTime);
      var hour = parseInt(dateTime.getHours());
      var ampm = hour >= 12 ? ' PM' : ' AM';
      var hour = hour % 12;
      if (hour == 0) {
        hour = 12;
      }
      scoreDateCol.innerHTML = parseInt(dateTime.getMonth() + 1) + '/' + parseInt(dateTime.getDate()) + '/' + parseInt(dateTime.getFullYear()) + ', ' + hour + ':' + ('0' + parseInt(dateTime.getMinutes())).slice(-2) + ampm;
      scoreData.append(scoreRow);
      scoreRow.append(starCol);
      scoreRow.append(scoreCol);
      scoreRow.append(scoreDateCol);
    }
    if (scoreData.getElementsByClassName('row')[0].dataset.number != 0) {
      upArrow.classList.add('display');
    } else {
      upArrow.classList.remove('display');
    }
    if (moreScoresExist) {
      downArrow.classList.add('display');
    } else {
      downArrow.classList.remove('display');
    }
  }
}

function flipMenu() {
  if (document.getElementById(this.dataset.section).dataset.flipped == 'false') {
    document.getElementById(this.dataset.section).classList.add('flip');
    document.getElementById(this.dataset.section).dataset.flipped = 'true';
  } else if (document.getElementById(this.dataset.section).dataset.flipped == 'true') {
    document.getElementById(this.dataset.section).classList.remove('flip');
    document.getElementById(this.dataset.section).dataset.flipped = 'false';
  }
}

function deleteAccount() {
  return fetch(server + '/user/' + localStorage.getItem('username'), {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json'},
    method: 'DELETE'
  }).catch(function(error) {
    window.alert('Your request did not go through. Please try again soon.');
  }).then(function(response) {
    if (response.ok) {
      sessionStorage.setItem('account-request', 'delete');
      window.location.href = '../create-account/index.html';
    }
  })
}

function changeColor() {
  if (this == iconColorPicker) {
    diamond.style.fill = this.value;
  } else if (this == backgroundColorPicker) {
    profileBackground.style.backgroundColor = this.value;
    var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(this.value);
    var r = parseInt(rgb[1], 16);
    var g = parseInt(rgb[2], 16);
    var b = parseInt(rgb[3], 16);
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
  }
}

function assessUsername() {
  var username = usernameInput.value;
  if (!/\S/.test(username)) {
    document.getElementById('user-warning-two').style.display = 'none';
    document.getElementById('user-warning-three').style.display = 'none';
    document.getElementById('user-warning-one').style.display = 'block';
    return false;
  }
  if (!username.match(/^[a-zA-Z0-9_-]+$/)) {
    document.getElementById('user-warning-one').style.display = 'none';
    document.getElementById('user-warning-three').style.display = 'none';
    document.getElementById('user-warning-two').style.display = 'block';
    return false;
  }
  document.getElementById('user-warning-one').style.display = 'none';
  document.getElementById('user-warning-three').style.display = 'none';
  document.getElementById('user-warning-two').style.display = 'none';
  return true;
}

function assessPassword() {
  var password = passwordInput.value;
  if (/\S/.test(password) && password.length > 0 && password.length < 8 || !/\S/.test(password)) {
    document.getElementById('pass-warning-one').style.display = 'block';
    return false;
  }
  document.getElementById('pass-warning-one').style.display = 'none';
  return true;
}

function assessPasswordMatch() {
  var password = passwordInput.value;
  var confirmPassword = confirmPasswordInput.value;
  if (password != confirmPassword) {
    document.getElementById('pass-warning-two').style.display = 'block';
    return false;
  }
  document.getElementById('pass-warning-two').style.display = 'none';
  return true;
}

function assessEmail() {
  var email = emailInput.value;
  if (email.length > 0 && !email.match('@') || emailPublicInput.checked && !email.match('@')) {
    document.getElementById('email-warning').style.display = 'block';
    return false;
  }
  document.getElementById('email-warning').style.display = 'none';
  return true;
}

function editPersonal() {
  if (this.dataset.editing == 'true') {
    if (!assessUsername() || !assessPassword() || !assessPasswordMatch() || !assessEmail()) {
      return;
    } else if (usernameInput.value != localStorage.getItem('username') || passwordInput.value != '') {
      $(verify).modal('show');
    } else {
      postEdits();
    }
  } else {
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
    this.innerHTML = 'save';
    this.dataset.editing = 'true';
    cancelButton.style.display = 'block';
    profileBackground.classList.add('editing');
    profileIcon.classList.add('editing');
  }
}

function checkPassword() {
  verifyPassword = verifyPasswordInput.value;
  verifyPasswordInput.value = '';
  return fetch(server + '/login', {
    method: 'GET',
    headers: {'Authorization': 'Basic ' + btoa(localStorage.getItem('username') + ':' + verifyPassword)}
  }).catch(function(error) {
    window.alert('Your request did not go through. Please try again soon.');
  }).then(function(response) {
    if (response.status == 400) {
      response.text().then(function(text) {
        if (text == 'Incorrect password') {
          $(incorrect).modal('show');
          verifyPasswordInput.focus();
          return;
        }
      })
    }
    if (response.status == 200) {
      postEdits();
    }
  })
}

function postEdits() {
  var data = {'username': usernameInput.value, 'password': passwordInput.value, 'first_name': firstNameInput.value, 'last_name': lastNameInput.value, 'name_public': namePublicInput.checked, 'email': emailInput.value, 'email_public': emailPublicInput.checked, 'background_color': backgroundColorPicker.value, 'icon_color': iconColorPicker.value, 'about': aboutInput.value};
  data = JSON.stringify(data);
  return fetch(server + '/user/' + localStorage.getItem('username'), {
    headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token')},
    method: 'PUT',
    body: data
  }).catch(function(error) {
    window.alert('Your request did not go through. Please try again soon.');
  }).then(function(response) {
    response.text().then(function(text) {
      if (text == 'Username already exists') {
        document.getElementById('user-warning-three').style.display = 'block';
      } else if (text == 'Success') {
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
        editButton.innerHTML = 'edit';
        editButton.dataset.editing = 'false';
        cancelButton.style.display = 'none';
        profileBackground.classList.remove('editing');
        var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(backgroundColorPicker.value);
        var r = parseInt(rgb[1], 16);
        var g = parseInt(rgb[2], 16);
        var b = parseInt(rgb[3], 16);
        if (r + g + b > 382) {
          profileBackground.classList.remove('light');
          deleteButton.classList.remove('light');
          aboutInput.classList.remove('light');
          usernameInput.classList.remove('light');
          passwordInput.classList.remove('light');
          confirmPasswordInput.classList.remove('light');
          firstNameInput.classList.remove('light');
          lastNameInput.classList.remove('light');
          emailInput.classList.remove('light');
          profileBackground.classList.add('dark');
          deleteButton.classList.add('dark');
          aboutInput.classList.add('dark');
          usernameInput.classList.add('dark');
          passwordInput.classList.add('dark');
          confirmPasswordInput.classList.add('dark');
          firstNameInput.classList.add('dark');
          lastNameInput.classList.add('dark');
          emailInput.classList.add('dark');
        } else {
          profileBackground.classList.remove('dark');
          deleteButton.classList.remove('dark');
          aboutInput.classList.remove('dark');
          usernameInput.classList.remove('dark');
          passwordInput.classList.remove('dark');
          confirmPasswordInput.classList.remove('dark');
          firstNameInput.classList.remove('dark');
          lastNameInput.classList.remove('dark');
          emailInput.classList.remove('dark');
          profileBackground.classList.add('light');
          deleteButton.classList.add('light');
          usernameInput.classList.add('light');
          aboutInput.classList.add('light');
          passwordInput.classList.add('light');
          confirmPasswordInput.classList.add('light');
          firstNameInput.classList.add('light');
          lastNameInput.classList.add('light');
          emailInput.classList.add('light');
        }
        profileIcon.classList.remove('editing');
        passwordInput.value = '';
        confirmPasswordInput.value = '';
        if (usernameInput.value != localStorage.getItem('username')) {
          localStorage.setItem('username', usernameInput.value);
        }
      } else {
        window.alert('Your request did not go through. Please try again soon.');
      }
    })
  })
}

function cancelEdit() {
  aboutInput.value = aboutBlurb;
  usernameInput.value = username;
  passwordInput.value = password;
  confirmPasswordInput.value = password;
  firstNameInput.value = firstName;
  lastNameInput.value = lastName;
  namePublicInput.checked = namePublic;
  emailInput.value = email;
  emailPublicInput.checked = emailPublic;
  backgroundColorPicker.value = backgroundColor;
  profileBackground.style.backgroundColor = backgroundColor;
  var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(backgroundColor);
  var r = parseInt(rgb[1], 16);
  var g = parseInt(rgb[2], 16);
  var b = parseInt(rgb[3], 16);
  if (r + g + b > 382) {
    profileBackground.classList.remove('light');
    deleteButton.classList.remove('light');
    aboutInput.classList.remove('light');
    usernameInput.classList.remove('light');
    passwordInput.classList.remove('light');
    confirmPasswordInput.classList.remove('light');
    firstNameInput.classList.remove('light');
    lastNameInput.classList.remove('light');
    emailInput.classList.remove('light');
    profileBackground.classList.add('dark');
    deleteButton.classList.add('dark');
    aboutInput.classList.add('dark');
    usernameInput.classList.add('dark');
    passwordInput.classList.add('dark');
    confirmPasswordInput.classList.add('dark');
    firstNameInput.classList.add('dark');
    lastNameInput.classList.add('dark');
    emailInput.classList.add('dark');
  } else {
    profileBackground.classList.remove('dark');
    deleteButton.classList.remove('dark');
    aboutInput.classList.remove('dark');
    usernameInput.classList.remove('dark');
    passwordInput.classList.remove('dark');
    confirmPasswordInput.classList.remove('dark');
    firstNameInput.classList.remove('dark');
    lastNameInput.classList.remove('dark');
    emailInput.classList.remove('dark');
    profileBackground.classList.add('light');
    deleteButton.classList.add('light');
    aboutInput.classList.add('light');
    usernameInput.classList.add('light');
    passwordInput.classList.add('light');
    confirmPasswordInput.classList.add('light');
    firstNameInput.classList.add('light');
    lastNameInput.classList.add('light');
    emailInput.classList.add('light');
  }
  iconColorPicker.value = iconColor;
  diamond.style.fill = iconColor;
  document.getElementById('user-warning-one').style.display = 'none';
  document.getElementById('user-warning-two').style.display = 'none';
  document.getElementById('user-warning-three').style.display = 'none';
  document.getElementById('pass-warning-one').style.display = 'none';
  document.getElementById('pass-warning-two').style.display = 'none';
  document.getElementById('email-warning').style.display = 'none';
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
  editButton.innerHTML = 'edit';
  editButton.dataset.editing = 'false';
  this.style.display = 'none';
  profileBackground.classList.remove('editing');
  profileIcon.classList.remove('editing');
}
