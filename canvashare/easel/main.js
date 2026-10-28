// Define global variables
var drawingId = window.location.search.split('drawing=')[1];
var drawingTitle = document.getElementById('drawing-title');
var blankCanvas;
var canvasContext;
var drawingCanvas;
var stroke = 10; // Set size of drawing dot on canvas
var startPoint; // Starting point for user's drawing movement on the canvas
var drawing; // Drawing that user adds to canvas
var currentPaint;
var currentPalette;
var currentPaletteButton;
var enteredTitle;


// Define palettes of colors for drawing
var basic = ['#ff0000', '#ffa500', '#ffff00', '#008000', '#0000ff', '#800080'];
var pastel = ['#ffe4e7', '#ffc5a7', '#fff0a5', '#ffffa9', '#d2ffc5',
  '#cffeff'];
var seashore = ['#594f4f', '#547980', '#45ada8', '#9de0ad', '#e5fcc2',
  '#f9ebc2'];
var bold = ['#00a0b0', '#6a4a3c', '#cc333f', '#eb6841', '#edc951', '#a1ad1a'];
var oblique = ['#ca8484', '#ff3d7f', '#ff9e9d', '#8484ca', '#3fb8af',
  '#7fc7af'];
var contrast = ['#e3d1ff', '#cbe86b', '#f2e9e1', '#1c140d', '#f9abab',
  '#95d8e5'];
var calico = ['#f5f5c7', '#dce9be', '#555152', '#2e2633', '#99173c',
  '#46c2dd'];
var mauve = ['#413e4a', '#73626e', '#b38184', '#f0b49e', '#f7e4be', '#bce4bf'];
var grayscale = ['#ffffff', '#999999', '#666666', '#333333', '#111111',
  '#000000'];

/* Each paint's spoken name: a screen reader says "Paint red", not a hex */
var PAINT_NAMES = {
  '#ff0000': 'red',
  '#ffa500': 'orange',
  '#ffff00': 'yellow',
  '#008000': 'green',
  '#0000ff': 'blue',
  '#800080': 'purple',
  '#ffe4e7': 'pale pink',
  '#ffc5a7': 'peach',
  '#fff0a5': 'pale yellow',
  '#ffffa9': 'pale lemon',
  '#d2ffc5': 'mint',
  '#cffeff': 'pale aqua',
  '#594f4f': 'slate brown',
  '#547980': 'slate teal',
  '#45ada8': 'teal',
  '#9de0ad': 'seafoam',
  '#e5fcc2': 'pale lime',
  '#f9ebc2': 'sand',
  '#00a0b0': 'turquoise',
  '#6a4a3c': 'brown',
  '#cc333f': 'crimson',
  '#eb6841': 'coral',
  '#edc951': 'mustard',
  '#a1ad1a': 'olive',
  '#ca8484': 'dusty rose',
  '#ff3d7f': 'hot pink',
  '#ff9e9d': 'salmon',
  '#8484ca': 'periwinkle',
  '#3fb8af': 'teal',
  '#7fc7af': 'sage',
  '#e3d1ff': 'lavender',
  '#cbe86b': 'lime',
  '#f2e9e1': 'linen',
  '#1c140d': 'espresso',
  '#f9abab': 'light pink',
  '#95d8e5': 'sky blue',
  '#f5f5c7': 'ivory',
  '#dce9be': 'pale green',
  '#555152': 'dark gray',
  '#2e2633': 'aubergine',
  '#99173c': 'burgundy',
  '#46c2dd': 'cerulean',
  '#413e4a': 'charcoal',
  '#73626e': 'mauve',
  '#b38184': 'old rose',
  '#f0b49e': 'apricot',
  '#f7e4be': 'wheat',
  '#bce4bf': 'celadon',
  '#ffffff': 'white',
  '#999999': 'light gray',
  '#666666': 'gray',
  '#333333': 'dark gray',
  '#111111': 'off black',
  '#000000': 'black'
};

