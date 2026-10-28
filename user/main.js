// Define global variables
/* Requested profile username, or null if it is missing or not a valid
username (letters, digits, underscore, hyphen) */
var username = new URLSearchParams(window.location.search).get('username');
if (!/^[a-zA-Z0-9_-]+$/.test(username || '')) {
  username = null;
}
var drawingStart = 0; // Range start for number of drawings to request from API
var drawingEnd = 4; // Range end for number of drawings to request from API
var moreDrawingsToDisplay = false; // If there are more drawings to display from API
var postStart = 0; // Range start for number of posts to request from API
var postEnd = 4; // Range end for number of posts to request from API
var morePostsToDisplay = false; // If there are more posts to display from API
var commentStart = 0; // Range start for number of comments to request from API
var commentEnd = 4; // Range end for number of comments to request from API
var moreCommentsToDisplay = false; // If there are more comments to display from API
var gallery = document.getElementById('gallery');
var drawingsButton = document.getElementById('drawings');
var postList = document.getElementById('post-list');
var postsButton = document.getElementById('posts');
var commentList = document.getElementById('comment-list');
var commentsButton = document.getElementById('comments');


// Define load functions
window.onload = function() {
  // Show the not-found state without contacting the server
  if (username === null) {
    createPageHeader();
    document.getElementById('header').classList.add('divider');
    checkIfLoggedIn();
    createPageFooter();
    document.getElementById('profile-title').textContent = 'User does not exist';
    document.title = 'Not found · Crystal Prism';
    return;
  }

  /* The tab and the heading name the profile from the first frame, so a
  profile that fails to load still says whose it is */
  document.title = username + ' · Crystal Prism';
  document.getElementById('profile-title').textContent = username;

  // Create page header (from common.js script)
  createPageHeader();

  // Apply additional style to header
  document.getElementById('header').classList.add('divider');

  /* Check if user is logged in (from common.js script) before loading the
  profile, so own likes render against the verified username on a first visit
  to this origin */
  Promise.resolve(checkIfLoggedIn()).then(function() {
    // Load profile user's personal information from server
    loadPersonalInfo();

    // Load user's drawings from server
    loadDrawings();
  });

  // Check if Crystal Prism API is online (from common.js script)
  pingServer(retryFunctions);

  // Create page footer (from common.js script)
  createPageFooter();

  return;
}


// Functions to run when Retry button is clicked from server down banner
function retryFunctions() {
  checkIfLoggedIn();

  loadPersonalInfo();

  if (drawingsButton.classList.contains('selected')) {
    loadDrawings();
  }
  else if (postsButton.classList.contains('selected')) {
    loadPosts();
  }
  else {
    loadComments();
  }

  return;
}


// Load profile user's personal information from server
function loadPersonalInfo() {
  var infoSlot = document.getElementById('user-link-row').firstElementChild;

  // Loading shows under the name from the first frame, unless info is shown
  if (!document.getElementById('profile-title').textContent) {
    slotLoading(infoSlot, 'Loading profile…');
  }

  return fetchWithTimeout(api + '/user/' + encodeURIComponent(username))

    .then(function(response) {
      // Display error if server responds with error
      if (!response.ok) {
        clearSlotStatus(infoSlot);
        document.getElementById('profile-title').textContent =
          'User does not exist';
        document.title = 'Not found · Crystal Prism';
        return;
      }

      return response.json().then(function(info) {
        clearSlotStatus(infoSlot);
        displayPersonalInfo(info);

        // Store info in localStorage for offline loading
        try {
          localStorage.setItem(username + '-profile', JSON.stringify(info));
        } catch (e) {}

        return;
      });
    })

    .catch(function() {
      // Display cached information if it is stored in localStorage
      try {
        var cached = JSON.parse(localStorage.getItem(username + '-profile'));
      } catch (e) {
        var cached = null;
      }

      if (cached) {
        clearSlotStatus(infoSlot);
        displayPersonalInfo(cached);
        return;
      }

      // Otherwise the failure shows where the profile would be, with Retry
      slotFailure(infoSlot, "Couldn't load this profile.", loadPersonalInfo);
      return;
    });
}


