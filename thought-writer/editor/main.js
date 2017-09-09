// Define variables
var profileLink = document.getElementById('profile-link');
var accountLink = document.getElementById('account-link');
var signInLink = document.getElementById('sign-in-link');
var requestStart = 0;
var requestEnd = 11;
var moreExists = false;
var postArea = document.getElementById('post-area');
var entryTitle = document.getElementById('entry-title');
var entry = document.getElementById('entry');
var toolbarButtons = document.getElementById('format-tools').getElementsByTagName('button');
var colorPicker = document.getElementById('color-picker');
var formatTools = document.getElementById('format-tools');
var clear = document.getElementById('clear');
var submit = document.getElementById('submit');
var checkbox = document.getElementById('checkbox');
var publicInput = document.getElementById('public');
var close = document.getElementById('close');
var modify = document.getElementById('modify');
var remove = document.getElementById('delete');
var drawingBoard = document.getElementById('drawing-board');
var actionButtons = document.getElementById('action-buttons');
var goBack = document.getElementById('go-back');
var newPost = document.getElementById('new-post');
var handle = document.getElementById('handle');
var open = false;
var cabinetFront = document.getElementById('cabinet-front');
var cabinetBack = document.getElementById('cabinet-back')
var leftArrow = document.getElementById('left-arrow');
var rightArrow = document.getElementById('right-arrow');
if (window.location.hostname == 'crystalprism.io') {
  var server = 'http://13.58.175.191/api';
} else {
  var server = 'http://localhost:5000/api';
}

// Define events
setInterval(saveData, 1000);

if (localStorage.getItem('entryTitle') != null) {
  if (localStorage.getItem('entryTitle') == 'Thank you for your post') {
    localStorage.setItem('entryTitle', '[title]');
  }
  entryTitle.value = localStorage.getItem('entryTitle');
}

if (localStorage.getItem('entry') != '') {
  entry.innerHTML = localStorage.getItem('entry');
}

if (localStorage.getItem('submitDisplay') != null) {
  if (localStorage.getItem('submitDisplay') == 'none') {
    clear.style.display = 'none';
    submit.style.display = 'none';
    close.style.display = 'inline-block';
    modify.style.display = 'inline-block';
    remove.style.display = 'inline-block';
  }
}

if (localStorage.getItem('entryTimestamp') != null) {
  entry.dataset.timestamp = localStorage.getItem('entryTimestamp');
}

if (localStorage.getItem('postPublic') != null) {
  if (localStorage.getItem('postPublic') == 'true') {
    checkbox.classList.add('checked');
    publicInput.checked = true;
  } else {
    checkbox.classList.remove('checked');
    publicInput.checked = false;
  }
}

for (var i = 0; i < toolbarButtons.length; i++) {
  toolbarButtons[i].addEventListener('click', executeCommand, false);
}

colorPicker.oninput = executeCommand;
window.onclick = enterTitle;
clear.onclick = clearEntry;
close.onclick = clearEntry;
submit.onclick = submitEntry;
modify.onclick = modifyEntry;
checkbox.onclick = togglePublic;
remove.onclick = deleteEntry;
goBack.onclick = displayPost;
newPost.onclick = startNew;
handle.onclick = toggleCabinet;
leftArrow.onclick = getMore;
rightArrow.onclick = getMore;

// Define functions
function checkAccountStatus() {
  return fetch(server + '/user/verify', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('cptoken')},
    method: 'GET',
  }).catch(function (error) {
    accountLink.innerHTML = 'Create Account';
    signInLink.innerHTML = 'Sign In';
    signInLink.onclick = function() {
      sessionStorage.setItem('cppreviouswindow', '../../thought-writer/editor/index.html');
    }
  }).then(function (response) {
    if (response.ok) {
      profileLink.innerHTML = localStorage.getItem('cpusername');
      profileLink.href = '../../user/index.html?username=' + localStorage.getItem('cpusername');
      accountLink.innerHTML = 'My Account';
      accountLink.href = '../../user/my-account/index.html';
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
        sessionStorage.setItem('cppreviouswindow', '../../thought-writer/editor/index.html');
      }
    }
  })
}

