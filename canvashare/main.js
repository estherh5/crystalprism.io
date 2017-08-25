// Define variables
var header = document.getElementById('header');
var gallery = document.getElementById('gallery');
var galleryTitle = document.getElementById('gallery-title');
var userImage = document.getElementById('user-image');
var requestStart = 0;
var requestEnd = 12;
var hoverTitles = ['"The world is but a canvas to our imagination." -Henry David Thoreau', '"Life is a great big canvas; throw all the paint you can at it." -Danny Kaye', '"A great artist can paint a great picture on a small canvas." -Charles Dudley Warner', '"I put on the canvas whatever comes into my mind." -Frida Kahlo', '"An empty canvas is a living wonder... far lovelier than certain pictures." -Wassily Kandinsky', '"I never know what I\'m going to put on the canvas. The canvas paints itself. I\'m just the middleman." -Peter Max', '"Cover the canvas at the first go, then work at it until you see nothing more to add." -Camille Pissarro', '"All I try to do is put as many colors as I can on the canvas every night." -Leslie Odom, Jr.', '"I was blown away by being able to color. Then I started to draw... bringing a blank white canvas to life was fascinating." James De La Vega'];
if (window.location.hostname == 'crystalprism.io') {
  var server = 'http://13.58.175.191/api';
} else {
  var server = 'http://localhost:5000/api';
}
var errorMessage = '';
var newIcon = document.getElementById('new');
var open = false;
var userDiv = document.getElementById('user-div');
var menu = document.getElementById('menu');
var newImage = document.getElementById('new-image');

// Define events
window.addEventListener('scroll', function () {
  if (window.pageYOffset > 100) {
    header.classList.add('shrink');
  } else if (header.classList.contains('shrink')) {
    header.classList.remove('shrink');
  }
})

newIcon.onclick = openMenu;
newImage.onclick = startNew;

window.onscroll = displayMoreImages;

// Define functions
function setHoverTitle() {
  var randomNumber = Math.floor(Math.random() * hoverTitles.length);
  galleryTitle.title = hoverTitles[randomNumber];
}

function getImages() {
  if (localStorage.getItem('imageSrc') != null) {
    userImage.src = localStorage.getItem('imageSrc');
    userDiv.classList.remove('hidden');
  }
  return fetch(server + '/canvashare/gallery?start=' + requestStart + '&end=' + requestEnd).catch(function (error) {
    if (errorMessage == '') {
      errorMessage = document.createElement('text');
      errorMessage.id = 'error-message';
      errorMessage.innerHTML = 'There was an error loading the CanvaShare gallery. Please refresh the page.';
      gallery.append(errorMessage);
    }
  }).then(function (response) {
    response.json().then(function (images) {
      if (images.length != 0) {
        for (var i = 0; i < images.length; i++) {
          var likeText = document.createElement('text');
          likeText.dataset.image = images[i];
          var viewText = document.createElement('text');
          viewText.dataset.image = images[i];
          getInfo(images[i]);
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
          var imageInfo = document.createElement('div');
          imageInfo.className = 'image-info';
          var imageLikes = document.createElement('div');
          imageLikes.className = 'image-likes';
          imageLikes.title = 'Image likes';
          if (localStorage.getItem(images[i]) == null) {
            imageLikes.innerHTML = '<i class="heart fa fa-heart-o" aria-hidden="true"></i>';
          } else {
            imageLikes.innerHTML = '<i class="heart fa fa-heart" aria-hidden="true"></i>';
          }
          var imageViews = document.createElement('div');
          imageViews.className = 'image-views';
          imageViews.title = 'Image copies';
          imageViews.innerHTML = '<i class="fa fa-file-image-o" aria-hidden="true"></i>';
          gallery.append(imageDiv);
          imageDiv.append(imageName);
          imageDiv.append(imageLink);
          imageLink.append(image);
          imageDiv.append(imageInfo);
          imageInfo.append(imageLikes);
          imageLikes.append(likeText);
          imageInfo.append(imageViews);
          imageViews.append(viewText);
          image.onclick = setImageValues;
          imageLikes.getElementsByTagName('i')[0].onclick = setImageValues;
        }
      }
    })
  })
}