/* Load one page of a profile list (drawings, posts or comments) into its
slot: Loading from the first frame, the page on success, cached items if the
first page fails and some are stored, and otherwise a failure with Retry
below whatever page is already showing */
function loadContent(list) {
  var start = list.start();
  var end = list.end();
  list.loading = true;
  slotLoading(list.slot, 'Loading ' + list.noun + '…');

  return fetchWithTimeout(list.url(start, end), list.options)

    .then(function(response) {
      if (!response.ok) {
        throw new Error('Server answered ' + response.status);
      }

      // Remove server down banner from page (from common.js script)
      pingServer();

      return response.json();
    })

    .then(function(items) {
      list.loading = false;
      clearSlotStatus(list.slot);

      // Display message if user has none
      if (items.length == 0) {
        list.slot.textContent = 'There are no ' + list.noun +
          ' for this user.';
        return;
      }

      /* Assess if there are more than requested items - 1 (number of loaded
      items) on server */
      var more = items.length > (end - start - 1);
      list.setMore(more);
      list.display(items.slice(0, more ? end - start - 1 : items.length));

      // Store items in localStorage for offline loading
      try {
        var stored = start == 0 ? [] : JSON.parse(localStorage
          .getItem(username + list.cacheKey)) || [];
        for (var i = 0; i < items.length; i++) {
          stored[start + i] = items[i];
        }
        localStorage.setItem(username + list.cacheKey, JSON.stringify(stored));
      } catch (e) {}

      return;
    })

    .catch(function() {
      list.loading = false;

      // On the first page, cached items stand in if they are stored
      if (start == 0) {
        try {
          var cached = JSON.parse(localStorage
            .getItem(username + list.cacheKey) || '[]');
        } catch (e) {
          var cached = [];
        }

        if (cached.length) {
          clearSlotStatus(list.slot);
          list.setMore(cached.length > end - 1);
          list.display(cached.slice(0, end - 1));
          return;
        }
      }

      slotFailure(list.slot, "Couldn't load " + list.noun + '.', function() {
        loadContent(list);
      });
      return;
    });
}

var drawingsList = {
  noun: 'drawings',
  slot: gallery,
  cacheKey: '-profile-drawings',
  start: function() { return drawingStart; },
  end: function() { return drawingEnd; },
  url: function(start, end) {
    return api + '/canvashare/drawings/' + encodeURIComponent(username) +
      '?start=' + start + '&end=' + end;
  },
  setMore: function(more) { moreDrawingsToDisplay = more; },
  display: function(items) { displayDrawings(items); },
};

var postsList = {
  noun: 'posts',
  slot: postList,
  cacheKey: '-profile-posts',
  start: function() { return postStart; },
  end: function() { return postEnd; },
  url: function(start, end) {
    return api + '/thought-writer/posts/' + encodeURIComponent(username) +
      '?start=' + start + '&end=' + end;
  },
  setMore: function(more) { morePostsToDisplay = more; },
  display: function(items) { displayPosts(items); },
};

var commentsList = {
  noun: 'comments',
  slot: commentList,
  cacheKey: '-profile-comments',
  start: function() { return commentStart; },
  end: function() { return commentEnd; },
  url: function(start, end) {
    return api + '/thought-writer/comments/user/' +
      encodeURIComponent(username) + '?start=' + start + '&end=' + end;
  },
  setMore: function(more) { moreCommentsToDisplay = more; },
  display: function(items) { displayComments(items); },
};