function getPosts() {
  if (sessionStorage.getItem('cppostcontent') != null) {
    entryTitle.value = sessionStorage.getItem('cpposttitle');
    entry.innerHTML = sessionStorage.getItem('cppostcontent');
    if (sessionStorage.getItem('cppostpublic') == 'true') {
      checkbox.classList.add('checked');
      publicInput.checked = true;
    } else {
      checkbox.classList.remove('checked');
      publicInput.checked = false;
    }
    entry.dataset.timestamp = sessionStorage.getItem('cpposttimestamp');
    entry.dataset.date = sessionStorage.getItem('cppostdate');
    entry.dataset.time = sessionStorage.getItem('cpposttime');
    sessionStorage.removeItem('cpposttitle');
    sessionStorage.removeItem('cppostcontent');
    sessionStorage.removeItem('cppostpublic');
    sessionStorage.removeItem('cpposttimestamp');
    sessionStorage.removeItem('cppostdate');
    sessionStorage.removeItem('cpposttime');
    clear.style.display = 'none';
    submit.style.display = 'none';
    close.style.display = 'inline-block';
    modify.style.display = 'inline-block';
    remove.style.display = 'inline-block';
  }
  if (localStorage.getItem('cptoken') != null) {
    return fetch(server + '/thought-writer/entries/' + localStorage.getItem('cpusername') + '?start=' + requestStart + '&end=' + requestEnd, {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('cptoken')},
      method: 'GET',
    }).then(function (response) {
      response.json().then(function (posts) {
        postArea.innerHTML = '';
        if (posts.length != 0) {
          if (posts.length > 10) {
            moreExists = true;
            loadNumber = 10;
          } else {
            moreExists = false;
            loadNumber = posts.length;
          }
          for (var i = 0; i < loadNumber; i++) {
            var post = document.createElement('div');
            post.classList.add('post');
            if (open) {
              post.classList.add('post-display');
            }
            post.dataset.title = posts[i].title;
            post.dataset.number = requestStart + i;
            post.dataset.public = posts[i].public;
            post.dataset.timestamp = posts[i].timestamp;
            var utcDateTime = JSON.parse(posts[i].timestamp);
            var dateTime = new Date(utcDateTime + ' UTC');
            var hour = parseInt(dateTime.getHours());
            var ampm = hour >= 12 ? ' PM' : ' AM';
            var hour = hour % 12;
            if (hour == 0) {
              hour = 12;
            }
            post.dataset.date = parseInt(dateTime.getMonth() + 1) + '/' + parseInt(dateTime.getDate()) + '/' + parseInt(dateTime.getFullYear());
            post.dataset.time = hour + ':' + ('0' + parseInt(dateTime.getMinutes())).slice(-2) + ampm;
            post.title = post.dataset.title + '  ' + post.dataset.date + ', ' + post.dataset.time;
            var postEntry = document.createElement('div');
            postEntry.classList.add('post-entry');
            postEntry.innerHTML = posts[i].content;
            postArea.appendChild(post);
            post.appendChild(postEntry);
            post.onclick = displayPost;
          }
        }
      })
    })
  }
}

function displayPost() {
  if (this.classList != null && this.classList.contains('post')) {
    backToDrawingBoard();
    entryTitle.value = this.dataset.title;
    entry.innerHTML = this.getElementsByTagName('div')[0].innerHTML;
    if (this.dataset.public == 'true') {
      checkbox.classList.add('checked');
      publicInput.checked = true;
    } else {
      checkbox.classList.remove('checked');
      publicInput.checked = false;
    }
    entry.dataset.timestamp = this.dataset.timestamp;
    entry.dataset.date = this.dataset.date;
    entry.dataset.time = this.dataset.time;
  } else if (this == goBack) {
    if (open) {
      toggleCabinet();
    }
    getPosts();
    backToDrawingBoard();
    entryTitle.value = sessionStorage.getItem('entryTitle');
    entry.innerHTML = sessionStorage.getItem('entry');
  }
  clear.style.display = 'none';
  submit.style.display = 'none';
  close.style.display = 'inline-block';
  modify.style.display = 'inline-block';
  remove.style.display = 'inline-block';
}

function saveData() {
  localStorage.setItem('entryTitle', entryTitle.value);
  localStorage.setItem('entry', entry.innerHTML);
  localStorage.setItem('submitDisplay', submit.style.display);
  localStorage.setItem('postPublic', publicInput.checked.toString());
  localStorage.setItem('entryTimestamp', entry.dataset.timestamp);
}

