// Define global variables
var profileLink = document.getElementById('profile-link');
var accountLink = document.getElementById('account-link');
var signInLink = document.getElementById('sign-in-link');
var themeButton = document.getElementById('theme-button');
var skyIcon = document.getElementById('sky-icon');
var navCircles = document.getElementsByClassName('nav-circle');
var navButtons = document.getElementsByClassName('nav-button');
var selectedButton = navButtons[0]; // Variable to track button associated with current page of SPA
var selectedPage = document.getElementById('splash-page'); // Variable to track current page of SPA
var projects = document.getElementsByClassName('project-listing');
var modalBackground = document.getElementById('modal-background');
var modalBody = document.getElementById('modal-body');
var projectOverviews = document.getElementsByClassName('project-overview');
var closeButton = document.getElementById('close');
var nextButton = document.getElementById('next');
var previousButton = document.getElementById('previous');
var videoContainers = document.getElementsByClassName('video-container');
var videos = document.getElementsByTagName('video');
var parentSections = document.getElementsByClassName('expand-parent');
var childSections = document.getElementsByClassName('expand-child');
var sectionDetails = document.getElementsByClassName('subsection-details');


// Define load functions
window.onload = function() {
  // Check if user is logged in (from common.js script)
  checkIfLoggedIn();
  // Set page theme to night view or Day View
  setTheme();
  // Toggle page if page URL has hash
  if (window.location.hash) {
    togglePage();
  }
  // Load posts to Ideas page
  loadPosts();
  // Add inverse color class to SVG icons in Projects page modal
  for (var i = 0; i < document.getElementsByClassName('modal-object').length; i++) {
    document.getElementsByClassName('modal-object')[i].contentDocument
    .getElementsByTagName('svg')[0].classList.add('inverse');
  }
  return;
}


// Set page theme to night view or Day View when page is loaded or theme button is clicked
themeButton.onclick = setTheme;

function setTheme() {
  // Change view to opposite of current view if theme button is clicked
  if (this == themeButton) {
    if (sessionStorage.getItem('theme') == 'night') {
      removeNightView();
      return;
    }
    addNightView();
    return;
  }
  // On load, set theme based on sessionStorage item if it exists
  if (sessionStorage.getItem('theme') == 'night') {
    addNightView();
    return;
  } else if (sessionStorage.getItem('theme') == 'day') {
    removeNightView();
    return;
  }
  // Set theme based on current time if no sessionStorage items
  var now = new Date().getHours();
  // Add night view if it is between 8 PM and 6 AM
  if (now >= 20 && now <= 23 || now >= 0 && now <= 6) {
    addNightView();
    return;
  }
  // Remove night view otherwise
  removeNightView();
  return;
}

// Set page theme to night view
function addNightView() {
  document.body.classList.add('night-view');
  // Add night view class to SVG icons loaded in objects
  for (var i = 0; i < document.getElementsByClassName('svg-icon-object').length; i++) {
    document.getElementsByClassName('svg-icon-object')[i].contentDocument
    .getElementsByTagName('svg')[0].classList.add('night-view');
  }
  // Set sky icon to a sun shape for day view setting
  skyIcon.classList.remove('ion-ios-moon-outline');
  skyIcon.classList.add('ion-ios-sunny');
  themeButton.innerHTML = 'Day View';
  sessionStorage.setItem('theme', 'night');
  return;
}

// Remove night view as page theme
function removeNightView() {
  document.body.classList.remove('night-view');
  // Remove night view class to SVG icons loaded in objects
  for (var i = 0; i < document.getElementsByClassName('svg-icon-object').length; i++) {
    document.getElementsByClassName('svg-icon-object')[i].contentDocument
    .getElementsByTagName('svg')[0].classList.remove('night-view');
  }
  // Set sky icon to a moon shape for night view setting
  skyIcon.classList.remove('ion-ios-sunny');
  skyIcon.classList.add('ion-ios-moon-outline');
  themeButton.innerHTML = 'Night View';
  sessionStorage.setItem('theme', 'day');
  return;
}


