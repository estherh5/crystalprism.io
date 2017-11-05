// Define global variables
var username = window.location.search.split('username=')[1]; // Profile's username
var drawingStart = 0; // Range start for number of drawings to request from server
var drawingEnd = 4; // Range end for number of drawings to request from server
var postStart = 0; // Range start for number of posts to request from server
var postEnd = 4; // Range end for number of posts to request from server
var gallery = document.getElementById('gallery');
var postList = document.getElementById('post-list');
// Determine server based on window location
if (window.location.hostname == 'crystalprism.io') {
  var server = 'http://13.58.175.191/api';
} else {
  var server = 'http://localhost:5000/api';
}


// Define load functions
window.onload = function() {
  // Create page header (from common.js script)
  createPageHeader();
  // Apply additional style to header
  document.getElementById('header').classList.add('divider');
  // Check if user is logged in (from common.js script)
  checkIfLoggedIn();
  // Load profile user's personal information to profile from server
  loadPersonal();
  // Load profile user's drawings to profile gallery from server
  loadDrawings();
  // Load profile user's posts to profile post area from server
  loadPosts();
  return;
}

// Load profile user's personal information to profile from server
function loadPersonal() {
  return fetch(server + '/user/' + encodeURIComponent(username))
  // Display error if server is down
  .catch(function(error) {
    document.getElementById('profile-title').innerHTML = 'Could not load page';
    document.title = 'Not found';
    return;
  }).then(function(response) {
    if (response.ok) {
      response.json().then(function(info) {
        // Set profile username display and page title to requested username
        document.getElementById('user-link')
        .href = 'index.html?username=' + username;
        document.getElementById('profile-title').innerHTML = username;
        document.title = username;
        // Populate user's about me blurb, name, email address, background
        // color, and icon color
        document.getElementById('about-blurb').innerHTML = info['about'];
        document.getElementById('name').innerHTML = info['name'];
        document.getElementById('email').innerHTML = info['email'];
        document.getElementById('email').href = 'mailto:' + info['email'];
        document.body.style.backgroundColor = info['background_color'];
        document.getElementById('diamond').contentDocument
        .getElementById('diamond-svg').style.fill = info['icon_color'];
        // Convert UTC timestamp from server to local timestamp in 'MM/DD/YYYY'
        // format
        var dateTime = new Date(info['member_since']);
        document.getElementById("member-stat")
        .innerHTML = 'Member since ' + dateTime.toLocaleDateString();
        // Display high scores for Rhythm of Life and Shapes in Rain
        document.getElementById('rhythm-stat')
        .innerHTML = info['rhythm_high_lifespan'];
        document.getElementById('shapes-stat')
        .innerHTML = info['shapes_high_score'];
        // Hide any personal information fields that are blank
        for (var i = 0; i < document.getElementsByClassName('user-data')
        .length; i++) {
          if (document.getElementsByClassName('user-data')[i].innerHTML == '') {
            document.getElementsByClassName('user-data')[i].parentNode.classList
            .add('hidden');
          }
        }
      });
      return;
    }
    // Display error if server responds with error
    document.getElementById('profile-title').innerHTML = 'User does not exist';
    document.title = 'Not found';
    return;
  });
}

