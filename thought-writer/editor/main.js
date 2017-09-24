// Define variables
var profileLink = document.getElementById('profile-link');
var accountLink = document.getElementById('account-link');
var signInLink = document.getElementById('sign-in-link');
var requestStart = 0;
var requestEnd = 11;
var morePostsExist = false;
var postsContainer = document.getElementById('posts-container');
var postTitle = document.getElementById('post-title');
var post = document.getElementById('post');
var toolbarButtons = document.getElementById('format-toolbar').getElementsByTagName('button');
var fontColorIcon = document.getElementById('font-color-icon');
var fontColorPicker = document.getElementById('font-color-picker');
var toolbar = document.getElementById('format-toolbar');
var clearButton = document.getElementById('clear');
var submitButton = document.getElementById('submit');
var publicCheckbox = document.getElementById('public-checkbox');
var publicInput = document.getElementById('public-input');
publicInput.checked = false;
var closeButton = document.getElementById('close');
var modifyButton = document.getElementById('modify');
var deleteButton = document.getElementById('delete');
var postBoard = document.getElementById('post-board');
var actionButtons = document.getElementById('action-buttons');
var backButton = document.getElementById('go-back');
var continueButton = document.getElementById('continue-post');
var newButton = document.getElementById('new-post');
var handle = document.getElementById('handle');
var open = false;
var cabinetFront = document.getElementById('cabinet-front');
var cabinetBack = document.getElementById('cabinet-back')
var leftArrow = document.getElementById('left-arrow');
var rightArrow = document.getElementById('right-arrow');
var postFinished = false;
var saveInterval = setInterval(saveData, 1000);
if (window.location.hostname == 'crystalprism.io') {
  var server = 'http://13.58.175.191/api';
} else {
  var server = 'http://localhost:5000/api';
}

// Define events
for (var i = 0; i < toolbarButtons.length; i++) {
  toolbarButtons[i].addEventListener('click', executeCommand, false);
}

fontColorIcon.addEventListener('click', function() {
  fontColorPicker.focus();
  fontColorPicker.click();
}, false);

window.onclick = enterTitle;
fontColorPicker.oninput = executeCommand;
clearButton.onclick = clearEntry;
submitButton.onclick = submitEntry;
closeButton.onclick = clearEntry;
modifyButton.onclick = modifyEntry;
deleteButton.onclick = deleteEntry;
publicCheckbox.onclick = togglePublic;
backButton.onclick = displayPost;
continueButton.onclick = continuePost;
newButton.onclick = startNew;
handle.onclick = toggleCabinet;
leftArrow.onclick = displayMorePosts;
rightArrow.onclick = displayMorePosts;

// Define functions
function checkAccountStatus() {
  return fetch(server + '/user/verify', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
    method: 'GET',
  }).catch(function(error) {
    accountLink.innerHTML = 'Create Account';
    signInLink.innerHTML = 'Sign In';
    signInLink.onclick = function() {
      sessionStorage.setItem('previous-window', '../../thought-writer/editor/index.html');
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
        sessionStorage.setItem('previous-window', '../../thought-writer/editor/index.html');
      }

    }
  })
}

function displayDraft() {
  if (localStorage.getItem('post-title') != null) {
    if (localStorage.getItem('post-title') == 'Thank you for your post') {
      localStorage.setItem('post-title', '[title]');
    }
    postTitle.value = localStorage.getItem('post-title');
  }
  if (localStorage.getItem('post-content') != null) {
    post.innerHTML = localStorage.getItem('post-content');
  }
  if (localStorage.getItem('post-public') != null) {
    if (localStorage.getItem('post-public') == 'true') {
      publicCheckbox.classList.add('checked');
      publicInput.checked = true;
    } else {
      publicCheckbox.classList.remove('checked');
      publicInput.checked = false;
    }
  }
}

function postAutoFocus() {
  post.focus();
}

