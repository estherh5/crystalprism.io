// Define variables
var profileLink = document.getElementById('profile-link');
var accountLink = document.getElementById('account-link');
var signInLink = document.getElementById('sign-in-link');
var afterValue = '';
var allImages = [];
var rightPanel = document.getElementById('right-panel');
var loadingImage = document.getElementById('loading-image');
var dimmer = document.getElementById('dimmer');
var locationInput = document.getElementById('location-input');
var locationLowercase = '';
var imageURLs = [];
var imagesContainer = document.getElementById('images-container');
var displayedImages = imagesContainer.getElementsByClassName('image');
var zoomedImage = document.getElementById('zoomed-image');
var zoomedModal = document.getElementById('zoomed-modal');
var imageTitleLinks = [];
var imageTitleTexts = [];
var imageTitles = imagesContainer.getElementsByClassName('image-title');
var noResultsTitle = document.getElementById('no-results-modal-title');
var noResultsModal = document.getElementById('no-results-modal');
var locationPlaceholders = ['Spain', 'Switzerland', 'India', 'Thailand', 'Italy', 'Canada', 'Norway'];
var carousel = document.getElementById('carousel');
var carouselCloseButton = document.getElementById('carousel-close');
var okayButton = document.getElementById('okay');
var submitButton = document.getElementById('submit');
var titleLink = document.getElementById('title-link');
var noResultsCloseButton = document.getElementById('no-results-modal-close');
var viewButton = document.getElementById('view-all');
var carouselInner = document.getElementById('carousel-inner');
var carouselPrev = document.getElementById('carousel-prev');
var carouselNext = document.getElementById('carousel-next');
var carouselItems = document.getElementsByClassName('carousel-item');
if (window.location.hostname == 'crystalprism.io') {
  var server = 'http://13.58.175.191/api';
} else {
  var server = 'http://localhost:5000/api';
}

// Define events
window.addEventListener('keyup', function(event) {
  if (carousel.style.display != 'none' && event.keyCode == 27) {
    event.preventDefault();
    carouselCloseButton.click();
  }
}, false);

locationInput.addEventListener('keyup', function(event) {
  if (!noResultsModal.classList.contains('show') && event.keyCode == 13) {
    event.preventDefault();
    submitButton.click();
  }
}, false);

titleLink.onclick = clearImages;
submitButton.onclick = clearImages;
okayButton.onclick = displayRandomImages;
noResultsCloseButton.onclick = displayRandomImages;
noResultsModal.onclick = displayRandomImages;
viewButton.onclick = showCarousel;
carouselCloseButton.onclick = hideCarousel;

for (var i = 0; i < carouselItems.length; i++) {
  carouselItems[i].addEventListener('click', hideCarousel, false);
}

// Define functions
function checkAccountStatus() {
  return fetch(server + '/user/verify', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
    method: 'GET',
  }).catch(function(error) {
    accountLink.innerHTML = 'Create Account';
    signInLink.innerHTML = 'Sign In';
    signInLink.onclick = function() {
      sessionStorage.setItem('previous-window', '../../vicarious/index.html');
    }
  }).then(function(response) {
    if (response.ok) {
      profileLink.innerHTML = localStorage.getItem('username');
      profileLink.href = '../user/index.html?username=' + localStorage.getItem('username');
      accountLink.innerHTML = 'My Account';
      accountLink.href = '../user/my-account/index.html';
      signInLink.innerHTML = 'Sign Out';
      signInLink.onclick = function() {
        sessionStorage.setItem('account-request', 'logout');
      }
    } else {
      localStorage.removeItem('username');
      localStorage.removeItem('token');
      accountLink.innerHTML = 'Create Account';
      signInLink.innerHTML = 'Sign In';
      signInLink.onclick = function() {
        sessionStorage.setItem('previous-window', '../../vicarious/index.html');
      }
    }
  })
}

function storeImages() {
  return fetch('https://www.reddit.com/r/travel.json?limit=100&after=' + afterValue).then(function(response) {
    response.json().then(function(info) {
      afterValue = info['data']['after'];
      for (var i = 0; i < info['data']['children'].length; i++) {
        if (allImages.length == 6) {
          displayImages();
        }
        if (info['data']['children'][i]['data']['url'].match(/(.jpg|.jpeg|.png|.tif)/)) {
          allImages.push(info['data']['children'][i]['data']);
        }
        if (i == info['data']['children'].length - 1) {
          if (afterValue == null) {
            return;
          } else {
            storeImages();
          }
        }
      }
    })
  })
}