// Load profile user's drawings to profile gallery from server
function loadDrawings() {
  return fetch(server + '/canvashare/gallery/' + encodeURIComponent(username) + '?start=' + drawingStart + '&end=' + drawingEnd)
  .then(function(response) {
    if (response.ok) {
      response.json().then(function(drawings) {
        // If there are no drawings sent from server, hide user's gallery
        // on profile
        if (drawings.length == 0) {
          document.getElementById('gallery-row').classList.add('hidden');
          var moreDrawingsOnServer = false;
          return;
        }
        // Otherwise, clear gallery to load new drawings from server
        gallery.innerHTML = '';
        // Assess if there are more than requested drawings - 1 (number of
        // loaded drawings) on server
        if (drawings.length > (drawingEnd - drawingStart - 1)) {
          var moreDrawingsOnServer = true;
          var drawingLoadNumber = drawingEnd - drawingStart - 1;
        }
        // If there are not, load all drawings sent from server
        else {
          var moreDrawingsOnServer = false;
          var drawingLoadNumber = drawings.length;
        }
        for (var i = 0; i < drawingLoadNumber; i++) {
          // Create container for drawing and its components
          var drawingContainer = document.createElement('div');
          drawingContainer.classList.add('drawing-container');
          // Set data-number attribute to track the drawing number for
          // displaying more drawings later
          drawingContainer.dataset.number = drawingStart + i;
          // Create container for drawing title
          var drawingTitle = document.createElement('div');
          drawingTitle.classList.add('drawing-title');
          // Set data-drawing attribute as drawing file name for later
          // identification, with URI-encoded characters
          drawingTitle.dataset.drawing = encodeURIComponent(drawings[i]);
          // Create drawing image
          var drawing = document.createElement('img');
          drawing.classList.add('drawing');
          drawing.src = server + '/canvashare/drawing/' + encodeURIComponent(drawings[i]);
          drawing.title = 'View drawing';
          // Create container for drawing artist and number of likes and views
          var drawingInfo = document.createElement('div');
          drawingInfo.classList.add('drawing-info');
          // Create container for number of drawing likes
          var drawingLikes = document.createElement('div');
          drawingLikes.classList.add('drawing-likes');
          drawingLikes.title = 'Likes';
          // Set data-drawing attribute as drawing file name for later
          // identification, with URI-encoded characters
          drawingLikes.dataset.drawing = encodeURIComponent(drawings[i]);
          // Create text to display number of likes
          var likeText = document.createElement('text');
          // Set data-drawing attribute as drawing file name for later
          // identification, with URI-encoded characters
          likeText.dataset.drawing = encodeURIComponent(drawings[i]);
          // Create drawing views container
          var drawingViews = document.createElement('div');
          drawingViews.classList.add('drawing-views');
          drawingViews.title = 'Views';
          // Create eye icon to display with drawing views
          var viewsIcon = document.createElement('i');
          viewsIcon.classList.add('fa');
          viewsIcon.classList.add('fa-eye');
          // Create text to display number of views
          var viewText = document.createElement('text');
          // Set data-drawing attribute as drawing file name for later
          // identification, with URI-encoded characters
          viewText.dataset.drawing = encodeURIComponent(drawings[i]);
          gallery.append(drawingContainer);
          drawingContainer.append(drawingTitle);
          drawingContainer.append(drawing);
          drawingContainer.append(drawingInfo);
          drawingInfo.append(drawingLikes);
          drawingLikes.append(likeText);
          drawingInfo.append(drawingViews);
          drawingViews.append(viewsIcon);
          drawingViews.append(viewText);
          // Update number of views when user clicks drawing
          drawing.onclick = updateViews;
          // Fill in drawing title, views, and likes
          getDrawingInfo(encodeURIComponent(drawings[i]));
        }
        // If first drawing displayed in gallery is not drawing 0 (i.e., there
        // are lower-numbered drawings to display), display left navigation
        // arrow
        if (gallery.getElementsByClassName('drawing-container')[0].dataset
        .number != 0) {
          document.getElementById('drawing-left-arrow').classList
          .add('display');
        }
        // Otherwise, hide left arrow
        else {
          document.getElementById('drawing-left-arrow').classList
          .remove('display');
        }
        // If there are more drawings on the server, display right navigation arrow
        if (moreDrawingsOnServer) {
          document.getElementById('drawing-right-arrow').classList
          .add('display');
        }
        // Otherwise, hide right arrow
        else {
          document.getElementById('drawing-right-arrow').classList
          .remove('display');
        }
      });
      return;
    }
    // Hide user's gallery from profile if server responds with error
    document.getElementById('gallery-row').classList.add('hidden');
    return;
  });
}

// Get title and number of views and likes for passed drawing file
function getDrawingInfo(drawingFile) {
  return fetch(server + '/canvashare/drawing-info/' + drawingFile
  .split('.png')[0]).then(function(response) {
    response.json().then(function(drawingInfo) {
      // Get elements that have data-drawing attribute set as file name
      var fileElements = document
      .querySelectorAll('[data-drawing="' + drawingFile + '"]');
      // Set title and number of likes and views for drawing
      fileElements[0].innerHTML = drawingInfo['title'];
      fileElements[2].innerHTML = drawingInfo['likes'];
      fileElements[3].innerHTML = drawingInfo['views'];
      // If current user liked the drawing, display a filled-in red heart in
      // likes container
      if (drawingInfo['liked_users'].includes(localStorage
      .getItem('username'))) {
        var likedHeart = document.createElement('i');
        likedHeart.classList.add('fa');
        likedHeart.classList.add('fa-heart');
        fileElements[1].insertBefore(likedHeart, fileElements[1].firstChild);
        // Update like count when user clicks heart
        likedHeart.onclick = updateLikes;
        return;
      }
      // Otherwise, display an empty heart outline
      var unlikedHeart = document.createElement('i');
      unlikedHeart.classList.add('fa');
      unlikedHeart.classList.add('fa-heart-o');
      fileElements[1].insertBefore(unlikedHeart, fileElements[1].firstChild);
      // Update like count when user clicks heart
      unlikedHeart.onclick = updateLikes;
      return;
    });
  });
}

