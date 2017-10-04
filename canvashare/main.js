// Define variables
var profileLink = document.getElementById('profile-link');
var accountLink = document.getElementById('account-link');
var signInLink = document.getElementById('sign-in-link');
var hoverTitles = ['"The world is but a canvas to our imagination." -Henry David Thoreau', '"Life is a great big canvas; throw all the paint you can at it." -Danny Kaye', '"A great artist can paint a great picture on a small canvas." -Charles Dudley Warner', '"I put on the canvas whatever comes into my mind." -Frida Kahlo', '"An empty canvas is a living wonder... far lovelier than certain pictures." -Wassily Kandinsky', '"I never know what I\'m going to put on the canvas. The canvas paints itself. I\'m just the middleman." -Peter Max', '"Cover the canvas at the first go, then work at it until you see nothing more to add." -Camille Pissarro', '"All I try to do is put as many colors as I can on the canvas every night." -Leslie Odom, Jr.', '"I was blown away by being able to color. Then I started to draw... bringing a blank white canvas to life was fascinating." James De La Vega'];
var galleryTitle = document.getElementById('gallery-title');
var draft = document.getElementById('drawing-draft');
var continueLink = document.getElementById('continue-drawing-link');
var continueOption = document.getElementById('continue-option');
var requestStart = 0;
var requestEnd = 12;
var errorMessage = null;
var gallery = document.getElementById('gallery');
var header = document.getElementById('header');
var open = false;
var plusIcon = document.getElementById('plus-icon');
var menu = document.getElementById('create-menu');
var newLink = document.getElementById('new-drawing-link');
if (window.location.hostname == 'crystalprism.io') {
  var server = 'http://13.58.175.191/api';
} else {
  var server = 'http://localhost:5000/api';
}

// Define events
sessionStorage.removeItem('drawing-title');
sessionStorage.removeItem('drawing-source');

window.addEventListener('load', checkAccountStatus, false);
window.addEventListener('load', setHoverTitle, false);
window.addEventListener('load', loadDrawings, false);

window.addEventListener('scroll', function() {
  if (window.pageYOffset > 60) {
    header.classList.add('shrink');
  } else if (header.classList.contains('shrink')) {
    header.classList.remove('shrink');
  }
}, false);

window.addEventListener('scroll', displayMoreDrawings, false);

window.onbeforeunload = toggleMenu;
plusIcon.onclick = toggleMenu;
newLink.onclick = setDrawingSource;

// Define functions
function checkAccountStatus() {
  if (localStorage.getItem('token') == null) {
    accountLink.innerHTML = 'Create Account';
    signInLink.innerHTML = 'Sign In';
    signInLink.onclick = function() {
      sessionStorage.setItem('previous-window', '../../canvashare/index.html');
    }
  } else {
    return fetch(server + '/user/verify', {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
      method: 'GET',
    }).catch(function(error) {
      accountLink.innerHTML = 'Create Account';
      signInLink.innerHTML = 'Sign In';
      signInLink.onclick = function() {
        sessionStorage.setItem('previous-window', '../../canvashare/index.html');
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
          sessionStorage.setItem('previous-window', '../../canvashare/index.html');
        }
      }
    })
  }
}

function setHoverTitle() {
  var randomNumber = Math.floor(Math.random() * hoverTitles.length);
  galleryTitle.title = hoverTitles[randomNumber];
}