// Display passed info on user's profile page
function displayPersonalInfo(info) {
  /* Set profile username display and page title to requested
  username */
  document.getElementById('user-link').href = '?username=' + encodeURIComponent(info['username']);
  document.getElementById('profile-title').textContent = info['username'];
  document.title = info['username'] + ' · Crystal Prism';

  /* Populate user's about me blurb, name, email address, background
  color, and icon color */
  if (info['about']) {
    document.getElementById('about-blurb').textContent = info['about'];
  } else {
    document.getElementById('about-row').classList.add('hidden');
  }

  if (info['first_name']) {
    document.getElementById('name')
      .textContent = info['first_name'] + ' ' + info['last_name'];
  } else {
    document.getElementById('name-row').classList.add('hidden');
  }

  if (info['email']) {
    document.getElementById('email').textContent = info['email'];
    document.getElementById('email').href = 'mailto:' + info['email'];
  } else {
    document.getElementById('email-row').classList.add('hidden');
  }

  document.body.style.backgroundColor = info['background_color'];
  document.getElementById('diamond').style.fill = info['icon_color'];

  // Update profile content font color based on background color
  updateFontColors(info['background_color']);

  // Update icon background color based on icon color
  updateIconBackground(info['icon_color']);

  /* Refresh profile icon rendering to eliminate SVG artifacts in
  Safari */
  document.getElementById('profile-icon').style.webkitTransform = 'scale(1)';

  /* Convert UTC timestamp from server to local timestamp in
  'MM/DD/YYYY' format */
  document.getElementById("member-stat").innerHTML = 'Member since ' +
    moment(info['created']).format('MM/DD/YYYY');

  // Display high scores for Rhythm of Life and Shapes in Rain
  document.getElementById('shapes-stat').textContent =
    String(Number(info['shapes_high_score']) || 0);

  // Display Rhythm lifespan from score
  var sec_num = Number(info['rhythm_high_score']) || 0;
  var score_hours = Math.floor(sec_num / 3600);
  var score_minutes = Math.floor((sec_num - (score_hours * 3600)) / 60);
  var score_seconds = sec_num - (score_hours * 3600) - (score_minutes * 60);
  var lifespan_value = ('0' + score_hours).slice(-2) + ':' +
    ('0' + score_minutes).slice(-2) + ':' + ('0' + score_seconds).slice(-2);
  document.getElementById('rhythm-stat').textContent = lifespan_value;

  /* The score rows show only once there are scores to show: a failed load
  never passes a placeholder 0 off as a real score */
  document.getElementById('rhythm-row').classList.remove('hidden');
  document.getElementById('shapes-row').classList.remove('hidden');

  return;
}


/* Assess darkness of user's profile icon color and adjust icon background
color to black/white in response */
function updateIconBackground(iconColor) {
  var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(iconColor);
  var r = parseInt(rgb[1], 16);
  var g = parseInt(rgb[2], 16);
  var b = parseInt(rgb[3], 16);

  if (r + g + b > 670) {
    document.getElementById('profile-icon').style.backgroundColor = '#000000';
    return;
  } else {
    document.getElementById('profile-icon').style.backgroundColor = '#ffffff';
  }

  return;
}


/* Assess darkness of passed color variable and adjust font color of profile
content to white/black in response */
function updateFontColors(color) {
  var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i
    .exec(color);
  var r = parseInt(rgb[1], 16);
  var g = parseInt(rgb[2], 16);
  var b = parseInt(rgb[3], 16);

  // Change page and footer font color to white if background color is dark
  if (r + g + b < 382) {
    document.getElementById('profile-container').style.color = '#ffffff';
    document.getElementById('footer').style.color = '#ffffff';
  }

  // Otherwise, leave font color as default (black)
  return;
}


// Load profile user's drawings from server
function loadDrawings() {
  return loadContent(drawingsList);
}