// Set requested page as URL hash when menu circles or buttons are clicked
for (var i = 0; i < navCircles.length; i++) {
  navCircles[i].addEventListener('click', function() {
    window.location.hash = this.dataset.page;
    return;
  }, false);
  navButtons[i].addEventListener('click', function() {
    window.location.hash = this.dataset.page;
    return;
  }, false);
}

// Set Projects page as URL hash when Projects page link is clicked from About page
document.getElementById('projects-page-link').onclick = function() {
  window.location.hash = this.dataset.page;
  return;
}

// Display requested page when window's URL hash changes (when navigating pages in SPA) and track via Google Analytics
window.onhashchange = function() {
  // Set Google Analytics page to [page URL]/[hash string]
  ga('set', 'page', '/' + (window.location.hash.split('#')[1]));
  ga('send', 'pageview');
  // Display requested page
  togglePage();
  return;
}

// Toggle page of SPA that is displayed
function togglePage() {
  // Hide page that user is navigating away from
  selectedPage.classList.add('hidden');
  // Unhide page header if navigating away from splash page
  if (selectedPage.id == 'splash-page') {
    document.getElementById('front-page-icon').classList.remove('hidden');
    document.getElementById('nav-buttons').classList.remove('hidden');
  }
  // Display page specified in page URL hash
  selectedPage = document.getElementById((window.location.hash).split('#')[1]);
  selectedPage.classList.remove('hidden');
  // Remove bold/color style of button for the previous page
  selectedButton.classList.remove('selected');
  selectedButton.style.color = '';
  // Add bold/color style of button for the requested page
  selectedButton = document.getElementById((window.location.hash).split('#')[1] + '-button');
  selectedButton.classList.add('selected');
  selectedButton.style.color = selectedButton.dataset.color;
  return;
}


// Open project modal when project is clicked from Projects page
for (var i = 0; i < projects.length; i++) {
  projects[i].addEventListener('click', openModal, false);
}

function openModal() {
  // Add grayscale style to elements behind modal
  document.getElementById('front-page-link').classList.add('grayscale');
  document.getElementById('nav-buttons').classList.add('grayscale');
  document.getElementById('projects-page').classList.add('grayscale');
  // Unhide modal and its control buttons
  modalBackground.classList.remove('hidden');
  closeButton.classList.remove('hidden');
  previousButton.classList.remove('hidden');
  nextButton.classList.remove('hidden');
  modalBackground.classList.add('open');
  modalBody.classList.add('open');
  // Display project overview for the project the user clicked to open modal
  document.getElementById(this.dataset.project + '-overview').classList.add('open');
  this.dataset.displayed = 'true';
  return;
}

// Display next/previous project in modal when next/previous buttons are clicked
nextButton.onclick = toggleProject;
previousButton.onclick = toggleProject;

function toggleProject() {
  // Get index of and hide project currently being displayed
  for (var i = 0; i < projects.length; i++) {
    if (projects[i] == document.querySelector('[data-displayed="true"]')) {
      var currentProjectNumber = i;
      projects[i].dataset.displayed = 'false';
      projectOverviews[i].classList.remove('open');
    }
  }
  if (this == nextButton) {
    // If current project displayed is the last project in the list of projects, display first project when next button is clicked
    if (currentProjectNumber == projects.length - 1) {
      projects[0].dataset.displayed = 'true';
      projectOverviews[0].classList.add('open');
      return;
    }
    // Display next project (current index + 1) otherwise
    projects[currentProjectNumber + 1].dataset.displayed = 'true';
    projectOverviews[currentProjectNumber + 1].classList.add('open');
    return;
  }
  // If current project displayed is the first project in the list of projects, display last project when previous button is clicked
  if (currentProjectNumber == 0) {
    projects[projects.length - 1].dataset.displayed = 'true';
    projectOverviews[projects.length - 1].classList.add('open');
    return;
  }
  // Display previous project (current index - 1) otherwise
  projects[currentProjectNumber - 1].dataset.displayed = 'true';
  projectOverviews[currentProjectNumber - 1].classList.add('open');
  return;
}

