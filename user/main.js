// Define global variables
var username = window.location.search.split('username=')[1];
var drawingStart = 0; // Range start for number of drawings to request from API
var drawingEnd = 4; // Range end for number of drawings to request from API
var postStart = 0; // Range start for number of posts to request from API
var postEnd = 4; // Range end for number of posts to request from API
var gallery = document.getElementById('gallery');
var postList = document.getElementById('post-list');


// Define load functions
window.onload = function() {
  // Load profile user's personal information to profile from server
  loadPersonalInfo();

  // Load profile user's drawings to profile gallery from server
  loadDrawings();

  // Load profile user's posts to profile post area from server
  loadPosts();

  // Create page header (from common.js script)
  createPageHeader();

  // Apply additional style to header
  document.getElementById('header').classList.add('divider');

  // Check if user is logged in (from common.js script)
  checkIfLoggedIn();

  // Check if Crystal Prism API is online (from common.js script)
  pingServer(function() {
    checkIfLoggedIn();
    loadPersonalInfo();
    loadDrawings();
    loadPosts();
    return;
  });

  // Create page footer (from common.js script)
  createPageFooter();

  return;
}


// Load profile user's personal information to profile from server
function loadPersonalInfo() {
  return fetch(api + '/user/' + username)

    // Display error if server is down
    .catch(function(error) {
      document.getElementById('profile-title')
        .innerHTML = 'Could not load page';
      document.title = 'Not found';
      return;
    })

    .then(function(response) {
      if (response.ok) {
        response.json().then(function(info) {
          // Set profile username display and page title to requested username
          document.getElementById('user-link')
            .href = '?username=' + info['username'];
          document.getElementById('profile-title').innerHTML = info['username'];
          document.title = info['username'];

          /* Populate user's about me blurb, name, email address, background
          color, and icon color */
          document.getElementById('about-blurb').innerHTML = info['about'];
          if (info['first_name']) {
            document.getElementById('name')
              .innerHTML = info['first_name'] + ' ' + info['last_name'];
          }
          if (info['email']) {
            document.getElementById('email').innerHTML = info['email'];
            document.getElementById('email').href = 'mailto:' + info['email'];
          }
          document.body.style.backgroundColor = info['background_color'];
          document.getElementById('diamond').style.fill = info['icon_color'];

          // Update profile content font color based on background color
          updateFontColors(info['background_color']);

          // Update icon background color based on icon color
          updateIconBackground(info['icon_color']);

          // Refresh profile icon rendering to eliminate SVG artifacts in Safari
          document.getElementById('profile-icon').style
            .webkitTransform = 'scale(1)';

          /* Convert UTC timestamp from server to local timestamp in
          'MM/DD/YYYY' format */
          document.getElementById("member-stat").innerHTML = 'Member since ' +
            moment(info['created']).format('MM/DD/YYYY');

          // Display high scores for Rhythm of Life and Shapes in Rain
          document.getElementById('shapes-stat')
            .innerHTML = info['shapes_high_score'];

          // Display Rhythm lifespan from score
          var sec_num = info['rhythm_high_score'];
          var score_hours = Math.floor(sec_num / 3600);
          var score_minutes = Math.floor((sec_num - (score_hours * 3600)) / 60);
          var score_seconds = sec_num - (score_hours * 3600) -
            (score_minutes * 60);
          var lifespan_value = ('0' + score_hours).slice(-2) + ':' +
            ('0' + score_minutes).slice(-2) + ':' + ('0' + score_seconds)
            .slice(-2);
          document.getElementById('rhythm-stat').innerHTML = lifespan_value;

          // Hide any personal information fields that are blank
          for (var i = 0; i < document.getElementsByClassName('user-data')
            .length; i++) {
              if (document.getElementsByClassName('user-data')[i]
                .innerHTML == '') {
                  document.getElementsByClassName('user-data')[i].parentNode
                    .classList.add('hidden');
                }
            }
        });

        return;
      }

      // Display error if server responds with error
      document.getElementById('profile-title')
        .innerHTML = 'User does not exist';
      document.title = 'Not found';

      return;
    });
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


// Load profile user's drawings to profile gallery from server
function loadDrawings() {
  return fetch(api + '/canvashare/drawings/' + username + '?start=' +
    drawingStart + '&end=' + drawingEnd)

    .then(function(response) {
      if (response.ok) {
        response.json().then(function(drawings) {

          /*If there are no drawings sent from server, hide user's gallery
          on profile */
          if (drawings.length == 0) {
            document.getElementById('gallery-row').classList.add('hidden');
            var moreDrawingsOnServer = false;
            return;
          }

          // Otherwise, clear gallery to load new drawings from server
          gallery.innerHTML = '';

          /* Assess if there are more than requested drawings - 1 (number of
          loaded drawings) on server */
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

            /* Set data-number attribute to track the drawing number for
            displaying more drawings later */
            drawingContainer.dataset.number = drawingStart + i;

            // Create container for drawing title
            var drawingTitle = document.createElement('div');
            drawingTitle.classList.add('drawing-title');
            drawingTitle.innerHTML = drawings[i]['title'];

            // Create drawing image
            var drawing = document.createElement('img');
            drawing.classList.add('drawing');
            drawing.src = drawings[i]['url'];
            drawing.title = 'View drawing';

            /* Set data-drawing attribute as drawing id for later
            identification */
            drawing.dataset.drawing = drawings[i]['drawing_id'];

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
            likeText.innerHTML = drawings[i]['like_count'];

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
            viewsIcon.classList.add('fas');
            viewsIcon.classList.add('fa-eye');

            // Create text to display number of views
            var viewText = document.createElement('text');
            viewText.innerHTML = drawings[i]['views'];

            /* Set data-drawing attribute as drawing id for later
            identification */
            viewText.dataset.drawing = 'views' + drawings[i]['drawing_id'];

            gallery.appendChild(drawingContainer);
            drawingContainer.appendChild(drawingTitle);
            drawingContainer.appendChild(drawing);
            drawingContainer.appendChild(drawingInfo);
            drawingInfo.appendChild(drawingLikes);
            drawingLikes.appendChild(likeText);
            drawingInfo.appendChild(drawingViews);
            drawingViews.appendChild(viewsIcon);
            drawingViews.appendChild(viewText);

            // Update number of views when user clicks drawing title or drawing
            drawingTitle.onclick = function() {
              updateViews(this.nextSibling);
              return;
            }

            drawing.onclick = function() {
              updateViews(this);
              return;
            }

            // Display drawing like hearts
            displayDrawingLikes(drawings[i]['drawing_id'], likers);
          }

          /* If first drawing displayed in gallery is not drawing 0 (i.e.,
          there are lower-numbered drawings to display), display left
          navigation arrow */
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

          /* If there are more drawings on the server, display right navigation
          arrow */
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


// Display drawing like hearts for passed drawing
function displayDrawingLikes(drawingId, likers) {
  // Get likes text that has data-drawing attribute set as drawing id
  var likeText = document
    .querySelectorAll('[data-drawing="likes' + drawingId + '"]')[0];

  // Check if user liked drawing if user is logged in
  if (checkIfLoggedIn()) {
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

        return;
      }

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

  return;
}


// Update passed drawing's view count
function updateViews(drawing) {
  return fetch(api + '/canvashare/drawing/' + drawing.dataset.drawing, {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
    method: 'PATCH',
  })

    // Display error message if server is down
    .catch(function(error) {
      window.alert('Your request did not go through. Please try again soon.')
    })

    /* If server responds without error, update view count and redirect to
    easel page */
    .then(function(response) {
      if (response.ok) {
        var viewText = document
          .querySelectorAll('[data-drawing="views' + drawing.dataset.drawing +
          '"]')[0];
        viewText.innerHTML = parseInt(viewText.innerHTML) + 1;
        window.location = '../canvashare/easel/?drawing=' + drawing.dataset
          .drawing;
        return;
      }

      // Otherwise, display error message
      window.alert('Your request did not go through. Please try again soon.');

      return;
    });
}


// Update drawing's like count
function updateLikes() {
  var heart = this;

  // Add click animation to create pop effect
  heart.classList.add('clicked');

  /* Remove clicked class from heart to allow animation to play when clicked
  again */
  heart.addEventListener('animationend', function() {
    heart.classList.remove('clicked');
    return;
  }, false);

  /* If heart is already filled in, delete drawing like and decrease drawing
  like count */
  if (this.classList.contains('fas')) {

    return fetch(api + '/canvashare/drawing-like/' + this.dataset
      .drawinglike, {
        headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'),
          'Content-Type': 'application/json'},
        method: 'DELETE'
      })

        // Display error message if server is down
        .catch(function(error) {
          window.alert('Your like did not go through. Please try again soon.');
          return;
        })

        /* If server responds without error, remove heart fill and decrease like
        count user sees */
        .then(function(response) {
          if (response.ok) {
            var likeText = heart.nextSibling;
            var currentLikes = likeText.innerHTML;
            heart.classList.remove('fas');
            heart.classList.add('far');
            delete heart.dataset.drawinglike;
            likeText.innerHTML = parseInt(currentLikes) - 1;
            return;
          }

          // Otherwise, display error message
          window.alert('You must log in to like a drawing.');

          return;
        });
  }

  // Otherwise, send request to server to increase like count
  var data = JSON.stringify({'drawing_id': this.dataset.drawing});

  return fetch(api + '/canvashare/drawing-like', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'),
      'Content-Type': 'application/json'},
    method: 'POST',
    body: data,
  })

    // Display error message if server is down
    .catch(function(error) {
      window.alert('Your like did not go through. Please try again soon.');
      return;
    })

    /* If server responds without error, fill in heart and increase like count
    user sees */
    .then(function(response) {
      if (response.ok) {
        response.text().then(function(drawingLikeId) {
          var likeText = heart.nextSibling;
          var currentLikes = likeText.innerHTML;
          likeText.innerHTML = parseInt(currentLikes) + 1;
          heart.classList.remove('far');
          heart.classList.add('fas');
          heart.dataset.drawinglike = drawingLikeId;
        });
        return;
      }

      // Otherwise, display error message
      window.alert('You must log in to like a drawing.');

      return;
    });
}


// Load user's posts to profile post area from server
function loadPosts() {
  return fetch(api + '/thought-writer/posts/' + username + '?start=' +
    postStart + '&end=' + postEnd)

    .then(function(response) {
      if (response.ok) {
        response.json().then(function(posts) {

          /* If there are no posts sent from server, hide user's post area on
          profile */
          if (posts.length == 0) {
            document.getElementById('post-list-row').classList.add('hidden');
            var morePostsOnServer = false;
            return;
          }

          // Otherwise, clear post area to display new posts from server
          postList.innerHTML = '';

          /* Assess if there are more than requested posts - 1 (number of
          loaded posts) on server */
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

            /* Set data-number attribute to track the post number for
            displaying more posts later */
            postContainer.dataset.number = postStart + i;

            // Create container for post title
            var postTitle = document.createElement('a');
            postTitle.classList.add('post-title');
            postTitle.href = '../thought-writer/post/?post=' + posts[i].post_id;
            postTitle.innerHTML = posts[i].title;
            postTitle.title = 'View post page';

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

            /* Convert UTC timestamp from server to local timestamp in
            'MM/DD/YYYY, HH:MM AM/PM' format */
            postTimestamp.innerHTML = moment(posts[i].created)
              .format('MM/DD/YYYY, LT');

            // Create container for number of post comments
            var postComments = document.createElement('a');
            postComments.classList.add('post-comments');
            postComments.title = 'View post comments';
            postComments.href = '../thought-writer/post/?post=' +
              posts[i].post_id + '#comments';

            if (posts[i].comment_count == 1) {
              postComments.innerHTML = posts[i].comment_count + ' comment';
            } else {
              postComments.innerHTML = posts[i].comment_count + ' comments';
            }

            postList.appendChild(postContainer);
            postContainer.appendChild(postTitle);
            postContainer.appendChild(postBoard);
            postBoard.appendChild(postContent);
            postContainer.appendChild(postInfo);
            postInfo.appendChild(postTimestamp);
            postInfo.appendChild(postComments);
          }

          /* If first post displayed in post area is not post 0 (i.e., there are
          lower-numbered posts to display), display left navigation arrow */
          if (postList.getElementsByClassName('post-container')[0].dataset
            .number != 0) {
              document.getElementById('posts-left-arrow').classList
                .add('display');
            }

          // Otherwise, hide left arrow
          else {
            document.getElementById('posts-left-arrow').classList
              .remove('display');
          }

          /* If there are more posts on the server, display right navigation
          arrow */
          if (morePostsOnServer) {
            document.getElementById('posts-right-arrow').classList
              .add('display');
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