function getPreviousPosts() {
  if (sessionStorage.getItem('post-timestamp') != null) {
    fetch(server + '/thought-writer/thoughts/' + localStorage.getItem('username') + '/' + encodeURIComponent(sessionStorage.getItem('post-timestamp')), {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
    }).catch(function(error) {
      window.alert('Your request did not go through. Please try again soon.');
    }).then(function(response) {
      response.json().then(function(requestedPost) {
        postTitle.value = requestedPost.title;
        post.innerHTML = requestedPost.content;
        if (requestedPost.public == 'true') {
          publicCheckbox.classList.add('checked');
          publicInput.checked = true;
        } else {
          publicCheckbox.classList.remove('checked');
          publicInput.checked = false;
        }
        sessionStorage.removeItem('post-timestamp');
        clearInterval(saveInterval);
        clearButton.style.display = 'none';
        submitButton.style.display = 'none';
        closeButton.style.display = 'inline-block';
        modifyButton.style.display = 'inline-block';
        deleteButton.style.display = 'inline-block';
      })
    })
  }
  if (localStorage.getItem('token') != null) {
    return fetch(server + '/thought-writer/entries/' + localStorage.getItem('username') + '?start=' + requestStart + '&end=' + requestEnd, {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
      method: 'GET',
    }).then(function(response) {
      response.json().then(function(previousPosts) {
        postsContainer.innerHTML = '';
        if (previousPosts.length != 0) {
          if (previousPosts.length > 10) {
            morePostsExist = true;
            loadNumber = 10;
          } else {
            morePostsExist = false;
            loadNumber = previousPosts.length;
          }
          for (var i = 0; i < loadNumber; i++) {
            var previousPost = document.createElement('div');
            previousPost.classList.add('previous-post');
            if (open) {
              previousPost.classList.add('display');
            }
            previousPost.dataset.title = previousPosts[i].title;
            previousPost.dataset.number = requestStart + i;
            previousPost.dataset.timestamp = previousPosts[i].timestamp;
            var utcDateTime = JSON.parse(previousPosts[i].timestamp);
            var utcDate = utcDateTime.split(' ')[0];
            var utcTime = utcDateTime.split(' ')[1];
            var dateTime = new Date(utcDate + 'T' + utcTime);
            var hour = parseInt(dateTime.getHours());
            var ampm = hour >= 12 ? ' PM' : ' AM';
            var hour = hour % 12;
            if (hour == 0) {
              hour = 12;
            }
            previousPost.dataset.date = parseInt(dateTime.getMonth() + 1) + '/' + parseInt(dateTime.getDate()) + '/' + parseInt(dateTime.getFullYear());
            previousPost.dataset.time = hour + ':' + ('0' + parseInt(dateTime.getMinutes())).slice(-2) + ampm;
            previousPost.dataset.public = previousPosts[i].public;
            previousPost.title = previousPost.dataset.title + '  ' + previousPost.dataset.date + ', ' + previousPost.dataset.time;
            var postContent = document.createElement('div');
            postContent.classList.add('previous-post-content');
            postContent.innerHTML = previousPosts[i].content;
            postsContainer.append(previousPost);
            previousPost.append(postContent);
            previousPost.onclick = displayPost;
          }
        }
      })
    })
  }
}

function displayPost() {
  if (this.classList.contains('previous-post')) {
    postTitle.value = this.dataset.title;
    post.innerHTML = this.getElementsByTagName('div')[0].innerHTML;
    post.dataset.timestamp = this.dataset.timestamp;
    if (this.dataset.public == 'true') {
      publicCheckbox.classList.add('checked');
      publicInput.checked = true;
    } else {
      publicCheckbox.classList.remove('checked');
      publicInput.checked = false;
    }
  } else if (this == backButton) {
    if (open) {
      toggleCabinet();
    }
    fetch(server + '/thought-writer/thoughts/' + localStorage.getItem('username') + '/' + encodeURIComponent(post.dataset.timestamp), {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
    }).catch(function(error) {
      window.alert('Your request did not go through. Please try again soon.');
    }).then(function(response) {
      response.json().then(function(lastPost) {
        postTitle.value = lastPost.title;
        post.innerHTML = lastPost.content;
        if (lastPost.public == 'true') {
          publicCheckbox.classList.add('checked');
          publicInput.checked = true;
        } else {
          publicCheckbox.classList.remove('checked');
          publicInput.checked = false;
        }
      })
    })
    getPreviousPosts();
  }
  flipBoard();
  clearInterval(saveInterval);
  clearButton.style.display = 'none';
  submitButton.style.display = 'none';
  closeButton.style.display = 'inline-block';
  modifyButton.style.display = 'inline-block';
  deleteButton.style.display = 'inline-block';
}

