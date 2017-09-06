// Define variables
var themeButton = document.getElementById('theme-button');
var skyIcon = document.getElementById('sky-icon');
var now = new Date().getHours();
var projectsCircle = document.getElementById('projects-circle');
var aboutCircle = document.getElementById('about-circle');
var photosCircle = document.getElementById('photos-circle');
var ideasCircle = document.getElementById('ideas-circle');
var projectsButton = document.getElementById('projects-button');
var aboutButton = document.getElementById('about-button');
var photosButton = document.getElementById('photos-button');
var ideasButton = document.getElementById('ideas-button');
var button = document.getElementById('projects-button');
var page = document.getElementById('starting-page');
var projectLinks = document.getElementsByClassName('project-link');
var modal = document.getElementById('modal');
var modalBody = document.getElementById('modal-body');
var projectBlurbs = document.getElementsByClassName('project-blurb');
var closeButton = document.getElementById('close');
var nextButton = document.getElementById('next');
var previousButton = document.getElementById('previous');
var videoPlayers = document.getElementsByClassName('video-player');
var videos = document.getElementsByTagName('video');
var childExpandables = document.getElementsByClassName('expand-small');
var parentExpandables = document.getElementsByClassName('expand-large');
var sections = document.getElementsByTagName('section');
var projectsPageLink = document.getElementById('projects-page-link');
var profileLink = document.getElementById('profile-link');
var accountLink = document.getElementById('account-link');
var signInLink = document.getElementById('sign-in-link');
if (window.location.hostname == 'crystalprism.io') {
  var server = 'http://13.58.175.191/api';
} else {
  var server = 'http://localhost:5000/api';
}
var requestStart = 0;
var requestEnd = 10;
var ideasPage = document.getElementById('ideas-page');
var errorMessage = '';

// Define events
themeButton.onclick = changeTheme;
projectsCircle.onclick = displayPage;
aboutCircle.onclick = displayPage;
photosCircle.onclick = displayPage;
ideasCircle.onclick = displayPage;
projectsButton.onclick = displayPage;
aboutButton.onclick = displayPage;
photosButton.onclick = displayPage;
ideasButton.onclick = displayPage;
modal.onclick = closeInfo;
nextButton.onclick = toggleNext;
previousButton.onclick = togglePrevious;
closeButton.onclick = closeInfo;
projectsPageLink.onclick = displayPage;

if (localStorage.getItem('theme') == 'night' || now >= 0 && now <= 6 && localStorage.getItem('theme') != 'day' || now >= 20 && now <= 23 && localStorage.getItem('theme') != 'day') {
  document.body.classList.add('night-view');
  skyIcon.classList.remove('ion-ios-moon-outline');
  skyIcon.classList.add('ion-ios-sunny');
  themeButton.innerHTML = 'Day View';
  localStorage.setItem('theme', 'night');
}

for (var i = 0; i < projectLinks.length; i++) {
  projectLinks[i].addEventListener('click', openInfo, false);
}

for (var i = 0; i < videoPlayers.length; i++) {
  videoPlayers[i].addEventListener('click', toggleVideo, false);
}

for (var i = 0; i < videos.length; i++) {
  videos[i].addEventListener('ended', toggleControlIcon, false);
}

window.addEventListener('keyup', function(e) {
  if (modal.classList.contains('open') && e.key == 'ArrowRight') {
    e.preventDefault();
    nextButton.click();
  } else if (modal.classList.contains('open') && e.key == 'ArrowLeft') {
    e.preventDefault();
    previousButton.click();
  }
});

for (var i = 0; i < childExpandables.length; i++) {
  childExpandables[i].addEventListener('click', expandSection, false);
}

for (var i = 0; i < parentExpandables.length; i++) {
  parentExpandables[i].addEventListener('click', expandSection, false);
}