// Update drawing's view count
function updateViews() {
  // Set sessionStorage items for drawing's source, used to populate easel on
  // redirected webpage
  sessionStorage.setItem('drawing-source', this.src);
  // Send request to server to update view count
  data = JSON.stringify({'request': 'view'});
  return fetch(server + '/canvashare/drawing-info/' + this.src
  .split('/canvashare/drawing/')[1].split('.png')[0], {
    headers: {'Authorization': 'Bearer ' + localStorage
    .getItem('token'), 'Content-Type': 'application/json'},
    method: 'PUT',
    body: data,
  })
  // Display error message if server is down
  .catch(function(error) {
    window.alert('Your request did not go through. Please try again soon.')
  }).then(function(response) {
    // If server responds without error, redirect to easel page
    if (response.ok) {
      window.location = '../canvashare/easel/index.html';
      return;
    }
    // Otherwise, display error message
    window.alert('Your request did not go through. Please try again soon.');
    return;
  });
}

// Update drawing's like count
function updateLikes() {
  // If heart is already filled in, decrease drawing like count
  if (this.classList.contains('fa-heart')) {
    var heart = this;
    // Add click animation to create pop effect
    heart.classList.add('clicked');
    // Remove clicked class from heart to allow animation to play when clicked
    // again
    setTimeout(function() {
      heart.classList.remove('clicked');
      return;
    }, 500);
    // Send request to server to decrease like count
    data = JSON.stringify({'request': 'unlike'});
    return fetch(server + '/canvashare/drawing-info/' + heart.nextSibling
    .dataset.drawing.split('.png')[0], {
      headers: {'Authorization': 'Bearer ' + localStorage
      .getItem('token'), 'Content-Type': 'application/json'},
      method: 'PUT',
      body: data,
    })
    // Display error message if server is down
    .catch(function(error) {
      window.alert('Your like did not go through. Please try again soon.');
      return;
    }).then(function(response) {
      // If server responds without error, remove heart fill and decrease like
      // count user sees
      if (response.ok) {
        var likeText = heart.nextSibling;
        var currentLikes = likeText.innerHTML;
        heart.classList.remove('fa-heart');
        heart.classList.add('fa-heart-o');
        likeText.innerHTML = parseInt(currentLikes) - 1;
        return;
      }
      // Otherwise, display error message
      window.alert('You must log in to like a drawing.');
      return;
    });
  }
  // Otherwise, increase like count
  var heart = this;
  // Add click animation to create pop effect
  heart.classList.add('clicked');
  // Remove clicked class from heart to allow animation to play when clicked
  // again
  setTimeout(function() {
    heart.classList.remove('clicked');
    return;
  }, 500);
  // Send request to server to increase like count
  data = JSON.stringify({'request': 'like'});
  return fetch(server + '/canvashare/drawing-info/' + heart.nextSibling.dataset
  .drawing.split('.png')[0], {
    headers: {'Authorization': 'Bearer ' + localStorage
    .getItem('token'), 'Content-Type': 'application/json'},
    method: 'PUT',
    body: data,
  })
  // Display error message if server is down
  .catch(function(error) {
    window.alert('Your like did not go through. Please try again soon.');
    return;
  }).then(function(response) {
    // If server responds without error, fill in heart and increase like count
    // user sees
    if (response.ok) {
      var likeText = heart.nextSibling;
      var currentLikes = likeText.innerHTML;
      likeText.innerHTML = parseInt(currentLikes) + 1;
      heart.classList.remove('fa-heart-o');
      heart.classList.add('fa-heart');
      return;
    }
    // Otherwise, display error message
    window.alert('You must log in to like a drawing.');
    return;
  });
}