function paintLabel(color) {
  return 'Paint ' + (PAINT_NAMES[color] || color);
}


// Define load functions
window.onload = function() {
  /* Draw blank drawing on separate canvas to reference later (to ensure user
  is not posting a blank drawing) */
  var blankCanvasContext = document.getElementById('blank-canvas')
    .getContext('2d');
  setTimeout(function() {
    blankCanvasContext.drawImage(document.getElementById('blank'), 0, 0);
    return;
  }, 500);
  blankCanvas = new createjs.Stage(document.getElementById('blank-canvas'));

  /* Load initial drawing source if drawing id is not null (e.g., if user
  clicked a drawing from the gallery) */
  if (drawingId) {
    loadDrawing();
  }

  /* Load initial drawing as blank canvas if sessionStorage item is 'new'
  (i.e., if user chose to start a new drawing from gallery) */
  else if (sessionStorage.getItem('drawing-request') == 'new') {
    assembleEasel(document.getElementById('blank').src, '');
    sessionStorage.removeItem('drawing-request');
  }

  /* Load initial drawing and title as localStorage items if not null (e.g., if
  user came to easel page directly) */
  else if (localStorage.getItem('drawing-source')) {
    var title = '';

    // Set drawing title as localStorage item if not null
    if (localStorage.getItem('drawing-title')) {
      title = localStorage.getItem('drawing-title');
    }

    assembleEasel(localStorage.getItem('drawing-source'), title);
  }

  // Otherwise, load initial drawing as blank canvas
  else {
    assembleEasel(document.getElementById('blank').src, '');
  }

  // Create page header (from common.js script)
  createPageHeader();

  /* Check if user is logged in (from common.js script), then offer Post or
  a sign-in link */
  updatePostAccess();
  Promise.resolve(checkIfLoggedIn()).then(updatePostAccess);

  // Check if Crystal Prism API is online (from common.js script)
  pingServer(checkIfLoggedIn);

  // Create page footer (from common.js script)
  createPageFooter();

  return;
}


// Load drawing if specified in URL hash
function loadDrawing() {
  var canvasSlot = document.getElementById('canvas-slot');

  // Loading shows under the canvas from the first frame
  slotLoading(canvasSlot, 'Loading drawing…');

  return fetchWithTimeout(api + '/canvashare/drawing/' + drawingId)

    .then(function(response) {
      if (!response.ok) {
        throw new Error('Server answered ' + response.status);
      }

      // Remove server down banner from page (from common.js script)
      pingServer();

      return response.json();
    })

    .then(function(drawing) {
      clearSlotStatus(canvasSlot);

      // Load initial drawing with URL from server
      assembleEasel(drawing.url, '');

      // Store drawing in localStorage for offline loading
      try {
        localStorage.setItem('drawing-' + drawingId, JSON.stringify(drawing));
      } catch (e) {}

      return;
    })

    .catch(function() {
      // Display cached drawing if it is stored in localStorage
      try {
        var cached = JSON.parse(localStorage.getItem('drawing-' + drawingId));
      } catch (e) {
        var cached = null;
      }

      if (cached) {
        clearSlotStatus(canvasSlot);
        assembleEasel(cached.url, '');
        return;
      }

      // Otherwise the failure shows under the canvas, with Retry
      slotFailure(canvasSlot, "Couldn't load this drawing.", loadDrawing);

      return;
    });
}


// Post shows only to a signed-in artist; anyone else gets a way to sign in
function updatePostAccess() {
  var signedIn = !!localStorage.getItem('username');
  var post = document.getElementById('post');
  var signIn = document.getElementById('post-sign-in');

  post.hidden = !signedIn;
  signIn.hidden = signedIn;
  signIn.href = signInHref();

  if (!signedIn) {
    clearInlineError(post);
  }

  return;
}