// Define functions
function checkAccountStatus() {
  return fetch(server + '/user/verify', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('cptoken')},
    method: 'GET',
  }).then(function (response) {
    if (response.ok) {
      profileLink.innerHTML = localStorage.getItem('cpusername');
      profileLink.href = 'user/index.html?username=' + localStorage.getItem('cpusername');
      accountLink.innerHTML = 'My Account';
      accountLink.href = 'user/my-account/index.html';
      signInLink.innerHTML = 'Sign Out';
      signInLink.onclick = function() {
        sessionStorage.setItem('cprequest', 'logout');
      }
    } else {
      localStorage.removeItem('cpusername');
      localStorage.removeItem('cptoken');
      accountLink.innerHTML = 'Create Account';
      signInLink.innerHTML = 'Sign In';
    }
  })
}

function getEntries() {
  return fetch(server + '/thought-writer/entries/esther?start=' + requestStart + '&end=' + requestEnd).catch(function (error) {
    if (errorMessage == '') {
      errorMessage = document.createElement('text');
      errorMessage.id = 'error-message';
      errorMessage.innerHTML = 'There was an error loading the Ideas page. Please refresh.';
      ideasPage.append(errorMessage);
    }
  }).then(function (response) {
    if (response.ok) {
      response.json().then(function (entries) {
        if (entries.length != 0) {
          for (var i = 0; i < entries.length; i++) {
            var entry = document.createElement('table');
            entry.classList.add('entry');
            var headerRow = document.createElement('tr');
            headerRow.classList.add('header-row');
            var entryName = document.createElement('td');
            entryName.classList.add('entry-name');
            entryName.innerHTML = entries[i].name;
            var entryDate = document.createElement('td');
            entryDate.classList.add('entry-date');
            entryDate.innerHTML = entries[i].date + ', ' + entries[i].time;
            var contentRow = document.createElement('tr');
            var entryContentArea = document.createElement('td');
            entryContentArea.classList.add('entry-content-area');
            entryContentArea.colSpan = '3';
            var entryContent = document.createElement('div');
            entryContent.classList.add('entry-content');
            entryContent.id = entries[i].name;
            if (entries[i].content.length >= 200) {
              entryContent.dataset.fulltext = entries[i].content;
              entryContent.innerHTML = entries[i].content.slice(0, 200) + '...';
              var showTextButton = document.createElement('button');
              showTextButton.classList.add('show-full-text');
              showTextButton.dataset.entry = entries[i].name;
              showTextButton.innerHTML = '<i class="fa fa-plus-square-o" aria-hidden="true"></i>';
              showTextButton.addEventListener('click', showFullText, false);
              entryContent.appendChild(showTextButton);
            } else {
              entryContent.innerHTML = entries[i].content.slice(0, 200);
            }
            ideasPage.appendChild(entry);
            entry.appendChild(headerRow);
            headerRow.appendChild(entryName);
            headerRow.appendChild(entryDate);
            entry.appendChild(contentRow);
            contentRow.appendChild(entryContentArea);
            entryContentArea.appendChild(entryContent);
          }
        }
      })
    } else {
      errorMessage = document.createElement('text');
      errorMessage.id = 'error-message';
      errorMessage.innerHTML = 'There are no posts to display. Please check later.';
      ideasPage.append(errorMessage);
    }
  })
}

function showFullText() {
  if (this.innerHTML == '<i class="fa fa-plus-square-o" aria-hidden="true"></i>') {
    this.innerHTML = '<i class="fa fa-minus-square-o" aria-hidden="true"></i>';
    var entryToDisplay = document.getElementById(this.dataset.entry);
    entryToDisplay.innerHTML = entryToDisplay.dataset.fulltext;
    entryToDisplay.appendChild(this);
  } else {
    this.innerHTML = '<i class="fa fa-plus-square-o" aria-hidden="true"></i>';
    var entryToDisplay = document.getElementById(this.dataset.entry);
    entryToDisplay.innerHTML = entryToDisplay.dataset.fulltext.slice(0, 200) + '...';
    entryToDisplay.appendChild(this);
  }
}

function changeTheme() {
  if (localStorage.getItem('theme') == 'night') {
    document.body.classList.remove('night-view');
    skyIcon.classList.remove('ion-ios-sunny');
    skyIcon.classList.add('ion-ios-moon-outline');
    themeButton.innerHTML = 'Night View';
    localStorage.setItem('theme', 'day');
  } else {
    document.body.classList.add('night-view');
    skyIcon.classList.remove('ion-ios-moon-outline');
    skyIcon.classList.add('ion-ios-sunny');
    themeButton.innerHTML = 'Day View';
    localStorage.setItem('theme', 'night');
  }
}