function saveData() {
  localStorage.setItem('post-title', postTitle.value);
  localStorage.setItem('post-content', post.innerHTML);
  localStorage.setItem('post-public', publicInput.checked.toString());
}

function enterTitle(e) {
  if (postTitle.contains(e.target)) {
    if (postTitle.value == '[title]') {
      postTitle.value = '';
    }
  } else {
    if (postTitle.value == '' || !/\S/.test(postTitle.value)) {
      postTitle.value = '[title]';
    }
  }
}

function executeCommand() {
  var command = this.dataset.command;
  if (command == 'foreColor') {
    fontColorIcon.style.color = this.value;
    document.execCommand(command, false, this.value);
  }
  else if (command == 'insertImage' || command == 'createLink') {
    var url = prompt('Specify link here: ', 'http:\/\/');
    document.execCommand(command, false, url);
  } else {
    document.execCommand(command, false, null);
  }
}

function clearEntry() {
  if (this == closeButton) {
    saveInterval = setInterval(saveData, 1000);
    displayDraft();
  } else {
    postTitle.value = '[title]';
    post.innerHTML = '';
    publicInput.checked = false;
    publicCheckbox.classList.remove('checked');
    delete post.dataset.timestamp;
  }
  clearButton.style.display = 'inline-block';
  submitButton.style.display = 'inline-block';
  closeButton.style.display = 'none';
  modifyButton.style.display = 'none';
  deleteButton.style.display = 'none';
}

function submitEntry() {
  while (postTitle.value == '[title]' || postTitle.value == '' || !/\S/.test(postTitle.value)) {
    enteredTitle = prompt('Specify a title for your post.');
    if (enteredTitle == '' || !/\S/.test(enteredTitle.value)) {
      enteredTitle = prompt('Specify a title for your post.');
    } else if (enteredTitle == null) {
      return;
    } else {
      postTitle.value = enteredTitle;
    }
  }
  if (!/\S/.test(post.innerHTML)) {
    window.alert('Your post cannot be blank.');
  }
  if (postTitle.value != '[title]' && postTitle.value != '' && postTitle.value != null && /\S/.test(postTitle.value) && /\S/.test(post.innerHTML)) {
    if (localStorage.getItem('token') == null) {
      window.alert('You must log in to create a post.');
      return;
    } else {
      var data = {'title': postTitle.value, 'content': post.innerHTML, 'public': (publicInput.checked).toString()};
      data = JSON.stringify(data);
    }
  }
  fetch(server + '/thought-writer/thoughts', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json'},
    method: 'POST',
    body: data,
  }).catch(function(error) {
    window.alert('Your post did not go through. Please try again soon.');
  }).then(function(response) {
    if (response.ok) {
      response.text().then(function(text) {
        if (open) {
          toggleCabinet();
        }
        post.dataset.timestamp = text;
        postFinished = true;
        postTitle.value = 'Thank you for your post';
        post.innerHTML = '';
        publicInput.checked = false;
        publicCheckbox.classList.remove('checked');
        saveData();
        getPreviousPosts();
        flipBoard();
      })
    }
  })
}

function togglePublic() {
  if (publicInput.checked) {
    publicInput.checked = false;
    publicCheckbox.classList.remove('checked');
  } else {
    publicInput.checked = true;
    publicCheckbox.classList.add('checked');
  }
}

function modifyEntry() {
  if (localStorage.getItem('token') == null) {
    window.alert('You must log in to create a post.');
    return;
  } else {
    var data = {'title': postTitle.value, 'timestamp': post.dataset.timestamp, 'content': post.innerHTML, 'public': (publicInput.checked).toString()};
    data = JSON.stringify(data);
  }
  fetch(server + '/thought-writer/thoughts?timestamp=' + encodeURIComponent(post.dataset.timestamp), {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json'},
    method: 'PUT',
    body: data,
  }).catch(function(error) {
    window.alert('Your post did not go through. Please try again soon.');
  }).then(function(response) {
    if (response.ok) {
      if (open) {
        toggleCabinet();
      }
      getPreviousPosts();
      postFinished = true;
      flipBoard();
    }
  })
  clearButton.style.display = 'inline-block';
  submitButton.style.display = 'inline-block';
  closeButton.style.display = 'none';
  modifyButton.style.display = 'none';
  deleteButton.style.display = 'none';
}