// Display passed drawings to user's profile gallery
function displayDrawings(drawings) {
  // Clear gallery to display new drawings
  gallery.innerHTML = '';

  for (var i = 0; i < drawings.length; i++) {
    // Create container for drawing and its components
    var drawingContainer = document.createElement('div');
    drawingContainer.classList.add('drawing-container');

    /* Set data-number attribute to track the drawing number for
    displaying more drawings later */
    drawingContainer.dataset.number = drawingStart + i;

    // Create container for drawing title
    var drawingTitle = document.createElement('a');
    drawingTitle.classList.add('drawing-title');
    drawingTitle.href = appUrl('canvashare', 'easel/?drawing=' +
      drawings[i]['drawing_id']);
    drawingTitle.textContent = drawings[i]['title'];

    // Create drawing image
    var drawing = document.createElement('img');
    drawing.classList.add('drawing');
    drawing.src = drawings[i]['url'];
    drawing.title = 'View drawing';

    /* Set data-drawing attribute as drawing id for later
    identification */
    drawing.dataset.drawing = drawings[i]['drawing_id'];

    // Go to easel page for drawing if user clicks drawing
    drawing.onclick = function() {
      window.location = appUrl('canvashare', 'easel/?drawing=' +
        this.dataset.drawing);
      return;
    }

    /* Create container for drawing artist and number of likes and
    views */
    var drawingInfo = document.createElement('div');
    drawingInfo.classList.add('drawing-info');

    // Create container for number of drawing likes
    var drawingLikes = document.createElement('div');
    drawingLikes.classList.add('drawing-likes');
    drawingLikes.title = 'Likes';

    // Create text to display number of likes
    var likeText = document.createElement('text');
    likeText.textContent = String(Number(drawings[i]['like_count']) || 0);

    /* Set data-drawing attribute as drawing id for later
    identification */
    likeText.dataset.drawing = 'likes' + drawings[i]['drawing_id'];

    // Set likers to list of users who liked drawing
    var likers = drawings[i]['likers'];

    // Create drawing views container
    var drawingViews = document.createElement('div');
    drawingViews.classList.add('drawing-views');
    drawingViews.title = 'Views';

    // Create eye icon to display with drawing views
    var viewsIcon = document.createElement('i');
    viewsIcon.classList.add('far');
    viewsIcon.classList.add('fa-eye');

    // Create text to display number of views
    var viewText = document.createElement('text');
    viewText.textContent = String(Number(drawings[i]['views']) || 0);

    gallery.appendChild(drawingContainer);
    drawingContainer.appendChild(drawingTitle);
    drawingContainer.appendChild(drawing);
    drawingContainer.appendChild(drawingInfo);
    drawingInfo.appendChild(drawingLikes);
    drawingLikes.appendChild(likeText);
    drawingInfo.appendChild(drawingViews);
    drawingViews.appendChild(viewsIcon);
    drawingViews.appendChild(viewText);

    // Display drawing like hearts
    displayDrawingLikes(drawings[i]['drawing_id'], likers);
  }

  /* If first drawing displayed in gallery is not drawing 0 (i.e.,
  there are lower-numbered drawings to display), display left
  navigation arrow */
  if (gallery.getElementsByClassName('drawing-container')[0]
    .dataset.number != 0) {
      document.getElementById('drawing-left-arrow').classList.add('display');
    }

  // Otherwise, hide left arrow
  else {
    document.getElementById('drawing-left-arrow').classList.remove('display');
  }

  /* If there are more drawings on the server, display right
  navigation arrow */
  if (moreDrawingsToDisplay) {
    document.getElementById('drawing-right-arrow').classList.add('display');
  }

  // Otherwise, hide right arrow
  else {
    document.getElementById('drawing-right-arrow').classList.remove('display');
  }

  return;
}


// Display drawing like hearts for passed drawing
function displayDrawingLikes(drawingId, likers) {
  // Get likes text that has data-drawing attribute set as drawing id
  var likeText = document
    .querySelectorAll('[data-drawing="likes' + drawingId + '"]')[0];

  /* If current user liked the drawing, display a filled-in red heart in
  likes container */
  for (var i = 0; i < likers.length; i++) {

    if (likers[i]['username'] == localStorage.getItem('username')) {
      var likedHeart = document.createElement('i');
      likedHeart.classList.add('fas');
      likedHeart.classList.add('fa-heart');
      likedHeart.dataset.drawinglike = likers[i]['drawing_like_id'];
      likedHeart.dataset.drawing = drawingId;
      likeText.parentNode.insertBefore(likedHeart, likeText);

      // Update like count when user clicks heart
      likedHeart.onclick = updateLikes;
      keyboardButton(likedHeart, 'Like');
      likedHeart.setAttribute('aria-pressed', 'true');

      return;
    }
  }

  // Otherwise, display an empty heart outline
  var unlikedHeart = document.createElement('i');
  unlikedHeart.classList.add('far');
  unlikedHeart.classList.add('fa-heart');
  likeText.parentNode.insertBefore(unlikedHeart, likeText);
  unlikedHeart.dataset.drawing = drawingId;

  // Update like count when user clicks heart
  unlikedHeart.onclick = updateLikes;
  keyboardButton(unlikedHeart, 'Like');
  unlikedHeart.setAttribute('aria-pressed', 'false');

  return;
}