function loadDrawings() {
  if (localStorage.getItem('drawing-source') != null) {
    draft.src = localStorage.getItem('drawing-source');
    continueLink.onclick = setDrawingSource;
    continueOption.classList.remove('hidden');
  }
  return fetch(server + '/canvashare/gallery?start=' + requestStart + '&end=' + requestEnd).catch(function(error) {
    if (errorMessage == null) {
      errorMessage = document.createElement('text');
      errorMessage.id = 'error-message';
      errorMessage.innerHTML = 'There was an error loading the CanvaShare gallery. Please refresh the page.';
      gallery.append(errorMessage);
    }
  }).then(function(response) {
    response.json().then(function(drawings) {
      if (drawings.length != 0) {
        for (var i = 0; i < drawings.length; i++) {
          var drawingLikes = document.createElement('div');
          drawingLikes.classList.add('drawing-likes');
          drawingLikes.title = 'Likes';
          drawingLikes.dataset.drawing = encodeURIComponent(drawings[i]);
          var drawingContainer = document.createElement('div');
          drawingContainer.classList.add('drawing-container');
          var drawingLink = document.createElement('a');
          drawingLink.classList.add('drawing-link');
          drawingLink.href = 'javascript:delay("drawingapp/index.html")';
          var drawingTitle = document.createElement('div');
          drawingTitle.classList.add('drawing-title');
          drawingTitle.innerHTML = drawings[i].substr(drawings[i].indexOf('/')+1).split(/`|.png/)[0];
          var drawing = document.createElement('img');
          drawing.classList.add('drawing');
          drawing.dataset.artist = drawings[i].substr(0, drawings[i].indexOf('/'));
          drawing.src = server + '/canvashare/drawing/' + encodeURIComponent(drawings[i]);
          var drawingInfo = document.createElement('div');
          drawingInfo.classList.add('drawing-info');
          var drawingArtist = document.createElement('div');
          drawingArtist.classList.add('drawing-artist');
          drawingArtist.title = 'Artist';
          var drawingViews = document.createElement('div');
          drawingViews.classList.add('drawing-views');
          drawingViews.title = 'Views';
          drawingViews.innerHTML = '<i class="fa fa-eye" aria-hidden="true"></i>';
          gallery.append(drawingContainer);
          drawingContainer.append(drawingTitle);
          drawingContainer.append(drawingLink);
          drawingLink.append(drawing);
          drawingContainer.append(drawingInfo);
          drawingInfo.append(drawingLikes);
          var likeText = document.createElement('text');
          likeText.dataset.drawing = encodeURIComponent(drawings[i]);
          drawingLikes.append(likeText);
          drawingInfo.append(drawingViews);
          var viewText = document.createElement('text');
          viewText.dataset.drawing = encodeURIComponent(drawings[i]);
          drawingViews.append(viewText);
          drawingInfo.append(drawingArtist);
          var artistLink = document.createElement('a');
          artistLink.href = '../user/index.html?username=' + drawings[i].substr(0, drawings[i].indexOf('/'));
          var artistText = document.createElement('text');
          artistText.classList.add('artist-text');
          artistText.dataset.drawing = encodeURIComponent(drawings[i]);
          artistLink.append(artistText);
          drawingArtist.append(artistLink);
          drawing.onclick = setDrawingValues;
          getInfo(encodeURIComponent(drawings[i]));
        }
      }
    })
  })
}

function getInfo(drawingFile) {
  return fetch(server + '/canvashare/drawinginfo/' + drawingFile.split('.png')[0]).then(function(response) {
    response.json().then(function(drawingInfo) {
      var parsed = JSON.parse(drawingInfo);
      var infoItems = document.querySelectorAll('[data-drawing="' + drawingFile + '"]');
      var unlikedHeart = document.createElement('i');
      unlikedHeart.classList.add('heart');
      unlikedHeart.classList.add('fa');
      unlikedHeart.classList.add('fa-heart-o');
      var likedHeart = document.createElement('i');
      likedHeart.classList.add('heart');
      likedHeart.classList.add('fa');
      likedHeart.classList.add('fa-heart');
      if (parsed['liked_users'].includes(localStorage.getItem('username'))) {
        infoItems[0].insertBefore(likedHeart, infoItems[0].firstChild);
      } else {
        infoItems[0].insertBefore(unlikedHeart, infoItems[0].firstChild);
      }
      infoItems[0].getElementsByTagName('i')[0].onclick = setDrawingValues;
      infoItems[1].innerHTML = parsed['likes'];
      infoItems[2].innerHTML = parsed['views'];
      infoItems[3].innerHTML = parsed['artist'];
    })
  });
}

function delay(URL) {
  setTimeout(function() {window.location = URL}, 800);
}

function setDrawingValues() {
  if (this.classList.contains('drawing')) {
    sessionStorage.setItem('drawing-source', this.src);
    sessionStorage.setItem('drawing-title', '[title]');
    currentLikes = document.querySelectorAll('[data-drawing="' + this.src.split('/canvashare/drawing/')[1] + '"]')[1].innerHTML;
    currentViews = document.querySelectorAll('[data-drawing="' + this.src.split('/canvashare/drawing/')[1] + '"]')[2].innerHTML;
    drawingArtist = this.dataset.artist;
    data = {'likes': parseInt(currentLikes), 'views': parseInt(currentViews) + 1};
    data = JSON.stringify(data);
    fetch(server + '/canvashare/drawinginfo/' + this.src.split('/canvashare/drawing/')[1].split('.png')[0], {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json'},
      method: 'POST',
      body: data
    })
  } else if (this.classList.contains('fa-heart-o')) {
    var heart = this;
    heart.classList.add('clicked');
    setTimeout(function() {
      heart.classList.remove('clicked');
    }, 500);
    likeText = this.nextSibling;
    currentLikes = likeText.innerHTML;
    currentViews = document.querySelectorAll('[data-drawing="' + this.nextSibling.dataset.drawing + '"]')[2].innerHTML;
    drawingArtist = document.querySelectorAll('[data-drawing="' + this.nextSibling.dataset.drawing + '"]')[3].innerHTML;
    data = {'likes': (parseInt(currentLikes) + 1).toString(), 'views': (parseInt(currentViews)).toString()};
    data = JSON.stringify(data);
    fetch(server + '/canvashare/drawinginfo/' + this.nextSibling.dataset.drawing.split('.png')[0], {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json'},
      method: 'POST',
      body: data
    }).catch(function(error) {
      window.alert('Your like did not go through. Please try again soon.')
    }).then(function(response) {
      if (response.ok) {
        likeText.innerHTML = parseInt(currentLikes) + 1;
        heart.classList.remove('fa-heart-o');
        heart.classList.add('fa-heart');
      } else {
        window.alert('You must log in to like a drawing.');
      }
    })
  } else if (this.classList.contains('fa-heart')) {
    var heart = this;
    heart.classList.add('clicked');
    setTimeout(function() {
      heart.classList.remove('clicked');
    }, 500);
    likeText = this.nextSibling;
    currentLikes = likeText.innerHTML;
    currentViews = document.querySelectorAll('[data-drawing="' + this.nextSibling.dataset.drawing + '"]')[2].innerHTML;
    drawingArtist = document.querySelectorAll('[data-drawing="' + this.nextSibling.dataset.drawing + '"]')[3].innerHTML;
    data = {'likes': parseInt(currentLikes) - 1, 'views': parseInt(currentViews)};
    data = JSON.stringify(data);
    fetch(server + '/canvashare/drawinginfo/' + this.nextSibling.dataset.drawing.split('.png')[0], {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json'},
      method: 'POST',
      body: data
    }).catch(function(error) {
      window.alert('Your like did not go through. Please try again soon.')
    }).then(function(response) {
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

function toggleMenu(e) {
  if (open) {
    plusIcon.classList.add('clicked');
    plusIcon.classList.remove('open');
    menu.classList.remove('visible');
    plusIcon.innerHTML = 'add_circle';
    open = false;
    setTimeout(function() {
      menu.classList.add('hidden');
      plusIcon.classList.remove('clicked');
    }, 500);
  } else if (e.target == plusIcon && !open) {
    plusIcon.classList.add('clicked');
    plusIcon.classList.add('open');
    menu.classList.remove('hidden');
    menu.classList.add('visible');
    plusIcon.innerHTML = 'remove_circle';
    open = true;
    setTimeout(function() {
      plusIcon.classList.remove('clicked');
    }, 500);
  }
}

function setDrawingSource() {
  sessionStorage.setItem('drawing-source', this.getElementsByTagName('img')[0].src);
  if (this == continueLink) {
    sessionStorage.setItem('drawing-title', localStorage.getItem('drawing-title'));
  } else {
    sessionStorage.setItem('drawing-title', '[title]');
  }
}

function displayMoreDrawings() {
  if ((document.body.scrollTop + document.body.clientHeight) >= document.body.scrollHeight - 10) {
    requestStart = requestEnd;
    requestEnd = requestEnd + Math.floor(gallery.offsetWidth/240);
    setTimeout(loadDrawings, 10);
  }
}