function executeCommand() {
  var command = this.dataset.command;
  if (command == 'foreColor') {
    document.execCommand(command, false, this.value);
  }
  else if (command == 'insertImage' || command == 'createLink') {
    var url = prompt('Specify link here: ', 'http:\/\/');
    document.execCommand(command, false, url);
  } else {
    document.execCommand(command, false, null);
  }
}

function enterTitle(e) {
  if (entryTitle.contains(e.target)) {
    if (entryTitle.value == '[title]') {
      entryTitle.value = '';
    }
  } else {
    if (entryTitle.value == '') {
      entryTitle.value = '[title]';
    }
  }
}

function clearEntry() {
  entryTitle.value = '[title]';
  entry.innerHTML = '';
  clear.style.display = 'inline-block';
  submit.style.display = 'inline-block';
  close.style.display = 'none';
  modify.style.display = 'none';
  remove.style.display = 'none';
  publicInput.checked = false;
  checkbox.classList.remove('checked');
  delete entry.dataset.timestamp;
}

function submitEntry() {
  var now = new Date();
  while (entryTitle.value == '[title]' || entryTitle.value == '') {
    enteredName = prompt('Specify a title for your entry.');
    if (enteredName == '') {
      enteredName = prompt('Specify a title for your entry.');
    } else if (enteredName == null) {
      return;
    } else {
      entryTitle.value = enteredName;
    }
  }
  if (entryTitle.value != '[title]' && entryTitle.value != '' && entryTitle.value != null) {
    if (localStorage.getItem('cptoken') == null) {
      window.alert('You must log in to create a post.');
      return;
    } else {
      var data = {'title': entryTitle.value, 'content': entry.innerHTML, 'public': (publicInput.checked).toString()};
      data = JSON.stringify(data);
    }
  }
  fetch(server + '/thought-writer/thoughts', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('cptoken'), 'Content-Type': 'application/json'},
    method: 'POST',
    body: data,
  }).catch(function (error) {
    window.alert('Your post did not go through. Please try again soon.');
  }).then(function (response) {
    if (response.ok) {
      response.text().then(function (text) {
        if (open) {
          toggleCabinet();
        }
        entry.dataset.timestamp = text;
        getPosts();
        drawingBoard.classList.add('entry-done-board');
        formatTools.classList.add('entry-done-content');
        entry.classList.add('entry-done-content');
        actionButtons.classList.add('entry-done-content');
        goBack.classList.add('entry-done-buttons');
        newPost.classList.add('entry-done-buttons');
        setTimeout (function() {
          drawingBoard.style.justifyContent = 'center';
          formatTools.style.display = 'none';
          entry.style.display = 'none';
          actionButtons.style.display = 'none';
          goBack.style.display = 'initial';
          newPost.style.display = 'initial';
        }, 200);
        sessionStorage.setItem('entryTitle', entryTitle.value);
        sessionStorage.setItem('entry', entry.innerHTML);
        entryTitle.value = 'Thank you for your post';
        entryTitle.disabled = true;
        entryTitle.style.userSelect = 'none';
        entry.innerHTML = '';
      })
    }
  })
}

function togglePublic() {
  if (publicInput.checked) {
    publicInput.checked = false;
    checkbox.classList.remove('checked');
  } else {
    publicInput.checked = true;
    checkbox.classList.add('checked');
  }
}