// Set up drawing space with passed drawing source and title
function assembleEasel(drawingSrc, title) {
  /* Create new image as initial starting drawing and set CORS requests as
  anonymous (no credentials required to display image) */
  var initialDrawing = new Image();
  initialDrawing.crossOrigin = 'Anonymous';

  // Set initial drawing title to passed title
  drawingTitle.value = title;

  /* Set drawing source to passed drawing source, including unique identifier
  at the end of URL (for non-locally-stored images) to prevent CORS block */
  if (drawingSrc.includes('https://')) {
    initialDrawing.src = drawingSrc + '?=' + new Date().getTime();
  } else {
    initialDrawing.src = drawingSrc;
  }

  // Add initial drawing to HTML canvas
  canvasContext = document.getElementById('canvas').getContext('2d');
  setTimeout(function() {
    canvasContext.drawImage(initialDrawing, 0, 0);
    return;
  }, 500);

  // Create EaselJS stage to render to canvas
  drawingCanvas = new createjs.Stage(document.getElementById('canvas'));

  /* Prevent stage from automatically clearing after each drawing mark on
  canvas */
  drawingCanvas.autoClear = false;

  // Enable event listeners that stage adds to DOM events
  drawingCanvas.enableDOMEvents(true);

  // Enable touch interaction with stage/canvas
  createjs.Touch.enable(drawingCanvas);

  // Add event listeners for clicking canvas to draw and save drawing
  drawingCanvas.addEventListener('stagemousedown', startBrushStroke, false);
  drawingCanvas.addEventListener('stagemouseup', endBrushStroke, false);
  drawingCanvas.addEventListener('stagemouseup', saveData, false);

  // Add EaselJS shape to canvas to add vector graphics as user draws
  drawing = new createjs.Shape();
  drawingCanvas.addChild(drawing);
  drawingCanvas.update();

  // Create SVG palette and set starting palette as basic
  var svgPalette = Snap('#current-palette');
  currentPalette = basic;

  // Create colored circles for each color in the palette
  for (var i = 0; i < currentPalette.length; i++) {
    // Paints sit 15% apart so each one's 44px tap circle has room
    var paint = svgPalette.circle(12.5 + (15 * i) + '%', '50%', '4%')
      .attr({fill: currentPalette[i], 'data-color': currentPalette[i]}).node;
    paint.classList.add('paint');
    svgPalette.append(paint);

    // A transparent 44px circle on top takes the tap for the small paint
    var paintHit = svgPalette.circle(12.5 + (15 * i) + '%', '50%', 22)
      .attr({fill: 'transparent'}).node;
    paintHit.classList.add('paint-hit');
    paintHit.setAttribute('aria-hidden', 'true');
    paintHit.onclick = (function(target) {
      return function() {
        target.dispatchEvent(new MouseEvent('click', {bubbles: true}));
        return;
      };
    })(paint);
    svgPalette.append(paintHit);

    // Update user's paint color on canvas when color is clicked
    paint.onclick = updatePaint;
    keyboardButton(paint, paintLabel(currentPalette[i]));
    paint.setAttribute('aria-pressed', i == 0 ? 'true' : 'false');
  }

  // Set user's current paint color as first color in palette
  currentPaint = document.getElementsByClassName('paint')[0];
  currentPaint.classList.add('selected');

  // Update user's cursor on canvas with current paint color
  updateBrush();

  // Display current palette's button as selected
  currentPaletteButton = document.getElementsByClassName('palette')[0];
  currentPaletteButton.classList.add('selected');
  currentPaletteButton.setAttribute('aria-pressed', 'true');

  // Update drawing's view count after drawing loads
  if (drawingId) {
    updateViews();
  }

  return;
}


// Update palette colors when user clicks palette option
for (var i = 0; i < document.getElementsByClassName('palette').length; i++) {
  document.getElementsByClassName('palette')[i].addEventListener('click',
    updatePalette, false);
}