// Load user's posts to profile post area from server
function loadPosts() {
  return fetch(server + '/thought-writer/post-board/' + encodeURIComponent(username) + '?start=' + postStart + '&end=' + postEnd)
  .then(function(response) {
    if (response.ok) {
      response.json().then(function(posts) {
        // If there are no posts sent from server, hide user's post area on
        // profile
        if (posts.length == 0) {
          document.getElementById('post-list-row').classList.add('hidden');
          var morePostsOnServer = false;
          return;
        }
        // Otherwise, clear post area to display new posts from server
        postList.innerHTML = '';
        // Assess if there are more than requested posts - 1 (number of loaded
        // posts) on server
        if (posts.length > (postEnd - postStart - 1)) {
          var morePostsOnServer = true;
          var postLoadNumber = postEnd - postStart - 1;
        }
        // If there are not, load all posts sent from server
        else {
          var morePostsOnServer = false;
          var postLoadNumber = posts.length;
        }
        for (var i = 0; i < postLoadNumber; i++) {
          // Create container for post and its components
          var postContainer = document.createElement('div');
          postContainer.classList.add('post-container');
          // Set data-number attribute to track the post number for displaying
          // more posts later
          postContainer.dataset.number = postStart + i;
          // Create container for post title
          var postTitle = document.createElement('div');
          postTitle.classList.add('post-title');
          postTitle.innerHTML = posts[i].title;
          postTitle.title = 'View post page';
          // Set data-writer and data-timestamp attributes to save in
          // sessionStorage when clicked
          postTitle.dataset.writer = posts[i].writer;
          postTitle.dataset.timestamp = posts[i].timestamp;
          // Create container for post background
          var postBoard = document.createElement('div');
          postBoard.classList.add('post-board');
          // Create container with post content
          var postContent = document.createElement('div');
          postContent.classList.add('post-content');
          postContent.innerHTML = posts[i].content;
          // Create container for post timestamp and comment number
          var postInfo = document.createElement('div');
          postInfo.classList.add('post-info');
          // Create container for post timestamp
          var postTimestamp = document.createElement('div');
          postTimestamp.classList.add('post-time');
          // Convert UTC timestamp from server to local timestamp in
          // 'MM/DD/YYYY, HH:MM AM/PM' format
          var dateTime = new Date(posts[i].timestamp);
          postTimestamp.innerHTML = dateTime.toLocaleString()
          .replace(/:\d{2}\s/,' ');
          // Create container for number of post comments
          var postComments = document.createElement('div');
          postComments.classList.add('post-comments');
          postComments.title = 'View post comments';
          if (posts[i].comments.length == 1) {
            postComments.innerHTML = posts[i].comments.length + ' comment';
          } else {
            postComments.innerHTML = posts[i].comments.length + ' comments';
          }
          // Set data-writer and data-timestamp attributes to save in
          // sessionStorage when clicked
          postComments.dataset.writer = posts[i].writer;
          postComments.dataset.timestamp = posts[i].timestamp;
          postList.append(postContainer);
          postContainer.append(postTitle);
          postContainer.append(postBoard);
          postBoard.append(postContent);
          postContainer.append(postInfo);
          postInfo.append(postTimestamp);
          postInfo.append(postComments);
          // Set sessionStorage items when post title is clicked and go to post
          // page
          postTitle.onclick = function() {
            sessionStorage.setItem('writer', this.dataset.writer);
            sessionStorage.setItem('timestamp', this.dataset.timestamp);
            window.location = '../thought-writer/post/index.html';
            return;
          }
          // Set sessionStorage items when post comment number is clicked and
          // go to post page's comments
          postComments.onclick = function() {
            sessionStorage.setItem('writer', this.dataset.writer);
            sessionStorage.setItem('timestamp', this.dataset.timestamp);
            window.location = '../thought-writer/post/index.html#comments';
            return;
          }
        }
        // If first post displayed in post area is not post 0 (i.e., there are
        // lower-numbered posts to display), display left navigation arrow
        if (postList.getElementsByClassName('post-container')[0].dataset
        .number != 0) {
          document.getElementById('posts-left-arrow').classList.add('display');
        }
        // Otherwise, hide left arrow
        else {
          document.getElementById('posts-left-arrow').classList
          .remove('display');
        }
        // If there are more posts on the server, display right navigation arrow
        if (morePostsOnServer) {
          document.getElementById('posts-right-arrow').classList.add('display');
        }
        // Otherwise, hide right arrow
        else {
          document.getElementById('posts-right-arrow').classList
          .remove('display');
        }
      });
      return;
    }
    // Hide user's post area from profile if server responds with error
    document.getElementById('post-list-row').classList.add('hidden');
    return;
  });
}

// Request lower-numbered drawings if left arrow is clicked in profile gallery
document.getElementById('drawing-left-arrow').onclick = function() {
  if (this.classList.contains('display')) {
    drawingStart = drawingStart - 3;
    drawingEnd = drawingEnd - 3;
    loadDrawings();
  }
  return;
}

// Request higher-numbered drawings if right arrow is clicked in profile gallery
document.getElementById('drawing-right-arrow').onclick = function() {
  if (this.classList.contains('display')) {
    drawingStart = drawingStart + 3;
    drawingEnd = drawingEnd + 3;
    loadDrawings();
  }
  return;
}

// Request lower-numbered posts if left arrow is clicked in profile post area
document.getElementById('posts-left-arrow').onclick = function() {
  if (this.classList.contains('display')) {
    postStart = postStart - 3;
    postEnd = postEnd - 3;
    loadPosts();
  }
  return;
}

// Request higher-numbered posts if right arrow is clicked in profile post area
document.getElementById('posts-right-arrow').onclick = function() {
  if (this.classList.contains('display')) {
    postStart = postStart + 3;
    postEnd = postEnd + 3;
    loadPosts();
  }
  return;
}
