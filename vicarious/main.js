// Define variables
var after = '';
var images = document.getElementById('images');
var submitButton = document.getElementById('submit');
var urlsList = [];
var viewButton = document.getElementById('view');
var carousel = document.getElementById('carousel');

// Define events
submitButton.addEventListener('click', clearImages, false);
viewButton.addEventListener('click', showCarousel, false);

// Define functions
function getContent() {
  var inputValue = document.getElementById('input').value.toLowerCase();
  return fetch('https://www.reddit.com/r/travel.json?limit=100&after=' + after).then(function (response) {
    response.json().then(function (info) {
      for (var i = 0; i < info['data']['children'].length; i++) {
        if (images.childNodes.length >= 6) {
          return;
        }
        if (info['data']['children'][i]['data']['url'].match(/(.jpg|.jpeg|.png|.tif)/) && info['data']['children'][i]['data']['title'].toLowerCase().indexOf(inputValue) != -1 && urlsList.includes(info['data']['children'][i]['data']['url']) == false) {
          imageList = document.createElement('ul');
          imageList.classList.add('list-unstyled');
          imageListItem = document.createElement('li');
          imageListItem.classList.add('media');
          imageListItem.classList.add('align-items-center');
          imageLink = document.createElement('a');
          imageLink.classList.add('image-link');
          imageLink.classList.add('mr-3');
          imageLink.href = info['data']['children'][i]['data']['url'];
          imageLink.target = '_blank';
          image = document.createElement('img');
          image.classList.add('img-fluid');
          image.classList.add('img-thumbnail');
          image.classList.add('image');
          image.src = info['data']['children'][i]['data']['url'];
          urlsList.push(image.src);
          titleDiv = document.createElement('div');
          titleDiv.classList.add('media-body');
          title = document.createElement('a');
          title.classList.add('image-title');
          title.href = 'https://reddit.com' + info['data']['children'][i]['data']['permalink'];
          title.target = '_blank';
          title.innerHTML = info['data']['children'][i]['data']['title'];
          images.appendChild(imageList);
          imageList.appendChild(imageListItem);
          imageListItem.appendChild(imageLink);
          imageLink.appendChild(image);
          imageListItem.appendChild(titleDiv);
          titleDiv.appendChild(title);
        }
        if (i == 99 && after != '') {
          after = info['data']['after'];
          getContent();
        }
        if (i == 101) {
          after = info['data']['after'];
          getContent();
        }
      }
    })
  })
}

function clearImages() {
  urlsList = [];
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
