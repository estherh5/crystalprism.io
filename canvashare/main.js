// Define variables
var profileLink = document.getElementById('profile-link');
var accountLink = document.getElementById('account-link');
var signInLink = document.getElementById('sign-in-link');
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
function checkAccountStatus() {
  return fetch(server + '/user/verify', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('cptoken')},
    method: 'GET',
  }).catch(function (error) {
    accountLink.innerHTML = 'Create Account';
    signInLink.innerHTML = 'Sign In';
    signInLink.onclick = function() {
      sessionStorage.setItem('cppreviouswindow', '../../canvashare/index.html');
    }
  }).then(function (response) {
    if (response.ok) {
      profileLink.innerHTML = localStorage.getItem('cpusername');
      profileLink.href = '../user/index.html?username=' + localStorage.getItem('cpusername');
      accountLink.innerHTML = 'My Account';
      accountLink.href = '../user/my-account/index.html';
      signInLink.innerHTML = 'Sign Out';
      signInLink.onclick = function() {
        sessionStorage.setItem('cprequest', 'logout');
      }
    } else {
      localStorage.removeItem('cpusername');
      localStorage.removeItem('cptoken');
      accountLink.innerHTML = 'Create Account';
      signInLink.innerHTML = 'Sign In';
      signInLink.onclick = function() {
        sessionStorage.setItem('cppreviouswindow', '../../canvashare/index.html');
      }
    }
  })
}

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
          var imageLikes = document.createElement('div');
          imageLikes.className = 'image-likes';
          imageLikes.title = 'Likes';
          imageLikes.dataset.image = images[i];
          var imageDiv = document.createElement('div');
          imageDiv.className = 'image-div';
          var imageLink = document.createElement('a');
          imageLink.className = 'image-link';
          imageLink.href = 'javascript:delay("drawingapp/index.html")';
          var imageName = document.createElement('div');
          imageName.className = 'image-name';
          imageName.innerHTML = images[i].substr(images[i].indexOf('/')+1).split(/`|.png/)[0];
          var image = document.createElement('img');
          image.className = 'image';
          image.dataset.painter = images[i].substr(0, images[i].indexOf('/'));
          image.src = server + '/canvashare/drawing/' + images[i];
          var imageInfo = document.createElement('div');
          imageInfo.className = 'image-info';
          var imagePainter = document.createElement('div');
          imagePainter.className = 'image-painter';
          imagePainter.title = 'Painter';
          var imageViews = document.createElement('div');
          imageViews.className = 'image-views';
          imageViews.title = 'Views';
          imageViews.innerHTML = '<i class="fa fa-eye" aria-hidden="true"></i>';
          gallery.append(imageDiv);
          imageDiv.append(imageName);
          imageDiv.append(imageLink);
          imageLink.append(image);
          imageDiv.append(imageInfo);
          imageInfo.append(imageLikes);
          var likeText = document.createElement('text');
          likeText.dataset.image = images[i];
          imageLikes.append(likeText);
          imageInfo.append(imageViews);
          var viewText = document.createElement('text');
          viewText.dataset.image = images[i];
          imageViews.append(viewText);
          imageInfo.append(imagePainter);
          var painterLink = document.createElement('a');
          painterLink.href = '../user/index.html?username=' + images[i].substr(0, images[i].indexOf('/'));
          var painterText = document.createElement('text');
          painterText.className = 'painter-text';
          painterText.dataset.image = images[i];
          painterLink.append(painterText);
          imagePainter.append(painterLink);
          image.onclick = setImageValues;
          getInfo(images[i]);
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
      var unlikedHeart = document.createElement('i');
      unlikedHeart.classList.add('heart');
      unlikedHeart.classList.add('fa');
      unlikedHeart.classList.add('fa-heart-o');
      var likedHeart = document.createElement('i');
      likedHeart.classList.add('heart');
      likedHeart.classList.add('fa');
      likedHeart.classList.add('fa-heart');
      if (parsed['liked_users'].includes(localStorage.getItem('cpusername'))) {
        dataElements[0].insertBefore(likedHeart, dataElements[0].firstChild);
      } else {
        dataElements[0].insertBefore(unlikedHeart, dataElements[0].firstChild);
      }
      dataElements[0].getElementsByTagName('i')[0].onclick = setImageValues;
      dataElements[1].innerHTML = parsed['likes'];
      dataElements[2].innerHTML = parsed['views'];
      dataElements[3].innerHTML = parsed['painter'];
    })
  });
}

function delay(URL) {
  setTimeout(function () {window.location = URL}, 800);
}

function setImageValues() {
  if (this.classList.contains('image')) {
    sessionStorage.setItem('imageSrc', this.src);
    currentLikes = document.querySelectorAll('[data-image="' + this.src.split('/canvashare/drawing/')[1] + '"]')[1].innerHTML;
    currentViews = document.querySelectorAll('[data-image="' + this.src.split('/canvashare/drawing/')[1] + '"]')[2].innerHTML;
    imagePainter = this.dataset.painter;
    data = {'likes': parseInt(currentLikes), 'views': parseInt(currentViews) + 1};
    data = JSON.stringify(data);
    fetch(server + '/canvashare/drawinginfo/' + this.src.split('/canvashare/drawing/')[1].split('.png')[0], {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('cptoken'), 'Content-Type': 'application/json'},
      method: 'POST',
      body: data
    })
  } else if (this.classList.contains('fa-heart-o')) {
    heart = this;
    heart.classList.add('clicked');
    setTimeout(function() {
      heart.classList.remove('clicked');
    }, 500);
    likeText = this.nextSibling;
    currentLikes = likeText.innerHTML;
    currentViews = document.querySelectorAll('[data-image="' + this.nextSibling.dataset.image + '"]')[2].innerHTML;
    imagePainter = document.querySelectorAll('[data-image="' + this.nextSibling.dataset.image + '"]')[3].innerHTML;
    data = {'likes': (parseInt(currentLikes) + 1).toString(), 'views': (parseInt(currentViews)).toString()};
    data = JSON.stringify(data);
    fetch(server + '/canvashare/drawinginfo/' + this.nextSibling.dataset.image.split('.png')[0], {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('cptoken'), 'Content-Type': 'application/json'},
      method: 'POST',
      body: data
    }).catch(function (error) {
      window.alert('Your like did not go through. Please try again soon.')
    }).then(function (response) {
      if (response.ok) {
        likeText.innerHTML = parseInt(currentLikes) + 1;
        heart.classList.remove('fa-heart-o');
        heart.classList.add('fa-heart');
      } else {
        window.alert('You must log in to like a drawing.');
      }
    })
  } else if (this.classList.contains('fa-heart')) {
    heart = this;
    heart.classList.add('clicked');
    setTimeout(function() {
      heart.classList.remove('clicked');
    }, 500);
    likeText = this.nextSibling;
    currentLikes = likeText.innerHTML;
    currentViews = document.querySelectorAll('[data-image="' + this.nextSibling.dataset.image + '"]')[2].innerHTML;
    imagePainter = document.querySelectorAll('[data-image="' + this.nextSibling.dataset.image + '"]')[3].innerHTML;
    data = {'likes': parseInt(currentLikes) - 1, 'views': parseInt(currentViews)};
    data = JSON.stringify(data);
    fetch(server + '/canvashare/drawinginfo/' + this.nextSibling.dataset.image.split('.png')[0], {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('cptoken'), 'Content-Type': 'application/json'},
      method: 'POST',
      body: data
    }).catch(function (error) {
      window.alert('Your like did not go through. Please try again soon.')
    }).then(function (response) {
      if (response.ok) {
        heart.classList.remove('fa-heart');
        heart.classList.add('fa-heart-o');
        likeText.innerHTML = parseInt(currentLikes) - 1;
      } else {
        window.alert('You must log in to like a drawing.');
      }
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
