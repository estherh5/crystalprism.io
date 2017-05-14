var canvas = document.getElementById('images');
var title = document.getElementById('title');

title.onclick = sessionStorage.setItem('imageSrc', '');

function getImages() {
  return fetch('http://localhost:5000/api/gallery').then(function (response) {
    response.json().then(function (images) {
      for (i = 0; i < images.length; i++) {
        imageDiv = document.createElement('div');
        imageDiv.className = 'image-div';
        imageLink = document.createElement('a');
        imageLink.href = 'drawingapp/index.html';
        imageLink.className = 'image-link';
        imageName = document.createElement('div');
        imageName.innerHTML = images[i].split(/`|.png/)[0];
        imageName.className = 'image-name';
        image = document.createElement('img');
        image.src = 'http://localhost:5000/api/drawing/' + images[i];
        image.className = 'image';
        image.onclick = setImageSrc;
        canvas.append(imageDiv);
        imageDiv.append(imageLink);
        imageLink.append(imageName);
        imageLink.append(image);
      }
    })
  })
}

function setImageSrc(e) {
  sessionStorage.setItem('imageSrc', e.target.src);
}
