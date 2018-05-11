// Define global variables
var username = window.location.search.split('username=')[1];
var drawingStart = 0; // Range start for number of drawings to request from API
var drawingEnd = 4; // Range end for number of drawings to request from API
var postStart = 0; // Range start for number of posts to request from API
var postEnd = 4; // Range end for number of posts to request from API
var commentStart = 0; // Range start for number of comments to request from API
var commentEnd = 4; // Range end for number of comments to request from API
var gallery = document.getElementById('gallery');
var drawingsButton = document.getElementById('drawings');
var postList = document.getElementById('post-list');
var postsButton = document.getElementById('posts');
var commentList = document.getElementById('comment-list');
var commentsButton = document.getElementById('comments');


// Define load functions
window.onload = function() {
  // Load profile user's personal information to profile from server
  loadPersonalInfo();

  // Load user's drawings to gallery
  loadDrawings();

  // Create page header (from common.js script)
  createPageHeader();

  // Apply additional style to header
  document.getElementById('header').classList.add('divider');

  // Check if user is logged in (from common.js script)
  checkIfLoggedIn();

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
          /* Set profile username display and page title to requested
          username */
          document.getElementById('user-link')
            .href = '?username=' + info['username'];
          document.getElementById('profile-title')
            .innerHTML = info['username'];
          document.title = info['username'];

          /* Populate user's about me blurb, name, email address, background
          color, and icon color */
          if (info['about']) {
            document.getElementById('about-blurb').innerHTML = info['about'];
          } else {
            document.getElementById('about-row').classList.add('hidden');
          }

          if (info['first_name']) {
            document.getElementById('name')
              .innerHTML = info['first_name'] + ' ' + info['last_name'];
          } else {
            document.getElementById('name-row').classList.add('hidden');
          }

          if (info['email']) {
            document.getElementById('email').innerHTML = info['email'];
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
          document.getElementById('profile-icon').style
            .webkitTransform = 'scale(1)';

          /* Convert UTC timestamp from server to local timestamp in
          'MM/DD/YYYY' format */
          document.getElementById("member-stat")
            .innerHTML = 'Member since ' + moment(info['created'])
            .format('MM/DD/YYYY');

          // Display high scores for Rhythm of Life and Shapes in Rain
          document.getElementById('shapes-stat')
            .innerHTML = info['shapes_high_score'];

          // Display Rhythm lifespan from score
          var sec_num = info['rhythm_high_score'];
          var score_hours = Math.floor(sec_num / 3600);
          var score_minutes = Math
            .floor((sec_num - (score_hours * 3600)) / 60);
          var score_seconds = sec_num - (score_hours * 3600) -
            (score_minutes * 60);
          var lifespan_value = ('0' + score_hours).slice(-2) + ':' +
            ('0' + score_minutes).slice(-2) + ':' + ('0' + score_seconds)
            .slice(-2);
          document.getElementById('rhythm-stat').innerHTML = lifespan_value;
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

    // Add error message to gallery if server responds with error
    .catch(function(error) {
      // Add server down banner to page (from common.js script)
      pingServer(retryFunctions);

      gallery.innerHTML = 'There was an error loading the user\'s drawings. ' +
        'Please refresh the page.';
      return;
    })

    .then(function(response) {
      if (response) {
        // Remove server down banner from page (from common.js script)
        pingServer();

        if (response.ok) {
          response.json().then(function(drawings) {
            // Clear gallery to load new drawings from server
            gallery.innerHTML = '';

            if (drawings.length > 0) {
              /* Assess if there are more than requested drawings - 1 (number
              of loaded drawings) on server */
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
                var drawingTitle = document.createElement('a');
                drawingTitle.classList.add('drawing-title');
                drawingTitle.href = '../canvashare/easel/?drawing=' +
                  drawings[i]['drawing_id'];
                drawingTitle.innerHTML = drawings[i]['title'];

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
                  window.location = '../canvashare/easel/?drawing=' + this
                    .dataset.drawing;
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
                viewsIcon.classList.add('far');
                viewsIcon.classList.add('fa-eye');

                // Create text to display number of views
                var viewText = document.createElement('text');
                viewText.innerHTML = drawings[i]['views'];

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
                  document.getElementById('drawing-left-arrow').classList
                  .add('display');
                }

              // Otherwise, hide left arrow
              else {
                document.getElementById('drawing-left-arrow').classList
                  .remove('display');
              }

              /* If there are more drawings on the server, display right
              navigation arrow */
              if (moreDrawingsOnServer) {
                document.getElementById('drawing-right-arrow').classList
                  .add('display');
              }

              // Otherwise, hide right arrow
              else {
                document.getElementById('drawing-right-arrow').classList
                  .remove('display');
              }
            }

            // Display message if user has no drawings
            else {
              gallery.innerHTML = 'There are no drawings for this user.';
            }

          });

          return;
        }

        // Add error message to gallery if server responds with error
        gallery.innerHTML = 'There was an error loading the user\'s ' +
          'drawings. Please refresh the page.';

        return;
      }
    });
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

  return;
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
          // Add server down banner to page (from common.js script)
          pingServer(retryFunctions);

          window.alert('Your like did not go through. Please try again soon.');

          return;
        })

        /* If server responds without error, remove heart fill and decrease
        like count user sees */
        .then(function(response) {
          if (response) {
            // Remove server down banner from page (from common.js script)
            pingServer();

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
          }
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
      // Add server down banner to page (from common.js script)
      pingServer(retryFunctions);

      window.alert('Your like did not go through. Please try again soon.');

      return;
    })

    /* If server responds without error, fill in heart and increase like count
    user sees */
    .then(function(response) {
      if (response) {
        // Remove server down banner from page (from common.js script)
        pingServer();

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
      }
    });
}


