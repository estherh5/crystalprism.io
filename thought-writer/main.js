// Define variables
var header = document.getElementById('header');
var plus = document.getElementById('plus');
var newButton = document.getElementById('new');
var profileLink = document.getElementById('profile-link');
var accountLink = document.getElementById('account-link');
var signInLink = document.getElementById('sign-in-link');
var errorMessage = '';
var postStart = 0;
var postEnd = 11;
var morePostsExist = false;
var postArea = document.getElementById('post-area');
if (window.location.hostname == 'crystalprism.io') {
  var server = 'http://13.58.175.191/api';
} else {
  var server = 'http://localhost:5000/api';
}

// Define events
window.addEventListener('scroll', function () {
  if (window.pageYOffset > 100) {
    header.classList.add('shrink');
  } else if (header.classList.contains('shrink')) {
    header.classList.remove('shrink');
  }
})

window.onscroll = displayMorePosts;

plus.onclick = function() {
  newButton.classList.add('clicked');
  setTimeout(function() {
    newButton.classList.remove('clicked');
  }, 500);
  window.location = 'editor/index.html';
}

// Define functions
function checkAccountStatus() {
  return fetch(server + '/user/verify', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('cptoken')},
    method: 'GET',
  }).catch(function (error) {
    accountLink.innerHTML = 'Create Account';
    signInLink.innerHTML = 'Sign In';
    signInLink.onclick = function() {
      sessionStorage.setItem('cppreviouswindow', '../../thought-writer/index.html');
    }
  }).then(function (response) {
    if (response.ok) {
      profileLink.innerHTML = localStorage.getItem('cpusername');
      profileLink.href = '../user/index.html?username=' + localStorage.getItem('cpusername');
      accountLink.innerHTML = 'My Account';
      accountLink.href = '../user/my-account/index.html';
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
        sessionStorage.setItem('cppreviouswindow', '../../thought-writer/index.html');
      }
    }
  })
}

function getPosts() {
  return fetch(server + '/thought-writer/entries' + '?start=' + postStart + '&end=' + postEnd).catch(function (error) {
    if (errorMessage == '') {
      errorMessage = document.createElement('text');
      errorMessage.id = 'error-message';
      errorMessage.innerHTML = 'There was an error loading the Thought Writer diary. Please refresh the page.';
      postArea.append(errorMessage);
    }
  }).then(function (response) {
    if (response.ok) {
      response.json().then(function (posts) {
        if (posts.length != 0) {
          if (posts.length > 10) {
            morePostsExist = true;
            postLoadNumber = 10;
          } else {
            morePostsExist = false;
            postLoadNumber = posts.length;
          }
          for (var i = 0; i < postLoadNumber; i++) {
            var postDiv = document.createElement('div');
            postDiv.className = 'post-div';
            postDiv.dataset.number = postStart + i;
            var postTitle = document.createElement('div');
            postTitle.className = 'post-title';
            postTitle.innerHTML = posts[i].title;
            var postEntry = document.createElement('div');
            postEntry.classList.add('post-entry');
            postEntry.innerHTML = posts[i].content;
            var postInfo = document.createElement('div');
            postInfo.className = 'post-info';
            var postTimeDisplay = document.createElement('div');
            var utcDateTime = JSON.parse(posts[i].timestamp);
            var dateTime = new Date(utcDateTime + ' UTC');
            var hour = parseInt(dateTime.getHours());
            var ampm = hour >= 12 ? ' PM' : ' AM';
            var hour = hour % 12;
            if (hour == 0) {
              hour = 12;
            }
            var postDate = parseInt(dateTime.getMonth() + 1) + '/' + parseInt(dateTime.getDate()) + '/' + parseInt(dateTime.getFullYear());
            var postTime = hour + ':' + ('0' + parseInt(dateTime.getMinutes())).slice(-2) + ampm;
            postTimeDisplay.innerHTML = postDate + ', ' + postTime;
            var postWriter = document.createElement('a');
            postWriter.href = '../user/index.html?username=' + posts[i].writer;
            postWriter.innerHTML = posts[i].writer;
            postArea.appendChild(postDiv);
            postDiv.appendChild(postTitle);
            postDiv.appendChild(postEntry);
            postDiv.appendChild(postInfo);
            postInfo.appendChild(postTimeDisplay);
            postInfo.appendChild(postWriter);
            postTitle.dataset.writer = posts[i].writer;
            postTitle.dataset.timestamp = posts[i].timestamp;
            postTitle.onclick = function() {
              sessionStorage.setItem('writer', this.dataset.writer);
              sessionStorage.setItem('timestamp', this.dataset.timestamp);
            }
          }
        }
      })
    }
  })
}

function displayMorePosts() {
  if (morePostsExist) {
    if ((document.body.scrollTop + document.body.clientHeight) >= document.body.scrollHeight - 10) {
      postStart = postEnd;
      postEnd = postEnd + Math.floor(postArea.offsetWidth/240);
      setTimeout(getPosts, 10);
    }
  }
}
