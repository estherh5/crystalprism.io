// Define global variables
var themeContainer = document.getElementById('theme-container');
var themeText = document.getElementById('theme-text');
var skyIcon = document.getElementById('sky-icon');
var navCircles = document.getElementsByClassName('nav-circle');
var navButtons = document.getElementsByClassName('nav-button');
var selectedButton = navButtons[0]; // Button associated with current SPA page
var previousPage = document.getElementById('splash-page'); // Last page selected
var selectedPage = document.getElementById('splash-page'); // Current SPA page
var projects = document.getElementsByClassName('project-listing');
var projectOverviews = document.getElementsByClassName('project-overview');
var videoContainers = document.getElementsByClassName('video-container');
var videos = document.getElementsByTagName('video');
var parentSections = document.getElementsByClassName('expand-parent');
var childSections = document.getElementsByClassName('expand-child');
var sectionDetails = document.getElementsByClassName('subsection-details');


// Define load functions
window.onload = function() {
  // Create page header (from common.js script)
  createPageHeader();

  // Create page footer (from common.js script)
  createPageFooter();

  // Check if Crystal Prism API is online (from common.js script)
  pingServer(function() {
    checkIfLoggedIn();

    // Reload photos if user is on Photos page
    if (selectedPage.id == 'photos-page') {
      loadPhotos();
    }

    // Reload posts if user is on Ideas page
    if (selectedPage.id == 'ideas-page') {
      loadPosts();
    }

    return;
  });

  // Check if user is logged in (from common.js script)
  checkIfLoggedIn();

  // Set page theme to night view or Day View
  setTheme();

  // Toggle page if page URL has hash
  if (window.location.hash) {
    togglePage();
  }

  // Otherwise, load splash page
  else {
    document.getElementById('splash-page').classList.remove('hidden');
  }

  return;
}


/* Set page theme to night view or Day View when page is loaded or theme button
is clicked */
themeContainer.onclick = setTheme;

