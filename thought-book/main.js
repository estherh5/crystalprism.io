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

// Define events
setInterval(saveData, 1000);

if (localStorage.getItem('entryName') != '') {
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
goBack.onclick = seeOld;
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
  if (window.location.hostname == 'crystalprism.io') {
    server = 'http://13.58.175.191/api';
  } else {
    server = 'http://localhost:5000/api';
  }
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
    var data = {'name': entryName.value, 'date': now.getMonth() + 1 + '/' + now.getDate() + '/' + now.getFullYear(), 'time': now.getHours() + ':' + now.getMinutes(), 'content': entry.innerHTML};
    data = JSON.stringify(data);
    fetch(server + '/thoughts', {
      headers: {'Content-Type': 'application/json'},
      method: 'POST',
      body: data,
    })
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
  }
}

function seeOld() {
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
}

function startNew() {
  journal.classList.remove('entry-done-journal');
  entryName.value = '[title]';
  entry.innerHTML = '';
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