function deleteEntry() {
  var confirmDelete = confirm('Are you sure you want to delete this post?');
  if (confirmDelete == true) {
    fetch(server + '/thought-writer/thoughts?timestamp=' + encodeURIComponent(post.dataset.timestamp), {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json'},
      method: 'DELETE'
    }).catch(function(error) {
      window.alert('Your request did not go through. Please try again soon.');
    })
    if (open) {
      toggleCabinet();
    }
    getPreviousPosts();
    displayDraft();
    saveInterval = setInterval(saveData, 1000);
    clearButton.style.display = 'inline-block';
    submitButton.style.display = 'inline-block';
    closeButton.style.display = 'none';
    modifyButton.style.display = 'none';
    deleteButton.style.display = 'none';
  }
}

function continuePost() {
  flipBoard();
  displayDraft();
}

function startNew() {
  postTitle.value = '[title]';
  post.innerHTML = '';
  delete post.dataset.timestamp;
  publicInput.checked = false;
  publicCheckbox.classList.remove('checked');
  flipBoard();
  saveInterval = setInterval(saveData, 1000);
  if (open) {
    toggleCabinet();
  }
  getPreviousPosts();
}

function flipBoard() {
  if (postFinished) {
    if (localStorage.getItem('post-content') != '') {
      continueButton.classList.add('finished');
      setTimeout(function() {
        continueButton.style.display = 'initial';
      }, 200)
    }
    postBoard.classList.add('finished');
    toolbar.classList.add('finished');
    post.classList.add('finished');
    actionButtons.classList.add('finished');
    backButton.classList.add('finished');
    newButton.classList.add('finished');
    setTimeout(function() {
      postBoard.style.justifyContent = 'center';
      toolbar.style.display = 'none';
      post.style.display = 'none';
      actionButtons.style.display = 'none';
      backButton.style.display = 'initial';
      newButton.style.display = 'initial';
    }, 200);
    postTitle.disabled = true;
    postTitle.style.userSelect = 'none';
    postFinished = false;
    clearInterval(saveInterval);
  } else {
    postBoard.classList.remove('finished');
    postBoard.style.justifyContent = 'flex-start';
    toolbar.style.display = 'flex';
    post.style.display = 'block';
    actionButtons.style.display = 'flex';
    backButton.style.display = 'none';
    continueButton.style.display = 'none';
    newButton.style.display = 'none';
    toolbar.classList.remove('finished');
    post.classList.remove('finished');
    actionButtons.classList.remove('finished');
    backButton.classList.remove('finished');
    continueButton.classList.remove('finished');
    newButton.classList.remove('finished');
    postTitle.disabled = false;
    postTitle.style.userSelect = 'text';
  }
}

function toggleCabinet() {
  var previousPosts = document.getElementsByClassName('previous-post');
  if (open) {
    cabinetBack.classList.remove('open');
    cabinetFront.classList.remove('open');
    for (var i = 0; i < previousPosts.length; i++) {
      previousPosts[i].classList.remove('display');
    }
    leftArrow.classList.remove('display');
    rightArrow.classList.remove('display');
    open = false;
  } else {
    cabinetBack.classList.add('open');
    cabinetFront.classList.add('open');
    for (var i = 0; i < previousPosts.length; i++) {
      previousPosts[i].classList.add('display');
    }
    if (morePostsExist) {
      rightArrow.classList.add('display');
    }
    if (postsContainer.children.length != 0) {
      if (postsContainer.getElementsByClassName('previous-post')[0].dataset.number != 0) {
        leftArrow.classList.add('display');
      }
    }
    open = true;
  }
}

function displayMorePosts() {
  if (window.getComputedStyle(this).getPropertyValue('opacity') != 0) {
    if (this.id == 'left-arrow') {
      requestStart = requestStart - 10;
      requestEnd = requestEnd - 10;
    } else if (this.id == 'right-arrow') {
      requestStart = requestStart + 10;
      requestEnd = requestEnd + 10;
    }
    getPreviousPosts();
    setTimeout(function() {
      if (postsContainer.getElementsByClassName('previous-post')[0].dataset.number != 0) {
        leftArrow.classList.add('display');
      } else {
        leftArrow.classList.remove('display');
      }
      if (morePostsExist) {
        rightArrow.classList.add('display');
      } else {
        rightArrow.classList.remove('display');
      }
    }, 50);
  }
}
