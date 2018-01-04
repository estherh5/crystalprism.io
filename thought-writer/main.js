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
  return fetch(api + '/thought-writer/post-board' + '?start=' + requestStart +
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
              var postTitle = document.createElement('div');
              postTitle.classList.add('post-title');
              postTitle.innerHTML = posts[i].title;

              /* Set data-writer and data-timestamp attributes to save in
              sessionStorage when clicked */
              postTitle.dataset.writer = posts[i].writer;
              postTitle.dataset.timestamp = posts[i].timestamp;

              // Create container with post content
              var postContent = document.createElement('div');
              postContent.classList.add('post-content');
              postContent.innerHTML = posts[i].content;

              // Create container for post timestamp, comment number, and writer
              var postInfo = document.createElement('div');
              postInfo.classList.add('post-info');

              // Create container for post timestamp
              var postTimestamp = document.createElement('div');

              /* Convert UTC timestamp from server to local timestamp in
              'MM/DD/YYYY, HH:MM AM/PM' format */
              postTimestamp.innerHTML = moment(posts[i].timestamp)
                .format('MM/DD/YYYY, LT');

              // Create container for number of post comments
              var postComments = document.createElement('div');
              postComments.classList.add('post-comments');

              if (posts[i].comments.length == 1) {
                postComments.innerHTML = posts[i].comments.length + ' comment';
              } else {
                postComments.innerHTML = posts[i].comments.length + ' comments';
              }

              /* Set data-writer and data-timestamp attributes to save in
              sessionStorage when clicked */
              postComments.dataset.writer = posts[i].writer;
              postComments.dataset.timestamp = posts[i].timestamp;

              // Create container for post writer with link to profile
              var postWriter = document.createElement('a');
              postWriter.href = '../user/?username=' + posts[i]
                .writer;
              postWriter.innerHTML = posts[i].writer;
              postBoard.appendChild(postContainer);
              postContainer.appendChild(postTitle);
              postContainer.appendChild(postContent);
              postContainer.appendChild(postInfo);
              postInfo.appendChild(postTimestamp);
              postInfo.appendChild(postComments);
              postInfo.appendChild(postWriter);

              /* Set sessionStorage items when post title is clicked and go to
              post page */
              postTitle.onclick = function() {
                sessionStorage.setItem('writer', this.dataset.writer);
                sessionStorage.setItem('post-timestamp-public', this.dataset
                  .timestamp);
                window.location = 'post/';
                return;
              }

              /* Set sessionStorage items when post comment number is clicked
              and go to post page's comments */
              postComments.onclick = function() {
                sessionStorage.setItem('writer', this.dataset.writer);
                sessionStorage.setItem('post-timestamp-public', this.dataset
                  .timestamp);
                window.location = 'post/#comments';
                return;
              }
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


// Assess percentage that user has scrolled down page
function percentScrolled(){
  // Determine document height (different for different browsers)
  var documentHeight = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
      document.body.clientHeight, document.documentElement.clientHeight);

  // Determine window height (different for different browsers)
  var windowHeight = window.innerHeight || (document.documentElement || document
    .body).clientHeight;

  // Determine how far from top user has scrolled down page
  var scrollTop = window.pageYOffset || (document.documentElement || document
    .body.parentNode || document.body).scrollTop;

  // Determine length scrollbar can travel down
  var scrollLength = documentHeight - windowHeight;

  // Return percentage scrolled down page
  return Math.floor((scrollTop / scrollLength) * 100);
}