// Update drawing's like count
function updateLikes() {
  var heart = this;
  var container = heart.closest('.drawing-container');
  clearInlineError(heart);

  // Ignore clicks while this heart's last request is still in flight
  if (heart.dataset.pending) {
    return;
  }

  // Liking needs an account: say so, with the way in
  if (!localStorage.getItem('username')) {
    signInPrompt(heart, 'Sign in to like drawings', container);
    return;
  }

  // Add click animation to create pop effect
  heart.classList.add('clicked');

  /* Remove clicked class from heart to allow animation to play when clicked
  again */
  heart.addEventListener('animationend', function() {
    heart.classList.remove('clicked');
    return;
  }, false);

  var likeText = heart.nextSibling;
  var previousCount = likeText.textContent;
  var wasLiked = heart.classList.contains('fas');

  // The heart and count change at once, and change back if the request fails
  heart.dataset.pending = 'true';
  setHeart(heart, !wasLiked);
  likeText.textContent = (parseInt(previousCount) || 0) + (wasLiked ? -1 : 1);

  function settle() {
    delete heart.dataset.pending;
    return;
  }

  function revert(message) {
    setHeart(heart, wasLiked);
    likeText.textContent = previousCount;
    settle();
    inlineError(heart, message, container);
    return;
  }

  function networkFailure() {
    // Add server down banner to page (from common.js script)
    pingServer(retryFunctions);
    revert("Your like didn't go through. Try again in a moment.");
    return;
  }

  // If heart was filled in, delete drawing like and decrease like count
  if (wasLiked) {
    return fetchWithTimeout(api + '/canvashare/drawing-like/' + heart.dataset
      .drawinglike, {
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        method: 'DELETE'
      })

      .then(function(response) {
        // Remove server down banner from page (from common.js script)
        pingServer();

        if (response.ok) {
          delete heart.dataset.drawinglike;
          settle();
          return;
        }

        revert("Your like didn't go through. Sign in again and retry.");
        return;
      }, networkFailure);
  }

  // Otherwise, send request to server to increase like count
  var data = JSON.stringify({'drawing_id': heart.dataset.drawing});

  return fetchWithTimeout(api + '/canvashare/drawing-like', {
    credentials: 'include',
    headers: {'Content-Type': 'application/json'},
    method: 'POST',
    body: data,
  })

    .then(function(response) {
      // Remove server down banner from page (from common.js script)
      pingServer();

      if (response.ok) {
        return response.text().then(function(drawingLikeId) {
          heart.dataset.drawinglike = drawingLikeId;
          settle();
          return;
        });
      }

      revert("Your like didn't go through. Sign in again and retry.");
      return;
    }, networkFailure)

    .catch(function() {
      settle();
      return;
    });
}


// Show a heart as liked (filled red) or not (outline), for sight and sound
function setHeart(heart, liked) {
  heart.classList.toggle('fas', liked);
  heart.classList.toggle('far', !liked);
  heart.setAttribute('aria-pressed', liked ? 'true' : 'false');
  return;
}


// A clickable icon that keyboards and screen readers can use too
function keyboardButton(element, label) {
  element.setAttribute('role', 'button');
  element.tabIndex = 0;

  if (label) {
    element.setAttribute('aria-label', label);
  }

  element.addEventListener('keydown', function(e) {
    if (e.key == 'Enter' || e.key == ' ') {
      e.preventDefault();
      element.click();
    }

    return;
  }, false);

  return;
}


/* A failure shows next to the control that failed, as a role="alert" line,
and the next attempt clears it */
function inlineError(control, message, anchor, position) {
  clearInlineError(control);
  var note = document.createElement('p');
  note.className = 'inline-error';
  note.setAttribute('role', 'alert');
  note.textContent = message;
  (anchor || control).insertAdjacentElement(position ||
    (anchor ? 'beforeend' : 'afterend'), note);
  control.inlineErrorNote = note;
  return note;
}

function clearInlineError(control) {
  var note = control.inlineErrorNote;
  if (note && note.parentNode) {
    note.parentNode.removeChild(note);
  }
  control.inlineErrorNote = null;
  return;
}

// An action that needs an account offers the sign-in, back to this page
function signInPrompt(control, text, anchor) {
  var note = inlineError(control, '', anchor);
  note.setAttribute('role', 'status');
  var link = document.createElement('a');
  link.className = 'sign-in-prompt';
  link.href = appUrl('account', 'sign-in/?next=' +
    encodeURIComponent(window.location.href));
  link.textContent = text;
  note.appendChild(link);
  return note;
}


// Load user's posts from server
function loadPosts() {
  return loadContent(postsList);
}