function getInfo(imageFileName) {
  return fetch(server + '/canvashare/drawinginfo/' + imageFileName.split('.png')[0]).then(function (response) {
    response.json().then(function (drawingInfo) {
      var parsed = JSON.parse(drawingInfo);
      var dataElements = document.querySelectorAll('[data-image="' + imageFileName + '"]');
      dataElements[0].innerHTML = parsed['likes'];
      dataElements[1].innerHTML = parsed['views'];
    })
  });
}

function delay(URL) {
  setTimeout(function () {window.location = URL}, 800);
}

function setImageValues() {
  if (this.classList.contains('image')) {
    sessionStorage.setItem('imageSrc', this.src);
    currentLikes = document.querySelectorAll('[data-image="' + this.src.split('/canvashare/drawing/')[1] + '"]')[0].innerHTML;
    currentViews = document.querySelectorAll('[data-image="' + this.src.split('/canvashare/drawing/')[1] + '"]')[1].innerHTML;
    data = {'likes': parseInt(currentLikes), 'views': parseInt(currentViews) + 1};
    data = JSON.stringify(data);
    fetch(server + '/canvashare/drawinginfo/' + this.src.split('/canvashare/drawing/')[1].split('.png')[0], {
      headers: {'Content-Type': 'application/json'},
      method: 'POST',
      body: data
    })
  } else if (this.classList.contains('fa-heart-o')) {
    localStorage.setItem(this.nextSibling.dataset.image, 1);
    this.classList.remove('fa-heart-o');
    this.classList.add('fa-heart');
    this.nextSibling.innerHTML = parseInt(this.nextSibling.innerHTML) + 1;
    currentLikes = this.nextSibling.innerHTML;
    currentViews = document.querySelectorAll('[data-image="' + this.nextSibling.dataset.image + '"]')[1].innerHTML;
    data = {'likes': currentLikes, 'views': parseInt(currentViews)};
    data = JSON.stringify(data);
    fetch(server + '/canvashare/drawinginfo/' + this.nextSibling.dataset.image.split('.png')[0], {
      headers: {'Content-Type': 'application/json'},
      method: 'POST',
      body: data
    })
  } else if (this.classList.contains('fa-heart')) {
    localStorage.removeItem(this.nextSibling.dataset.image);
    this.classList.remove('fa-heart');
    this.classList.add('fa-heart-o');
    this.nextSibling.innerHTML = parseInt(this.nextSibling.innerHTML) - 1;
    currentLikes = this.nextSibling.innerHTML;
    currentViews = document.querySelectorAll('[data-image="' + this.nextSibling.dataset.image + '"]')[1].innerHTML;
    data = {'likes': currentLikes, 'views': parseInt(currentViews)};
    data = JSON.stringify(data);
    fetch(server + '/canvashare/drawinginfo/' + this.nextSibling.dataset.image.split('.png')[0], {
      headers: {'Content-Type': 'application/json'},
      method: 'POST',
      body: data
    })
  }
}

function openMenu() {
  if (open) {
    newIcon.classList.add('clicked');
    newIcon.classList.remove('open');
    menu.classList.remove('visible');
    newIcon.innerHTML = 'add_circle';
    open = false;
    setTimeout(function() {
      menu.classList.add('hidden');
      newIcon.classList.remove('clicked');
    }, 500);
  } else {
    newIcon.classList.add('clicked');
    newIcon.classList.add('open');
    menu.classList.remove('hidden');
    menu.classList.add('visible');
    newIcon.innerHTML = 'remove_circle';
    open = true;
    setTimeout(function() {
      newIcon.classList.remove('clicked');
    }, 500);
  }
}

function startNew() {
  sessionStorage.setItem('imageSrc', this.getElementsByTagName('img')[0].src);
}

function displayMoreImages() {
  if ((document.body.scrollTop + document.body.clientHeight) >= document.body.scrollHeight - 10) {
    requestStart = requestEnd;
    requestEnd = requestEnd + Math.floor(gallery.offsetWidth/240);
    setTimeout(getImages, 10);
  }
}
