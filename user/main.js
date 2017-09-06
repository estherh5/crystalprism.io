// Define varaibles
var profileLink = document.getElementById('profile-link');
var accountLink = document.getElementById('account-link');
var signInLink = document.getElementById('sign-in-link');
var username = window.location.search.split('username=')[1];
var user = document.getElementById('user');
var userLink = document.getElementById('user-link');
var userData = document.getElementsByClassName('user-data');
var about = document.getElementById('about');
var firstLastName = document.getElementById('name');
var email = document.getElementById('email');
var diamond = document.getElementById('diamond');
var memberStat = document.getElementById("member-stat");
var userDrawings = [];
var rhythmStat = document.getElementById('rhythm-stat');
var shapesStat = document.getElementById('shapes-stat');
var drawingStart = 0;
var drawingEnd = 4;
var galleryRow = document.getElementById('gallery-row');
var gallery = document.getElementById('gallery');
var drawingLeftArrow = document.getElementById('drawing-left-arrow');
var drawingRightArrow = document.getElementById('drawing-right-arrow');
var postStart = 0;
var postEnd = 4;
var postAreaRow = document.getElementById('post-area-row');
var postArea = document.getElementById('post-area');
var postLeftArrow = document.getElementById('post-left-arrow');
var postRightArrow = document.getElementById('post-right-arrow');
if (window.location.hostname == 'crystalprism.io') {
  var server = 'http://13.58.175.191/api';
} else {
  var server = 'http://localhost:5000/api';
}

// Define events
drawingLeftArrow.onclick = getMore;
drawingRightArrow.onclick = getMore;
postLeftArrow.onclick = getMore;
postRightArrow.onclick = getMore;

// Define functions
function checkAccountStatus() {
  return fetch(server + '/user/verify', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('cptoken')},
    method: 'GET',
  }).then(function (response) {
    if (response.ok) {
      profileLink.innerHTML = localStorage.getItem('cpusername');
      profileLink.href = 'index.html?username=' + localStorage.getItem('cpusername');
      accountLink.innerHTML = 'My Account';
      accountLink.href = 'my-account/index.html';
      signInLink.innerHTML = 'Sign Out';
      signInLink.onclick = function() {
        sessionStorage.setItem('cprequest', 'logout');
      }
    } else {
      localStorage.removeItem('cpusername');
      localStorage.removeItem('cptoken');
      accountLink.innerHTML = 'Create Account';
      signInLink.innerHTML = 'Sign In';
      signInLink.onclick = function() {
        sessionStorage.setItem('cppreviouswindow', '../index.html?username=' + username);
      }
    }
  })
}

