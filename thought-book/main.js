// Define variables
var entryName = document.getElementById('entry-name');
var entry = document.getElementById('entry');
var toolbarButtons = document.getElementById('format-tools').getElementsByTagName('button');
var colorPicker = document.getElementById('color-picker');
var submit = document.getElementById('submit');

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
submit.onclick = postEntry;

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
    entryName.value = '[title]';
    entry.innerHTML = '';
  }
}
