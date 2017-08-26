// Define variables
var requestStart = 0;
var requestEnd = 11;
var moreExists = false;
var postArea = document.getElementById('post-area');
var entryName = document.getElementById('entry-name');
var entry = document.getElementById('entry');
var toolbarButtons = document.getElementById('format-tools').getElementsByTagName('button');
var colorPicker = document.getElementById('color-picker');
var formatTools = document.getElementById('format-tools');
var clear = document.getElementById('clear');
var submit = document.getElementById('submit');
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

if (localStorage.getItem('entryName') != '') {
  if (localStorage.getItem('entryName') == 'Thank you for your post') {
    localStorage.setItem('entryName', '[title]');
  }
  entryName.value = localStorage.getItem('entryName');
}

if (localStorage.getItem('entry') != '') {
  entry.innerHTML = localStorage.getItem('entry');
}

if (localStorage.getItem('clearName') != '') {
  clear.innerHTML = localStorage.getItem('clearName');
}

if (localStorage.getItem('submitName') != '') {
  submit.innerHTML = localStorage.getItem('submitName');
}

if (localStorage.getItem('entryTimestamp') != '') {
  entry.dataset.timestamp = localStorage.getItem('entryTimestamp');
}

for (var i = 0; i < toolbarButtons.length; i++) {
  toolbarButtons[i].addEventListener('click', executeCommand, false);
}

colorPicker.oninput = executeCommand;
window.onclick = enterTitle;
clear.onclick = clearEntry;
submit.onclick = submitEntry;
remove.onclick = deleteEntry;
goBack.onclick = modifyLast;
newPost.onclick = startNew;
handle.onclick = toggleCabinet;
leftArrow.onclick = getMore;
rightArrow.onclick = getMore;

// Define functions
function getPosts() {
  if (localStorage.getItem('cptoken') != null) {
    return fetch(server + '/thought-writer/entries?start=' + requestStart + '&end=' + requestEnd, {
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
            post.dataset.name = posts[i].name;
            post.dataset.number = requestStart + i;
            post.dataset.timestamp = posts[i].timestamp;
            post.dataset.date = posts[i].date;
            post.dataset.time = posts[i].time;
            post.title = post.dataset.name + '  ' + post.dataset.date + ', ' + post.dataset.time;
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
  backToDrawingBoard();
  entryName.value = this.dataset.name;
  entry.innerHTML = this.getElementsByTagName('div')[0].innerHTML;
  entry.dataset.timestamp = this.dataset.timestamp;
  entry.dataset.date = this.dataset.date;
  entry.dataset.time = this.dataset.time;
  clear.innerHTML = 'Close';
  submit.innerHTML = 'Modify';
  remove.style.display = 'inline-block';
}

function saveData() {
  localStorage.setItem('entryName', entryName.value);
  localStorage.setItem('entry', entry.innerHTML);
  localStorage.setItem('clearName', clear.innerHTML);
  localStorage.setItem('submitName', submit.innerHTML);
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
  if (entryName.contains(e.target)) {
    if (entryName.value == '[title]') {
      entryName.value = '';
    }
  } else {
    if (entryName.value == '') {
      entryName.value = '[title]';
    }
  }
}

function clearEntry() {
  entryName.value = '[title]';
  entry.innerHTML = '';
  clear.innerHTML = 'Clear';
  submit.innerHTML = 'Submit';
  remove.style.display = '';
  delete entry.dataset.timestamp;
}

function submitEntry() {
  var now = new Date();
  while (entryName.value == '[title]' || entryName.value == '') {
    enteredName = prompt('Specify a title for your entry.');
    if (enteredName == '') {
      enteredName = prompt('Specify a title for your entry.');
    } else if (enteredName == null) {
      return;
    } else {
      entryName.value = enteredName;
    }
  }
  if (this.innerHTML == 'Submit') {
    if (entryName.value != '[title]' && entryName.value != '' && entryName.value != null) {
      if (localStorage.getItem('cptoken') == null) {
        window.alert('You must log in to create a post.');
        return;
      } else {
        var timestamp = now.getTime();
        entry.dataset.timestamp = timestamp;
        var hour = parseInt(now.getHours());
        var ampm = hour >= 12 ? ' PM' : ' AM';
        var hour = hour % 12;
        if (hour == 0) {
          hour = 12;
        }
        var data = {'name': entryName.value, 'timestamp': timestamp, 'date': parseInt(now.getMonth() + 1) + '/' + parseInt(now.getDate()) + '/' + parseInt(now.getFullYear()), 'time': hour + ':' + ('0' + parseInt(now.getMinutes())).slice(-2) + ampm, 'content': entry.innerHTML};
        data = JSON.stringify(data);
      }
    }
  } else if (this.innerHTML == 'Modify') {
    if (localStorage.getItem('cptoken') == null) {
      window.alert('You must log in to create a post.');
      return;
    } else {
      var data = {'name': entryName.value, 'timestamp': parseInt(entry.dataset.timestamp), 'date': entry.dataset.date, 'time': entry.dataset.time, 'content': entry.innerHTML};
      data = JSON.stringify(data);
    }
  }
  fetch(server + '/thought-writer/thoughts/?timestamp=' + entry.dataset.timestamp, {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('cptoken'), 'Content-Type': 'application/json'},
    method: 'POST',
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
      sessionStorage.setItem('entryName', entryName.value);
      sessionStorage.setItem('entry', entry.innerHTML);
      entryName.value = 'Thank you for your post';
      entryName.disabled = true;
      entryName.style.userSelect = 'none';
      entry.innerHTML = '';
    }
  })
  if (this.innerHTML == 'Modify') {
    this.innerHTML = 'Submit';
    clear.innerHTML = 'Clear';
    remove.style.display = '';
  }
}

function deleteEntry() {
  fetch(server + '/thought-writer/thoughts/?timestamp=' + entry.dataset.timestamp, {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('cptoken'), 'Content-Type': 'application/json'},
    method: 'DELETE'
  })
  if (open) {
    toggleCabinet();
  }
  getPosts();
  clearEntry();
}

function modifyLast() {
  fetch(server + '/thought-writer/thoughts/?timestamp=' + entry.dataset.timestamp, {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('cptoken'), 'Content-Type': 'application/json'},
    method: 'DELETE'
  })
  if (open) {
    toggleCabinet();
  }
  getPosts();
  backToDrawingBoard();
  entryName.value = sessionStorage.getItem('entryName');
  entry.innerHTML = sessionStorage.getItem('entry');
}

function startNew() {
  entryName.value = '[title]';
  delete entry.dataset.timestamp;
  backToDrawingBoard();
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
  entryName.disabled = false;
  entryName.style.userSelect = 'text';
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
