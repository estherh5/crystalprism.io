// Define variables
var gallery = document.getElementById('gallery');
var galleryTitle = document.getElementById('gallery-title');
var requestStart = 0;
var requestEnd = 12;
var hoverTitles = ['Click to leave your mark', 'The world is your canvas', 'Share your imagination with the world'];
if (window.location.hostname == 'crystalprism.io') {
  var server = 'http://13.58.175.191/api';
} else {
  var server = 'http://localhost:5000/api';
}

// Define events
galleryTitle.onclick = sessionStorage.setItem('imageSrc', '');

window.onscroll = displayMoreImages;

// Define functions
function setHoverTitle() {
  var randomNumber = Math.floor(Math.random() * hoverTitles.length);
  galleryTitle.title = hoverTitles[randomNumber];
}

function getImages() {
  return fetch(server + '/canvashare/gallery?start=' + requestStart + '&end=' + requestEnd).then(function (response) {
    response.json().then(function (images) {
      if (images.length != 0) {
        for (var i = 0; i < images.length; i++) {
          var viewText = document.createElement('text');
          viewText.id = images[i];
          getViews(images[i]);
          var imageDiv = document.createElement('div');
          imageDiv.className = 'image-div';
          var imageLink = document.createElement('a');
          imageLink.className = 'image-link';
          imageLink.href = 'javascript:delay("drawingapp/index.html")';
          var imageName = document.createElement('div');
          imageName.className = 'image-name';
          imageName.innerHTML = images[i].split(/`|.png/)[0];
          var image = document.createElement('img');
          image.className = 'image';
          image.src = server + '/canvashare/drawing/' + images[i];
          var imageViews = document.createElement('div');
          imageViews.className = 'image-views';
          imageViews.innerHTML = 'Views: ';
          gallery.append(imageDiv);
          imageDiv.append(imageLink);
          imageLink.append(imageName);
          imageLink.append(image);
          imageDiv.append(imageViews);
          imageViews.append(viewText);
          imageDiv.onclick = setImageValues;
        }
      }
    })
  })
}

function getViews(imageFileName) {
  return fetch(server + '/canvashare/drawinginfo/' + imageFileName.split('.png')[0]).then(function (response) {
    response.json().then(function (viewNumber) {
      document.getElementById(imageFileName).innerHTML = viewNumber;
    })
  });
}

function delay(URL) {
  setTimeout(function () {window.location = URL}, 800);
}

function setImageValues() {
  sessionStorage.setItem('imageSrc', this.getElementsByTagName('img')[0].src);
  currentViews = document.getElementById(this.getElementsByTagName('img')[0].src.split('/drawing/')[1]).innerHTML;
  stringViews = {'views': (parseInt(currentViews) + 1).toString()};
  stringViews = JSON.stringify(stringViews);
  fetch(server + '/canvashare/drawinginfo/' + this.getElementsByTagName('img')[0].src.split('/drawing/')[1].split('.png')[0], {
    headers: {'Content-Type': 'application/json'},
    method: 'POST',
    body: stringViews
  })
}

function displayMoreImages() {
  if ((document.body.scrollTop + document.body.clientHeight) >= document.body.scrollHeight - 10) {
    requestStart = requestEnd;
    requestEnd = requestEnd + Math.floor(gallery.offsetWidth/240);
    setTimeout(getImages, 10);
  }
}
