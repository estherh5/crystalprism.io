// Define variables
var aboutButton = document.getElementById('about-button');
var projectsButton = document.getElementById('projects-button');
var page = document.getElementById('projects-page');
var button = projectsButton;
var expandableSmallChevrons = document.getElementsByClassName('expand-small');
var expandableLargeChevrons = document.getElementsByClassName('expand-large');
var expandableSections = document.getElementsByClassName('section');

// Define events
aboutButton.onclick = displayPage;
projectsButton.onclick = displayPage;

for (var i = 0; i < expandableSmallChevrons.length; i++) {
  expandableSmallChevrons[i].addEventListener('click', expandSection, false);
}

for (var i = 0; i < expandableLargeChevrons.length; i++) {
  expandableLargeChevrons[i].addEventListener('click', expandSection, false);
}

// Define functions
function displayPage(e) {
  page.classList.add('hidden');
  if (page.id == 'about-page') {
    for (var i = 0; i < expandableSmallChevrons.length; i++) {
      expandableSmallChevrons[i].getElementsByTagName('span')[0].classList.remove('fa-chevron-down');
      expandableSmallChevrons[i].getElementsByTagName('span')[0].classList.add('fa-chevron-right');
      expandableSmallChevrons[i].dataset.expanded = 'No';
    }
    for (var j = 0; j < expandableSections.length; j++) {
      expandableSections[j].style.visibility = 'hidden';
      expandableSections[j].style.height = '0px';
    }
    for (var k = 0; k < expandableLargeChevrons.length; k++) {
      expandableLargeChevrons[k].getElementsByTagName('span')[0].classList.remove('fa-chevron-down');
      expandableLargeChevrons[k].getElementsByTagName('span')[0].classList.add('fa-chevron-right');
      expandableLargeChevrons[k].dataset.expanded = 'No';
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
    siblingChevrons = document.querySelectorAll('[data-expandparent="' + this.dataset.expandparent + '"]');
  }
  if (this.dataset.expanded == 'Yes') {
    this.getElementsByTagName('span')[0].classList.remove('fa-chevron-down');
    this.getElementsByTagName('span')[0].classList.add('fa-chevron-right');
    for (j = parseInt(this.dataset.expandstart); j < parseInt(this.dataset.expandend); j++) {
      expandableSections[j].style.visibility = 'hidden';
      expandableSections[j].style.height = '0px';
      expandableSmallChevrons[j].getElementsByTagName('span')[0].classList.remove('fa-chevron-down');
      expandableSmallChevrons[j].getElementsByTagName('span')[0].classList.add('fa-chevron-right');
      expandableSmallChevrons[j].dataset.expanded = 'No';
    }
    this.dataset.expanded = 'No';
  } else {
    this.getElementsByTagName('span')[0].classList.remove('fa-chevron-right');
    this.getElementsByTagName('span')[0].classList.add('fa-chevron-down');
    for (j = parseInt(this.dataset.expandstart); j < parseInt(this.dataset.expandend); j++) {
      expandableSections[j].style.visibility = 'visible';
      expandableSections[j].style.height = 'inherit';
      expandableSmallChevrons[j].getElementsByTagName('span')[0].classList.remove('fa-chevron-right');
      expandableSmallChevrons[j].getElementsByTagName('span')[0].classList.add('fa-chevron-down');
      expandableSmallChevrons[j].dataset.expanded = 'Yes';
    }
    this.dataset.expanded = 'Yes';
  }
  if (this.dataset.expanded == 'Yes' && this.classList.contains('expand-small') && expandableLargeChevrons[this.dataset.expandparent].dataset.expanded == 'No') {
    expandableLargeChevrons[this.dataset.expandparent].getElementsByTagName('span')[0].classList.remove('fa-chevron-right');
    expandableLargeChevrons[this.dataset.expandparent].getElementsByTagName('span')[0].classList.add('fa-chevron-down');
    expandableLargeChevrons[this.dataset.expandparent].dataset.expanded = 'Yes';
  }
  if (this.dataset.expanded == 'No' && this.classList.contains('expand-small') && notExpanded(siblingChevrons) && expandableLargeChevrons[this.dataset.expandparent].dataset.expanded == 'Yes') {
    expandableLargeChevrons[this.dataset.expandparent].getElementsByTagName('span')[0].classList.remove('fa-chevron-down');
    expandableLargeChevrons[this.dataset.expandparent].getElementsByTagName('span')[0].classList.add('fa-chevron-right');
    expandableLargeChevrons[this.dataset.expandparent].dataset.expanded = 'No';
  }
}

function notExpanded(object) {
  var noneExpanded = 0;
  for (var i = 0; i < object.length; i++) {
    if (object[i].dataset.expanded == 'No') {
      noneExpanded = noneExpanded + 1;
    }
  }
  if (noneExpanded == object.length) {
    return true;
  } else {
    return false;
  }
}
