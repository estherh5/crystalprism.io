// Define global variables
var postId = window.location.search.split('post=')[1];
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

  // Request post based on webpage query param
  return fetch(api + '/thought-writer/post/' + postId)

      /* Display error message if server is down and error isn't already
      displayed (i.e., prevent multiple errors if user submits comment and
      requests to reload post) */
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
            postTimestamp.innerHTML = moment(post.created)
              .format('MM/DD/YYYY, LT');

            // Add link to writer's profile
            postWriter.href = '../../user/?username=' + post.username;
            postWriter.innerHTML = post.username;

            /* Clear comments list (for function call when user submits new
            comment) */
            comments.innerHTML = '';

            // Display comment count
            if (post.comment_count == 1) {
              commentCount.innerHTML = post.comment_count + ' comment';
            } else {
              commentCount.innerHTML = post.comment_count + ' comments';
            }

            // Load post comments to comments list
            loadComments(post.post_id);
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


// Load comments for passed post id
function loadComments(postId) {
  return fetch(api + '/thought-writer/comments/post/' + postId)

    .then(function(response) {
      if (response.ok) {
        response.json().then(function(comments) {

          for (var i = 0; i < comments.length; i++) {
            // Create container for comment
            var commentContainer = document.createElement('div');
            commentContainer.classList.add('comment-container');

            // Create container for comment content
            var commentContent = document.createElement('div');
            commentContent.classList.add('comment-content');
            commentContent.innerHTML = comments[i].content;

            // Create link to commenter's profile
            var commenter = document.createElement('a');
            commenter.classList.add('commenter');
            commenter.href = '../../user/?username=' + comments[i].username;
            commenter.innerHTML = comments[i].username;

            // Create container for comment timestamp
            var commentTimestamp = document.createElement('div');
            commentTimestamp.classList.add('comment-timestamp');

            /* Convert UTC timestamp from server to local timestamp in
            'MM/DD/YYYY, HH:MM AM/PM' format */
            commentTimestamp.innerHTML = moment(comments[i].created)
              .format('MM/DD/YYYY, LT');

            document.getElementById('comments').appendChild(commentContainer);
            commentContainer.appendChild(commentContent);
            commentContainer.appendChild(commenter);
            commentContainer.appendChild(commentTimestamp);
          }
        });
      }
      return;
    });
}

// Post comment to server when Submit button is clicked
document.getElementById('submit-comment').onclick = submitComment;

function submitComment() {
  // If user is not logged in, warn user that login is required to post comment
  if (localStorage.getItem('token') == null) {
    window.alert('You must log in to leave a comment.');
    return;
  }

  var newComment = document.getElementById('new-comment-box');

  /* If comment does not contain any non-space characters (excluding empty
  elements), display warning to user */
  if (!/\S/.test(newComment.textContent)) {
    window.alert('Your comment cannot be blank.');
    return;
  }

  // Otherwise, send comment to server
  var data = JSON.stringify({'content': newComment.innerHTML,
    'post_id': parseInt(postId)});

  return fetch(api + '/thought-writer/comment', {
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
