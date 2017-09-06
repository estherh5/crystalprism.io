// Define variables
var menuRow = document.getElementById('menu-row');
var success = document.getElementById('success');
var successTitle = document.getElementById('success-title');
var frontTexts = document.getElementsByClassName('front-text');
var backButtons = document.getElementsByClassName('back-button');
var profileLink = document.getElementById('profile-link');
var signInLink = document.getElementById('sign-in-link');
var editButton = document.getElementById('edit');
var enterPass = document.getElementById('enter-pass');
var verifyPasswordInput = document.getElementById('verify-password');
var submitButton = document.getElementById('submit');
var retry = document.getElementById('retry');
var retryTitle = document.getElementById('retry-title');
var aboutInput = document.getElementById('about');
var usernameInput = document.getElementById('username');
var passwordInput = document.getElementById('password');
var confirmPasswordInput = document.getElementById('confirm-password');
var firstNameInput = document.getElementById('first-name');
var lastNameInput = document.getElementById('last-name');
var namePublicInput = document.getElementById('name-public');
var emailInput = document.getElementById('email');
var emailPublicInput = document.getElementById('email-public');
var colorPicker = document.getElementById('color-picker');
var backgroundColorPicker = document.getElementById('background-color-picker');
var memberStat = document.getElementById('member-stat');
var userDrawings = [];
var likedDrawings = [];
var drawingStat = document.getElementById('drawing-stat');
var likedStat = document.getElementById('liked-stat');
var postStat = document.getElementById('post-stat');
var rhythmPlaysStat = document.getElementById('rhythm-plays-stat');
var rhythmScores = [];
var shapesPlaysStat = document.getElementById('shapes-plays-stat');
var shapesScores = [];
var displayedScores = [];
var about = aboutInput.value;
var username = usernameInput.value;
var password = passwordInput.value;
var firstName = firstNameInput.value;
var lastName = lastNameInput.value;
var namePublic = namePublicInput.checked;
var email = emailInput.value;
var emailPublic = emailPublicInput.checked;
var backgroundColorValue = backgroundColorPicker.value;
var color = colorPicker.value;
var cancelButton = document.getElementById('cancel');
var fields = document.getElementsByTagName('input');
var labels = document.getElementsByTagName('label');
var checkboxes = document.getElementsByClassName('public');
var backgroundColorDisplay = document.getElementById('background-color');
var profileImage = document.getElementById('profile-image');
var diamond = document.getElementById('diamond');
var canvashareLinkOne = document.getElementById('canvashare-link-one-div');
var canvashareLinkTwo = document.getElementById('canvashare-link-two-div');
var thoughtWriterLink = document.getElementById('thought-writer-link-div');
var gallery = document.getElementById('gallery');
var drawingStart = 0;
var drawingEnd = 7;
var moreDrawingsExist = false;
var drawingRightArrow = document.getElementById('drawing-right-arrow');
var drawingLeftArrow = document.getElementById('drawing-left-arrow');
var mine = document.getElementById('mine');
var liked = document.getElementById('liked');
var postStart = 0;
var postEnd = 7;
var morePostsExist = false;
var postArea = document.getElementById('post-area');
var postRightArrow = document.getElementById('post-right-arrow');
var postLeftArrow = document.getElementById('post-left-arrow');
var rhythmLink = document.getElementById('rhythm-link');
var rhythmHeader = document.getElementById('rhythm-header');
var rhythmNoScores = document.getElementById('rhythm-no-scores');
var shapesLink = document.getElementById('shapes-link');
var shapesHeader = document.getElementById('shapes-header');
var shapesNoScores = document.getElementById('shapes-no-scores');
var scoreStart = 0;
var scoreEnd = 11;
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
for (var i = 0; i < frontTexts.length; i++) {
  frontTexts[i].addEventListener('click', flipMenu, false);
}

for (var i = 0; i < backButtons.length; i++) {
  backButtons[i].addEventListener('click', flipMenuBack, false);
}

