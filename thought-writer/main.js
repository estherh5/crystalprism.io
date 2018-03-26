// Define global variables
var errorMessage = null;
var requestStart = 0; // Range start for number of posts to request from server
var requestEnd = 12; // Range end for number of posts to request from server
var morePostsOnServer = false;
var postBoard = document.getElementById('post-board');


// Define load functions
window.onload = function() {
  // Create page header (from common.js script)
  createPageHeader();

  // Create page footer (from common.js script)
  createPageFooter();

  // Check if Crystal Prism API is online (from common.js script)
  pingServer(function() {
    checkIfLoggedIn();
    loadPosts();
    return;
  });

  // Check if user is logged in (from common.js script)
  checkIfLoggedIn();

  // Load posts to post board from server
  loadPosts();

  return;
}


// Load posts to post board from server
function loadPosts() {
  return fetch(api + '/thought-writer/posts' + '?start=' + requestStart +
    '&end=' + requestEnd)

    /* Display error message if server is down and error isn't already displayed
    (i.e., prevent multiple errors when scrolling to load more posts) */
    .catch(function(error) {
      if (errorMessage == null) {
        errorMessage = document.createElement('text');
        errorMessage.id = 'error-message';
        errorMessage.innerHTML = 'There was an error loading the post board. ' +
          'Please refresh the page.';
        postBoard.appendChild(errorMessage);
        return;
      }
    })

    .then(function(response) {
      if (response.ok) {
        response.json().then(function(posts) {

          // Add posts to post board if there is at least 1 sent from server
          if (posts.length != 0) {

            // Remove error message from post board if it is displayed
            if (errorMessage != null) {
              postBoard.removeChild(errorMessage);
            }

            /* Assess if there are more than requested posts - 1 (number of
            loaded posts) on server */
            if (posts.length > (requestEnd - requestStart - 1)) {
              morePostsOnServer = true;
              var loadNumber = requestEnd - requestStart - 1;
            }

            // If there are not, load all posts sent from server
            else {
              morePostsOnServer = false;
              var loadNumber = posts.length;
            }

            for (var i = 0; i < loadNumber; i++) {
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
                postComments.innerHTML = posts[i].comment_count + ' comment';
              } else {
                postComments.innerHTML = posts[i].comment_count + ' comments';
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
          }

          // If there are no posts sent from server, set variable to false
          else {
            morePostsOnServer = false;
          }
        });

        return;
      }

      // Display error message if the server sends an error
      if (errorMessage == null) {
        errorMessage = document.createElement('text');
        errorMessage.id = 'error-message';
        errorMessage.innerHTML = 'There are no posts on the post board. ' +
          'Click the yellow paper icon to create one.';
        postBoard.appendChild(errorMessage);
        return;
      }
    });
}


// Request more posts as user scrolls down page (infinite scroll)
window.addEventListener('scroll', requestMorePosts, false);

function requestMorePosts() {
  /* If user has scrolled more than 90% of way down page and the server has
  more posts, update request numbers */
  if (percentScrolled() > 90 && morePostsOnServer) {
    // Set post request start number to previous end number
    requestStart = requestEnd;

    /* Set post request end number to previous end number + number of posts
    that can fit in one row of gallery */
    requestEnd = requestEnd + Math.floor((postBoard.offsetWidth) / (document
      .getElementsByClassName('post-container')[0].offsetWidth));

    // Load posts with new request numbers
    loadPosts();
  }

  return;
}
