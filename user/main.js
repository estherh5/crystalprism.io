// Define varaibles
var profileLink = document.getElementById('profile-link');
var accountLink = document.getElementById('account-link');
var signInLink = document.getElementById('sign-in-link');
var username = window.location.search.split('username=')[1];
var profileTitle = document.getElementById('profile-title');
var userLink = document.getElementById('user-link');
var userData = document.getElementsByClassName('user-data');
var aboutBlurb = document.getElementById('about-blurb');
var name = document.getElementById('name');
var email = document.getElementById('email');
var diamond = document.getElementById('diamond');
var memberStat = document.getElementById("member-stat");
var userDrawings = [];
var drawingsStart = 0;
var drawingsEnd = 4;
var galleryRow = document.getElementById('gallery-row');
var gallery = document.getElementById('gallery');
var drawingsLeftArrow = document.getElementById('drawing-left-arrow');
var drawingsRightArrow = document.getElementById('drawing-right-arrow');
var rhythmStat = document.getElementById('rhythm-stat');
var shapesStat = document.getElementById('shapes-stat');
var postsStart = 0;
var postsEnd = 4;
var postAreaRow = document.getElementById('post-area-row');
var postArea = document.getElementById('post-area');
var postsLeftArrow = document.getElementById('posts-left-arrow');
var postsRightArrow = document.getElementById('posts-right-arrow');
if (window.location.hostname == 'crystalprism.io') {
  var server = 'http://13.58.175.191/api';
} else {
  var server = 'http://localhost:5000/api';
}

// Define events
window.addEventListener('load', checkAccountStatus, false);
window.addEventListener('load', loadPersonal, false);
window.addEventListener('load', loadPosts, false);
drawingsLeftArrow.onclick = loadMoreContent;
drawingsRightArrow.onclick = loadMoreContent;
postsLeftArrow.onclick = loadMoreContent;
postsRightArrow.onclick = loadMoreContent;

// Define functions
function checkAccountStatus() {
  if (localStorage.getItem('token') == null) {
    accountLink.innerHTML = 'Create Account';
    signInLink.innerHTML = 'Sign In';
    signInLink.onclick = function() {
      sessionStorage.setItem('previous-window', '../index.html?username=' + username);
    }
  } else {
    return fetch(server + '/user/verify', {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
      method: 'GET',
    }).catch(function(error) {
      accountLink.innerHTML = 'Create Account';
      signInLink.innerHTML = 'Sign In';
      signInLink.onclick = function() {
        sessionStorage.setItem('previous-window', '../index.html?username=' + username);
      }
    }).then(function(response) {
      if (response.ok) {
        profileLink.innerHTML = localStorage.getItem('username');
        profileLink.href = 'index.html?username=' + localStorage.getItem('username');
        accountLink.innerHTML = 'My Account';
        accountLink.href = 'my-account/index.html';
        signInLink.innerHTML = 'Sign Out';
        signInLink.onclick = function() {
          sessionStorage.setItem('account-request', 'logout');
        }
      } else {
        localStorage.removeItem('username');
        localStorage.removeItem('token');
        accountLink.innerHTML = 'Create Account';
        signInLink.innerHTML = 'Sign In';
        signInLink.onclick = function() {
          sessionStorage.setItem('previous-window', '../index.html?username=' + username);
        }
      }
    })
  }
}

function loadPersonal() {
  return fetch(server + '/user/' + username).catch(function(error) {
    profileTitle.innerHTML = 'Could not load page';
    document.title = 'Not found';
  }).then(function(response) {
    if (response.ok) {
      response.json().then(function(info) {
        userLink.href = 'index.html?username=' + username;
        profileTitle.innerHTML = username;
        document.title = username;
        aboutBlurb.innerHTML = info['about'];
        name.innerHTML = info['name'];
        email.innerHTML = info['email'];
        email.href = 'mailto:' + info['email'];
        document.body.style.backgroundColor = info['background_color'];
        diamond.style.fill = info['icon_color'];
        var utcDateTime = JSON.parse(info['member_since']);
        var utcDate = utcDateTime.split(' ')[0];
        var utcTime = utcDateTime.split(' ')[1];
        var dateTime = new Date(utcDate + 'T' + utcTime);
        memberStat.innerHTML = 'Member since ' + parseInt(dateTime.getMonth() + 1) + '/' + parseInt(dateTime.getDate()) + '/' + parseInt(dateTime.getFullYear());
        userDrawings = info['drawings'];
        loadDrawings();
        var star = document.createElement('i');
        star.classList.add('fa');
        star.classList.add('fa-star');
        rhythmStat.parentNode.insertBefore(star, rhythmStat);
        rhythmStat.innerHTML = 'Rhythm of Life high score: <b>' + info['rhythm_high_lifespan'] + '</b>';
        var starTwo = document.createElement('i');
        starTwo.classList.add('fa');
        starTwo.classList.add('fa-star');
        shapesStat.parentNode.insertBefore(starTwo, shapesStat);
        shapesStat.innerHTML = 'Shapes in Rain high score: <b>' + info['shapes_high_score'] + '</b>';
        for (var i = 0; i < userData.length; i++) {
          if (userData[i].innerHTML == '') {
            userData[i].parentNode.classList.add('hidden');
          }
        }
      })
    } else {
      profileTitle.innerHTML = 'User does not exist';
      document.title = 'Not found';
    }
  })
}