signInLink.onclick = function() {
  sessionStorage.setItem('cprequest', 'logout');
}

backgroundColorDisplay.onclick = function(e) {
  if (e.target == this) {
    backgroundColorPicker.focus();
    backgroundColorPicker.click();
  }
}

profileImage.onclick = function() {
  colorPicker.focus();
  colorPicker.click();
}

editButton.onclick = editContent;
submitButton.onclick = checkPassword;
cancelButton.onclick = cancelEdit;
backgroundColorPicker.oninput = changeColor;
colorPicker.oninput = changeColor;
usernameInput.onfocusout = assessUsername;
passwordInput.onfocusout = assessPassword;
confirmPasswordInput.onfocusout = assessPasswordMatch;
emailInput.onfocusout = assessEmail;
drawingLeftArrow.onclick = getMore;
drawingRightArrow.onclick = getMore;
mine.onclick = toggleDrawings;
liked.onclick = toggleDrawings;
postLeftArrow.onclick = getMore;
postRightArrow.onclick = getMore;
rhythmUpArrow.onclick = getMore;
rhythmDownArrow.onclick = getMore;
shapesUpArrow.onclick = getMore;
shapesDownArrow.onclick = getMore;

// Define functions
function displaySuccess() {
  if (sessionStorage.getItem('cprequest') == 'createaccount') {
    successTitle.innerHTML = localStorage.getItem('cpusername');
    $(success).modal('show');
    sessionStorage.removeItem('cprequest');
  }
}

function checkAccountStatus() {
  if (localStorage.getItem('cptoken') == null) {
    window.location.href = '../sign-in/index.html';
  }
  return fetch(server + '/user/verify', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('cptoken')},
    method: 'GET',
  }).catch(function (error) {
    window.location.href = '../sign-in/index.html';
  }).then(function (response) {
    if (!response.ok) {
      sessionStorage.setItem('cprequest', 'logout');
      window.location.href = '../sign-in/index.html';
    } else {
      return;
    }
  })
}

function populatePersonal() {
  return fetch(server + '/user/' + localStorage.getItem('cpusername'), {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('cptoken')},
    method: 'GET',
  }).catch(function (error) {
    canvashareLinkOne.classList.remove('hidden');
    canvashareLinkTwo.classList.add('hidden');
    rhythmLink.classList.add('hidden');
    rhythmHeader.classList.add('hidden');
    rhythmNoScores.classList.remove('hidden');
    shapesLink.classList.add('hidden');
    shapesHeader.classList.add('hidden');
    shapesNoScores.classList.remove('hidden');
  }).then(function (response) {
    response.json().then(function (info) {
      profileLink.innerHTML = localStorage.getItem('cpusername');
      profileLink.href = '../index.html?username=' + localStorage.getItem('cpusername');
      aboutInput.value = info['about'];
      usernameInput.value = info['username'];
      firstNameInput.value = info['first_name'];
      lastNameInput.value = info['last_name'];
      namePublicInput.checked = info['name_public'];
      emailInput.value = info['email'];
      emailPublicInput.checked = info['email_public'];
      backgroundColorPicker.value = info['background_color'];
      backgroundColorDisplay.style.backgroundColor = info['background_color'];
      colorPicker.value = info['color'];
      diamond.style.fill = info['color'];
      utcDateTime = JSON.parse(info['member_since']);
      dateTime = new Date(utcDateTime + ' UTC');
      var hour = parseInt(dateTime.getHours());
      var ampm = hour >= 12 ? ' PM' : ' AM';
      var hour = hour % 12;
      if (hour == 0) {
        hour = 12;
      }
      memberStat.innerHTML = parseInt(dateTime.getMonth() + 1) + '/' + parseInt(dateTime.getDate()) + '/' + parseInt(dateTime.getFullYear()) + ', ' + hour + ':' + ('0' + parseInt(dateTime.getMinutes())).slice(-2) + ampm;
      userDrawings = info['images'];
      likedDrawings = info['liked_images'];
      drawingStat.innerHTML = userDrawings.length;
      likedStat.innerHTML = likedDrawings.length;
      populateDrawings();
      postStat.innerHTML = info['post_number'];
      rhythmPlaysStat.innerHTML = info['rhythm_plays'];
      rhythmScores = info['rhythm_scores'];
      populateScores('rhythm');
      shapesPlaysStat.innerHTML = info['shapes_plays'];
      shapesScores = info['shapes_scores'];
      populateScores('shapes');
    })
  })
}

