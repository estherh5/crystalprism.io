var canvas = document.getElementById('images');
var title = document.getElementById('title');

title.onclick = sessionStorage.setItem('imageSrc', '');

function getImages() {
  return fetch('http://localhost:5000/api/gallery').then(function (response) {
    response.json().then(function (images) {
      for (i = 0; i < images.length; i++) {
        image = document.createElement('img');
        image.src = 'http://localhost:5000/api/drawing/' + images[i];
        image.className = 'image';
        image.onclick = setImageSrc;
        link = document.createElement('a');
        link.href = 'drawingapp/index.html';
        canvas.append(link);
        link.append(image);
      }
    })
  })
}

function setImageSrc(e) {
  sessionStorage.setItem('imageSrc', e.target.src);
}