function loadDrawings() {
  drawings = userDrawings.slice(drawingsStart, drawingsEnd);
  if (drawings.length == 0) {
    galleryRow.classList.add('hidden');
  }
  if (drawings.length != 0) {
    gallery.innerHTML = '';
    if (drawings.length > 3) {
      moreDrawingsExist = true;
      var drawingsLoadNumber = 3;
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
      drawingLink.href = 'javascript:delay("../canvashare/drawingapp/index.html")';
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
      drawing.onclick = setDrawingValues;
      getDrawingInfo(drawings[i]);
    }
    if (gallery.getElementsByClassName('drawing-container')[0].dataset.number != 0) {
      drawingsLeftArrow.classList.add('display');
    } else {
      drawingsLeftArrow.classList.remove('display');
    }
    if (moreDrawingsExist) {
      drawingsRightArrow.classList.add('display');
    } else {
      drawingsRightArrow.classList.remove('display');
    }
  }
}

function setDrawingValues() {
  if (this.classList.contains('drawing')) {
    sessionStorage.setItem('drawing-source', this.src);
    currentLikes = document.querySelectorAll('[data-drawing="' + this.src.split('/canvashare/drawing/')[1] + '"]')[1].innerHTML;
    currentViews = document.querySelectorAll('[data-drawing="' + this.src.split('/canvashare/drawing/')[1] + '"]')[2].innerHTML;
    data = {'likes': parseInt(currentLikes), 'views': parseInt(currentViews) + 1};
    data = JSON.stringify(data);
    fetch(server + '/canvashare/drawinginfo/' + this.src.split('/canvashare/drawing/')[1].split('.png')[0], {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json'},
      method: 'POST',
      body: data
    })
  } else if (this.classList.contains('fa-heart-o')) {
    heart = this;
    heart.classList.add('clicked');
    setTimeout(function() {
      heart.classList.remove('clicked');
    }, 500);
    likeText = this.nextSibling;
    currentLikes = likeText.innerHTML;
    currentViews = document.querySelectorAll('[data-drawing="' + this.nextSibling.dataset.drawing + '"]')[2].innerHTML;
    data = {'likes': (parseInt(currentLikes) + 1).toString(), 'views': (parseInt(currentViews)).toString()};
    data = JSON.stringify(data);
    fetch(server + '/canvashare/drawinginfo/' + this.nextSibling.dataset.drawing.split('.png')[0], {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json'},
      method: 'POST',
      body: data
    }).catch(function(error) {
      window.alert('Your like did not go through. Please try again soon.')
    }).then(function(response) {
      if (response.ok) {
        likeText.innerHTML = parseInt(currentLikes) + 1;
        heart.classList.remove('fa-heart-o');
        heart.classList.add('fa-heart');
      } else {
        window.alert('You must log in to like a drawing.');
      }
    })
  } else if (this.classList.contains('fa-heart')) {
    heart = this;
    heart.classList.add('clicked');
    setTimeout(function() {
      heart.classList.remove('clicked');
    }, 500);
    likeText = this.nextSibling;
    currentLikes = likeText.innerHTML;
    currentViews = document.querySelectorAll('[data-drawing="' + this.nextSibling.dataset.drawing + '"]')[2].innerHTML;
    data = {'likes': parseInt(currentLikes) - 1, 'views': parseInt(currentViews)};
    data = JSON.stringify(data);
    fetch(server + '/canvashare/drawinginfo/' + this.nextSibling.dataset.drawing.split('.png')[0], {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json'},
      method: 'POST',
      body: data
    }).catch(function(error) {
      window.alert('Your like did not go through. Please try again soon.')
    }).then(function(response) {
      if (response.ok) {
        heart.classList.remove('fa-heart');
        heart.classList.add('fa-heart-o');
        likeText.innerHTML = parseInt(currentLikes) - 1;
      } else {
        window.alert('You must log in to like a drawing.');
      }
    })
  }
}

