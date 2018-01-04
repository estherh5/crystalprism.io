// Define global variables
var errorMessage = null;
var postWriter = document.getElementById('post-writer');


// Define load functions
window.onload = function() {
  // Create page header (from common.js script)
  createPageHeader();

  // Create page footer (from common.js script)
  createPageFooter();

  // Check if Crystal Prism API is online (from common.js script)
  pingServer(function() {
    checkIfLoggedIn();
    loadPost();
    return;
  });

  // Check if user is logged in (from common.js script)
  checkIfLoggedIn();

  // Load post to post board from server
  loadPost();

  return;
}


// Load post to post board from server
function loadPost() {
  var postTitle = document.getElementById('post-title');
  var postContent = document.getElementById('post-content');
  var postTimestamp = document.getElementById('post-timestamp');
  var comments = document.getElementById('comments');
  var commentCount = document.getElementById('comment-count');

  // Request post based on items stored in sessionStorage
  var postPath = encodeURIComponent(sessionStorage
    .getItem('writer')) + '/' + encodeURIComponent(sessionStorage
    .getItem('post-timestamp-public'));

  return fetch(api + '/thought-writer/post/' + postPath)

    /* Display error message if server is down and error isn't already displayed
    (i.e., prevent multiple errors if user submits comment and requests to
    reload post) */
    .catch(function(error) {
      if (errorMessage == null) {
        errorMessage = document.createElement('text');
        errorMessage.id = 'error-message';
        errorMessage.innerHTML = 'There was an error loading the post. ' +
          'Please refresh the page.';
        // Clear post and append error message
        document.getElementById('post-background').innerHTML = '';
        document.getElementById('post-background').appendChild(errorMessage);
        return;
      }
    })

    .then(function(response) {
      if (response.ok) {
        response.json().then(function(post) {

          // Set page title and post title container to title of post
          document.title = post.title;
          postTitle.innerHTML = post.title;

          // Add post content to post content container
          postContent.innerHTML = post.content;

          /* Convert UTC timestamp from server to local timestamp in
          'MM/DD/YYYY, HH:MM AM/PM' format */
          postTimestamp.innerHTML = moment(post.timestamp)
            .format('MM/DD/YYYY, LT');

          // Add link to writer's profile
          postWriter.href = '../../user/?username=' + post.writer;
          postWriter.innerHTML = post.writer;

          /* Clear comments list (for function call when user submits new
          comment) */
          comments.innerHTML = '';

          // Display comment count
          if (post.comments.length == 1) {
            commentCount.innerHTML = post.comments.length + ' comment';
          } else {
            commentCount.innerHTML = post.comments.length + ' comments';
          }

          // Append post comments to comments list
          for (var i = 0; i < post.comments.length; i++) {
            // Create container for comment
            var commentContainer = document.createElement('div');
            commentContainer.classList.add('comment-container');

            // Create container for comment content
            var commentContent = document.createElement('div');
            commentContent.classList.add('comment-content');
            commentContent.innerHTML = post.comments[i].content;

            // Create link to commenter's profile
            var commenter = document.createElement('a');
            commenter.classList.add('commenter');
            commenter.href = '../../user/?username=' + post
              .comments[i].commenter;
            commenter.innerHTML = post.comments[i].commenter;

            // Create container for comment timestamp
            var commentTimestamp = document.createElement('div');
            commentTimestamp.classList.add('comment-timestamp');

            /* Convert UTC timestamp from server to local timestamp in
            'MM/DD/YYYY, HH:MM AM/PM' format */
            var commentDate = new Date(post.comments[i].timestamp);
            commentTimestamp.innerHTML = moment(post.comments[i].timestamp)
              .format('MM/DD/YYYY, LT');
            comments.appendChild(commentContainer);
            commentContainer.appendChild(commentContent);
            commentContainer.appendChild(commenter);
            commentContainer.appendChild(commentTimestamp);
          }
        });

        return;
      }

      // Display error message if server responds with error
      if (errorMessage == null) {
        errorMessage = document.createElement('text');
        errorMessage.id = 'error-message';
        errorMessage.innerHTML = 'There was an error loading the post. ' +
          'Please refresh the page.';

        // Clear page container and append error message
        document.getElementById('container').innerHTML = '';
        document.getElementById('container').appendChild(errorMessage);

        return;
      }
    });
}


// Post comment to server when Submit button is clicked
document.getElementById('submit-comment').onclick = submitComment;

function submitComment() {
  var newComment = document.getElementById('new-comment-box');

  /* If comment does not contain any non-space characters (excluding empty
  elements), display warning to user */
  if (!/\S/.test(newComment.textContent)) {
    window.alert('Your comment cannot be blank.');
    return;
  }

  // Otherwise, send comment to server
  var data = JSON.stringify({'content': newComment.innerHTML});
  var postPath = encodeURIComponent(postWriter
    .innerHTML) + '/' + encodeURIComponent(sessionStorage
    .getItem('post-timestamp-public'));

  return fetch(api + '/thought-writer/comment/' + postPath, {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'),
      'Content-Type': 'application/json'},
    method: 'POST',
    body: data,
  })

    // Display error if server is down
    .catch(function(error) {
      window.alert('Your comment did not go through. Please try again soon.');
    })

    .then(function(response) {
      if (response.ok) {
        // Clear new comment box
        newComment.innerHTML = '';

        // Reload post to get updated comments list
        loadPost();

        return;
      }

      // Display alert if server responded with error
      window.alert('You must log in to leave a comment.');

      return;
    });
}
