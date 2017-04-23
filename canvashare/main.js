var canvas = document.getElementById('images');

function getImages() {
  return fetch('http://localhost:5000/api/gallery').then(function (response) {
    response.json().then(function (images) {
      for (i = 0; i < images.length; i++) {
        image = document.createElement('img');
        image.src = 'http://localhost:5000/api/drawing/' + images[i];
        image.className = 'image';
        canvas.append(image);
      }
    })
  })
}