function getDrawingInfo(drawingFileName) {
  return fetch(server + '/canvashare/drawinginfo/' + drawingFileName.split('.png')[0]).then(function(response) {
    response.json().then(function(drawingInfo) {
      var parsed = JSON.parse(drawingInfo);
      var dataElements = document.querySelectorAll('[data-drawing="' + drawingFileName + '"]');
      var unlikedHeart = document.createElement('i');
      unlikedHeart.classList.add('heart');
      unlikedHeart.classList.add('fa');
      unlikedHeart.classList.add('fa-heart-o');
      var likedHeart = document.createElement('i');
      likedHeart.classList.add('heart');
      likedHeart.classList.add('fa');
      likedHeart.classList.add('fa-heart');
      if (parsed['liked_users'].includes(localStorage.getItem('username'))) {
        dataElements[0].insertBefore(likedHeart, dataElements[0].firstChild);
      } else {
        dataElements[0].insertBefore(unlikedHeart, dataElements[0].firstChild);
      }
      likedHeart.onclick = setDrawingValues;
      unlikedHeart.onclick = setDrawingValues;
      likedHeart.style.cursor = 'pointer';
      unlikedHeart.style.cursor = 'pointer';
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
    if (this == drawingsLeftArrow) {
      drawingsStart = drawingsStart - 3;
      drawingsEnd = drawingsEnd - 3;
      loadDrawings();
    } else if (this == drawingsRightArrow) {
      drawingsStart = drawingsStart + 3;
      drawingsEnd = drawingsEnd + 3;
      loadDrawings();
    } else if (this == postsLeftArrow) {
      postsStart = postsStart - 3;
      postsEnd = postsEnd - 3;
      loadPosts();
    } else if (this == postsRightArrow) {
      postsStart = postsStart + 3;
      postsEnd = postsEnd + 3;
      loadPosts();
    }
  }
}

function loadPosts() {
  return fetch(server + '/thought-writer/entries/' + username + '?start=' + postsStart + '&end=' + postsEnd).then(function(response) {
    if (response.ok) {
      response.json().then(function(posts) {
        if (posts.length == 0) {
          postAreaRow.classList.add('hidden');
        }
        if (posts.length != 0) {
          postArea.innerHTML = '';
          if (posts.length > 3) {
            morePostsExist = true;
            postsLoadNumber = 3;
          } else {
            morePostsExist = false;
            postsLoadNumber = posts.length;
          }
          for (var i = 0; i < postsLoadNumber; i++) {
            var postContainer = document.createElement('div');
            postContainer.classList.add('post-container');
            postContainer.dataset.number = postsStart + i;
            var postTitle = document.createElement('a');
            postTitle.classList.add('post-title');
            postTitle.title = 'View post page';
            postTitle.href = 'javascript:delay("../thought-writer/post/index.html")';
            postTitle.innerHTML = posts[i].title;
            var post = document.createElement('div');
            post.classList.add('post');
            var postEntry = document.createElement('div');
            postEntry.classList.add('post-content');
            postEntry.innerHTML = posts[i].content;
            var postInfo = document.createElement('div');
            postInfo.classList.add('post-info');
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
            var postComments = document.createElement('a');
            postComments.title = 'View post comments';
            if (posts[i].comments.length == 1) {
              postComments.innerHTML = posts[i].comments.length + ' comment';
            } else {
              postComments.innerHTML = posts[i].comments.length + ' comments';
            }
            postComments.href = 'javascript:delay("../thought-writer/post/index.html#comments")';
            postArea.append(postContainer);
            postContainer.append(postTitle);
            postContainer.append(post);
            post.append(postEntry);
            postContainer.append(postInfo);
            postInfo.append(postTimeDisplay);
            postInfo.append(postComments);
            postTitle.dataset.writer = posts[i].writer;
            postTitle.dataset.timestamp = posts[i].timestamp;
            postComments.dataset.writer = posts[i].writer;
            postComments.dataset.timestamp = posts[i].timestamp;
            postTitle.onclick = function() {
              sessionStorage.setItem('writer', this.dataset.writer);
              sessionStorage.setItem('timestamp', this.dataset.timestamp);
            }
            postComments.onclick = function() {
              sessionStorage.setItem('writer', this.dataset.writer);
              sessionStorage.setItem('timestamp', this.dataset.timestamp);
            }
          }
          if (postArea.getElementsByClassName('post-container')[0].dataset.number != 0) {
            postsLeftArrow.classList.add('display');
          } else {
            postsLeftArrow.classList.remove('display');
          }
          if (morePostsExist) {
            postsRightArrow.classList.add('display');
          } else {
            postsRightArrow.classList.remove('display');
          }
        }
      })
    } else {
      postAreaRow.classList.add('hidden');
    }
  })
}