// Display passed posts to user's profile posts list
function displayPosts(posts) {
  // Clear post area to display new posts from server
  postList.innerHTML = '';

  for (var i = 0; i < posts.length; i++) {
    // Create container for post and its components
    var postContainer = document.createElement('div');
    postContainer.classList.add('post-container');

    /* Set data-number attribute to track the post number for
    displaying more posts later */
    postContainer.dataset.number = postStart + i;

    // Create container for post title
    var postTitle = document.createElement('a');
    postTitle.classList.add('post-title');
    postTitle.href = appUrl('thought-writer', 'post/?post=' +
      posts[i].post_id);
    postTitle.textContent = posts[i].title;
    postTitle.title = 'View post page';

    // Create container for post background
    var postBoard = document.createElement('div');
    postBoard.classList.add('post-board');

    // Create container with post content
    var postContent = document.createElement('div');
    postContent.classList.add('post-content');
    setRichText(postContent, posts[i].content);

    // Create container for post timestamp and comment number
    var postInfo = document.createElement('div');
    postInfo.classList.add('post-info');

    // Create container for post timestamp
    var postTimestamp = document.createElement('div');
    postTimestamp.classList.add('post-time');

    /* Convert UTC timestamp from server to local timestamp in
    'MM/DD/YYYY, HH:MM AM/PM' format */
    postTimestamp.innerHTML = moment(posts[i].created)
      .format('MM/DD/YYYY, LT');

    // Create container for number of post comments
    var postComments = document.createElement('a');
    postComments.classList.add('post-comments');
    postComments.title = 'View post comments';
    postComments.href = appUrl('thought-writer', 'post/?post=' +
      posts[i].post_id) + '#comments';

    if (posts[i].comment_count == 1) {
      postComments.textContent = (Number(posts[i].comment_count) || 0) +
        ' comment';
    } else {
      postComments.textContent = (Number(posts[i].comment_count) || 0) +
        ' comments';
    }

    postList.appendChild(postContainer);
    postContainer.appendChild(postTitle);
    postContainer.appendChild(postBoard);
    postBoard.appendChild(postContent);
    postContainer.appendChild(postInfo);
    postInfo.appendChild(postTimestamp);
    postInfo.appendChild(postComments);
  }

  /* If first post displayed in post area is not post 0 (i.e.,
  there are lower-numbered posts to display), display left
  navigation arrow */
  if (postList.getElementsByClassName('post-container')[0].dataset
    .number != 0) {
      document.getElementById('posts-left-arrow').classList.add('display');
    }

  // Otherwise, hide left arrow
  else {
    document.getElementById('posts-left-arrow').classList.remove('display');
  }

  /* If there are more posts on the server, display right
  navigation arrow */
  if (morePostsToDisplay) {
    document.getElementById('posts-right-arrow').classList.add('display');
  }

  // Otherwise, hide right arrow
  else {
    document.getElementById('posts-right-arrow').classList.remove('display');
  }

  return;
}


// Load user's comments from server
function loadComments() {
  return loadContent(commentsList);
}


// Display passed comments in user's profile comments list
function displayComments(comments) {
  // Clear comment area to display new comments from server
  commentList.innerHTML = '';

  for (var i = 0; i < comments.length; i++) {
    // Create container for comment and its components
    var commentContainer = document.createElement('div');
    commentContainer.classList.add('comment-container');

    /* Set data-number attribute to track the comment number for
    displaying more comments later */
    commentContainer.dataset.number = commentStart + i;

    // Create container for comment background
    var commentBoard = document.createElement('div');
    commentBoard.classList.add('comment-board');

    // Create container with comment content
    var commentContent = document.createElement('div');
    commentContent.classList.add('comment-content');
    setRichText(commentContent, comments[i].content);

    /* Create container for comment timestamp and link to parent
    post */
    var commentInfo = document.createElement('div');
    commentInfo.classList.add('comment-info');

    // Create container for comment timestamp
    var commentTimestamp = document.createElement('div');
    commentTimestamp.classList.add('comment-time');

    /* Convert UTC timestamp from server to local timestamp in
    'MM/DD/YYYY, HH:MM AM/PM' format */
    commentTimestamp.innerHTML = moment(comments[i].created)
      .format('MM/DD/YYYY, LT');

    // Create container for link to parent post
    var parentPost = document.createElement('a');
    parentPost.classList.add('parent-post');
    parentPost.title = 'View comment on post page';
    parentPost.href = appUrl('thought-writer', 'post/?post=' +
      comments[i].post_id) + '#comment' + comments[i].comment_id;
    parentPost.textContent = comments[i].title;

    commentList.appendChild(commentContainer);
    commentContainer.appendChild(commentBoard);
    commentBoard.appendChild(commentContent);
    commentContainer.appendChild(commentInfo);
    commentInfo.appendChild(commentTimestamp);
    commentInfo.appendChild(parentPost);
  }

  /* If first comment displayed in post area is not comment 0
  (i.e., there are lower-numbered comments to display), display
  left navigation arrow */
  if (commentList.getElementsByClassName('comment-container')[0]
    .dataset.number != 0) {
      document.getElementById('comments-left-arrow').classList.add('display');
    }

  // Otherwise, hide left arrow
  else {
    document.getElementById('comments-left-arrow').classList.remove('display');
  }

  // If there are more comments on the server, display right navigation arrow
  if (moreCommentsToDisplay) {
    document.getElementById('comments-right-arrow').classList.add('display');
  }

  // Otherwise, hide right arrow
  else {
    document.getElementById('comments-right-arrow').classList.remove('display');
  }

  return;
}