function populateDrawings() {
  if (mine.classList.contains('selected')) {
    images = userDrawings.slice(drawingStart, drawingEnd);
  } else if (liked.classList.contains('selected')) {
    images = likedDrawings.slice(drawingStart, drawingEnd);
  }
  if (images.length == 0) {
    gallery.innerHTML = '';
    drawingLeftArrow.classList.remove('display');
    drawingRightArrow.classList.remove('display');
    if (mine.classList.contains('selected')) {
      canvashareLinkOne.classList.remove('hidden');
      canvashareLinkTwo.classList.add('hidden');
    } else if (liked.classList.contains('selected')) {
      images = likedDrawings.slice(drawingStart, drawingEnd);
      canvashareLinkOne.classList.add('hidden');
      canvashareLinkTwo.classList.remove('hidden');
    }
  }
  if (images.length != 0) {
    canvashareLinkOne.classList.add('hidden');
    canvashareLinkTwo.classList.add('hidden');
    gallery.innerHTML = '';
    if (images.length > 6) {
      moreDrawingsExist = true;
      var drawingLoadNumber = 6;
    } else {
      moreDrawingsExist = false;
      var drawingLoadNumber = images.length;
    }
    for (var i = 0; i < drawingLoadNumber; i++) {
      var imageLikes = document.createElement('div');
      imageLikes.className = 'image-likes';
      imageLikes.title = 'Likes';
      imageLikes.dataset.image = images[i];
      var imageDiv = document.createElement('div');
      imageDiv.className = 'image-div';
      imageDiv.dataset.number = drawingStart + i;
      var imageLink = document.createElement('a');
      imageLink.className = 'image-link';
      imageLink.href = 'javascript:delay("../../canvashare/drawingapp/index.html")';
      var imageName = document.createElement('div');
      imageName.className = 'image-name';
      imageName.innerHTML = images[i].substr(images[i].indexOf('/')+1).split(/`|.png/)[0];
      var image = document.createElement('img');
      image.className = 'image';
      image.src = server + '/canvashare/drawing/' + images[i];
      var imageInfo = document.createElement('div');
      imageInfo.className = 'image-info';
      var imageViews = document.createElement('div');
      imageViews.className = 'image-views';
      imageViews.title = 'Views';
      imageViews.innerHTML = '<i class="fa fa-eye" aria-hidden="true"></i>';
      gallery.append(imageDiv);
      imageDiv.append(imageName);
      imageDiv.append(imageLink);
      imageLink.append(image);
      imageDiv.append(imageInfo);
      imageInfo.append(imageLikes);
      var likeText = document.createElement('text');
      likeText.dataset.image = images[i];
      imageLikes.append(likeText);
      imageInfo.append(imageViews);
      var viewText = document.createElement('text');
      viewText.dataset.image = images[i];
      imageViews.append(viewText);
      image.onclick = function() {
        sessionStorage.setItem('imageSrc', this.src);
      }
      getInfo(images[i]);
    }
    if (gallery.getElementsByClassName('image-div')[0].dataset.number != 0) {
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

function getInfo(imageFileName) {
  return fetch(server + '/canvashare/drawinginfo/' + imageFileName.split('.png')[0]).then(function (response) {
    response.json().then(function (drawingInfo) {
      var parsed = JSON.parse(drawingInfo);
      var dataElements = document.querySelectorAll('[data-image="' + imageFileName + '"]');
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
  setTimeout(function () {window.location = URL}, 800);
}

function getMore() {
  if (window.getComputedStyle(this).getPropertyValue('opacity') != 0) {
    if (this == drawingLeftArrow) {
      drawingStart = drawingStart - 6;
      drawingEnd = drawingEnd - 6;
      populateDrawings();
    } else if (this == drawingRightArrow) {
      drawingStart = drawingStart + 6;
      drawingEnd = drawingEnd + 6;
      populateDrawings();
    } else if (this == postLeftArrow) {
      postStart = postStart - 6;
      postEnd = postEnd - 6;
      populatePosts();
    } else if (this == postRightArrow) {
      postStart = postStart + 6;
      postEnd = postEnd + 6;
      populatePosts();
    } else if (this == rhythmUpArrow) {
      scoreStart = scoreStart - 10;
      scoreEnd = scoreEnd - 10;
      populateScores('rhythm');
    } else if (this == rhythmDownArrow) {
      scoreStart = scoreStart + 10;
      scoreEnd = scoreEnd + 10;
      populateScores('rhythm');
    } else if (this == shapesUpArrow) {
      scoreStart = scoreStart - 10;
      scoreEnd = scoreEnd - 10;
      populateScores('shapes');
    } else if (this == shapesDownArrow) {
      scoreStart = scoreStart + 10;
      scoreEnd = scoreEnd + 10;
      populateScores('shapes');
    }
  }
}

function toggleDrawings() {
  drawingStart = 0;
  drawingEnd = 7;
  if (this == liked) {
    liked.classList.add('selected');
    mine.classList.remove('selected');
  }
  if (this == mine) {
    mine.classList.add('selected');
    liked.classList.remove('selected');
  }
  populateDrawings();
}

function populatePosts() {
  return fetch(server + '/thought-writer/entries/' + localStorage.getItem('cpusername') + '?start=' + postStart + '&end=' + postEnd, {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('cptoken')},
    method: 'GET',
  }).catch(function (error) {
    thoughtWriterLink.classList.remove('hidden');
  }).then(function (response) {
    if (!response.ok) {
      thoughtWriterLink.classList.remove('hidden');
    } else {
      response.json().then(function (posts) {
        if (posts.length == 0) {
          thoughtWriterLink.classList.remove('hidden');
        }
        if (posts.length != 0) {
          thoughtWriterLink.classList.add('hidden');
          postArea.innerHTML = '';
          if (posts.length > 6) {
            morePostsExist = true;
            postLoadNumber = 6;
          } else {
            morePostsExist = false;
            postLoadNumber = posts.length;
          }
          for (var i = 0; i < postLoadNumber; i++) {
            var postDiv = document.createElement('div');
            postDiv.className = 'post-div';
            postDiv.dataset.number = postStart + i;
            var postLink = document.createElement('a');
            postLink.className = 'post-link';
            postLink.href = 'javascript:delay("../../thought-writer/index.html")';
            var postName = document.createElement('div');
            postName.className = 'post-name';
            postName.innerHTML = posts[i].name;
            var post = document.createElement('div');
            post.classList.add('post');
            var postEntry = document.createElement('div');
            postEntry.classList.add('post-entry');
            postEntry.innerHTML = posts[i].content;
            var postInfo = document.createElement('div');
            postInfo.className = 'post-info';
            var postTimeDisplay = document.createElement('div');
            postTimeDisplay.className = 'post-time';
            var now = new Date();
            var utcDate = new Date(posts[i].timestamp - now.getTimezoneOffset() * 60000);
            var hour = parseInt(utcDate.getHours());
            var ampm = hour >= 12 ? ' PM' : ' AM';
            var hour = hour % 12;
            if (hour == 0) {
              hour = 12;
            }
            var postDate = parseInt(utcDate.getMonth() + 1) + '/' + parseInt(utcDate.getDate()) + '/' + parseInt(utcDate.getFullYear());
            var postTime = hour + ':' + ('0' + parseInt(utcDate.getMinutes())).slice(-2) + ampm;
            postTimeDisplay.innerHTML = postDate + ', ' + postTime;
            postArea.appendChild(postDiv);
            postDiv.appendChild(postLink);
            postLink.appendChild(postName);
            postDiv.appendChild(post);
            post.appendChild(postEntry);
            postDiv.appendChild(postInfo);
            postInfo.appendChild(postTimeDisplay);
            postLink.dataset.name = posts[i].name;
            postLink.dataset.content = posts[i].content;
            postLink.dataset.public = posts[i].public;
            postLink.dataset.timestamp = posts[i].timestamp;
            postLink.dataset.date = postDate;
            postLink.dataset.time = postTime;
            postLink.onclick = function() {
              sessionStorage.setItem('cppostname', this.dataset.name);
              sessionStorage.setItem('cppostcontent', this.dataset.content);
              sessionStorage.setItem('cppostpublic', this.dataset.public);
              sessionStorage.setItem('cpposttimestamp', this.dataset.timestamp);
              sessionStorage.setItem('cppostdate', this.dataset.date);
              sessionStorage.setItem('cpposttime', this.dataset.time);
            }
          }
          if (postArea.getElementsByClassName('post-div')[0].dataset.number != 0) {
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

function populateScores(game) {
  if (game == 'rhythm') {
    if (rhythmScores.length == 0) {
      rhythmLink.classList.add('hidden');
      rhythmHeader.classList.add('hidden');
      rhythmNoScores.classList.remove('hidden');
    }
    if (rhythmScores.length != 0) {
      displayedScores = rhythmScores.slice(scoreStart, scoreEnd);
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
      displayedScores = shapesScores.slice(scoreStart, scoreEnd);
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
      scoreRow.dataset.number = scoreStart + i;
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
      utcDateTime = JSON.parse(displayedScores[i].date);
      dateTime = new Date(utcDateTime + ' UTC');
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
  }
}

function flipMenuBack() {
  if (document.getElementById(this.dataset.section).dataset.flipped == 'true') {
    document.getElementById(this.dataset.section).classList.remove('flip');
    document.getElementById(this.dataset.section).dataset.flipped = 'false';
  }
}

function editContent() {
  if (this.dataset.editing == 'true') {
    if (!assessUsername() || !assessPassword() || !assessPasswordMatch() || !assessEmail()) {
      return;
    } else if (usernameInput.value != localStorage.getItem('cpusername') || passwordInput.value != '') {
      $(enterPass).modal('show');
    } else {
      postEdits();
    }
  } else {
    about = aboutInput.value;
    username = usernameInput.value;
    password = passwordInput.value;
    firstName = firstNameInput.value;
    lastName = lastNameInput.value;
    namePublic = namePublicInput.checked;
    email = emailInput.value;
    emailPublic = emailPublicInput.checked;
    backgroundColorValue = backgroundColorPicker.value;
    color = colorPicker.value;
    aboutInput.classList.add('editing');
    aboutInput.disabled = false;
    for (var i = 0; i < fields.length; i++) {
      fields[i].classList.add('editing');
      fields[i].disabled = false;
    }
    for (var i = 0; i < checkboxes.length; i++) {
      labels[i].classList.add('editing');
      checkboxes[i].classList.add('editing');
    }
    this.innerHTML = 'save';
    this.dataset.editing = 'true';
    cancelButton.style.display = 'block';
    backgroundColorDisplay.classList.add('editing');
    profileImage.classList.add('editing');
  }
}

function checkPassword() {
  verifyPassword = verifyPasswordInput.value;
  verifyPasswordInput.value = '';
  return fetch(server + '/login', {
    method: 'GET',
    headers: {'Authorization': 'Basic ' + btoa(localStorage.getItem('cpusername') + ':' + verifyPassword)}
  }).catch(function (error) {
    window.alert('Your request did not go through. Please try again soon.');
  }).then(function (response) {
    if (response.status == 400) {
      response.text().then(function (text) {
        if (text == 'Incorrect password') {
          $(passwordFail).modal('show');
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
  about = aboutInput.value;
  username = usernameInput.value;
  password = passwordInput.value;
  firstName = firstNameInput.value;
  lastName = lastNameInput.value;
  namePublic = namePublicInput.checked;
  email = emailInput.value;
  emailPublic = emailPublicInput.checked;
  backgroundColorValue = backgroundColorPicker.value;
  color = colorPicker.value;
  var data = {'username': username, 'password': password, 'first_name': firstName, 'last_name': lastName, 'name_public': namePublic, 'email': email, 'email_public': emailPublic, 'background_color': backgroundColorValue, 'color': color, 'about': about};
  data = JSON.stringify(data);
  return fetch(server + '/user/' + localStorage.getItem('cpusername'), {
    headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('cptoken')},
    method: 'PUT',
    body: data,
  }).catch(function (error) {
    window.alert('Your request did not go through. Please try again soon.');
  }).then(function(response) {
    response.text().then(function (text) {
      if (text == 'Username already exists') {
        $(retry).modal('show');
        retryTitle.innerHTML = 'Username "' + username + '" already exists';
      } else if (text == 'Success') {
        aboutInput.classList.remove('editing');
        aboutInput.disabled = true;
        for (var i = 0; i < fields.length; i++) {
          fields[i].classList.remove('editing');
          fields[i].disabled = true;
        }
        for (var i = 0; i < checkboxes.length; i++) {
          labels[i].classList.remove('editing');
          checkboxes[i].classList.remove('editing');
        }
        editButton.innerHTML = 'edit';
        editButton.dataset.editing = 'false';
        cancelButton.style.display = 'none';
        backgroundColorDisplay.classList.remove('editing');
        profileImage.classList.remove('editing');
        passwordInput.value = '';
        if (usernameInput.value != localStorage.getItem('cpusername')) {
          localStorage.setItem('cpusername', usernameInput.value);
        }
      }
    })
  })
}

function changeColor() {
  if (this == colorPicker) {
    diamond.style.fill = this.value;
  } else if (this == backgroundColorPicker) {
    backgroundColorDisplay.style.backgroundColor = this.value;
  }
}

function cancelEdit() {
  aboutInput.value = about;
  usernameInput.value = username;
  passwordInput.value = password;
  confirmPasswordInput.value = password;
  firstNameInput.value = firstName;
  lastNameInput.value = lastName;
  namePublicInput.checked = namePublic;
  emailInput.value = email;
  emailPublicInput.checked = emailPublic;
  backgroundColorPicker.value = backgroundColorValue;
  backgroundColorDisplay.style.backgroundColor = backgroundColorValue;
  colorPicker.value = color;
  diamond.style.fill = color;
  document.getElementById('user-warning-one').style.display = 'none';
  document.getElementById('user-warning-two').style.display = 'none';
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
    labels[i].classList.remove('editing');
    checkboxes[i].classList.remove('editing');
  }
  editButton.innerHTML = 'edit';
  editButton.dataset.editing = 'false';
  this.style.display = 'none';
  backgroundColorDisplay.classList.remove('editing');
  profileImage.classList.remove('editing');
}

function assessUsername() {
  var username = usernameInput.value;
  if (username.length == 0) {
    document.getElementById('user-warning-two').style.display = 'none';
    document.getElementById('user-warning-one').style.display = 'block';
    return false;
  }
  if (!username.match(/^[a-zA-Z0-9_-]+$/)) {
    document.getElementById('user-warning-one').style.display = 'none';
    document.getElementById('user-warning-two').style.display = 'block';
    return false;
  }
  document.getElementById('user-warning-one').style.display = 'none';
  document.getElementById('user-warning-two').style.display = 'none';
  return true;
}

function assessPassword() {
  var password = passwordInput.value;
  if (password.length > 0 && password.length < 8) {
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
  if (email.length > 0 && !email.match('@') || emailPublicInput.checked && email.length > 0 && !email.match('@')) {
    document.getElementById('email-warning').style.display = 'block';
    return false;
  }
  document.getElementById('email-warning').style.display = 'none';
  return true;
}
