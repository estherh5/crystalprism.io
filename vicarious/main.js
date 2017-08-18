// Define variables
var after = '';
var images = document.getElementById('images');
var countryInput = document.getElementById('input');
var inputValueLower = '';
var urlsList = [];
var imageTitleLinksList = [];
var imageTitlesList = [];
var imageLinks = images.getElementsByClassName('image-link');
var imageImgs = images.getElementsByClassName('image');
var imageTitles = images.getElementsByClassName('image-title');
var noResultsModal = document.getElementById('modal');
var noResultsTitle = document.getElementById('modal-title');
var placeholders = ['Spain', 'Switzerland', 'India', 'Thailand', 'Italy', 'Canada', 'Norway']
var submitButton = document.getElementById('submit');
var rightPanel = document.getElementById('right');
var loadingImage = document.getElementById('loading-image');
var okayButton = document.getElementById('okay');
var modalCloseButton = document.getElementById('modal-close');
var viewButton = document.getElementById('view');
var carousel = document.getElementById('carousel');
var carouselCloseButton = document.getElementById('close-carousel');
var carouselItems = document.getElementsByClassName('carousel-item');

// Define events
countryInput.addEventListener('keyup', function(event) {
  event.preventDefault();
  if (event.keyCode == 13) {
    submitButton.click();
  }
});

submitButton.addEventListener('click', clearImages, false);
okayButton.addEventListener('click', getContent, false);
modalCloseButton.addEventListener('click', getContent, false);
noResultsModal.addEventListener('click', getContent, false);
viewButton.addEventListener('click', showCarousel, false);
carouselCloseButton.addEventListener('click', hideCarousel, false);

for (var i = 0; i < carouselItems.length; i++) {
  carouselItems[i].addEventListener('click', hideCarousel, false);
}

// Define functions
function getContent() {
  loadingImage.style.animationPlayState = 'running';
  inputValue = countryInput.value;
  inputValueLower = inputValue.toLowerCase();
  return fetch('https://www.reddit.com/r/travel.json?limit=100&after=' + after).then(function (response) {
    response.json().then(function (info) {
      after = info['data']['after'];
      for (var i = 0; i < info['data']['children'].length; i++) {
        if (urlsList.length >= 5) {
          rightPanel.classList.remove('cleared');
          loadingImage.classList.remove('loading');
          return;
        }
        if (info['data']['children'][i]['data']['url'].match(/(.jpg|.jpeg|.png|.tif)/) && info['data']['children'][i]['data']['title'].toLowerCase().indexOf(inputValueLower) != -1 && urlsList.includes(info['data']['children'][i]['data']['url']) == false) {
          urlsList.push(info['data']['children'][i]['data']['url']);
          var imageNumber = urlsList.indexOf(info['data']['children'][i]['data']['url']);
          imageLinks[imageNumber].href = urlsList[imageNumber];
          imageImgs[imageNumber].src = urlsList[imageNumber];
          imageImgs[imageNumber].classList.remove('cleared');
          imageTitleLinksList.push('https://reddit.com' + info['data']['children'][i]['data']['permalink']);
          imageTitlesList.push(info['data']['children'][i]['data']['title']);
          imageTitles[imageNumber].href = imageTitleLinksList[imageNumber];
          imageTitles[imageNumber].innerHTML = imageTitlesList[imageNumber];
        }
        if (i == info['data']['children'].length - 1) {
          if (after == null) {
            if (urlsList.length == 0) {
              loadingImage.style.animationPlayState = 'paused';
              noResultsTitle.innerHTML = 'No images found for "' + inputValue + '"';
              $(noResultsModal).modal('show');
            } else if (urlsList.length != 0) {
              rightPanel.classList.remove('cleared');
              loadingImage.classList.remove('loading');
            }
            countryInput.value = '';
          } else {
            getContent();
          }
        }
      }
    })
  })
}

function setInputPlaceholder() {
  var randomNumber = Math.floor(Math.random() * placeholders.length);
  countryInput.placeholder = placeholders[randomNumber];
}

function clearImages() {
  for (var j = 0; j < imageLinks.length; j++) {
    imageLinks[j].removeAttribute('href');
    imageImgs[j].classList.add('cleared');
    imageImgs[j].style.animationPlayState = 'initial';
    imageImgs[j].removeAttribute('src');
    imageTitles[j].removeAttribute('href');
    imageTitles[j].innerHTML = '';
  }
  rightPanel.classList.add('cleared');
  loadingImage.classList.add('loading');
  urlsList = [];
  imageTitleLinksList = [];
  imageTitlesList = [];
  after = '';
  getContent();
}

function showCarousel() {
  carousel.style.display = 'initial';
  var carouselImages = document.getElementsByClassName('carousel-image');
  for (var i = 0; i < carouselImages.length; i++) {
    carouselImages[i].src = urlsList[i];
  }
}

function hideCarousel(e) {
  if (e.target == this) {
    carousel.style.display = 'none';
  }
}