function displayImages() {
  $('.carousel').carousel('pause');
  dimmer.style.display = 'block';
  loadingImage.style.animationPlayState = 'running';
  var locationValue = locationInput.value;
  locationLowercase = locationValue.toLowerCase();
  for (var i = 0; i < allImages.length; i++) {
    if (imageURLs.length == 5) {
      rightPanel.classList.remove('cleared');
      loadingImage.classList.remove('loading');
      locationInput.value = '';
      setLocationPlaceholder();
      dimmer.style.display = 'none';
      return;
    }
    if (allImages[i]['title'].toLowerCase().indexOf(locationLowercase) != -1 && imageURLs.includes(allImages[i]['url']) == false) {
      imageURLs.push(allImages[i]['url']);
      var imageNumber = imageURLs.indexOf(allImages[i]['url']);
      displayedImages[imageNumber].src = imageURLs[imageNumber];
      displayedImages[imageNumber].classList.remove('cleared');
      displayedImages[imageNumber].onclick = function() {
        zoomedImage.src = this.src;
        $(zoomedModal).modal('show');
      }
      imageTitleLinks.push('https://reddit.com' + allImages[i]['permalink']);
      imageTitleTexts.push(allImages[i]['title']);
      imageTitles[imageNumber].href = imageTitleLinks[imageNumber];
      imageTitles[imageNumber].innerHTML = imageTitleTexts[imageNumber];
    }
    if (i == allImages.length - 1) {
      if (imageURLs.length == 0) {
        loadingImage.style.animationPlayState = 'paused';
        noResultsTitle.innerHTML = 'No images found for "' + locationValue + '"';
        $(noResultsModal).modal('show');
        setTimeout(function() {
          okayButton.focus();
        }, 200);
      } else if (imageURLs.length != 0) {
        rightPanel.classList.remove('cleared');
        loadingImage.classList.remove('loading');
        dimmer.style.display = 'none';
        setLocationPlaceholder();
      }
      locationInput.value = '';
    }
  }
}

function setLocationPlaceholder() {
  var randomNumber = Math.floor(Math.random() * locationPlaceholders.length);
  locationInput.placeholder = locationPlaceholders[randomNumber];
}

function displayRandomImages(e) {
  if (e == titleLink || this == noResultsModal && e.target == this || this.tagName.toLowerCase() == 'button') {
    locationInput.focus();
    dimmer.style.display = 'block';
    loadingImage.style.animationPlayState = 'running';
    randomNumber = Math.floor(Math.random() * (allImages.length - 6));
    for (var i = 0; i < 6; i++) {
      if (imageURLs.length == 5) {
        rightPanel.classList.remove('cleared');
        loadingImage.classList.remove('loading');
        locationInput.value = '';
        setLocationPlaceholder();
        dimmer.style.display = 'none';
        return;
      }
      if (!imageURLs.includes(allImages[randomNumber + i]['url'])) {
        imageURLs.push(allImages[randomNumber + i]['url']);
        var imageNumber = imageURLs.indexOf(allImages[randomNumber + i]['url']);
        displayedImages[imageNumber].src = imageURLs[imageNumber];
        displayedImages[imageNumber].classList.remove('cleared');
        imageTitleLinks.push('https://reddit.com' + allImages[randomNumber + i]['permalink']);
        imageTitleTexts.push(allImages[randomNumber + i]['title']);
        imageTitles[imageNumber].href = imageTitleLinks[imageNumber];
        imageTitles[imageNumber].innerHTML = imageTitleTexts[imageNumber];
      }
    }
  }
}

function clearImages() {
  for (var j = 0; j < displayedImages.length; j++) {
    displayedImages[j].classList.add('cleared');
    displayedImages[j].style.animationPlayState = 'initial';
    displayedImages[j].removeAttribute('src');
    imageTitles[j].removeAttribute('href');
    imageTitles[j].innerHTML = '';
  }
  rightPanel.classList.add('cleared');
  loadingImage.classList.add('loading');
  imageURLs = [];
  imageTitleLinks = [];
  imageTitleTexts = [];
  afterValue = '';
  if (this == titleLink) {
    displayRandomImages(this);
  } else {
    displayImages();
  }
}

function showCarousel() {
  profileLink.style.color = '#ffffff';
  accountLink.style.color = '#ffffff';
  signInLink.style.color = '#ffffff';
  carouselInner.innerHTML = '';
  for (var i = 0; i < imageURLs.length; i++) {
    if (imageURLs.length < 2) {
      carouselPrev.style.display = 'none';
      carouselNext.style.display = 'none';
    } else {
      carouselPrev.style.display = 'flex';
      carouselNext.style.display = 'flex';
    }
    var carouselItem = document.createElement('div');
    carouselItem.classList.add('carousel-item');
    if (i == 0) {
      carouselItem.classList.add('active');
    }
    var carouselImage = document.createElement('img');
    carouselImage.classList.add('carousel-image');
    carouselImage.classList.add('img-fluid');
    carouselImage.src = imageURLs[i];
    carouselItem.append(carouselImage);
    carouselInner.append(carouselItem);
  }
  carousel.style.display = 'initial';
  $('.carousel').carousel('cycle');
}

function hideCarousel(e) {
  if (e.target == this) {
    profileLink.style.color = '#000000';
    accountLink.style.color = '#000000';
    signInLink.style.color = '#000000';
    carousel.style.display = 'none';
    $('.carousel').carousel('pause');
  }
}