// Toggle video play/pause state when video is clicked in modal
for (var i = 0; i < videoContainers.length; i++) {
  videoContainers[i].addEventListener('click', toggleVideo, false);
}

function toggleVideo() {
  var video = document.getElementById(this.dataset.project + '-video');
  var control = document.getElementById(this.dataset.project + '-control');
  // If video is paused or over, change to play state when clicked
  if (video.paused || video.ended) {
    control.classList.remove('fa-play');
    control.classList.add('fa-pause');
    control.classList.add('playing');
    video.classList.add('playing');
    video.play();
    return;
  }
  // Set video to pause state otherwise
  control.classList.add('fa-play');
  control.classList.remove('fa-pause');
  control.classList.remove('playing');
  video.classList.remove('playing');
  video.pause();
  return;
}

// Return video control icon to starting state (play button) when video ends
for (var i = 0; i < videos.length; i++) {
  videos[i].addEventListener('ended', resetVideoControl, false);
}

function resetVideoControl() {
  var control = document.getElementById(this.dataset.project + '-control');
  control.classList.remove('fa-pause');
  control.classList.add('fa-play');
  control.classList.remove('playing');
  this.classList.remove('playing');
  return;
}

// Close modal when modal background is clicked or when close button is clicked
modalBackground.onclick = function(e) {
  if (e.target == this) {
    closeModal();
  }
  return;
}

closeButton.onclick = closeModal;

function closeModal() {
  // Hide project being displayed in modal
  for (var i = 0; i < projects.length; i++) {
    if (projects[i].dataset.displayed == 'true') {
      projects[i].dataset.displayed = 'false';
      projectOverviews[i].classList.remove('open');
    }
  }
  // Remove grayscale style for elements behind modal
  document.getElementById('front-page-link').classList.remove('grayscale');
  document.getElementById('nav-buttons').classList.remove('grayscale');
  document.getElementById('projects-page').classList.remove('grayscale');
  // Remove open class so modal fades out
  modalBody.classList.remove('open');
  modalBackground.classList.remove('open');
  // Hide modal from screen after fade out
  setTimeout(function() {
    modalBackground.classList.add('hidden');
    closeButton.classList.add('hidden');
    previousButton.classList.add('hidden');
    nextButton.classList.add('hidden');
  }, 1000);
  return;
}

// Define keyboard shortcuts for modal controls
window.addEventListener('keydown', function(e) {
  // Click next button when modal is open and right arrow is clicked
  if (modalBackground.classList.contains('open') && e.key == 'ArrowRight') {
    e.preventDefault();
    nextButton.click();
    return;
  // Click previous button when modal is open and left arrow is clicked
  } else if (modalBackground.classList.contains('open') && e.key == 'ArrowLeft') {
    e.preventDefault();
    previousButton.click();
    return;
  // Click displayed video to toggle video play state when modal is open and space key is clicked
  } else if (modalBackground.classList.contains('open') && e.keyCode == 32) {
    e.preventDefault();
    for (var i = 0; i < projectOverviews.length; i++) {
      if (projectOverviews[i].classList.contains('open')) {
        projectOverviews[i].getElementsByClassName('video-container')[0].click();
      }
    }
    return;
  // Close modal when modal is open and escape key is clicked
  } else if (modalBackground.classList.contains('open') && e.keyCode == 27) {
    e.preventDefault();
    closeModal();
    return;
  }
  return;
}, false);