// Load user's posts to profile post area from server
function loadPosts() {
  return fetch(api + '/thought-writer/posts/' + username + '?start=' +
    postStart + '&end=' + postEnd)

    // Add error message to post list if server responds with error
    .catch(function(error) {
      // Add server down banner to page (from common.js script)
      pingServer(retryFunctions);

      postList.innerHTML = 'There was an error loading the user\'s posts. ' +
        'Please refresh the page.';

      return;
    })

    .then(function(response) {
      if (response) {
        // Remove server down banner from page (from common.js script)
        pingServer();

        if (response.ok) {
          response.json().then(function(posts) {
            // Clear post area to display new posts from server
            postList.innerHTML = '';

            if (posts.length > 0) {
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
                postTitle.href = '../thought-writer/post/?post=' + posts[i]
                  .post_id;
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
                  postComments.innerHTML = posts[i].comment_count +
                    ' comment';
                } else {
                  postComments.innerHTML = posts[i].comment_count +
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
                  document.getElementById('posts-left-arrow').classList
                    .add('display');
                }

              // Otherwise, hide left arrow
              else {
                document.getElementById('posts-left-arrow').classList
                  .remove('display');
              }

              /* If there are more posts on the server, display right
              navigation arrow */
              if (morePostsOnServer) {
                document.getElementById('posts-right-arrow').classList
                  .add('display');
              }

              // Otherwise, hide right arrow
              else {
                document.getElementById('posts-right-arrow').classList
                  .remove('display');
              }
            }

            // Display message if user has no posts
            else {
              postList.innerHTML = 'There are no posts for this user.';
            }

          });

          return;
        }

        // Add error message to post list if server responds with error
        postList.innerHTML = 'There was an error loading the user\'s posts. ' +
          'Please refresh the page.';

        return;
      }
    });
}


