// Define global variables
var after = ''; // Value used by Reddit's API to get next set of images
var allImages = []; // Array to store images from Reddit API
var rightPanel = document.getElementById('right-panel');
var loadingImage = document.getElementById('loading-image');
var locationInput = document.getElementById('location-input');
var submitButton = document.getElementById('submit');
var titleLink = document.getElementById('title-link');
var noResultsTitle = document.getElementById('no-results-modal-title');
var noResultsModal = document.getElementById('no-results-modal');
var noResultsOkayButton = document.getElementById('no-results-okay');
var noResultsCloseButton = document.getElementById('no-results-modal-close');
var imageURLs = []; // Array to store images that match user search term
var imageTitleLinks = []; // Array to store links to Reddit posts for imageURLs
var imageTitleTexts = []; // Array to store titles of Reddit posts for imageURLs
var imagesContainer = document.getElementById('images-container')
var displayedImages = imagesContainer.getElementsByClassName('image');
var displayedImageTitles = imagesContainer.getElementsByClassName('image-title');
var viewButton = document.getElementById('view-all');
var carousel = document.getElementById('carousel');
var carouselCloseButton = document.getElementById('carousel-close');
var carouselPrev = document.getElementById('carousel-prev');
var carouselNext = document.getElementById('carousel-next');


// Define load functions
window.onload = function() {
  // Stop carousel from cycling (starts cycling by default)
  $('.carousel').carousel('pause');

  // Create page header (from common.js script)
  createPageHeader();

  // Create page footer (from common.js script)
  createPageFooter();

  // Check if user is logged in (from common.js script)
  checkIfLoggedIn();

  // Store images from Reddit's API in an array
  storeImages();

  // Set random location as location search input placeholder
  setLocationPlaceholder();

  return;
}


// Store all travel images from Reddit's API in an array
function storeImages() {
  // Retrieve 100 images from Reddit's Travel subreddit
  return fetch('https://www.reddit.com/r/travel.json?limit=100&after=' + after)

    // Display error modal if server is down
    .catch(function(error) {
      $(error).modal('show');

      // Focus on okay button after modal displays
      $(error).on('shown.bs.modal', function () {
        document.getElementById('error-okay').focus();
        return;
      });
      return;
    })

    .then(function(response) {
      if (response.ok) {
        response.json().then(function(info) {
          /* Get "after" value, which Reddit's API uses to retrieve next set of
          images */
          after = info['data']['after'];

          for (var i = 0; i < info['data']['children'].length; i++) {

            /* When 5 images have been found, get their data (URL, title, etc.)
            and display them on page */
            if (allImages.length == 5) {
              findImages('');
            }

            /* If the URL item in the Reddit data contains an image file
            extension, store the URL in the allImages array */
            if (info['data']['children'][i]['data']['url']
              .match(/(.jpg|.jpeg|.png|.tif)/)) {
                allImages.push(info['data']['children'][i]['data']);
            }

            if (i == info['data']['children'].length - 1) {
              /* If this is the last object from the Reddit data and the "after"
              value is null, return */
              if (after == null) {
                return;
              }

              /* Otherwise, run the function again using a fetch request with the
              new "after" value */
              storeImages();
            }
          }
        });

        return;
      }

      // Display error modal if server throws error
      $(error).modal('show');
      $(error).on('shown.bs.modal', function () {
        document.getElementById('error-okay').focus();
        return;
      });

      return;
    });
}


/* Display random API images when no images match user's search term and user
exits modal */
noResultsModal.onclick = function(e) {
  // Only call function if user clicks on area outside of modal body
  if (e.target == this) {
    findImages('random');
  }

  return;
}

noResultsOkayButton.onclick = function() {
  findImages('random');
  return;
}

noResultsCloseButton.onclick = function() {
  findImages('random');
  return;
}


/* Close modal and display random images when modal is open and escape key is
clicked */
window.addEventListener('keyup', function(e) {
  if (noResultsModal.classList.contains('show') && e.keyCode == 27) {
    e.preventDefault();
    noResultsCloseButton.click();
  }

  return;
}, false);


