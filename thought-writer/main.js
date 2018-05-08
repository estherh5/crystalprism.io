// Define global variables
var errorMessage;
var requestStart = 0; // Range start for number of posts to request from server
var requestEnd = 12; // Range end for number of posts to request from server
var morePostsToDisplay = false;
var postBoard = document.getElementById('post-board');


// Define load functions
window.onload = function() {
  // Load posts from server
  loadPosts();

  // Create page header (from common.js script)
  createPageHeader();

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
  // Clear post board to display most up-to-date server posts
  postBoard.innerHTML = '';

  checkIfLoggedIn();
  loadPosts();

  return;
}


// Load posts from server
function loadPosts() {
  return fetch(api + '/thought-writer/posts?start=' + requestStart + '&end=' +
    requestEnd)

      /* Display error message if server is down and error isn't already
      displayed (i.e., prevent multiple errors when scrolling to load more
      posts) */
      .catch(function(error) {
        // Add server down banner to page (from common.js script)
        pingServer(retryFunctions);

        // Display cached posts if they are stored in localStorage
        if (localStorage.getItem('thought-writer-post-board-posts')) {
          var posts = JSON.parse(localStorage
            .getItem('thought-writer-post-board-posts'));

          /* Assess if there are more than requested posts - 1 (number of
          loaded posts) */
          if (posts.length > (requestEnd - 1)) {
            morePostsToDisplay = true;
            var loadNumber = requestEnd - 1;
          }

          // If there are not, load all posts
          else {
            morePostsToDisplay = false;
            var loadNumber = posts.length;
          }

          displayPosts(posts.slice(requestStart, loadNumber));
        }

        // Otherwise, display error message
        else if (!errorMessage || errorMessage.parentNode != postBoard) {
          errorMessage = document.createElement('text');
          errorMessage.id = 'error-message';
          errorMessage.innerHTML = 'There was an error loading the post ' +
            'board. Please refresh the page.';
          postBoard.appendChild(errorMessage);
        }

        return;
      })

      .then(function(response) {
        if (response) {
          // Remove server down banner from page (from common.js script)
          pingServer();

          // Display posts on post board if server responds without error
          if (response.ok) {
            response.json().then(function(posts) {
              if (posts.length != 0) {

                // Remove error message from post board if it is displayed
                if (errorMessage && errorMessage.parentNode == postBoard) {
                  postBoard.removeChild(errorMessage);
                }

                /* Assess if there are more than requested posts - 1 (number of
                loaded posts) on server */
                if (posts.length > (requestEnd - requestStart - 1)) {
                  morePostsToDisplay = true;
                  var loadNumber = requestEnd - requestStart - 1;
                }

                // If there are not, load all posts sent from server
                else {
                  morePostsToDisplay = false;
                  var loadNumber = posts.length;
                }

                displayPosts(posts.slice(0, loadNumber));

                /* Remove locally stored posts if this is the initial request
                to replace with latest posts from server */
                if (requestStart == 0) {
                  localStorage.removeItem('thought-writer-post-board-posts');
                  var localPosts = [];
                }

                // Otherwise, get locally stored posts list
                else {
                  var localPosts = JSON.parse(localStorage
                    .getItem('thought-writer-post-board-posts'));
                }

                /* Add each post to locally stored posts list based on
                requestStart and requestEnd values */
                for (var i = 0; i < posts.length; i++) {
                  localPosts[requestStart + i] = posts[i];
                }

                // Store posts in localStorage for offline loading
                localStorage.setItem('thought-writer-post-board-posts', JSON
                  .stringify(localPosts));
              }

              // If there are no posts sent from server, set variable to false
              else {
                morePostsToDisplay = false;
              }
            });

            return;
          }

          // Display error message if the server sends an error
          if (!errorMessage || errorMessage.parentNode != postBoard) {
            errorMessage = document.createElement('text');
            errorMessage.id = 'error-message';
            errorMessage.innerHTML = 'There are no posts on the post board. ' +
              'Click the yellow paper icon to create one.';
            postBoard.appendChild(errorMessage);
          }

          return;
        }
      });
}


// Display passed posts on post board
function displayPosts(posts) {
  for (var i = 0; i < posts.length; i++) {
    // Create container for post and its components
    var postContainer = document.createElement('div');
    postContainer.classList.add('post-container');

    // Create container for post title
    var postTitle = document.createElement('a');
    postTitle.classList.add('post-title');
    postTitle.innerHTML = posts[i].title;
    postTitle.href = 'post/?post=' + posts[i].post_id;

    // Create container with post content
    var postContent = document.createElement('div');
    postContent.classList.add('post-content');
    postContent.innerHTML = posts[i].content;

    /* Create container for post timestamp, comment number, and
    writer */
    var postInfo = document.createElement('div');
    postInfo.classList.add('post-info');

    // Create container for post timestamp
    var postTimestamp = document.createElement('div');

    /* Convert UTC timestamp from server to local timestamp in
    'MM/DD/YYYY, HH:MM AM/PM' format */
    postTimestamp.innerHTML = moment(posts[i].created)
      .format('MM/DD/YYYY, LT');

    // Create container for number of post comments
    var postComments = document.createElement('a');
    postComments.classList.add('post-comments');
    postComments.href = 'post/?post=' + posts[i]
      .post_id + '#comments';

    if (posts[i].comment_count == 1) {
      postComments.innerHTML = posts[i].comment_count +
        ' comment';
    } else {
      postComments.innerHTML = posts[i].comment_count +
        ' comments';
    }

    // Create container for post writer with link to profile
    var postWriter = document.createElement('a');
    postWriter.href = '../user/?username=' + posts[i].username;
    postWriter.innerHTML = posts[i].username;
    postBoard.appendChild(postContainer);
    postContainer.appendChild(postTitle);
    postContainer.appendChild(postContent);
    postContainer.appendChild(postInfo);
    postInfo.appendChild(postTimestamp);
    postInfo.appendChild(postComments);
    postInfo.appendChild(postWriter);
  }

  return;
}


// Request more posts as user scrolls down page (infinite scroll)
window.addEventListener('scroll', requestMorePosts, false);

function requestMorePosts() {
  if (scrolled) {
    /* If user has scrolled more than 90% of way down page and the server has
    more posts, update request numbers */
    if (percentScrolled() > 90 && morePostsToDisplay) {
      // Set post request start number to previous end number - 1
      requestStart = requestEnd - 1;

      /* Set post request end number to previous end number + number of posts
      that can fit in one row of post board */
      requestEnd = requestEnd + Math.floor((postBoard.offsetWidth) / (document
        .getElementsByClassName('post-container')[0].offsetWidth));

      // Load posts with new request numbers
      loadPosts();
    }
  }

  /* Otherwise, set scrolled variable to true to indicate user scrolled down
  infinite scroll page (used for smooth scrolling in common.js file) */
  scrolled = true;

  return;
}
