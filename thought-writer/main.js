// Define variables
var header = document.getElementById('header');
var profileLink = document.getElementById('profile-link');
var accountLink = document.getElementById('account-link');
var signInLink = document.getElementById('sign-in-link');
var errorMessage = '';
var postStart = 0;
var postEnd = 11;
var morePostsExist = false;
var postBoard = document.getElementById('post-board');
if (window.location.hostname == 'crystalprism.io') {
  var server = 'http://13.58.175.191/api';
} else {
  var server = 'http://localhost:5000/api';
}

// Define events
window.addEventListener('scroll', function() {
  if (window.pageYOffset > 60) {
    header.classList.add('shrink');
  } else if (header.classList.contains('shrink')) {
    header.classList.remove('shrink');
  }
})

window.onscroll = displayMorePosts;

// Define functions
function checkAccountStatus() {
  return fetch(server + '/user/verify', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
    method: 'GET',
  }).catch(function(error) {
    accountLink.innerHTML = 'Create Account';
    signInLink.innerHTML = 'Sign In';
    signInLink.onclick = function() {
      sessionStorage.setItem('previous-window', '../../thought-writer/index.html');
    }
  }).then(function(response) {
    if (response.ok) {
      profileLink.innerHTML = localStorage.getItem('username');
      profileLink.href = '../user/index.html?username=' + localStorage.getItem('username');
      accountLink.innerHTML = 'My Account';
      accountLink.href = '../user/my-account/index.html';
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
        sessionStorage.setItem('previous-window', '../../thought-writer/index.html');
      }
    }
  })
}

function loadPosts() {
  return fetch(server + '/thought-writer/entries' + '?start=' + postStart + '&end=' + postEnd).catch(function(error) {
    if (errorMessage == '') {
      errorMessage = document.createElement('text');
      errorMessage.id = 'error-message';
      errorMessage.innerHTML = 'There was an error loading the Thought Writer post board. Please refresh the page.';
      postBoard.append(errorMessage);
    }
  }).then(function(response) {
    if (response.ok) {
      response.json().then(function(posts) {
        if (posts.length != 0) {
          if (posts.length > 10) {
            morePostsExist = true;
            postLoadNumber = 10;
          } else {
            morePostsExist = false;
            postLoadNumber = posts.length;
          }
          for (var i = 0; i < postLoadNumber; i++) {
            var postContainer = document.createElement('div');
            postContainer.classList.add('post-container');
            postContainer.dataset.number = postStart + i;
            var postTitle = document.createElement('a');
            postTitle.classList.add('post-title');
            postTitle.href = 'javascript:delay("post/index.html")';
            postTitle.innerHTML = posts[i].title;
            var postContent = document.createElement('div');
            postContent.classList.add('post-content');
            postContent.innerHTML = posts[i].content;
            var postInfo = document.createElement('div');
            postInfo.classList.add('post-info');
            var postWriter = document.createElement('a');
            postWriter.href = '../user/index.html?username=' + posts[i].writer;
            postWriter.innerHTML = posts[i].writer;
            var postComments = document.createElement('a');
            if (posts[i].comments.length == 1) {
              postComments.innerHTML = posts[i].comments.length + ' comment';
            } else {
              postComments.innerHTML = posts[i].comments.length + ' comments';
            }
            postComments.href = 'javascript:delay("post/index.html#comments")';
            var postTimeDisplay = document.createElement('div');
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
            postBoard.append(postContainer);
            postContainer.append(postTitle);
            postContainer.append(postContent);
            postContainer.append(postInfo);
            postInfo.append(postWriter);
            postInfo.append(postComments);
            postInfo.append(postTimeDisplay);
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
        }
      })
    }
  })
}

function delay(URL) {
  setTimeout(function() {window.location = URL}, 800);
}

function displayMorePosts() {
  if (morePostsExist) {
    if ((document.body.scrollTop + document.body.clientHeight) >= document.body.scrollHeight - 10) {
      postStart = postEnd;
      postEnd = postEnd + Math.floor(postBoard.offsetWidth/240);
      setTimeout(loadPosts, 10);
    }
  }
}
