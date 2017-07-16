var canvas = document.getElementById('images');
var title = document.getElementById('title');
var requestStart = 0;
var requestEnd = 12;

title.onclick = sessionStorage.setItem('imageSrc', '');

function getImages() {
  return fetch('http://localhost:5000/api/gallery?start=' + requestStart + '&end=' + requestEnd).then(function (response) {
    response.json().then(function (images) {
      if (images.length != 0) {
        for (i = 0; i < images.length; i++) {
          views = document.createElement('text');
          views.id = images[i];
          getViews(images[i]);
          imageDiv = document.createElement('div');
          imageDiv.className = 'image-div';
          imageLink = document.createElement('a');
          imageLink.href = "javascript:delay('drawingapp/index.html')";
          imageLink.className = 'image-link';
          imageName = document.createElement('div');
          imageName.innerHTML = images[i].split(/`|.png/)[0];
          imageName.className = 'image-name';
          image = document.createElement('img');
          image.src = 'http://localhost:5000/api/drawing/' + images[i];
          image.className = 'image';
          image.onclick = setImageValues;
          imageViews = document.createElement('div');
          imageViews.innerHTML = 'Views: ';
          imageViews.className = 'image-views';
          canvas.append(imageDiv);
          imageDiv.append(imageLink);
          imageLink.append(imageName);
          imageLink.append(image);
          imageDiv.append(imageViews);
          imageViews.append(views);
        }
      }
    })
  })
}

function getViews(name) {
  return fetch('http://localhost:5000/api/drawinginfo/' + name.split('.png')[0]).then(function (response) {
    response.json().then(function (info) {
      document.getElementById(name).innerHTML = info;
    })
  });
}

function delay(URL) {
  setTimeout(function() {window.location = URL}, 800);
}

function setImageValues(e) {
  sessionStorage.setItem('imageSrc', e.target.src);
  currentViews = document.getElementById(e.target.src.split('/drawing/')[1]).innerHTML;
  data = {'views': (parseInt(currentViews) + 1).toString()};
  data = JSON.stringify(data);
  fetch('http://localhost:5000/api/drawinginfo/' + e.target.src.split('/drawing/')[1].split('.png')[0], {
    headers: {'Content-Type': 'application/json'},
    method: 'POST',
    body: data,
  })
}

window.onscroll = function () {
  if ((document.body.scrollTop + document.body.clientHeight) >= document.body.scrollHeight - 10) {
    requestStart = requestEnd;
    requestEnd = requestEnd + Math.floor(canvas.offsetWidth/240);
    setTimeout(getImages, 10);
  }
}