function updatePalette() {
  // Nothing to act on until the easel has a drawing (its load can fail)
  if (!drawingCanvas) {
    return;
  }

  /* Remove selected class from previous palette button and add it to clicked
  palette button */
  currentPaletteButton.classList.remove('selected');
  currentPaletteButton.setAttribute('aria-pressed', 'false');
  currentPaletteButton = this;
  currentPaletteButton.classList.add('selected');
  currentPaletteButton.setAttribute('aria-pressed', 'true');

  /* Set current palette as data-palette item from clicked button (looked up by
  name; eval would need 'unsafe-eval' in the Content-Security-Policy) */
  currentPalette = {basic: basic, pastel: pastel, seashore: seashore,
    bold: bold, oblique: oblique, contrast: contrast, calico: calico,
    mauve: mauve, grayscale: grayscale}[currentPaletteButton.dataset.palette];

  // Remove selected class from previously selected paint color
  currentPaint.classList.remove('selected');

  // Update palette colors with new palette's colors
  for (var i = 0; i < document.getElementsByClassName('paint').length; i++) {
    document.getElementsByClassName('paint')[i].setAttribute('fill',
      currentPalette[i]);
    document.getElementsByClassName('paint')[i].setAttribute('data-color',
      currentPalette[i]);
    document.getElementsByClassName('paint')[i].setAttribute('aria-label',
      paintLabel(currentPalette[i]));
    document.getElementsByClassName('paint')[i].setAttribute('aria-pressed',
      i == 0 ? 'true' : 'false');
    document.getElementsByClassName('paint')[i].classList.remove('outline');
    // Add outline around white color in palette
    if (currentPalette[i] == '#ffffff') {
      document.getElementsByClassName('paint')[i].classList.add('outline');
    }
  }

  /* Set first paint color as selected paint and update user's cursor on canvas
  to reflect color */
  currentPaint = document.getElementsByClassName('paint')[0];
  currentPaint.classList.add('selected');
  updateBrush();

  return;
}


// Update current paint color to paint user clicks
function updatePaint() {
  /* Remove selected class from previously selected paint color and add it to
  clicked paint color */
  currentPaint.classList.remove('selected');
  currentPaint.setAttribute('aria-pressed', 'false');
  currentPaint = this;
  currentPaint.classList.add('selected');
  currentPaint.setAttribute('aria-pressed', 'true');

  // Update user's cursor on canvas to reflect color
  updateBrush();

  return;
}


// Update user's cursor on canvas to clicked paint color in palette
function updateBrush() {
  // Remove previous cursor color
  document.getElementById('canvas').style.cursor = '';

  /* Turn cursor color circle SVG into string and append to cursor canvas using
  canvg */
  var brushCanvas = document.getElementById('brush');
  var brushCursor = document.getElementById('brush-cursor');
  brushCursor.setAttribute('fill', currentPaint.dataset.color);
  brushCursor.setAttribute('r', stroke/2);

  // Set cursor outline to black/white if selected paint color is light/dark
  var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i
    .exec(currentPaint.dataset.color);
  var r = parseInt(rgb[1], 16);
  var g = parseInt(rgb[2], 16);
  var b = parseInt(rgb[3], 16);

  if (r + g + b > 382) {
    brushCursor.setAttribute('stroke', '#000000');
  } else {
    brushCursor.setAttribute('stroke', '#ffffff');
  }

  var XMLS = new XMLSerializer();
  var brushSVG = XMLS.serializeToString(document.getElementById('brush-svg'));
  canvg(brushCanvas, brushSVG);

  // Set cursor style as data URI of cursor canvas that is size of stroke
  document.getElementById('canvas').style.cursor = 'url(' + brushCanvas
    .toDataURL() + ') ' + stroke + ' ' + stroke + ', auto';

  return;
}