function displayPage(e) {
  page.classList.add('hidden');
  if (page.id == 'starting-page') {
    document.getElementById('page-buttons').classList.remove('hidden');
    document.getElementById('diamond-small').classList.remove('hidden');
  }
  if (page.id == 'about-page') {
    for (var i = 0; i < childExpandables.length; i++) {
      childExpandables[i].getElementsByTagName('span')[0].classList.remove('fa-chevron-down');
      childExpandables[i].getElementsByTagName('span')[0].classList.add('fa-chevron-right');
      childExpandables[i].dataset.expanded = 'No';
    }
    for (var j = 0; j < sections.length; j++) {
      sections[j].style.visibility = 'hidden';
      sections[j].style.height = '0px';
    }
    for (var k = 0; k < parentExpandables.length; k++) {
      parentExpandables[k].getElementsByTagName('span')[0].classList.remove('fa-chevron-down');
      parentExpandables[k].getElementsByTagName('span')[0].classList.add('fa-chevron-right');
      parentExpandables[k].dataset.expanded = 'No';
    }
  }
  button.classList.remove('selected');
  button.style.color = '';
  page = document.getElementById(e.target.dataset.page);
  page.classList.remove('hidden');
  button = document.getElementById(e.target.dataset.button);
  button.classList.add('selected');
  button.style.color = button.dataset.color;
}

function openInfo() {
  for (var i = 0; i < projectLinks.length; i++) {
    projectLinks[i].dataset.open = 'false';
    projectBlurbs[i].classList.remove('open');
  }
  document.getElementById('homepage').classList.add('grayscale');
  document.getElementById('page-buttons').classList.add('grayscale');
  document.getElementById('projects-page').classList.add('grayscale');
  modal.classList.remove('hidden');
  closeButton.classList.remove('hidden');
  previousButton.classList.remove('hidden');
  nextButton.classList.remove('hidden');
  modal.classList.add('open');
  modalBody.classList.add('open');
  document.getElementById(this.dataset.project + '-blurb').classList.add('open');
  this.dataset.open = 'true';
}

function closeInfo(e) {
  if (e.target == this || this.tagName.toLowerCase() == 'button') {
    for (var i = 0; i < projectLinks.length; i++) {
      projectLinks[i].dataset.open = 'false';
      projectBlurbs[i].classList.remove('open');
    }
    document.getElementById('homepage').classList.remove('grayscale');
    document.getElementById('page-buttons').classList.remove('grayscale');
    document.getElementById('projects-page').classList.remove('grayscale');
    modalBody.classList.remove('open');
    modal.classList.remove('open');
    setTimeout(function() {
      modal.classList.add('hidden');
      closeButton.classList.add('hidden');
      previousButton.classList.add('hidden');
      nextButton.classList.add('hidden');
    }, 1000);
  }
}

function toggleNext() {
  for (var i = 0; i < projectLinks.length; i++) {
    if (projectLinks[i] == document.querySelector('[data-open=true]')) {
      var currentProjectNumber = i;
    }
  }
  for (var i = 0; i < projectLinks.length; i++) {
    projectLinks[i].dataset.open = 'false';
    projectBlurbs[i].classList.remove('open');
  }
  if (currentProjectNumber == projectLinks.length - 1) {
    projectLinks[0].dataset.open = 'true';
    projectBlurbs[0].classList.add('open');
  } else {
    projectLinks[currentProjectNumber + 1].dataset.open = 'true';
    projectBlurbs[currentProjectNumber + 1].classList.add('open');
  }
}