function setTheme() {
  // Change view to opposite of current view if theme button is clicked
  if (this == themeContainer) {
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
  var currentHour = new Date().getHours();

  // Add night view if current time is between 8 PM and 7 AM
  if (currentHour >= 20 && currentHour <= 23 || currentHour >= 0
    && currentHour <= 6) {
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

  // Set sky icon to a sun shape for day view setting
  skyIcon.classList.remove('ion-ios-moon-outline');
  skyIcon.classList.add('ion-ios-sunny');
  themeText.innerHTML = 'Day View';
  sessionStorage.setItem('theme', 'night');

  return;
}


// Remove night view as page theme
function removeNightView() {
  document.body.classList.remove('night-view');

  // Set sky icon to a moon shape for night view setting
  skyIcon.classList.remove('ion-ios-sunny');
  skyIcon.classList.add('ion-ios-moon-outline');
  themeText.innerHTML = 'Night View';
  sessionStorage.setItem('theme', 'day');

  return;
}


// Toggle hover style on splash page menu when user taps menu on touch screen
document.getElementById('menu').addEventListener('touchstart', function(e) {
  if (e.target == this) {
    e.preventDefault();
    if (document.getElementById('menu').classList.contains('hover')) {
      document.getElementById('menu').classList.remove('hover');
      return;
    }
    document.getElementById('menu').classList.add('hover');
    return;
  }
}, false);


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


/* Set Projects page as URL hash when Projects page link is clicked from
About page */
document.getElementById('projects-page-link').onclick = function() {
  window.location.hash = this.dataset.page;
  return;
}


/* Display requested page when window's URL hash changes (when navigating pages
in SPA) and track via Google Analytics */
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
  previousPage.classList.add('fade');

  // Count number of style transitions that occur
  var transitions = 0;

  // Navigate to selected page after previous page style transition ends
  previousPage.addEventListener('transitionend', function changePage() {
    transitions++;

    // Only run navigation function once, after first transition
    if (transitions == 1) {
      previousPage.classList.add('hidden');

      // Unhide page header if navigating away from splash page
      if (selectedPage.id == 'splash-page') {
        document.getElementById('front-page-icon').classList.remove('hidden');
        document.getElementById('nav-buttons').classList.remove('hidden');
      }

      // Display page specified in page URL hash
      selectedPage = document.getElementById((window.location.hash)
        .split('#')[1]);
      selectedPage.classList.remove('hidden');
      selectedPage.classList.remove('fade');

      // Load photos to Photos page if user toggles to this page
      if (selectedPage.id == 'photos-page') {
        loadPhotos();
      }

      // Load posts to Ideas page if user toggles to this page
      if (selectedPage.id == 'ideas-page') {
        loadPosts();
      }

      // Remove bold/color style of button for the previous page
      selectedButton.classList.remove('selected');

      // Add bold/color style of button for the requested page
      selectedButton = document.getElementById((window.location.hash)
        .split('#')[1] + '-button');
      selectedButton.classList.add('selected');

      // Set previous page as currently selected page for future toggling
      previousPage = selectedPage;

      previousPage.removeEventListener('transitionend', changePage, false);
    }

    return;

  }, false);

  return;
}


// Open project modal when project is clicked from Projects page
for (var i = 0; i < projects.length; i++) {
  projects[i].addEventListener('click', function() {
    openModal(this, 'project');
    return;
  }, false);
}

/* Open modal of passed type (e.g., 'project', 'photo') based on item (e.g.,
project on Projects page) clicked */
function openModal(item, type) {
  // Add grayscale style to elements behind modal
  document.getElementById('front-page-link').classList.add('grayscale');
  document.getElementById('nav-buttons').classList.add('grayscale');
  document.getElementById(type + 's-page').classList.add('grayscale');

  // Unhide modal and its control buttons
  document.getElementById(type + '-modal-background').classList
    .remove('hidden');
  document.getElementById(type + '-close').classList.remove('hidden');
  document.getElementById(type + '-previous').classList.remove('hidden');
  document.getElementById(type + '-next').classList.remove('hidden');
  document.getElementById(type + '-modal-background').classList.add('open');
  document.getElementById(type + '-modal-body').classList.add('open');

  // Display project overview for the project the user clicked to open modal
  if (type == 'project') {
    document.getElementById(item.dataset.project + '-overview').classList
      .add('open');
    item.dataset.displayed = 'true';
  }

  /* Display larger version of photo for the photo the user clicked to open
  modal */
  if (type == 'photo') {
    document.getElementById('larger-photo').classList.add('open');
    document.getElementById('larger-photo').src = '#';
    document.getElementById('larger-photo').src = item
      .getElementsByTagName('img')[0].src.replace('-thumb.png', '.png');
    item.dataset.displayed = 'true';
  }

  return;
}


/* Display next/previous project in project modal when next/previous buttons
are clicked */
document.getElementById('project-next').onclick = toggleProject;
document.getElementById('project-previous').onclick = toggleProject;

function toggleProject() {
  // Get index of and hide project currently being displayed
  for (var i = 0; i < projects.length; i++) {
    if (projects[i] == document.querySelector('[data-displayed="true"]')) {
      var currentProjectNumber = i;
      projects[i].dataset.displayed = 'false';
      projectOverviews[i].classList.remove('open');

      // Pause video of currently displayed project
      var video = document.getElementById(projects[i].dataset
          .project + '-video');
      var control = document.getElementById(projects[i].dataset
          .project + '-control');
      control.classList.add('fa-play');
      control.classList.remove('fa-pause');
      control.classList.remove('playing');
      video.classList.remove('playing');
      video.pause();
    }
  }

  if (this.id == 'project-next') {
    /* If current project displayed is the last project in the list of projects,
    display first project when next button is clicked */
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

  /* If current project displayed is the first project in the list of projects,
  display last project when previous button is clicked */
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


/* Display next/previous photo in photo modal when next/previous buttons
are clicked */
document.getElementById('photo-next').onclick = togglePhoto;
document.getElementById('photo-previous').onclick = togglePhoto;

function togglePhoto() {
  var photos = document.getElementsByClassName('photo-listing');

  // Get index of and hide photo currently being displayed
  for (var i = 0; i < photos.length; i++) {
    if (photos[i] == document.querySelector('[data-displayed="true"]')) {
      var currentPhotoNumber = i;
      photos[i].dataset.displayed = 'false';
      document.getElementById('larger-photo').classList.remove('open');
      document.getElementById('larger-photo').src = '#';
    }
  }

  if (this.id == 'photo-next') {
    /* If current photo displayed is the last photo in the list of photos,
    display first photo when next button is clicked */
    if (currentPhotoNumber == photos.length - 1) {
      photos[0].dataset.displayed = 'true';
      document.getElementById('larger-photo').src = photos[0]
        .getElementsByTagName('img')[0].src.replace('-thumb.png', '.png');
      document.getElementById('larger-photo').classList.add('open');
      return;
    }

    // Display next photo (current index + 1) otherwise
    photos[currentPhotoNumber + 1].dataset.displayed = 'true';
    document.getElementById('larger-photo')
      .src = photos[currentPhotoNumber + 1].getElementsByTagName('img')[0].src
      .replace('-thumb.png', '.png');
    document.getElementById('larger-photo').classList.add('open');
    return;
  }

  /* If current photo displayed is the first photo in the list of photos,
  display last photo when previous button is clicked */
  if (currentPhotoNumber == 0) {
    photos[photos.length - 1].dataset.displayed = 'true';
    document.getElementById('larger-photo').src = photos[photos.length - 1]
      .getElementsByTagName('img')[0].src.replace('-thumb.png', '.png');
    document.getElementById('larger-photo').classList.add('open');
    return;
  }

  // Display previous photo (current index - 1) otherwise
  photos[currentPhotoNumber - 1].dataset.displayed = 'true';
  document.getElementById('larger-photo').src = photos[currentPhotoNumber - 1]
    .getElementsByTagName('img')[0].src.replace('-thumb.png', '.png');
  document.getElementById('larger-photo').classList.add('open');

  return;
}


// Close modal when modal background is clicked or when close button is clicked
for (var i = 0; i < document.getElementsByClassName('modal-background').length;
  i++) {
    document.getElementsByClassName('modal-background')[i].addEventListener(
      'click', function(e) {
        if (e.target == this) {
          closeModal(this.id.split('-')[0]);
        }
        return;
      }, false);
  }

for (var i = 0; i < document.getElementsByClassName('close').length; i++) {
  document.getElementsByClassName('close')[i].addEventListener('click',
    function() {
      closeModal(this.id.split('-')[0]);
      return;
    }, false);
}

function closeModal(type) {
  // Hide project being displayed in modal
  if (type == 'project') {
    for (var i = 0; i < projects.length; i++) {
      if (projects[i].dataset.displayed == 'true') {
        projects[i].dataset.displayed = 'false';
        projectOverviews[i].classList.remove('open');
      }
    }
  }

  // Hide photo being displayed in modal
  if (type == 'photo') {
    var photos = document.getElementsByClassName('photo-listing');

    for (var i = 0; i < photos.length; i++) {
      if (photos[i].dataset.displayed == 'true') {
        photos[i].dataset.displayed = 'false';
      }
      document.getElementById('larger-photo').classList.remove('open');
      document.getElementById('larger-photo').src = '#';
    }
  }

  // Remove grayscale style for elements behind modal
  document.getElementById('front-page-link').classList.remove('grayscale');
  document.getElementById('nav-buttons').classList.remove('grayscale');
  document.getElementById(type + 's-page').classList.remove('grayscale');

  // Remove open class so modal fades out
  document.getElementById(type + '-modal-body').classList.remove('open');
  document.getElementById(type + '-modal-background').classList.remove('open');

  // Hide modal from screen after fade out
  document.getElementById(type + '-modal-background')
    .addEventListener('transitionend', function hideModal() {
      document.getElementById(type + '-modal-background').classList
        .add('hidden');
      document.getElementById(type + '-close').classList.add('hidden');
      document.getElementById(type + '-previous').classList.add('hidden');
      document.getElementById(type + '-next').classList.add('hidden');
      document.getElementById(type + '-modal-background')
        .removeEventListener('transitionend', hideModal, false);
    }, false);

  return;
}


// Define keyboard shortcuts for modal controls
window.addEventListener('keydown', function(e) {
  for (var i = 0; i < document.getElementsByClassName('modal-background')
    .length; i++) {
      // Click next button when modal is open and right arrow is clicked
      if (document.getElementsByClassName('modal-background')[i].classList
        .contains('open') && e.key == 'ArrowRight') {
          e.preventDefault();
          document.getElementById(document
            .getElementsByClassName('modal-background')[i].id.split('-')[0] +
            '-next').click();
          return;
        }

      // Click previous button when modal is open and left arrow is clicked
      else if (document.getElementsByClassName('modal-background')[i].classList
        .contains('open') && e.key == 'ArrowLeft') {
          e.preventDefault();
          document.getElementById(document
            .getElementsByClassName('modal-background')[i].id.split('-')[0] +
            '-previous').click();
          return;
        }

      // Close modal when modal is open and escape key is clicked
      else if (document.getElementsByClassName('modal-background')[i].classList
        .contains('open') && e.keyCode == 27) {
          e.preventDefault();
          closeModal(document.getElementsByClassName('modal-background')[i].id
            .split('-')[0]);
          return;
        }

      else if (document.getElementsByClassName('modal-background')[i].classList
        .contains('open') && e.keyCode == 32) {
          e.preventDefault();

          // Click next button when photo modal is open and space key is clicked
          if (document.getElementsByClassName('modal-background')[i]
            .id == 'photo-modal-background') {
              document.getElementById(document
                .getElementsByClassName('modal-background')[i].id
                .split('-')[0] + '-next').click();
              return;
            }

          /* Click displayed video to toggle video play state when project modal
          is open and space key is clicked */
          for (var j = 0; j < projectOverviews.length; j++) {
            if (projectOverviews[j].classList.contains('open')) {
              projectOverviews[j].getElementsByClassName('video-container')[0]
                .click();
            }
          }
          return;
        }
    }

  return;
}, false);


// Load photos from Amazon S3 bucket to Photos page
function loadPhotos() {
  document.getElementById('photos-page').innerHTML = '';

  return fetch(api + '/homepage/photos?start=0&end=20')

    // Display error if server is down
    .catch(function(error) {
      var photosError = document.createElement('text');
      photosError.id = 'photos-error';
      photosError.innerHTML = 'There was an error loading the photos. ' +
        'Please refresh the page.';
      document.getElementById('photos-page').appendChild(photosError);
      return;

    }).then(function(response) {
      if (response.ok) {
        response.json().then(function(s3Photos) {
          /* Add photo(s) to Photos page if there is at least one photo sent
          from server */
          if (s3Photos.length != 0) {
            // Create container for photos list
            var photosList = document.createElement('ul');
            photosList.id = 'photos-list';
            document.getElementById('photos-page').appendChild(photosList);

            for (var i = 0; i < s3Photos.length; i++) {
              if (s3Photos[i].includes('thumb')) {
                // Create containers for photo
                var photoContainer = document.createElement('li');
                var photoListing = document.createElement('div');
                photoListing.classList.add('photo-listing');
                photoListing.dataset.displayed = 'false';

                // Add photo to Photos page
                var photo = document.createElement('img');
                photo.classList.add('photo');
                photo.src = s3Photos[i];
                photoContainer.appendChild(photoListing);
                photoListing.appendChild(photo);
                photosList.appendChild(photoContainer);

                // Open photo modal when photo is clicked from Photos page
                photoListing.addEventListener('click', function() {
                  openModal(this, 'photo');
                  return;
                }, false);

              }
            }
          }
        });

        return;
      }

      // Display error message if server returned error
      var photosError = document.createElement('text');
      photosError.id = 'photos-error';
      photosError.innerHTML = 'There are no photos right now. ' +
        'Please check later.';
      document.getElementById('photos-page').appendChild(photosError);
      return;
    });
}


// Load Thought Writer posts written by Esther to Ideas page
function loadPosts() {
  document.getElementById('ideas-page').innerHTML = '';

  return fetch(api + '/thought-writer/post-board/esther')

    // Display error if server is down
    .catch(function(error) {
      var ideasError = document.createElement('text');
      ideasError.id = 'ideas-error';
      ideasError.innerHTML = 'There was an error loading the Ideas posts. ' +
        'Please refresh the page.';
      document.getElementById('ideas-page').appendChild(ideasError);
      return;

    }).then(function(response) {
      if (response.ok) {
        response.json().then(function(posts) {
          /* Add post(s) to Ideas page if there is at least one post sent
          from server */
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

              /* Convert UTC timestamp from server to local timestamp in
              'MM/DD/YYYY, HH:MM AM/PM' format */
              postTimestamp.innerHTML = moment(posts[i].timestamp)
                .format('MM/DD/YYYY, LT');

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
                /* Store full text in data-fulltext attribute to load if user
                expands preview */
                postContent.dataset.fulltext = posts[i].content;
                postContent.innerHTML = posts[i].content.slice(0, 200) + '...';
                var toggleTextIcon = document.createElement('i');
                toggleTextIcon.classList.add('fa');
                toggleTextIcon.classList.add('fa-plus-square-o');
                var toggleTextButton = document.createElement('button');
                toggleTextButton.classList.add('toggle-full-text');
                toggleTextButton.dataset.post = posts[i].title;
                toggleTextButton.appendChild(toggleTextIcon);

                // Toggle full post text if user clicks plus/minus icon
                toggleTextButton.onclick = toggleFullText;
                postContent.appendChild(toggleTextButton);
              }

              // Display full post otherwise
              else {
                postContent.innerHTML = posts[i].content;
              }

              // Add post to Ideas page
              document.getElementById('ideas-page').appendChild(post);
              post.appendChild(postHeader);
              postHeader.appendChild(postTitle);
              postHeader.appendChild(postTimestamp);
              post.appendChild(postBody);
              postBody.appendChild(postContainer);
              postContainer.appendChild(postContent);
            }
          }
        });

        return;
      }

      // Display error message if server returned error
      var ideasError = document.createElement('text');
      ideasError.id = 'ideas-error';
      ideasError.innerHTML = 'There are no posts right now. ' +
        'Please check later.';
      document.getElementById('ideas-page').appendChild(ideasError);
      return;
    });
}