// Begin brush stroke when user clicks on canvas
function startBrushStroke(event) {
  /* Do nothing if this is not the first touch on touchscreen (always true for
  mouse event) */
  if (!event.primary) {
    return;
  }

  // Get the point the user clicked on the canvas
  startPoint = new createjs.Point(drawingCanvas.mouseX, drawingCanvas.mouseY);

  /* Clone start point to have as middle point when drawing curve in moveBrush
  function */
  midPoint = startPoint.clone();

  // Draw a circle at the point the user clicked on the canvas
  drawing.graphics.clear().beginFill(currentPaint.dataset.color)
    .drawCircle(drawingCanvas.mouseX, drawingCanvas.mouseY, stroke/2);
  drawingCanvas.update();

  // Add mouse movement listener as user drags mouse to draw on canvas
  drawingCanvas.addEventListener('stagemousemove', moveBrush);

  return;
}


// Continue brush stroke as user drags mouse across canvas
function moveBrush(event) {
  /* Do nothing if this is not the first touch on touchscreen (always true for
  mouse event) */
  if (!event.primary) {
    return;
  }

  /* Set the end point for the stroke (start point + point the user moves to
  on the canvas, shifted 1 bit) */
  var endPoint = new createjs.Point(startPoint.x + drawingCanvas
    .mouseX >> 1, startPoint.y + drawingCanvas.mouseY >> 1);

  // Draw curve from start point to end point, through mid point
  drawing.graphics.clear().setStrokeStyle(stroke, 'round', 'round')
    .beginStroke(currentPaint.dataset.color).moveTo(endPoint.x, endPoint.y)
    .curveTo(startPoint.x, startPoint.y, midPoint.x, midPoint.y);

  // Set new start point as current mouse location for next time function runs
  startPoint.x = drawingCanvas.mouseX;
  startPoint.y = drawingCanvas.mouseY;

  // Set mid point to end point for next time function runs
  midPoint.x = endPoint.x;
  midPoint.y = endPoint.y;
  drawingCanvas.update();

  return;
}


// Remove mouse movement listener when user releases mouse on canvas
function endBrushStroke(event) {
  /* Do nothing if this is not the first touch on touchscreen (always true for
  mouse event) */
  if (!event.primary) {
    return;
  }

  drawingCanvas.removeEventListener('stagemousemove', moveBrush);

  return;
}


// Update drawing's view count when drawing first loads
function updateViews() {
  // Send request to server to update view count
  return fetch(api + '/canvashare/drawing/' + drawingId, {
    method: 'PATCH',
  });
}


/* Save drawing source and title to localStorage when user draws on canvas and
types in drawing title */
drawingTitle.onkeyup = saveData;

function saveData() {
  localStorage.setItem('drawing-source', drawingCanvas.toDataURL());
  localStorage.setItem('drawing-title', drawingTitle.value);
  return;
}


// Clear drawing title if it contains no non-space characters
window.onclick = clearEmptyTitle;

function clearEmptyTitle(e) {
  /* If user clicks anywhere on page that is not the drawing title, clear the
  drawing title if there are no non-space characters */
  if (!drawingTitle.contains(e.target)) {
    if (!/\S/.test(drawingTitle.value)) {
      drawingTitle.value = '';
    }
  }

  return;
}


// Clear drawing when user clicks Clear button, after an in-page confirmation
document.getElementById('clear').onclick = function() {
  if (!drawingCanvas) {
    return;
  }

  inlineConfirm(this, 'Clear your drawing?', 'Clear', clearDrawing,
    document.getElementById('drawing-actions'));
  return;
}

function clearDrawing() {
  // Clear drawing canvas
  drawingCanvas.clear();

  // Add blank white drawing to main canvas
  canvasContext.drawImage(document.getElementById('blank'), 0, 0);

  // Set title to default
  drawingTitle.value = '';

  // Remove localStorage items for drawing title and source
  localStorage.removeItem('drawing-source');
  localStorage.removeItem('drawing-title');

  return;
}


// Post drawing to gallery when user clicks Post button
document.getElementById('post').onclick = postDrawing;