/* Find API images that match input term (input is blank on load to match on
first 5 images) */
function findImages(input) {
  // Display loading style and animation while images load
  document.getElementById('dimmer').style.display = 'block';
  loadingImage.style.animationPlayState = 'running';

  /* If input is 'random', generate a random list of 5 images from the API
  results */
  if (input == 'random') {
    randomNumber = Math.floor(Math.random() * (allImages.length - 6));
    searchList = allImages.slice(randomNumber, randomNumber + 5);

    // Clear location input for user to search for something new
    locationInput.value = '';
    setLocationPlaceholder();
    locationInput.focus();

    // Set input term to blank to return match on any image title
    input = '';
  }

  // If input is anything else, search through full list of API images
  else {
    searchList = allImages;
  }

  for (var i = 0; i < searchList.length; i++) {
    /* Remove loading style and animation, populate carousel, and display
    images on page when 5 images are found */
    if (imageURLs.length == 5) {
      rightPanel.classList.remove('cleared');
      loadingImage.classList.remove('loading');
      document.getElementById('dimmer').style.display = 'none';
      populateCarousel();
      displayImages();
      return;
    }

    /* Search through images to find match with input search term and image
    title, ignoring images already in search results list */
    if (searchList[i]['title'].toLowerCase().indexOf(input.toLowerCase()) != -1
      && imageURLs.includes(searchList[i]['url']) == false) {
        imageURLs.push(searchList[i]['url']);
        imageTitleLinks.push('https://reddit.com' + searchList[i]['permalink']);
        imageTitleTexts.push(searchList[i]['title']);
      }

    if (i == searchList.length - 1) {
      /* If search has reached end of images list and found no matching images,
      display no results modal and clear carousel */
      if (imageURLs.length == 0) {
        loadingImage.style.animationPlayState = 'paused';
        noResultsTitle.innerHTML = 'No images found for "' + input + '"';
        $(noResultsModal).modal('show');

        // Focus on okay button after modal displays
        $(noResultsModal).on('shown.bs.modal', function () {
          noResultsOkayButton.focus();
          return;
        });

        populateCarousel();
        return;
      }

      /* If search has reached end of API images list and found at least 1
      matching image, populate carousel, display images, and remove loading
      style and animation */
      populateCarousel();
      displayImages();
      rightPanel.classList.remove('cleared');
      loadingImage.classList.remove('loading');
      document.getElementById('dimmer').style.display = 'none';
    }
  }

  return;
}


// Display images found in findImages function
function displayImages() {
  for (var i = 0; i < imageURLs.length; i++) {
    displayedImages[i].src = imageURLs[i];
    displayedImages[i].dataset.number = i;
    displayedImages[i].classList.remove('cleared');

    // Open carousel to specified image when clicked
    displayedImages[i].addEventListener('click', function() {
      openCarousel(this.dataset.number);
    }, false);

    // Display link to image's Reddit post as title for image
    displayedImageTitles[i].href = imageTitleLinks[i];
    displayedImageTitles[i].innerHTML = imageTitleTexts[i];
  }
  return;
}


/* Clear images from page if user clicks page title, submit button, or enter
key in search input field to search for image */
titleLink.onclick = clearImages;
submitButton.onclick = clearImages;

locationInput.addEventListener('keyup', function(e) {
  /* Clear images when enter key is clicked and no results modal is not
  displayed */
  if (!noResultsModal.classList.contains('show') && e.keyCode == 13) {
    e.preventDefault();
    clearImages();
    return;
  }
}, false);