/* Display/hide full post text if user clicks plus/minus icon for posts with
previews */
function toggleFullText() {
  // Display full text if plus icon is displayed
  if (this.getElementsByTagName('i')[0].classList
    .contains('fa-plus-square-o')) {
      this.getElementsByTagName('i')[0].classList.remove('fa-plus-square-o');
      this.getElementsByTagName('i')[0].classList.add('fa-minus-square-o');
      var postToDisplay = document.getElementById(this.dataset.post);
      postToDisplay.innerHTML = postToDisplay.dataset.fulltext;
      postToDisplay.appendChild(this);
      return;
  }

  // Otherwise, hide full text and display preview if minus icon is displayed
  this.getElementsByTagName('i')[0].classList.remove('fa-minus-square-o');
  this.getElementsByTagName('i')[0].classList.add('fa-plus-square-o');
  var postToDisplay = document.getElementById(this.dataset.post);
  postToDisplay.innerHTML = postToDisplay.dataset.fulltext
    .slice(0, 200) + '...';
  postToDisplay.appendChild(this);
  return;
}


/* Expand/collapse parent section or child subsection when chevron is clicked
on About page */
for (var i = 0; i < parentSections.length; i++) {
  parentSections[i].addEventListener('click', toggleSection, false);
}

for (var i = 0; i < childSections.length; i++) {
  childSections[i].addEventListener('click', toggleSection, false);
}