function postDrawing() {
  // Nothing to act on until the easel has a drawing (its load can fail)
  if (!drawingCanvas) {
    return;
  }

  var post = document.getElementById('post');
  var actions = document.getElementById('drawing-actions');
  clearInlineError(post);
  clearInlineError(drawingTitle);

  /* If user is not logged in, swap Post for the sign-in link (the button
  only shows to signed-in artists, but a session can end in another tab) */
  if (!localStorage.getItem('username')) {
    updatePostAccess();
    return;
  }

  // If drawing is blank, say so beside the button
  if (drawingCanvas.toDataURL() == blankCanvas.toDataURL()) {
    inlineError(post, 'Your drawing is blank. Draw something, then post it.',
      actions);
    return;
  }

  // A drawing needs a title: ask for one at the title field
  if (!/\S/.test(drawingTitle.value)) {
    inlineError(drawingTitle, 'Give your drawing a title, then post it.');
    drawingTitle.focus();
    return;
  }

  // Otherwise, send data URI of drawing to server
  var data = JSON.stringify({'drawing': drawingCanvas.toDataURL(),
    'title': drawingTitle.value});

  /* Disable menu buttons and set cursor style to waiting until server request
  goes through */
  var restorePost = setBusy(post, 'Posting…');
  document.getElementById('clear').disabled = true;
  document.getElementById('download').disabled = true;
  document.body.style.cursor = 'wait';

  function reset() {
    restorePost();
    document.getElementById('clear').disabled = false;
    document.getElementById('download').disabled = false;
    document.body.style.cursor = '';
    return;
  }

  return fetchWithTimeout(api + '/canvashare/drawing', {
    credentials: 'include',
    headers: {'Content-Type': 'application/json'},
    method: 'POST',
    body: data,
  })

    .then(function(response) {
      // Remove server down banner from page (from common.js script)
      pingServer();

      /* If drawing was posted successfully, clear drawing from easel and
      storage items and redirect to gallery page */
      if (response.status == 201) {
        clearDrawing();
        window.location = '../';
        reset();
        return;
      }

      reset();

      // If drawing is not unique, say so beside the button
      if (response.status == 409) {
        inlineError(post, 'This drawing is already in the gallery. Change ' +
          'something and post again.', actions);
        return;
      }

      // If server rejects the drawing (e.g. HTML in title), show its reason
      if (response.status == 400) {
        return response.text().then(function(reason) {
          inlineError(post, reason, actions);
          return;
        });
      }

      // A signed-out answer means the session ended: offer sign-in instead
      if (response.status == 401 || response.status == 403) {
        localStorage.removeItem('username');
        updatePostAccess();
        return;
      }

      // Any other answer is the server's fault: say so beside the button
      inlineError(post, "Your drawing didn't post. Try again in a moment.",
        actions);
      return;
    }, function() {
      // Add server down banner to page (from common.js script)
      pingServer(checkIfLoggedIn);

      reset();
      inlineError(post, "Your drawing didn't post. Check your connection " +
        'and try again.', actions);
      return;
    });
}


// Download drawing when user clicks Download button
document.getElementById('download').onclick = downloadDrawing;

function downloadDrawing(e) {
  // Nothing to act on until the easel has a drawing (its load can fail)
  if (!drawingCanvas) {
    return;
  }

  clearInlineError(drawingTitle);

  // A download needs a file name: ask for a title at the title field
  if (!/\S/.test(drawingTitle.value)) {
    if (e) {
      e.preventDefault();
    }
    document.getElementById('download-link').removeAttribute('href');
    inlineError(drawingTitle, 'Give your drawing a title, then download it.');
    drawingTitle.focus();
    return;
  }

  // Set download URL to data URI of drawing and file name to drawing title
  document.getElementById('download-link').href = drawingCanvas.toDataURL();
  document.getElementById('download-link').download = drawingTitle.value;

  return;
}
