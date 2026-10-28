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
var carousel = document.getElementById('carousel');
var carouselCloseButton = document.getElementById('carousel-close');
var carouselPrev = document.getElementById('carousel-prev');
var carouselNext = document.getElementById('carousel-next');
var loadingImages = false; // True while pages are still coming from Reddit


// Define load functions
window.onload = function() {
  // Stop carousel from cycling (starts cycling by default)
  $('.carousel').carousel('pause');

  // Store images from Reddit's API in an array
  loadImages();

  // Set random location as location search input placeholder
  setLocationPlaceholder();

  // Create page header (from common.js script)
  createPageHeader();

  // Check if user is logged in (from common.js script)
  checkIfLoggedIn();

  // Check if Crystal Prism API is online (from common.js script)
  pingServer(checkIfLoggedIn);

  // Create page footer (from common.js script)
  createPageFooter();

  return;
}


// Store all travel images from Reddit's API in an array
function storeImages() {
  // Retrieve 100 images from Reddit's Travel subreddit
  return fetchWithTimeout('https://www.reddit.com/r/travelphotos.json?limit=1000&after=' + after, {}, 15000)
    .then(function(response) {
      if (!response.ok) {
        throw new Error('Reddit answered ' + response.status);
      }
      return response.json();
    })

    .then(function(info) {
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
      }

      /* If the "after" value is null, every page is in: store images in
      localStorage */
      if (!after) {
        loadingImages = false;
        try {
          localStorage.setItem('vicarious-images', JSON.stringify(allImages));
        } catch (e) {}

        // Fewer than 5 images in all: show whatever there is
        if (allImages.length <= 5) {
          findImages('');
        }

        return;
      }

      /* Otherwise, run the function again using a fetch request with the new
      "after" value */
      return storeImages();
    })

    .catch(function() {
      imagesLoadFailed();
      return;
    });
}


/* A failed load ends visibly: the loading dimmer and animation stop, cached
images stand in if there are any, and otherwise the results panel says so and
offers Retry */
function imagesLoadFailed() {
  loadingImages = false;

  // A later page failing after images are already on screen changes nothing
  if (allImages.length > 5) {
    return;
  }

  if (allImages.length == 0) {
    try {
      var cached = JSON.parse(localStorage.getItem('vicarious-images') || '[]');
      if (cached.length) {
        allImages = cached;
      }
    } catch (e) {}
  }

  if (allImages.length) {
    findImages('');
    return;
  }

  showLoadError();
  return;
}

function showLoadError() {
  document.getElementById('dimmer').style.display = 'none';
  loadingImage.classList.remove('loading');
  loadingImage.style.animationPlayState = 'paused';
  submitButton.disabled = false;
  document.body.style.cursor = '';
  // Said in the results panel, beside the search it blocks, with Retry
  slotFailure(rightPanel, "Couldn't load travel photos: Reddit didn't " +
    'answer. Check your connection and try again.', loadImages);
  return;
}

/* Results replace the slot's status; a keyboard that waited on it moves to
the first result */
function showResults() {
  var hadFocus = slotStatusHasFocus(rightPanel);
  clearSlotStatus(rightPanel);
  rightPanel.classList.remove('cleared');
  loadingImage.classList.remove('loading');
  document.getElementById('dimmer').style.display = 'none';
  if (hadFocus) {
    rightPanel.querySelector('.image-title').focus();
  }
  return;
}

function loadImages() {
  /* A Loading status in the results slot: a Retry pressed there hands it the
  keyboard rather than dropping focus to the page. Screen readers only: the
  spinning globe already shows loading, and text under the dimmer would not
  read */
  slotLoading(rightPanel, 'Loading travel photos…').classList.add('sr-only');
  after = '';
  allImages = [];
  loadingImages = true;
  rightPanel.classList.add('cleared');
  loadingImage.classList.add('loading');
  loadingImage.style.animationPlayState = 'running';
  document.getElementById('dimmer').style.display = 'block';
  storeImages();
  return;
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
  /* Disable Submit button and set cursor style to waiting until server request
  goes through */
  submitButton.disabled = true;
  document.body.style.cursor = 'wait';

  // Display loading style and animation while images load
  document.getElementById('dimmer').style.display = 'block';
  loadingImage.style.animationPlayState = 'running';

  /* If input is 'random', generate a random list of 5 images from the API
  results */
  if (input == 'random') {
    randomNumber = Math.max(0, Math.floor(Math.random() * (allImages.length - 6)));
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

  /* Nothing to search yet: the first page is still loading (it calls
  findImages itself when it lands), or the load failed */
  if (searchList.length == 0) {
    if (!loadingImages) {
      showLoadError();
    }
    return;
  }

  for (var i = 0; i < searchList.length; i++) {
    /* Remove loading style and animation, populate carousel, and display
    images on page when 5 images are found */
    if (imageURLs.length == 5) {
      populateCarousel();
      displayImages();
      showResults();
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
        noResultsTitle.textContent = 'No images found for "' + input + '"';
        $(noResultsModal).modal('show');

        // Focus on okay button after modal displays
        $(noResultsModal).on('shown.bs.modal', function () {
          noResultsOkayButton.focus();
          return;
        });

        populateCarousel();

        // Reset Submit button and cursor style
        submitButton.disabled = false;
        document.body.style.cursor = '';

        return;
      }

      /* If search has reached end of API images list and found at least 1
      matching image, populate carousel, display images, and remove loading
      style and animation */
      populateCarousel();
      displayImages();
      showResults();
    }
  }

  return;
}


// Display images found in findImages function
function displayImages() {
  for (var i = 0; i < 5; i++) {
    if (imageURLs[i]) {
      displayedImages[i].src = imageURLs[i];
      displayedImages[i].dataset.number = i;
      displayedImages[i].classList.remove('hidden');
      displayedImages[i].classList.remove('cleared');

      // Open carousel to specified image when clicked
      displayedImages[i].addEventListener('click', function() {
        openCarousel(this.dataset.number);
      }, false);

      // Display link to image's Reddit post as title for image
      displayedImageTitles[i].href = imageTitleLinks[i];
      displayedImageTitles[i].textContent = htmlToText(imageTitleTexts[i]);
      displayedImages[i].alt = displayedImageTitles[i].textContent;
    } else {
      displayedImages[i].classList.add('hidden');
    }
  }

  // Reset Submit button and cursor style
  submitButton.disabled = false;
  document.body.style.cursor = '';

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


// Open carousel to specified image number in cycle
function openCarousel(number) {
  var carouselItems = document.getElementsByClassName('carousel-item');

  // Start carousel cycle on specified image number
  carouselItems[number].classList.add('active');

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

  carousel.classList.remove('d-flex');

  return;
}


// Define carousel keyboard shortcuts
window.addEventListener('keydown', function(e) {
  // Close carousel when escape key is clicked
  if (window.getComputedStyle(carousel).display != 'none' && e.keyCode == 27) {
    e.preventDefault();
    carouselCloseButton.click();
  }

  // Advance to next carousel item when space key is clicked
  else if (window.getComputedStyle(carousel).display != 'none' && e
    .keyCode == 32) {
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