// Request lower-numbered drawings if left arrow is clicked in profile gallery
document.getElementById('drawing-left-arrow').onclick = function() {
  if (this.classList.contains('display') && !drawingsList.loading) {
    drawingStart = drawingStart - 3;
    drawingEnd = drawingEnd - 3;
    loadDrawings();
  }

  return;
}


/* Request higher-numbered drawings if right arrow is clicked in profile
gallery */
document.getElementById('drawing-right-arrow').onclick = function() {
  if (this.classList.contains('display') && !drawingsList.loading) {
    drawingStart = drawingStart + 3;
    drawingEnd = drawingEnd + 3;
    loadDrawings();
  }

  return;
}


// Request lower-numbered posts if left arrow is clicked in profile post area
document.getElementById('posts-left-arrow').onclick = function() {
  if (this.classList.contains('display') && !postsList.loading) {
    postStart = postStart - 3;
    postEnd = postEnd - 3;
    loadPosts();
  }

  return;
}


// Request higher-numbered posts if right arrow is clicked in profile post area
document.getElementById('posts-right-arrow').onclick = function() {
  if (this.classList.contains('display') && !postsList.loading) {
    postStart = postStart + 3;
    postEnd = postEnd + 3;
    loadPosts();
  }

  return;
}


/* Request lower-numbered comments if left arrow is clicked in profile comment
area */
document.getElementById('comments-left-arrow').onclick = function() {
  if (this.classList.contains('display') && !commentsList.loading) {
    commentStart = commentStart - 3;
    commentEnd = commentEnd - 3;
    loadComments();
  }

  return;
}


/* Request higher-numbered comments if right arrow is clicked in profile
comment area */
document.getElementById('comments-right-arrow').onclick = function() {
  if (this.classList.contains('display') && !commentsList.loading) {
    commentStart = commentStart + 3;
    commentEnd = commentEnd + 3;
    loadComments();
  }

  return;
}


/* Toggle drawings, posts and comments when Drawings/Posts/Comments buttons are
clicked */
drawingsButton.onclick = toggleContent;
postsButton.onclick = toggleContent;
commentsButton.onclick = toggleContent;

function toggleContent() {
  // Set drawing/post/comment request numbers to starting numbers
  drawingStart = 0;
  drawingEnd = 4;
  postStart = 0;
  postEnd = 4;
  commentStart = 0;
  commentEnd = 4;

  // Exactly one tab is selected, and only it is in the tab order
  var tabs = [drawingsButton, postsButton, commentsButton];
  for (var i = 0; i < tabs.length; i++) {
    var selected = tabs[i] == this;
    tabs[i].classList.toggle('selected', selected);
    tabs[i].setAttribute('aria-selected', selected ? 'true' : 'false');
    tabs[i].tabIndex = selected ? 0 : -1;
    document.getElementById(tabs[i].getAttribute('aria-controls')).classList
      .toggle('hidden', !selected);
  }

  if (this.id == 'drawings') {
    loadDrawings();
  }
  else if (this.id == 'posts') {
    loadPosts();
  }
  else {
    loadComments();
  }

  return;
}


// Arrow keys move between the tabs, as a tablist does
document.querySelector('.menu-options').addEventListener('keydown', function(e) {
  var tabs = [drawingsButton, postsButton, commentsButton];
  var index = tabs.indexOf(document.activeElement);
  if (index == -1 || (e.key != 'ArrowRight' && e.key != 'ArrowLeft')) {
    return;
  }

  e.preventDefault();
  var next = tabs[(index + (e.key == 'ArrowRight' ? 1 : 2)) % 3];
  next.focus();
  next.click();
  return;
}, false);