// Load Thought Writer posts written by Esther to Ideas page
function loadPosts() {
  // Determine server based on window location
  if (window.location.hostname == 'crystalprism.io') {
    var server = 'http://13.58.175.191/api';
  } else {
    var server = 'http://localhost:5000/api';
  }
  return fetch(server + '/thought-writer/post-board/esther').catch(function(error) {
    // Display error if server is down
    var errorMessage = document.createElement('text');
    errorMessage.id = 'error-message';
    errorMessage.innerHTML = 'There was an error loading the Ideas page. Please refresh the page.';
    document.getElementById('ideas-page').append(errorMessage);
    return;
  }).then(function(response) {
    if (response.ok) {
      response.json().then(function(posts) {
        // Add post(s) to Ideas page if there is at least one post sent from server
        if (posts.length != 0) {
          for (var i = 0; i < posts.length; i++) {
            // Create table for post header and body rows
            var post = document.createElement('table');
            post.classList.add('post');
            // Create header row to display post title and timestamp in cells
            var postHeader = document.createElement('tr');
            postHeader.classList.add('post-header');
            var postTitle = document.createElement('td');
            postTitle.classList.add('post-title');
            postTitle.innerHTML = posts[i].title;
            var postTimestamp = document.createElement('td');
            postTimestamp.classList.add('post-timestamp');
            // Convert UTC timestamp from server to local timestamp in 'MM/DD/YYYY, HH:MM AM/PM' format
            var dateTime = new Date(posts[i].timestamp);
            postTimestamp.innerHTML = dateTime.toLocaleString().replace(/:\d{2}\s/,' ');
            // Create body row with post content in cell
            var postBody = document.createElement('tr');
            var postContainer = document.createElement('td');
            postContainer.classList.add('post-container');
            postContainer.colSpan = '3';
            var postContent = document.createElement('div');
            postContent.classList.add('post-content');
            postContent.id = posts[i].title;
            // Display preview of post if >= 200 characters
            if (posts[i].content.length >= 200) {
              // Store full text in data-fulltext attribute to load if user expands preview
              postContent.dataset.fulltext = posts[i].content;
              postContent.innerHTML = posts[i].content.slice(0, 200) + '...';
              var toggleTextIcon = document.createElement('i');
              toggleTextIcon.classList.add('fa');
              toggleTextIcon.classList.add('fa-plus-square-o');
              var toggleTextButton = document.createElement('button');
              toggleTextButton.classList.add('toggle-full-text');
              toggleTextButton.dataset.post = posts[i].title;
              toggleTextButton.append(toggleTextIcon);
              // Toggle full post text if user clicks plus/minus icon
              toggleTextButton.onclick = toggleFullText;
              postContent.append(toggleTextButton);
            }
            // Display full post otherwise
            else {
              postContent.innerHTML = posts[i].content;
            }
            // Add post to Ideas page
            document.getElementById('ideas-page').append(post);
            post.append(postHeader);
            postHeader.append(postTitle);
            postHeader.append(postTimestamp);
            post.append(postBody);
            postBody.append(postContainer);
            postContainer.append(postContent);
          }
        }
      });
      return;
    }
    // Display error message if server returned error
    var errorMessage = document.createElement('text');
    errorMessage.id = 'error-message';
    errorMessage.innerHTML = 'There are no posts to display. Please check later.';
    document.getElementById('ideas-page').append(errorMessage);
    return;
  });
}

// Display/hide full post text if user clicks plus/minus icon for posts with previews
function toggleFullText() {
  // Display full text if plus icon is displayed
  if (this.getElementsByTagName('i')[0].classList.contains('fa-plus-square-o')) {
    this.getElementsByTagName('i')[0].classList.remove('fa-plus-square-o');
    this.getElementsByTagName('i')[0].classList.add('fa-minus-square-o');
    var postToDisplay = document.getElementById(this.dataset.post);
    postToDisplay.innerHTML = postToDisplay.dataset.fulltext;
    postToDisplay.append(this);
    return;
  }
  // Otherwise, hide full text and display preview if minus icon is displayed
  this.getElementsByTagName('i')[0].classList.remove('fa-minus-square-o');
  this.getElementsByTagName('i')[0].classList.add('fa-plus-square-o');
  var postToDisplay = document.getElementById(this.dataset.post);
  postToDisplay.innerHTML = postToDisplay.dataset.fulltext.slice(0, 200) + '...';
  postToDisplay.append(this);
  return;
}


// Expand/collapse parent section or child subsection when chevron is clicked on About page
for (var i = 0; i < parentSections.length; i++) {
  parentSections[i].addEventListener('click', toggleSection, false);
}

for (var i = 0; i < childSections.length; i++) {
  childSections[i].addEventListener('click', toggleSection, false);
}