function toggleSection() {
  if (window.innerWidth >= 768 || (document.documentElement || document.body)
    .clientWidth >= 768) {
      // If section/subsection is already expanded, collapse it
      if (this.dataset.expanded == 'true') {
        // Change span icon to expand chevron
        this.getElementsByTagName('span')[0].classList
          .remove('fa-chevron-down');
        this.getElementsByTagName('span')[0].classList.add('fa-chevron-right');

        /* Collapse specified section/subsection (specified by data-start and
        data-end attributes) */
        for (var i = parseInt(this.dataset.start); i < parseInt(this.dataset
          .end); i++) {
          sectionDetails[i].style.visibility = 'hidden';
          sectionDetails[i].style.height = '0px';
          childSections[i].getElementsByTagName('span')[0].classList
            .remove('fa-chevron-down');
          childSections[i].getElementsByTagName('span')[0].classList
            .add('fa-chevron-right');
          childSections[i].dataset.expanded = 'false';
        }
        this.dataset.expanded = 'false';
        if (this.classList.contains('expand-parent')) {
          this.getElementsByTagName('text')[0].innerHTML = 'Expand All';
        }
      }

      // Expand the section/subsection otherwise
      else {
        // Change span icon to collapse chevron
        this.getElementsByTagName('span')[0].classList
          .remove('fa-chevron-right');
        this.getElementsByTagName('span')[0].classList.add('fa-chevron-down');

        /* Expand specified section/subsection (specified by data-start and
        data-end attributes) */
        for (var i = parseInt(this.dataset.start); i < parseInt(this.dataset
          .end); i++) {
          sectionDetails[i].style.visibility = 'visible';
          sectionDetails[i].style.height = 'inherit';
          childSections[i].getElementsByTagName('span')[0].classList
            .remove('fa-chevron-right');
          childSections[i].getElementsByTagName('span')[0].classList
            .add('fa-chevron-down');
          childSections[i].dataset.expanded = 'true';
        }

        this.dataset.expanded = 'true';

        if (this.classList.contains('expand-parent')) {
          this.getElementsByTagName('text')[0].innerHTML = 'Collapse All';
        }
      }

      // Get sibling subsections if user clicked a child subsection
      if (this.classList.contains('expand-child')) {
        siblingSections = document.querySelectorAll('[data-parent="' + this
          .dataset.parent + '"]');
      }

      /* If child subsection and its siblings are now all expanded from above
      logic, change the parent section to expanded state */
      if (this.dataset.expanded == 'true' && this.classList
        .contains('expand-child') && areAllExpanded(siblingSections)) {
          parentSections[this.dataset.parent].getElementsByTagName('span')[0]
            .classList.remove('fa-chevron-right');
          parentSections[this.dataset.parent].getElementsByTagName('span')[0]
            .classList.add('fa-chevron-down');
          parentSections[this.dataset.parent].dataset.expanded = 'true';
          parentSections[this.dataset.parent].getElementsByTagName('text')[0]
            .innerHTML = 'Collapse All';
          return;
        }

      /* If child subsection is now collapsed from above logic, change the
      parent section to collapsed state if it's not already in that state */
      if (this.dataset.expanded == 'false' && this.classList
        .contains('expand-child') && parentSections[this.dataset.parent]
        .dataset.expanded == 'true') {
          parentSections[this.dataset.parent].getElementsByTagName('span')[0]
            .classList.remove('fa-chevron-down');
          parentSections[this.dataset.parent].getElementsByTagName('span')[0]
            .classList.add('fa-chevron-right');
          parentSections[this.dataset.parent].dataset.expanded = 'false';
          parentSections[this.dataset.parent].getElementsByTagName('text')[0]
            .innerHTML = 'Expand All';
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