// Load user's comments to profile comment area from server
function loadComments() {
  return fetch(api + '/thought-writer/comments/user/' + username + '?start=' +
    commentStart + '&end=' + commentEnd)

      // Add error message to comment list if server responds with error
      .catch(function(error) {
        // Add server down banner to page (from common.js script)
        pingServer(retryFunctions);

        commentList.innerHTML = 'There was an error loading the user\'s ' +
          'comments. Please refresh the page.';

        return;
      })

      .then(function(response) {
        if (response) {
          // Remove server down banner from page (from common.js script)
          pingServer();

          if (response.ok) {
            response.json().then(function(comments) {
              // Clear comment area to display new comments from server
              commentList.innerHTML = '';

              if (comments.length > 0) {
                /* Assess if there are more than requested comments - 1 (number
                of loaded comments) on server */
                if (comments.length > (commentEnd - commentStart - 1)) {
                  moreCommentsExist = true;
                  var commentsLoadNumber = commentEnd - commentStart - 1;
                }

                // If there are not, load all comments sent from server
                else {
                  moreCommentsExist = false;
                  var commentsLoadNumber = comments.length;
                }

                for (var i = 0; i < commentsLoadNumber; i++) {
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
                  commentContent.innerHTML = comments[i].content;

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
                  parentPost.href = '../../thought-writer/post/?post=' +
                    comments[i].post_id + '#comment' + comments[i].comment_id;
                  parentPost.innerHTML = comments[i].title;

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
                    document.getElementById('comments-left-arrow').classList
                      .add('display');
                  }

                // Otherwise, hide left arrow
                else {
                  document.getElementById('comments-left-arrow').classList
                    .remove('display');
                }

                /* If there are more comments on the server, display right
                navigation arrow */
                if (moreCommentsExist) {
                  document.getElementById('comments-right-arrow').classList
                    .add('display');
                }

                // Otherwise, hide right arrow
                else {
                  document.getElementById('comments-right-arrow').classList
                    .remove('display');
                }
              }

              // Display message if user has no comments
              else {
                commentList.innerHTML = 'There are no comments for this user.';
              }

            });

            return;
          }

          // Add error message to comment list if server responds with error
          commentList.innerHTML = 'There was an error loading the user\'s ' +
            'comments. Please refresh the page.';

          return;
        }
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


/* Request lower-numbered comments if left arrow is clicked in profile comment
area */
document.getElementById('comments-left-arrow').onclick = function() {
  if (this.classList.contains('display')) {
    commentStart = commentStart - 3;
    commentEnd = commentEnd - 3;
    loadComments();
  }

  return;
}


/* Request higher-numbered comments if right arrow is clicked in profile
comment area */
document.getElementById('comments-right-arrow').onclick = function() {
  if (this.classList.contains('display')) {
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

  /* If the Drawings button is clicked, set the button as selected, hide posts
  and comments, and request drawings from server */
  if (this.id == 'drawings') {
    postsButton.classList.remove('selected');
    commentsButton.classList.remove('selected');
    drawingsButton.classList.add('selected');
    document.getElementById('post-list-row').classList.add('hidden');
    document.getElementById('comment-list-row').classList.add('hidden');
    document.getElementById('gallery-row').classList.remove('hidden');
    loadDrawings();
    return;
  }

  /* If the Posts button is clicked, set the button as selected, hide drawings
  and comments, and request posts from server */
  if (this.id == 'posts') {
    drawingsButton.classList.remove('selected');
    commentsButton.classList.remove('selected');
    postsButton.classList.add('selected');
    document.getElementById('gallery-row').classList.add('hidden');
    document.getElementById('comment-list-row').classList.add('hidden');
    document.getElementById('post-list-row').classList.remove('hidden');
    loadPosts();
    return;
  }

  /* Otherwise, set the Comments button as selected, hide drawings and posts,
  and request comments from server */
  drawingsButton.classList.remove('selected');
  postsButton.classList.remove('selected');
  commentsButton.classList.add('selected');
  document.getElementById('gallery-row').classList.add('hidden');
  document.getElementById('post-list-row').classList.add('hidden');
  document.getElementById('comment-list-row').classList.remove('hidden');
  loadComments();

  return;
}