function toggleSection() {
  if (window.innerWidth >= 768 || (document.documentElement || document.body)
  .clientWidth >= 768) {
    // If section/subsection is already expanded, collapse the section/subsection
    if (this.dataset.expanded == 'true') {
      // Change span icon to expand chevron
      this.getElementsByTagName('span')[0].classList.remove('fa-chevron-down');
      this.getElementsByTagName('span')[0].classList.add('fa-chevron-right');
      // Collapse specified section/subsection (specified by data-start and data-end attributes)
      for (var i = parseInt(this.dataset.start); i < parseInt(this.dataset.end); i++) {
        sectionDetails[i].style.visibility = 'hidden';
        sectionDetails[i].style.height = '0px';
        childSections[i].getElementsByTagName('span')[0].classList.remove('fa-chevron-down');
        childSections[i].getElementsByTagName('span')[0].classList.add('fa-chevron-right');
        childSections[i].dataset.expanded = 'false';
      }
      this.dataset.expanded = 'false';
      if (this.classList.contains('expand-parent')) {
        this.getElementsByTagName('text')[0].innerHTML = 'Expand All';
      }
    // Expand the section/subsection otherwise
    } else {
      // Change span icon to collapse chevron
      this.getElementsByTagName('span')[0].classList.remove('fa-chevron-right');
      this.getElementsByTagName('span')[0].classList.add('fa-chevron-down');
      // Expand specified section/subsection (specified by data-start and data-end attributes)
      for (var i = parseInt(this.dataset.start); i < parseInt(this.dataset.end); i++) {
        sectionDetails[i].style.visibility = 'visible';
        sectionDetails[i].style.height = 'inherit';
        childSections[i].getElementsByTagName('span')[0].classList.remove('fa-chevron-right');
        childSections[i].getElementsByTagName('span')[0].classList.add('fa-chevron-down');
        childSections[i].dataset.expanded = 'true';
      }
      this.dataset.expanded = 'true';
      if (this.classList.contains('expand-parent')) {
        this.getElementsByTagName('text')[0].innerHTML = 'Collapse All';
      }
    }
    // Get sibling subsections if user clicked a child subsection
    if (this.classList.contains('expand-child')) {
      siblingSections = document.querySelectorAll('[data-parent="' + this.dataset.parent + '"]');
    }
    // If child subsection and its siblings are now all expanded from above logic, change the parent section to expanded state
    if (this.dataset.expanded == 'true' && this.classList.contains('expand-child') && areAllExpanded(siblingSections)) {
      parentSections[this.dataset.parent].getElementsByTagName('span')[0].classList
      .remove('fa-chevron-right');
      parentSections[this.dataset.parent].getElementsByTagName('span')[0].classList
      .add('fa-chevron-down');
      parentSections[this.dataset.parent].dataset.expanded = 'true';
      parentSections[this.dataset.parent].getElementsByTagName('text')[0].innerHTML = 'Collapse All';
      return;
    }
    // If child subsection is now collapsed from above logic, change the parent section to collapsed state if it's not already in that state
    if (this.dataset.expanded == 'false' && this.classList.contains('expand-child') && parentSections[this.dataset.parent].dataset.expanded == 'true') {
      parentSections[this.dataset.parent].getElementsByTagName('span')[0].classList
      .remove('fa-chevron-down');
      parentSections[this.dataset.parent].getElementsByTagName('span')[0].classList
      .add('fa-chevron-right');
      parentSections[this.dataset.parent].dataset.expanded = 'false';
      parentSections[this.dataset.parent].getElementsByTagName('text')[0].innerHTML = 'Expand All';
      return;
    }
    return;
  }
}

// Assess if sections in a passed array are all expanded
function areAllExpanded(sections) {
  var numberExpanded = 0;
  // Count number of expanded sections in passed sections array
  for (var i = 0; i < sections.length; i++) {
    if (sections[i].dataset.expanded == 'true') {
      numberExpanded = numberExpanded + 1;
    }
  }
  // If all sections are expanded, return true
  if (numberExpanded == sections.length) {
    return true;
  }
  return false;
}
