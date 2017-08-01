// Define variables
var projectsCircle = document.getElementById('projects-circle');
var aboutCircle = document.getElementById('about-circle');
var projectsButton = document.getElementById('projects-button');
var aboutButton = document.getElementById('about-button');
var button = document.getElementById('projects-button');
var page = document.getElementById('starting-page');
var childExpandables = document.getElementsByClassName('expand-small');
var parentExpandables = document.getElementsByClassName('expand-large');
var sections = document.getElementsByTagName('section');

// Define events
projectsCircle.onclick = displayPage;
aboutCircle.onclick = displayPage;
projectsButton.onclick = displayPage;
aboutButton.onclick = displayPage;

for (var i = 0; i < childExpandables.length; i++) {
  childExpandables[i].addEventListener('click', expandSection, false);
}

for (var i = 0; i < parentExpandables.length; i++) {
  parentExpandables[i].addEventListener('click', expandSection, false);
}

// Define functions
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
  page = document.getElementById(e.target.dataset.page);
  page.classList.remove('hidden');
  button = document.getElementById(e.target.dataset.button);
  button.classList.add('selected');
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
  if (this.dataset.expanded == 'Yes' && this.classList.contains('expand-small') && parentExpandables[this.dataset.expandparent].dataset.expanded == 'No') {
    parentExpandables[this.dataset.expandparent].getElementsByTagName('span')[0].classList.remove('fa-chevron-right');
    parentExpandables[this.dataset.expandparent].getElementsByTagName('span')[0].classList.add('fa-chevron-down');
    parentExpandables[this.dataset.expandparent].dataset.expanded = 'Yes';
  }
  if (this.dataset.expanded == 'No' && this.classList.contains('expand-small') && notExpanded(siblingExpandables) && parentExpandables[this.dataset.expandparent].dataset.expanded == 'Yes') {
    parentExpandables[this.dataset.expandparent].getElementsByTagName('span')[0].classList.remove('fa-chevron-down');
    parentExpandables[this.dataset.expandparent].getElementsByTagName('span')[0].classList.add('fa-chevron-right');
    parentExpandables[this.dataset.expandparent].dataset.expanded = 'No';
  }
}

function notExpanded(siblings) {
  var noneExpanded = 0;
  for (var i = 0; i < siblings.length; i++) {
    if (siblings[i].dataset.expanded == 'No') {
      noneExpanded = noneExpanded + 1;
    }
  }
  if (noneExpanded == siblings.length) {
    return true;
  } else {
    return false;
  }
}
