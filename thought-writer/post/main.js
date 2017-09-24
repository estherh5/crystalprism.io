// Define variables
var profileLink = document.getElementById('profile-link');
var accountLink = document.getElementById('account-link');
var signInLink = document.getElementById('sign-in-link');
var errorMessage = '';
var postStart = 0;
var postEnd = 11;
var container = document.getElementById('container');
var postArea = document.getElementById('post-area');
var postTitle = document.getElementById('post-title');
var postContent = document.getElementById('post-content');
var postWriter = document.getElementById('post-writer');
var postTimeDisplay = document.getElementById('post-timestamp');
var commentsNumber = document.getElementById('comments-number');
var comments = document.getElementById('comments');
var submit = document.getElementById('submit');
var newComment = document.getElementById('new-comment-box');
if (window.location.hostname == 'crystalprism.io') {
  var server = 'http://13.58.175.191/api';
} else {
  var server = 'http://localhost:5000/api';
}

// Define events
window.addEventListener('scroll', function() {
  if (window.pageYOffset > 100) {
    header.classList.add('shrink');
  } else if (header.classList.contains('shrink')) {
    header.classList.remove('shrink');
  }
})

submit.onclick = addComment;

// Define functions
function checkAccountStatus() {
  return fetch(server + '/user/verify', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
    method: 'GET',
  }).catch(function(error) {
    accountLink.innerHTML = 'Create Account';
    signInLink.innerHTML = 'Sign In';
    signInLink.onclick = function() {
      sessionStorage.setItem('previous-window', '../../thought-writer/post/index.html');
    }
  }).then(function(response) {
    if (response.ok) {
      profileLink.innerHTML = localStorage.getItem('username');
      profileLink.href = '../../user/index.html?username=' + localStorage.getItem('username');
      accountLink.innerHTML = 'My Account';
      accountLink.href = '../../user/my-account/index.html';
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
        sessionStorage.setItem('previous-window', '../../thought-writer/post/index.html');
      }
    }
  })
}

function getPost() {
  return fetch(server + '/thought-writer/thoughts/' + encodeURIComponent(sessionStorage.getItem('writer')) + '/' + encodeURIComponent(sessionStorage.getItem('timestamp'))).catch(function(error) {
    if (errorMessage == '') {
      errorMessage = document.createElement('text');
      errorMessage.id = 'error-message';
      errorMessage.innerHTML = 'There was an error loading the Thought Writer post. Please refresh the page.';
      container.innerHTML = '';
      container.append(errorMessage);
    }
  }).then(function(response) {
    if (response.ok) {
      response.json().then(function(post) {
        postTitle.innerHTML = post.title;
        postContent.innerHTML = post.content;
        var utcDateTime = JSON.parse(post.timestamp);
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
        postWriter.href = '../../user/index.html?username=' + post.writer;
        postWriter.innerHTML = post.writer;
        comments.innerHTML = '';
        if (post.comments.length == 1) {
          commentsNumber.innerHTML = post.comments.length + ' comment';
        } else {
          commentsNumber.innerHTML = post.comments.length + ' comments';
        }
        for (var i = 0; i < post.comments.length; i++) {
          var commentContainer = document.createElement('div');
          commentContainer.classList.add('comment-container');
          var commentContent = document.createElement('div');
          commentContent.classList.add('comment-content');
          commentContent.innerHTML = post.comments[i].content;
          var commentTimestamp = document.createElement('div');
          commentTimestamp.classList.add('comment-timestamp');
          var utcDateTime = JSON.parse(post.comments[i].timestamp);
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
          commentTimestamp.innerHTML = postDate + ', ' + postTime;
          var commenter = document.createElement('a');
          commenter.classList.add('commenter');
          commenter.href = '../../user/index.html?username=' + post.comments[i].commenter;
          commenter.innerHTML = post.comments[i].commenter;
          comments.append(commentContainer);
          commentContainer.append(commentContent);
          commentContainer.append(commenter);
          commentContainer.append(commentTimestamp);
        }
      })
    }
  })
}

function addComment() {
  if (!/\S/.test(newComment.innerHTML)) {
    window.alert('Your comment cannot be blank.');
  }
  if (/\S/.test(newComment.innerHTML)) {
    data = {'content': newComment.innerHTML};
    data = JSON.stringify(data);
    return fetch(server + '/thought-writer/comments?timestamp=' + encodeURIComponent(sessionStorage.getItem('timestamp')), {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json'},
      method: 'POST',
      body: data
    }).catch(function(error) {
      window.alert('Your comment did not go through. Please try again soon.');
    }).then(function(response) {
      if (response.ok) {
        newComment.innerHTML = '';
        getPost();
      } else {
        window.alert('You must log in to leave a comment.');
      }
    })
  }
}