function modifyEntry() {
  if (localStorage.getItem('cptoken') == null) {
    window.alert('You must log in to create a post.');
    return;
  } else {
    var data = {'writer': localStorage.getItem('cpusername'), 'title': entryTitle.value, 'timestamp': entry.dataset.timestamp, 'content': entry.innerHTML, 'public': (publicInput.checked).toString()};
    data = JSON.stringify(data);
  }
  fetch(server + '/thought-writer/thoughts?timestamp=' + encodeURIComponent(entry.dataset.timestamp), {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('cptoken'), 'Content-Type': 'application/json'},
    method: 'PUT',
    body: data,
  }).catch(function (error) {
    window.alert('Your post did not go through. Please try again soon.');
  }).then(function (response) {
    if (response.ok) {
      if (open) {
        toggleCabinet();
      }
      getPosts();
      drawingBoard.classList.add('entry-done-board');
      formatTools.classList.add('entry-done-content');
      entry.classList.add('entry-done-content');
      actionButtons.classList.add('entry-done-content');
      goBack.classList.add('entry-done-buttons');
      newPost.classList.add('entry-done-buttons');
      setTimeout (function() {
        drawingBoard.style.justifyContent = 'center';
        formatTools.style.display = 'none';
        entry.style.display = 'none';
        actionButtons.style.display = 'none';
        goBack.style.display = 'initial';
        newPost.style.display = 'initial';
      }, 200);
      sessionStorage.setItem('entryTitle', entryTitle.value);
      sessionStorage.setItem('entry', entry.innerHTML);
      entryTitle.value = 'Thank you for your post';
      entryTitle.disabled = true;
      entryTitle.style.userSelect = 'none';
      entry.innerHTML = '';
    }
  })
  clear.style.display = 'inline-block';
  submit.style.display = 'inline-block';
  close.style.display = 'none';
  modify.style.display = 'none';
  remove.style.display = 'none';
}

function deleteEntry() {
  var confirmDelete = confirm('Are you sure you want to delete this post?');
  if (confirmDelete == true) {
    fetch(server + '/thought-writer/thoughts?timestamp=' + encodeURIComponent(entry.dataset.timestamp), {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('cptoken'), 'Content-Type': 'application/json'},
      method: 'DELETE'
    }).catch(function (error) {
      window.alert('Your request did not go through. Please try again soon.');
    })
    if (open) {
      toggleCabinet();
    }
    getPosts();
    clearEntry();
  }
}

function startNew() {
  entryTitle.value = '[title]';
  delete entry.dataset.timestamp;
  publicInput.checked = false;
  checkbox.classList.remove('checked');
  backToDrawingBoard();
  if (open) {
    toggleCabinet();
  }
  getPosts();
}

function backToDrawingBoard() {
  drawingBoard.classList.remove('entry-done-board');
  setTimeout (function() {
    drawingBoard.style.justifyContent = 'flex-start';
    formatTools.style.display = 'flex';
    entry.style.display = 'block';
    actionButtons.style.display = 'flex';
    goBack.style.display = 'none';
    newPost.style.display = 'none';
    formatTools.classList.remove('entry-done-content');
    entry.classList.remove('entry-done-content');
    actionButtons.classList.remove('entry-done-content');
    goBack.classList.remove('entry-done-buttons');
    newPost.classList.remove('entry-done-buttons');
  }, 200);
  entryTitle.disabled = false;
  entryTitle.style.userSelect = 'text';
}

function toggleCabinet() {
  if (open) {
    cabinetBack.classList.remove('cabinet-back-display');
    cabinetFront.classList.remove('cabinet-front-display');
    allPosts = document.getElementsByClassName('post');
    for (var i = 0; i < allPosts.length; i++) {
      allPosts[i].classList.remove('post-display');
    }
    leftArrow.classList.remove('next-display');
    rightArrow.classList.remove('next-display');
    open = false;
  } else {
    cabinetBack.classList.add('cabinet-back-display');
    cabinetFront.classList.add('cabinet-front-display');
    allPosts = document.getElementsByClassName('post');
    for (var i = 0; i < allPosts.length; i++) {
      allPosts[i].classList.add('post-display');
    }
    if (moreExists) {
      rightArrow.classList.add('next-display');
    }
    if (postArea.children.length != 0) {
      if (postArea.getElementsByClassName('post')[0].dataset.number != 0) {
        leftArrow.classList.add('next-display');
      }
    }
    open = true;
  }
}

function getMore() {
  if (window.getComputedStyle(this).getPropertyValue('opacity') != 0) {
    if (this.id == 'left-arrow') {
      requestStart = requestStart - 10;
      requestEnd = requestEnd - 10;
    } else if (this.id == 'right-arrow') {
      requestStart = requestStart + 10;
      requestEnd = requestEnd + 10;
    }
    getPosts();
    setTimeout(function () {
      if (postArea.getElementsByClassName('post')[0].dataset.number != 0) {
        leftArrow.classList.add('next-display');
      } else {
        leftArrow.classList.remove('next-display');
      }
      if (moreExists) {
        rightArrow.classList.add('next-display');
      } else {
        rightArrow.classList.remove('next-display');
      }
    }, 50);
  }
}