function clearImages() {
  // Clear images and their titles from image containers on page
  for (var j = 0; j < displayedImages.length; j++) {
    displayedImages[j].classList.add('cleared');
    displayedImages[j].style.animationPlayState = 'initial';
    displayedImages[j].removeAttribute('src');
    displayedImageTitles[j].removeAttribute('href');
    displayedImageTitles[j].innerHTML = '';
  }

  // Display loading image in place of empty image containers
  loadingImage.classList.add('loading');
  rightPanel.classList.add('cleared');

  // Clear list of images and titles found in findImages function
  imageURLs = [];
  imageTitleLinks = [];
  imageTitleTexts = [];
  after = '';

  /* If user clicked page title or search input field is blank, display random
  images */
  if (this == titleLink || locationInput.value == '') {
    findImages('random');
    return;
  }

  // Otherwise, display images that match location that user searched for
  findImages(locationInput.value);

  return;
}


// Populate carousel with images found in findImages function
function populateCarousel() {
  // Clear current carousel images
  document.getElementById('carousel-inner').innerHTML = '';

  for (var i = 0; i < imageURLs.length; i++) {
    /* Hide carousel navigation buttons if there is only a single image (or no
    images) to cycle through */
    if (imageURLs.length < 2) {
      carouselPrev.classList.remove('d-flex');
      carouselNext.classList.remove('d-flex');
    } else {
      carouselPrev.classList.add('d-flex');
      carouselNext.classList.add('d-flex');
    }

    // Create carousel image for each image found in findImages function
    var carouselItem = document.createElement('div');
    carouselItem.classList.add('carousel-item');
    var carouselImage = document.createElement('img');
    carouselImage.classList.add('carousel-image');
    carouselImage.classList.add('img-fluid');
    carouselImage.src = imageURLs[i];
    carouselItem.appendChild(carouselImage);
    document.getElementById('carousel-inner').appendChild(carouselItem);
  }

  return;
}


/* Open carousel to specified image number in cycle (start from beginning when
View All button is clicked) */
viewButton.addEventListener('click', function() {
  openCarousel(0);
  return;
}, false);

function openCarousel(number) {
  var carouselItems = document.getElementsByClassName('carousel-item');

  // Start carousel cycle on specified image number
  carouselItems[number].classList.add('active');

  // Make account menu links white font for visibility
  document.getElementById('profile-link').style.color = '#ffffff';
  document.getElementById('account-link').style.color = '#ffffff';
  document.getElementById('sign-in-link').style.color = '#ffffff';
  carousel.classList.add('d-flex');
  $('.carousel').carousel('cycle');

  // Focus on next button control to allow keyboard shortcuts
  carouselNext.focus();

  return;
}


/* Close carousel when close button is clicked or when area outside carousel
image is clicked */
carouselCloseButton.onclick = closeCarousel;

carousel.onclick = function(e) {
  if (e.target == this) {
    closeCarousel();
    return;
  }
}

function closeCarousel() {
  var carouselItems = document.getElementsByClassName('carousel-item');

  // Pause carousel cycle
  $('.carousel').carousel('pause');

  /* Remove active class from all carousel items to clear previous cycle of
  images */
  for (var i = 0; i < carouselItems.length; i++) {
    carouselItems[i].classList.remove('active');
  }

  // Return account menu links to original font color
  document.getElementById('profile-link').style.color = '#000000';
  document.getElementById('account-link').style.color = '#000000';
  document.getElementById('sign-in-link').style.color = '#000000';
  carousel.classList.remove('d-flex');

  return;
}


// Define carousel keyboard shortcuts
window.addEventListener('keyup', function(e) {
  // Close carousel when escape key is clicked
  if (carousel.style.display != 'none' && e.keyCode == 27) {
    e.preventDefault();
    carouselCloseButton.click();
  }

  // Advance to next carousel item when space key is clicked
  else if (carousel.style.display != 'none' && e.keyCode == 32) {
    e.preventDefault();
    carouselNext.click();
  }

  return;
}, false);


// Set random country placeholder in search input field
function setLocationPlaceholder() {
  var locationPlaceholders = ['Spain', 'Switzerland', 'India', 'Thailand',
    'Italy', 'Canada', 'Norway'];
  var randomNumber = Math.floor(Math.random() * locationPlaceholders.length);
  locationInput.placeholder = locationPlaceholders[randomNumber];
  return;
}