function togglePrevious() {
  for (var i = 0; i < projectLinks.length; i++) {
    if (projectLinks[i] == document.querySelector('[data-open=true]')) {
      var currentProjectNumber = i;
    }
  }
  for (var i = 0; i < projectLinks.length; i++) {
    projectLinks[i].dataset.open = 'false';
    projectBlurbs[i].classList.remove('open');
  }
  if (currentProjectNumber == 0) {
    projectLinks[projectLinks.length - 1].dataset.open = 'true';
    projectBlurbs[projectLinks.length - 1].classList.add('open');
  } else {
    projectLinks[currentProjectNumber - 1].dataset.open = 'true';
    projectBlurbs[currentProjectNumber - 1].classList.add('open');
  }
}

function toggleVideo() {
  var video = document.getElementById(this.dataset.project + '-video');
  var control = document.getElementById(this.dataset.project + '-control');
  if (video.paused || video.ended) {
    control.classList.remove('fa-play');
    control.classList.add('fa-pause');
    control.classList.add('playing');
    video.classList.add('playing');
    video.play();
  } else {
    control.classList.add('fa-play');
    control.classList.remove('fa-pause');
    control.classList.remove('playing');
    video.classList.remove('playing');
    video.pause();
  }
}

function toggleControlIcon() {
  var control = document.getElementById(this.dataset.project + '-control');
  control.classList.remove('fa-pause');
  control.classList.add('fa-play');
  control.classList.remove('playing');
  this.classList.remove('playing');
}

function expandSection() {
  if (this.classList.contains('expand-small')) {
    siblingExpandables = document.querySelectorAll('[data-expandparent="' + this.dataset.expandparent + '"]');
  }
  if (this.dataset.expanded == 'Yes') {
    this.getElementsByTagName('span')[0].classList.remove('fa-chevron-down');
    this.getElementsByTagName('span')[0].classList.add('fa-chevron-right');
    for (j = parseInt(this.dataset.expandstart); j < parseInt(this.dataset.expandend); j++) {
      sections[j].style.visibility = 'hidden';
      sections[j].style.height = '0px';
      childExpandables[j].getElementsByTagName('span')[0].classList.remove('fa-chevron-down');
      childExpandables[j].getElementsByTagName('span')[0].classList.add('fa-chevron-right');
      childExpandables[j].dataset.expanded = 'No';
    }
    this.dataset.expanded = 'No';
  } else {
    this.getElementsByTagName('span')[0].classList.remove('fa-chevron-right');
    this.getElementsByTagName('span')[0].classList.add('fa-chevron-down');
    for (j = parseInt(this.dataset.expandstart); j < parseInt(this.dataset.expandend); j++) {
      sections[j].style.visibility = 'visible';
      sections[j].style.height = 'inherit';
      childExpandables[j].getElementsByTagName('span')[0].classList.remove('fa-chevron-right');
      childExpandables[j].getElementsByTagName('span')[0].classList.add('fa-chevron-down');
      childExpandables[j].dataset.expanded = 'Yes';
    }
    this.dataset.expanded = 'Yes';
  }
  if (this.dataset.expanded == 'Yes' && this.classList.contains('expand-small') && expanded(siblingExpandables) && parentExpandables[this.dataset.expandparent].dataset.expanded == 'No') {
    parentExpandables[this.dataset.expandparent].getElementsByTagName('span')[0].classList.remove('fa-chevron-right');
    parentExpandables[this.dataset.expandparent].getElementsByTagName('span')[0].classList.add('fa-chevron-down');
    parentExpandables[this.dataset.expandparent].dataset.expanded = 'Yes';
  }
  if (this.dataset.expanded == 'No' && this.classList.contains('expand-small') && !expanded(siblingExpandables) && parentExpandables[this.dataset.expandparent].dataset.expanded == 'Yes') {
    parentExpandables[this.dataset.expandparent].getElementsByTagName('span')[0].classList.remove('fa-chevron-down');
    parentExpandables[this.dataset.expandparent].getElementsByTagName('span')[0].classList.add('fa-chevron-right');
    parentExpandables[this.dataset.expandparent].dataset.expanded = 'No';
  }
}

function expanded(siblings) {
  var expanded = 0;
  for (var i = 0; i < siblings.length; i++) {
    if (siblings[i].dataset.expanded == 'Yes') {
      expanded = expanded + 1;
    }
  }
  if (expanded == siblings.length) {
    return true;
  } else {
    return false;
  }
}
