// Define global variables
var postId = window.location.search.split('post=')[1];
var errorMessage = null;
var postWriter = document.getElementById('post-writer');
var loaded = false; // Track whether or not comments have loaded
var requestStart = 0; // Range start for number of comments to request from server
var requestEnd = 11; // Range end for number of comments to request from server
var moreCommentsOnServer = false;


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

  // Load post comments to comments list
  loadComments(postId);

  return;
}


// Load post to post board from server
function loadPost() {
  var postBackground = document.getElementById('post-background');
  var postTitle = document.getElementById('post-title');
  var postTimestamp = document.getElementById('post-timestamp');
  var postModTimestamp = document.getElementById('post-modified-timestamp');
  var commentCount = document.getElementById('comments');

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
        postBackground.innerHTML = '';
        postBackground.appendChild(errorMessage);
        return;
      }
    })

    .then(function(response) {
      if (response.ok) {
        response.json().then(function(post) {
          // Clear post background to display post
          postBackground.innerHTML = '';

          // Set page title and post title container to title of post
          document.title = post.title;
          postTitle.innerHTML = post.title;

          // Create post content container
          var postContent = document.createElement('div');
          postContent.id = 'post-content';
          postBackground.appendChild(postContent);

          // Add content to post content container
          postContent.innerHTML = post.content;

          /* Convert UTC timestamp from server to local timestamp in
          'MM/DD/YYYY, HH:MM AM/PM' format */
          postTimestamp.innerHTML = moment(post.created)
            .format('MM/DD/YYYY, LT');

          // Display modified timestamp if post was edited
          if (post.created != post.modified) {
            postModTimestamp.innerHTML = 'Edited ' + moment(post.modified)
              .format('MM/DD/YYYY, LT');
          }

          // Add link to writer's profile
          postWriter.href = '../../user/?username=' + post.username;
          postWriter.innerHTML = post.username;

          // Display comment count
          if (post.comment_count == 1) {
            commentCount.innerHTML = post.comment_count + ' comment';
          } else {
            commentCount.innerHTML = post.comment_count + ' comments';
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


// Load comments for passed post id
function loadComments(postId) {
  return fetch(api + '/thought-writer/comments/post/' + postId + '?start=' +
    requestStart + '&end=' + requestEnd)

      .then(function(response) {
        if (response.ok) {
          response.json().then(function(comments) {
            /* Assess if there are more than requested comments - 1 (number of
            loaded comments) on server */
            if (comments.length > (requestEnd - requestStart - 1)) {
              moreCommentsOnServer = true;
              var loadNumber = requestEnd - requestStart - 1;
            }

            // If there are not, load all comments sent from server
            else {
              moreCommentsOnServer = false;
              var loadNumber = comments.length;
            }

            for (var i = 0; i < loadNumber; i++) {
              // Create container for comment
              var commentContainer = document.createElement('div');
              commentContainer.classList.add('comment-container');
              commentContainer.id = 'comment' + comments[i].comment_id;

              // Create container for comment content
              var commentContent = document.createElement('div');
              commentContent.classList.add('comment-content');
              commentContent.dataset.id = comments[i].comment_id;
              commentContent.innerHTML = comments[i].content;

              // Create link to commenter's profile
              var commenter = document.createElement('a');
              commenter.classList.add('commenter');
              commenter.href = '../../user/?username=' + comments[i].username;
              commenter.innerHTML = comments[i].username;

              // Create container for comment timestamp
              var commentTimestamp = document.createElement('div');
              commentTimestamp.classList.add('comment-timestamp');

              /* Display modified timestamp if comment was edited, converting
              UTC timestamp from server to local timestamp in 'MM/DD/YYYY, HH:MM
              AM/PM' format */
              if (comments[i].created != comments[i].modified) {
                commentTimestamp.innerHTML = moment(comments[i].created)
                  .format('MM/DD/YYYY, LT') + ' (edited)';
              } else {
                commentTimestamp.innerHTML = moment(comments[i].created)
                  .format('MM/DD/YYYY, LT');
              }

              document.getElementById('comments-list')
                .appendChild(commentContainer);
              commentContainer.appendChild(commentContent);
              commentContainer.appendChild(commenter);
              commentContainer.appendChild(commentTimestamp);

              /* Create buttons for editing and deleting comment if user created
              the comment */
              if (comments[i].username == localStorage.getItem('username')) {
                var buttonContainer = document.createElement('div');
                buttonContainer.classList.add('button-container');

                var submitButton = document.createElement('button');
                submitButton.classList.add('submit-button');
                submitButton.dataset.submitid = comments[i].comment_id;
                submitButton.innerHTML = 'Submit';
                submitButton.onclick = submitEdits;

                var cancelButton = document.createElement('button');
                cancelButton.classList.add('cancel-button');
                cancelButton.dataset.cancelid = comments[i].comment_id;
                cancelButton.dataset.content = comments[i].content;
                cancelButton.innerHTML = 'Cancel';
                cancelButton.onclick = cancelEdits;

                var modifyButton = document.createElement('button');
                modifyButton.classList.add('modify-button');
                modifyButton.dataset.modifyid = comments[i].comment_id;
                modifyButton.innerHTML = 'Modify';
                modifyButton.onclick = modifyComment;

                var deleteButton = document.createElement('button');
                deleteButton.classList.add('delete-button');
                deleteButton.dataset.deleteid = comments[i].comment_id;
                deleteButton.innerHTML = 'Delete';
                deleteButton.onclick = deleteComment;

                commentContainer.appendChild(buttonContainer);
                buttonContainer.appendChild(submitButton);
                buttonContainer.appendChild(cancelButton);
                buttonContainer.appendChild(modifyButton);
                buttonContainer.appendChild(deleteButton);
              }
            }

            // Jump to comment specified in URL hash after comments load
            if (window.location.hash && !loaded) {
              window.location = window.location.href;
              loaded = true;
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

        // Reload post
        loadPost();

        // Clear comments list
        document.getElementById('comments-list').innerHTML = '';

        // Reset request query params
        requestStart = 0;
        requestEnd = 11;

        // Reload comments list
        loadComments(postId);

        return;
      }

      // Display alert if server responded with error
      window.alert('You must log in to leave a comment.');

      return;
    });
}


// Enter edit mode for comment when Modify button is clicked
function modifyComment() {
  var comment = document.querySelectorAll('[data-id="' + this.dataset
    .modifyid + '"]')[0];
  var submitButton = document.querySelectorAll('[data-submitid="' + this
    .dataset.modifyid + '"]')[0];
  var cancelButton = document.querySelectorAll('[data-cancelid="' + this
    .dataset.modifyid + '"]')[0];

  // Make comment contenteditable
  comment.contentEditable = 'true';

  comment.classList.add('editing');

  // Set focus in contenteditable comment for immediate editing
  comment.focus();

  // Hide Modify button and display Submit and Cancel buttons
  this.style.display = 'none';
  submitButton.style.display = 'block';
  cancelButton.style.display = 'block';

  return;
}

// Cancel edits for comment when Cancel button is clicked
function cancelEdits() {
  var comment = document.querySelectorAll('[data-id="' + this.dataset
    .cancelid + '"]')[0];
  var submitButton = document.querySelectorAll('[data-submitid="' + this
    .dataset.cancelid + '"]')[0];
  var modifyButton = document.querySelectorAll('[data-modifyid="' + this
    .dataset.cancelid + '"]')[0];

  // Reset comment to non-contenteditable
  comment.contentEditable = 'false';

  comment.classList.remove('editing');

  // Reset comment content to pre-editing content
  comment.innerHTML = this.dataset.content;

  // Hide Submit and Cancel buttons and display Modify button
  this.style.display = 'none';
  submitButton.style.display = 'none';
  modifyButton.style.display = 'block';

  return;
}

// Submit edits for comment when Submit button is clicked
function submitEdits() {
  var comment = document.querySelectorAll('[data-id="' + this.dataset
    .submitid + '"]')[0];
  var commentTimestamp = comment.parentNode
    .getElementsByClassName('comment-timestamp')[0];
  var submitButton = this;
  var cancelButton = document.querySelectorAll('[data-cancelid="' + this
    .dataset.submitid + '"]')[0];
  var modifyButton = document.querySelectorAll('[data-modifyid="' + this
    .dataset.submitid + '"]')[0];

  /* If comment does not contain any non-space characters (excluding empty
  elements), display warning to user */
  if (!/\S/.test(comment.textContent)) {
    window.alert('Your comment cannot be blank.');
    return;
  }

  // Otherwise, send comment to server
  var data = JSON.stringify({'content': comment.innerHTML});

  return fetch(api + '/thought-writer/comment/' + this.dataset.submitid, {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'),
      'Content-Type': 'application/json'},
    method: 'PATCH',
    body: data,
  })

    // Display error if server is down
    .catch(function(error) {
      window.alert('Your edits did not go through. Please try again soon.');
    })

    .then(function(response) {
      if (response.ok) {
        // Reset comment to non-contenteditable
        comment.contentEditable = 'false';

        // Add '(edited)' to comment timestamp display
        commentTimestamp.innerHTML = commentTimestamp.innerHTML + ' (edited)'

        /* Set pre-editing content data attribute to new content for Cancel
        button */
        cancelButton.dataset.content = comment.innerHTML;

        // Hide Submit and Cancel buttons and display Modify button
        submitButton.style.display = 'none';
        cancelButton.style.display = 'none';
        modifyButton.style.display = 'block';

        return;
      }

      // Display alert if server responded with error
      window.alert('You must log in to modify a comment.');

      return;
    });
}

// Delete comment from server when user clicks Delete button
function deleteComment() {
  // Prompt for confirmation to delete comment
  var confirmDelete = confirm('Are you sure you want to delete this comment?');

  if (confirmDelete == true) {

    return fetch(api + '/thought-writer/comment/' + this.dataset.deleteid, {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'),
        'Content-Type': 'application/json'},
      method: 'DELETE',
    })

      // Display error message if server is down
      .catch(function(error) {
        window.alert('Your request did not go through. Please try again soon.');
        return;
      })

      .then(function(response) {
        if (response.ok) {
          // Reload post
          loadPost();

          // Clear comments list
          document.getElementById('comments-list').innerHTML = '';

          // Reset request query params
          requestStart = 0;
          requestEnd = 11;

          // Reload comments list
          loadComments(postId);

          return;
        }

        // Otherwise, display error message
        window.alert('You must log in to delete a comment.');

        return;
      });
    }

    return;
}


// Request more comments as user scrolls down page (infinite scroll)
window.addEventListener('scroll', requestMoreComments, false);

function requestMoreComments() {
  /* If user has scrolled more than 90% of way down page and the server has
  more comments, update request numbers */
  if (percentScrolled() > 90 && moreCommentsOnServer) {
    // Set comment request start number to previous end number - 1
    requestStart = requestEnd - 1;

    // Set comment request end number to previous end number + 10
    requestEnd = requestEnd + 10;

    // Load comments with new request numbers
    loadComments(postId);
  }

  return;
}