function populatePersonal() {
  return fetch(server + '/user/' + username).then(function (response) {
    if (response.ok) {
      response.json().then(function (info) {
        userLink.href = 'index.html?username=' + username;
        user.innerHTML = username;
        document.title = username;
        about.innerHTML = info['about'];
        firstLastName.innerHTML = info['name'];
        email.innerHTML = info['email'];
        email.href = 'mailto:' + info['email'];
        document.body.style.backgroundColor = info['background_color'];
        diamond.style.fill = info['color'];
        var utcDateTime = JSON.parse(info['member_since']);
        var dateTime = new Date(utcDateTime + ' UTC');
        memberStat.innerHTML = 'Member since ' + parseInt(dateTime.getMonth() + 1) + '/' + parseInt(dateTime.getDate()) + '/' + parseInt(dateTime.getFullYear());
        userDrawings = info['images'];
        populateDrawings();
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
      user.innerHTML = 'User does not exist';
      document.title = 'Not found';
    }
  })
}

function populateDrawings() {
  images = userDrawings.slice(drawingStart, drawingEnd);
  if (images.length == 0) {
    galleryRow.classList.add('hidden');
  }
  if (images.length != 0) {
    gallery.innerHTML = '';
    if (images.length > 3) {
      moreDrawingsExist = true;
      var drawingLoadNumber = 3;
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
      imageLink.href = 'javascript:delay("../canvashare/drawingapp/index.html")';
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
      image.onclick = setImageValues;
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

function setImageValues() {
  if (this.classList.contains('image')) {
    sessionStorage.setItem('imageSrc', this.src);
    currentLikes = document.querySelectorAll('[data-image="' + this.src.split('/canvashare/drawing/')[1] + '"]')[1].innerHTML;
    currentViews = document.querySelectorAll('[data-image="' + this.src.split('/canvashare/drawing/')[1] + '"]')[2].innerHTML;
    data = {'likes': parseInt(currentLikes), 'views': parseInt(currentViews) + 1};
    data = JSON.stringify(data);
    fetch(server + '/canvashare/drawinginfo/' + this.src.split('/canvashare/drawing/')[1].split('.png')[0], {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('cptoken'), 'Content-Type': 'application/json'},
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
    currentViews = document.querySelectorAll('[data-image="' + this.nextSibling.dataset.image + '"]')[2].innerHTML;
    data = {'likes': (parseInt(currentLikes) + 1).toString(), 'views': (parseInt(currentViews)).toString()};
    data = JSON.stringify(data);
    fetch(server + '/canvashare/drawinginfo/' + this.nextSibling.dataset.image.split('.png')[0], {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('cptoken'), 'Content-Type': 'application/json'},
      method: 'POST',
      body: data
    }).then(function (response) {
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
    currentViews = document.querySelectorAll('[data-image="' + this.nextSibling.dataset.image + '"]')[2].innerHTML;
    data = {'likes': parseInt(currentLikes) - 1, 'views': parseInt(currentViews)};
    data = JSON.stringify(data);
    fetch(server + '/canvashare/drawinginfo/' + this.nextSibling.dataset.image.split('.png')[0], {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('cptoken'), 'Content-Type': 'application/json'},
      method: 'POST',
      body: data
    }).then(function (response) {
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

function getInfo(imageFileName) {
  return fetch(server + '/canvashare/drawinginfo/' + imageFileName.split('.png')[0]).then(function (response) {
    response.json().then(function (drawingInfo) {
      var parsed = JSON.parse(drawingInfo);
      var dataElements = document.querySelectorAll('[data-image="' + imageFileName + '"]');
      var unlikedHeart = document.createElement('i');
      unlikedHeart.classList.add('heart');
      unlikedHeart.classList.add('fa');
      unlikedHeart.classList.add('fa-heart-o');
      var likedHeart = document.createElement('i');
      likedHeart.classList.add('heart');
      likedHeart.classList.add('fa');
      likedHeart.classList.add('fa-heart');
      if (parsed['liked_users'].includes(localStorage.getItem('cpusername'))) {
        dataElements[0].insertBefore(likedHeart, dataElements[0].firstChild);
      } else {
        dataElements[0].insertBefore(unlikedHeart, dataElements[0].firstChild);
      }
      likedHeart.onclick = setImageValues;
      unlikedHeart.onclick = setImageValues;
      likedHeart.style.cursor = 'pointer';
      unlikedHeart.style.cursor = 'pointer';
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
      drawingStart = drawingStart - 3;
      drawingEnd = drawingEnd - 3;
      populateDrawings();
    } else if (this == drawingRightArrow) {
      drawingStart = drawingStart + 3;
      drawingEnd = drawingEnd + 3;
      populateDrawings();
    } else if (this == postLeftArrow) {
      postStart = postStart - 3;
      postEnd = postEnd - 3;
      populatePosts();
    } else if (this == postRightArrow) {
      postStart = postStart + 3;
      postEnd = postEnd + 3;
      populatePosts();
    }
  }
}

function populatePosts() {
  return fetch(server + '/thought-writer/entries/' + username + '?start=' + postStart + '&end=' + postEnd).then(function (response) {
    if (response.ok) {
      response.json().then(function (posts) {
        if (posts.length == 0) {
          postAreaRow.classList.add('hidden');
        }
        if (posts.length != 0) {
          postArea.innerHTML = '';
          if (posts.length > 3) {
            morePostsExist = true;
            postLoadNumber = 3;
          } else {
            morePostsExist = false;
            postLoadNumber = posts.length;
          }
          for (var i = 0; i < postLoadNumber; i++) {
            var postDiv = document.createElement('div');
            postDiv.className = 'post-div';
            postDiv.dataset.number = postStart + i;
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
            postDiv.appendChild(postName);
            postDiv.appendChild(post);
            post.appendChild(postEntry);
            postDiv.appendChild(postInfo);
            postInfo.appendChild(postTimeDisplay);
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
      })
    } else {
      postAreaRow.classList.add('hidden');
    }
  })
}
