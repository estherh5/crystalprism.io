// Define variables
var after = '';
var images = document.getElementById('images');
var inputValueLower = '';
var urlsList = [];
var imageTitleLinksList = [];
var imageTitlesList = [];
var imageLinks = images.getElementsByClassName('image-link');
var imageImgs = images.getElementsByClassName('image');
var imageTitles = images.getElementsByClassName('image-title');
var noResultsModal = document.getElementById('modal');
var noResultsTitle = document.getElementById('modal-title');
var submitButton = document.getElementById('submit');
var okayButton = document.getElementById('okay');
var modalCloseButton = document.getElementById('modal-close');
var viewButton = document.getElementById('view');
var carousel = document.getElementById('carousel');

// Define events
submitButton.addEventListener('click', clearImages, false);
okayButton.addEventListener('click', getContent, false);
modalCloseButton.addEventListener('click', getContent, false);
noResultsModal.addEventListener('click', getContent, false);
viewButton.addEventListener('click', showCarousel, false);

// Define functions
function getContent() {
  inputValue = document.getElementById('input').value;
  inputValueLower = inputValue.toLowerCase();
  return fetch('https://www.reddit.com/r/travel.json?limit=100&after=' + after).then(function (response) {
    response.json().then(function (info) {
      for (var i = 0; i < info['data']['children'].length; i++) {
        if (urlsList.length >= 5) {
          for (var j = 0; j < imageLinks.length; j++) {
            imageLinks[j].href = urlsList[j];
            imageImgs[j].src = urlsList[j];
            imageImgs[j].classList.remove('loading');
            imageTitles[j].href = imageTitleLinksList[j];
            imageTitles[j].innerHTML = imageTitlesList[j];
          }
          return;
        }
        if (info['data']['children'][i]['data']['url'].match(/(.jpg|.jpeg|.png|.tif)/) && info['data']['children'][i]['data']['title'].toLowerCase().indexOf(inputValueLower) != -1 && urlsList.includes(info['data']['children'][i]['data']['url']) == false) {
          urlsList.push(info['data']['children'][i]['data']['url']);
          imageTitleLinksList.push('https://reddit.com' + info['data']['children'][i]['data']['permalink']);
          imageTitlesList.push(info['data']['children'][i]['data']['title']);
        }
        if (i == info['data']['children'].length - 1) {
          after = info['data']['after'];
          getContent();
        }
      }
      if (urlsList.length == 0 && after == null) {
        for (var j = 0; j < imageImgs.length; j++) {
          imageImgs[j].style.animationPlayState = 'paused';
        }
        noResultsTitle.innerHTML = 'No images found for "' + inputValue + '"';
        $(noResultsModal).modal('show');
        document.getElementById('input').value = '';
      }
    })
  })
}

function clearImages() {
  for (var j = 0; j < imageLinks.length; j++) {
    imageLinks[j].removeAttribute('href');
    imageImgs[j].classList.add('loading');
    imageImgs[j].style.animationPlayState = 'initial';
    imageImgs[j].src = 'images/loading.png';
    imageTitles[j].removeAttribute('href');
    imageTitles[j].innerHTML = '';
  }
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
