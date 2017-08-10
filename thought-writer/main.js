// Define variables
var entryName = document.getElementById('entry-name');
var entry = document.getElementById('entry');
var toolbarButtons = document.getElementById('format-tools').getElementsByTagName('button');
var colorPicker = document.getElementById('color-picker');
var formatTools = document.getElementById('format-tools');
var clear = document.getElementById('clear');
var submit = document.getElementById('submit');
var journal = document.getElementById('journal');
var clearSubmit = document.getElementById('clear-submit');
var goBack = document.getElementById('go-back');
var newPost = document.getElementById('new-post');
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

for (var i = 0; i < toolbarButtons.length; i++) {
  toolbarButtons[i].addEventListener('click', executeCommand, false);
}

colorPicker.oninput = executeCommand;
window.onclick = enterTitle;
clear.onclick = clearEntry;
submit.onclick = postEntry;
goBack.onclick = modifyLast;
newPost.onclick = startNew;

// Define functions
function saveData() {
  localStorage.setItem('entryName', entryName.value);
  localStorage.setItem('entry', entry.innerHTML);
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
}

function postEntry() {
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
  if (entryName.value != '[title]' && entryName.value != '' && entryName.value != null) {
    var data = {'name': entryName.value, 'month': parseInt(now.getMonth() + 1), 'day': parseInt(now.getDate()), 'year': parseInt(now.getFullYear()), 'hour': parseInt(now.getHours()), 'minute': parseInt(now.getMinutes()), 'content': entry.innerHTML};
    data = JSON.stringify(data);
    fetch(server + '/thought-writer', {
      headers: {'Content-Type': 'application/json'},
      method: 'POST',
      body: data,
    }).catch(function (error) {
      window.alert('Your post did go through. Please try again soon.');
    }).then(function (response) {
      if (response.ok) {
        journal.classList.add('entry-done-journal');
        formatTools.classList.add('entry-done-content');
        entry.classList.add('entry-done-content');
        clearSubmit.classList.add('entry-done-content');
        goBack.classList.add('entry-done-buttons');
        newPost.classList.add('entry-done-buttons');
        setTimeout (function() {
          journal.style.justifyContent = 'center';
          formatTools.style.display = 'none';
          entry.style.display = 'none';
          clearSubmit.style.display = 'none';
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
  }
}

function modifyLast() {
  journal.classList.remove('entry-done-journal');
  setTimeout (function() {
    journal.style.justifyContent = 'flex-start';
    formatTools.style.display = 'flex';
    entry.style.display = 'block';
    clearSubmit.style.display = 'flex';
    goBack.style.display = 'none';
    newPost.style.display = 'none';
    formatTools.classList.remove('entry-done-content');
    entry.classList.remove('entry-done-content');
    clearSubmit.classList.remove('entry-done-content');
    goBack.classList.remove('entry-done-buttons');
    newPost.classList.remove('entry-done-buttons');
  }, 200);
  entryName.disabled = false;
  entryName.style.userSelect = 'text';
  entryName.value = sessionStorage.getItem('entryName');
  entry.innerHTML = sessionStorage.getItem('entry');
  fetch(server + '/thought-writer', {
    headers: {'Content-Type': 'application/json'},
    method: 'DELETE'
  })
}

function startNew() {
  journal.classList.remove('entry-done-journal');
  entryName.disabled = false;
  entryName.style.userSelect = 'text';
  entryName.value = '[title]';
  setTimeout (function() {
    journal.style.justifyContent = 'flex-start';
    formatTools.style.display = 'flex';
    entry.style.display = 'block';
    clearSubmit.style.display = 'flex';
    goBack.style.display = 'none';
    newPost.style.display = 'none';
    formatTools.classList.remove('entry-done-content');
    entry.classList.remove('entry-done-content');
    clearSubmit.classList.remove('entry-done-content');
    goBack.classList.remove('entry-done-buttons');
    newPost.classList.remove('entry-done-buttons');
  }, 200);
}
