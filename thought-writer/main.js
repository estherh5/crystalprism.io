// Define global variables
var errorMessage;
var requestStart = 0; // Range start for number of posts to request from server
var requestEnd = 12; // Range end for number of posts to request from server
var morePostsToDisplay = false;
var loadingPosts = false; // True while a request for posts is in flight
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
  requestStart = 0;
  requestEnd = 12;

  checkIfLoggedIn();
  loadPosts();

  return;
}


// Load posts from server
function loadPosts() {
  var start = requestStart;
  loadingPosts = true;
  morePostsToDisplay = false;

  // Remove the empty-board message if it is displayed
  if (errorMessage && errorMessage.parentNode == postBoard) {
    postBoard.removeChild(errorMessage);
  }

  // Loading shows in the board from the first frame, below any posts
  slotLoading(postBoard, start == 0 ? 'Loading posts…' : 'Loading more posts…');

  return fetchWithTimeout(api + '/thought-writer/posts?start=' + start +
    '&end=' + requestEnd)

    .then(function(response) {
      if (!response.ok) {
        throw new Error('Server answered ' + response.status);
      }

      // Remove server down banner from page (from common.js script)
      pingServer();

      return response.json();
    })

    .then(function(posts) {
      loadingPosts = false;
      clearSlotStatus(postBoard);

      // An empty board says so, and how to fill it
      if (posts.length == 0) {
        if (start == 0) {
          errorMessage = document.createElement('text');
          errorMessage.id = 'error-message';
          errorMessage.textContent = 'There are no posts on the post board. ' +
            'Click the yellow paper icon to create one.';
          postBoard.appendChild(errorMessage);
        }

        return;
      }

      /* Assess if there are more than requested posts - 1 (number of loaded
      posts) on server */
      if (posts.length > (requestEnd - start - 1)) {
        morePostsToDisplay = true;
        var loadNumber = requestEnd - start - 1;
      }

      // If there are not, load all posts sent from server
      else {
        var loadNumber = posts.length;
      }

      displayPosts(posts.slice(0, loadNumber));

      /* Remove locally stored posts if this is the initial request to replace
      with latest posts from server */
      try {
        var localPosts = start == 0 ? [] : JSON.parse(localStorage
          .getItem('thought-writer-post-board-posts')) || [];

        /* Add each post to locally stored posts list based on request start
        value */
        for (var i = 0; i < posts.length; i++) {
          localPosts[start + i] = posts[i];
        }

        // Store posts in localStorage for offline loading
        localStorage.setItem('thought-writer-post-board-posts', JSON
          .stringify(localPosts));
      } catch (e) {}

      return;
    })

    .catch(function() {
      loadingPosts = false;

      // On first load, cached posts stand in if they are stored in localStorage
      if (start == 0 && !postBoard.getElementsByClassName('post-container')
        .length) {
          try {
            var posts = JSON.parse(localStorage
              .getItem('thought-writer-post-board-posts') || '[]');
          } catch (e) {
            var posts = [];
          }

          if (posts.length) {
            clearSlotStatus(postBoard);
            displayPosts(posts.slice(0, requestEnd - 1));
            return;
          }
        }

      /* Otherwise the failure shows where the posts would be, below any
      already on the board, and Retry asks for the same posts again */
      slotFailure(postBoard, start == 0 ? "Couldn't load the post board." :
        "Couldn't load more posts.", loadPosts);

      return;
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
    postTitle.textContent = posts[i].title;
    postTitle.href = 'post/?post=' + posts[i].post_id;

    // Create container with post content
    var postContent = document.createElement('div');
    postContent.classList.add('post-content');
    setRichText(postContent, posts[i].content);

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
      postComments.textContent = (Number(posts[i].comment_count) || 0) +
        ' comment';
    } else {
      postComments.textContent = (Number(posts[i].comment_count) || 0) +
        ' comments';
    }

    // Create container for post writer with link to profile
    var postWriter = document.createElement('a');
    postWriter.href = appUrl('account', '?username=' + encodeURIComponent(posts[i].username));
    postWriter.textContent = posts[i].username;
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
    if (percentScrolled() > 90 && morePostsToDisplay && !loadingPosts) {
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
