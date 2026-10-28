// Define global variables
var postId = window.location.search.split('post=')[1];
var postWriter = document.getElementById('post-writer');
var loaded = false; // Track whether or not comments have loaded
var requestStart = 0; // Range start for number of comments to request from server
var requestEnd = 11; // Range end for number of comments to request from server
var moreCommentsToDisplay = false;
var loadingComments = false; // True while a request for comments is in flight


// Define load functions
window.onload = function() {
  // Create page header (from common.js script)
  createPageHeader();

  /* Check if user is logged in (from common.js script), then load the post
  and its comments: the stored username decides who sees Edit/Delete, and a
  first visit to this subdomain has none until the session check writes it */
  updateCommentAccess();

  // No post named in the link: say so without asking the server
  if (!postId) {
    showPostMissing();
  }
  else {
    Promise.resolve(checkIfLoggedIn()).then(function() {
      updateCommentAccess();
      loadPost();
      loadComments(postId);
    });
  }

  // Check if Crystal Prism API is online (from common.js script)
  pingServer(retryFunctions);

  // Create page footer (from common.js script)
  createPageFooter();

  return;
}


// A link with no post in it: the post frame says so and points to the board
function showPostMissing() {
  var postBackground = document.getElementById('post-background');
  var status = slotFailure(postBackground, 'There is no post at this link.');
  var board = document.createElement('a');
  board.href = '..';
  board.className = 'slot-retry';
  board.textContent = 'See all posts';
  status.appendChild(board);
  document.getElementById('comment-area').hidden = true;
  return;
}


// Functions to run when Retry button is clicked from server down banner
function retryFunctions() {
  if (!postId) {
    return;
  }

  // Clear comments list
  document.getElementById('comments-list').innerHTML = '';
  requestStart = 0;
  requestEnd = 11;

  Promise.resolve(checkIfLoggedIn()).then(function() {
    loadPost();
    loadComments(postId);
  });

  return;
}


// Load post from server
function loadPost() {
  var postBackground = document.getElementById('post-background');

  /* A first load shows Loading in the post's own frame; a reload (after a
  comment) keeps the post on screen while it refreshes */
  var showing = document.getElementById('post-content');
  if (!showing) {
    slotLoading(postBackground, 'Loading post…');
  }

  // Request post based on webpage query param
  return fetchWithTimeout(api + '/thought-writer/post/' + postId)

    .then(function(response) {
      if (!response.ok) {
        throw new Error('Server answered ' + response.status);
      }

      // Remove server down banner from page (from common.js script)
      pingServer();

      return response.json();
    })

    .then(function(post) {
      displayPost(post);

      // Store post in localStorage for offline loading
      try {
        localStorage.setItem('thought-writer-post-' + postId, JSON
          .stringify(post));
      } catch (e) {}

      return;
    })

    .catch(function() {
      // A reload that fails leaves the post already on screen
      if (document.getElementById('post-content')) {
        return;
      }

      // Display cached post if it is stored in localStorage
      try {
        var cached = JSON.parse(localStorage
          .getItem('thought-writer-post-' + postId));
      } catch (e) {
        var cached = null;
      }

      if (cached) {
        displayPost(cached);
        return;
      }

      /* Otherwise the failure shows in the post's frame, with Retry, and
      the comments of a post that isn't there stay hidden */
      document.getElementById('comment-area').hidden = true;
      slotFailure(postBackground, "Couldn't load this post.", loadPost);

      return;
    });
}


// Display passed post on post board
function displayPost(post) {
  var postBackground = document.getElementById('post-background');
  var postTitle = document.getElementById('post-title');
  var postTimestamp = document.getElementById('post-timestamp');
  var postModTimestamp = document.getElementById('post-modified-timestamp');
  var commentCount = document.getElementById('comments');

  // Clear post background to display post
  postBackground.innerHTML = '';
  document.getElementById('comment-area').hidden = false;

  // Set page title and post title container to title of post
  document.title = post.title;
  postTitle.textContent = post.title;

  // Create post content container
  var postContent = document.createElement('div');
  postContent.id = 'post-content';
  postBackground.appendChild(postContent);

  // Add content to post content container
  setRichText(postContent, post.content);

  // If user is the post writer, display edit and delete buttons
  if (post.username == localStorage.getItem('username')) {
    document.getElementById('edit').classList.remove('hidden');
    document.getElementById('delete').classList.remove('hidden');

    // Open the post in the editor, named in the URL
    document.getElementById('edit').onclick = function() {
      window.location = '../editor/?post=' + encodeURIComponent(postId);
      return;
    }
  } else {
    document.getElementById('edit').classList.add('hidden');
    document.getElementById('delete').classList.add('hidden');
  }

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
  postWriter.href = appUrl('account', '?username=' + encodeURIComponent(post.username));
  postWriter.textContent = post.username;

  // Display comment count
  if (post.comment_count == 1) {
    commentCount.textContent = (Number(post.comment_count) || 0) + ' comment';
  } else {
    commentCount.textContent = (Number(post.comment_count) || 0) + ' comments';
  }
}


// Delete post from server when post writer clicks Delete button
document.getElementById('delete').onclick = deletePost;

function deletePost() {
  var deleteButton = document.getElementById('delete');
  var postInfo = document.getElementById('post-info');
  clearInlineError(deleteButton);

  // Ask in the page, under the post, before deleting it
  inlineConfirm(deleteButton, 'Delete this post?', 'Delete', function() {
    /* Disable menu buttons and set cursor style to waiting until server
    request goes through */
    document.getElementById('edit').disabled = true;
    var restoreDelete = setBusy(deleteButton, 'Deleting…');
    document.body.style.cursor = 'wait';

    function reset() {
      document.getElementById('edit').disabled = false;
      restoreDelete();
      document.body.style.cursor = '';
      return;
    }

    return fetchWithTimeout(api + '/thought-writer/post/' + postId, {
      credentials: 'include',
      headers: {'Content-Type': 'application/json'},
      method: 'DELETE',
    })

      .then(function(response) {
        // Remove server down banner from page (from common.js script)
        pingServer();
        reset();

        if (response.ok) {
          window.location = '../';
          return;
        }

        // Otherwise, say why under the post
        inlineError(deleteButton, response.status == 401 ||
          response.status == 403 ? 'Sign in again to delete this post.' :
          "The post wasn't deleted. Try again in a moment.", postInfo);
        return;
      }, function() {
        // Add server down banner to page (from common.js script)
        pingServer(retryFunctions);
        reset();
        inlineError(deleteButton, "The post wasn't deleted. Check your " +
          'connection and try again.', postInfo);
        return;
      });
  }, postInfo);

  return;
}


// Load comments for passed post id
function loadComments(postId) {
  var commentsList = document.getElementById('comments-list');
  var start = requestStart;
  loadingComments = true;
  moreCommentsToDisplay = false;

  // Loading shows in the list from the first frame, below any comments
  slotLoading(commentsList, start == 0 ? 'Loading comments…' :
    'Loading more comments…');

  return fetchWithTimeout(api + '/thought-writer/comments/post/' + postId +
    '?start=' + start + '&end=' + requestEnd)

    .then(function(response) {
      if (!response.ok) {
        throw new Error('Server answered ' + response.status);
      }

      // Remove server down banner from page (from common.js script)
      pingServer();

      return response.json();
    })

    .then(function(comments) {
      loadingComments = false;
      clearSlotStatus(commentsList);

      /* Assess if there are more than requested comments - 1 (number of
      comments that will be displayed) on server */
      if (comments.length > (requestEnd - start - 1)) {
        moreCommentsToDisplay = true;
        var loadNumber = requestEnd - start - 1;
      }

      // If there are not, display all comments sent from server
      else {
        var loadNumber = comments.length;
      }

      displayComments(comments.slice(0, loadNumber));

      /* Replace locally stored comments if this is the initial request, or
      add to them otherwise */
      try {
        var localComments = start == 0 ? [] : JSON.parse(localStorage
          .getItem('thought-writer-comments-post-' + postId)) || [];

        for (var i = 0; i < comments.length; i++) {
          localComments[start + i] = comments[i];
        }

        // Store comments in localStorage for offline loading
        localStorage.setItem('thought-writer-comments-post-' + postId,
          JSON.stringify(localComments));
      } catch (e) {}

      return;
    })

    .catch(function() {
      loadingComments = false;

      // On first load, cached comments stand in if they are stored
      if (start == 0 && !commentsList
        .getElementsByClassName('comment-container').length) {
          try {
            var comments = JSON.parse(localStorage
              .getItem('thought-writer-comments-post-' + postId) || '[]');
          } catch (e) {
            var comments = [];
          }

          if (comments.length) {
            clearSlotStatus(commentsList);
            displayComments(comments.slice(0, requestEnd - 1));
            return;
          }
        }

      /* Otherwise the failure shows below any comments already listed, and
      Retry asks for the same comments again */
      slotFailure(commentsList, start == 0 ? "Couldn't load the comments." :
        "Couldn't load more comments.", function() {
          loadComments(postId);
        });

      return;
    });
}


// Display passed comments in comments area
function displayComments(comments) {
  for (var i = 0; i < comments.length; i++) {
    // Create container for comment
    var commentContainer = document.createElement('div');
    commentContainer.classList.add('comment-container');
    commentContainer.id = 'comment' + comments[i].comment_id;

    // Create container for comment content
    var commentContent = document.createElement('div');
    commentContent.classList.add('comment-content');
    commentContent.dataset.id = comments[i].comment_id;
    setRichText(commentContent, comments[i].content);

    // Create link to commenter's profile
    var commenter = document.createElement('a');
    commenter.classList.add('commenter');
    commenter.href = appUrl('account', '?username=' + encodeURIComponent(comments[i]
      .username));
    commenter.textContent = comments[i].username;

    // Create container for comment timestamp
    var commentTimestamp = document.createElement('div');
    commentTimestamp.classList.add('comment-timestamp');

    /* Display modified timestamp if comment was edited, converting
    UTC timestamp from server to local timestamp in 'MM/DD/YYYY,
    HH:MM AM/PM' format */
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

    /* Create buttons for editing and deleting comment if user
    created the comment */
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

  return;
}


// Post comment to server when Submit button is clicked
document.getElementById('submit-comment').onclick = submitComment;

function submitComment() {
  var submit = document.getElementById('submit-comment');
  var newComment = document.getElementById('new-comment-box');
  clearInlineError(submit);

  /* Signed-out visitors see a sign-in prompt instead of the box; a session
  that ended in another tab swaps to it here */
  if (!localStorage.getItem('username')) {
    updateCommentAccess();
    return;
  }

  /* If comment does not contain any non-space characters (excluding empty
  elements), say so under the box */
  if (!/\S/.test(newComment.textContent)) {
    inlineError(submit, 'Write your comment first, then submit it.');
    newComment.focus();
    return;
  }

  // Otherwise, send comment to server
  var data = JSON.stringify({'content': newComment.innerHTML,
    'post_id': parseInt(postId)});

  /* Disable Submit button and set cursor style to waiting until server request
  goes through */
  var restoreSubmit = setBusy(submit, 'Submitting…');
  document.body.style.cursor = 'wait';

  function reset() {
    restoreSubmit();
    document.body.style.cursor = '';
    return;
  }

  return fetchWithTimeout(api + '/thought-writer/comment', {
    credentials: 'include',
    headers: {'Content-Type': 'application/json'},
    method: 'POST',
    body: data,
  })

    .then(function(response) {
      // Remove server down banner from page (from common.js script)
      pingServer();
      reset();

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

      // A signed-out answer means the session ended: offer sign-in instead
      if (response.status == 401 || response.status == 403) {
        localStorage.removeItem('username');
        updateCommentAccess();
        return;
      }

      inlineError(submit, "Your comment didn't go through. Try again in a " +
        'moment.');
      return;
    }, function() {
      // Add server down banner to page (from common.js script)
      pingServer(retryFunctions);
      reset();
      inlineError(submit, "Your comment didn't go through. Check your " +
        'connection and try again.');
      return;
    });
}


/* The comment box shows only to signed-in visitors; anyone else gets a link
to sign in and come back here */
function updateCommentAccess() {
  var signedIn = !!localStorage.getItem('username');
  var form = document.getElementById('new-comment-form');
  var prompt = document.getElementById('comment-sign-in');

  form.hidden = !signedIn;
  prompt.hidden = signedIn;
  document.getElementById('comment-sign-in-link').href = signInHref();

  return;
}


// Enter edit mode for comment when Modify button is clicked
function modifyComment() {
  var commentId = this.dataset.modifyid;
  var comment = document.querySelectorAll('[data-id="' + commentId + '"]')[0];
  var submitButton = document.querySelectorAll('[data-submitid="' +
    commentId + '"]')[0];
  var cancelButton = document.querySelectorAll('[data-cancelid="' +
    commentId + '"]')[0];

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
  var commentId = this.dataset.cancelid;
  var commentContainer = document.getElementById('comment' + commentId);
  var comment = document.querySelectorAll('[data-id="' + commentId + '"]')[0];
  var submitButton = document.querySelectorAll('[data-submitid="' +
    commentId + '"]')[0];
  var modifyButton = document.querySelectorAll('[data-modifyid="' +
    commentId + '"]')[0];

  // Remove error message if displayed
  if (document.getElementById('error' + commentId)) {
    commentContainer.removeChild(document.getElementById('error' + commentId));
  }

  // Reset comment to non-contenteditable
  comment.contentEditable = 'false';

  comment.classList.remove('editing');

  // Reset comment content to pre-editing content
  setRichText(comment, this.dataset.content);

  // Hide Submit and Cancel buttons and display Modify button
  this.style.display = 'none';
  submitButton.style.display = 'none';
  modifyButton.style.display = 'block';

  return;
}

// Submit edits for comment when Submit button is clicked
function submitEdits() {
  var commentId = this.dataset.submitid;
  var comment = document.querySelectorAll('[data-id="' + commentId + '"]')[0];
  var commentContainer = document.getElementById('comment' + commentId);
  var commentTimestamp = commentContainer
    .getElementsByClassName('comment-timestamp')[0];
  var submitButton = this;
  var cancelButton = document.querySelectorAll('[data-cancelid="' +
    commentId + '"]')[0];
  var modifyButton = document.querySelectorAll('[data-modifyid="' +
    commentId + '"]')[0];
  var deleteButton = document.querySelectorAll('[data-deleteid="' +
    commentId + '"]')[0];

  // Remove error message if displayed
  if (document.getElementById('error' + commentId)) {
    commentContainer.removeChild(document.getElementById('error' + commentId));
  }

  // If comment is blank, ask if user wants to delete comment
  if (!/\S/.test(comment.textContent)) {
    deleteButton.click();
    return;
  }

  // Display error message if user made no changes to comment
  var previousComments = JSON.parse(localStorage
    .getItem('thought-writer-comments-post-' + postId));

  for (var i = 0; i < previousComments.length; i++) {
    if (previousComments[i].comment_id == commentId) {
      var previousCommentContent = previousComments[i].content;
    }
  }

  if (previousCommentContent == comment.innerHTML) {
    var error = document.createElement('div');
    error.id = 'error' + commentId;
    error.classList.add('error');
    error.setAttribute('role', 'alert');
    error.innerHTML = 'You did not make any changes to your comment.';

    commentContainer.appendChild(error);
    return;
  }

  // Otherwise, send comment to server
  var data = JSON.stringify({'content': comment.innerHTML});

  /* Disable menu buttons and set cursor style to waiting until server request
  goes through */
  var restoreSubmit = setBusy(submitButton, 'Submitting…');
  cancelButton.disabled = true;
  modifyButton.disabled = true;
  deleteButton.disabled = true;
  document.body.style.cursor = 'wait';

  return fetchWithTimeout(api + '/thought-writer/comment/' + commentId, {
    credentials: 'include',
    headers: {'Content-Type': 'application/json'},
    method: 'PATCH',
    body: data,
  })

    // Display error if server is down
    .catch(function(error) {
      // Add server down banner to page (from common.js script)
      pingServer(retryFunctions);

      commentError(commentContainer, commentId, "Your edits didn't go " +
        'through. Check your connection and try again.');

      // Reset menu buttons and cursor style
      restoreSubmit();
      cancelButton.disabled = false;
      modifyButton.disabled = false;
      deleteButton.disabled = false;
      document.body.style.cursor = '';

      return;
    })

    .then(function(response) {
      if (response) {
        // Remove server down banner from page (from common.js script)
        pingServer();

        if (response.ok) {
          // Reset comment to non-contenteditable
          comment.contentEditable = 'false';

          /* Add '(edited)' to comment timestamp display if it is not already
          there */
          if (commentTimestamp.innerHTML.indexOf('edited') == -1) {
            commentTimestamp.innerHTML = commentTimestamp.innerHTML +
              ' (edited)';
          }

          /* Set pre-editing content data attribute to new content for Cancel
          button */
          cancelButton.dataset.content = comment.innerHTML;

          // Reset menu buttons and cursor style
          restoreSubmit();
          cancelButton.disabled = false;
          modifyButton.disabled = false;
          deleteButton.disabled = false;
          document.body.style.cursor = '';

          // Hide Submit and Cancel buttons and display Modify button
          submitButton.style.display = 'none';
          cancelButton.style.display = 'none';
          modifyButton.style.display = 'block';

          return;
        }

        // Display error message if user made no changes
        else if (response.status == 409) {
          var error = document.createElement('div');
          error.id = 'error' + commentId;
          error.classList.add('error');
          error.setAttribute('role', 'alert');
    error.setAttribute('role', 'alert');
          error.innerHTML = 'You did not make any changes to your comment.';

          commentContainer.appendChild(error);

          // Reset menu buttons and cursor style
          restoreSubmit();
          cancelButton.disabled = false;
          modifyButton.disabled = false;
          deleteButton.disabled = false;
          document.body.style.cursor = '';

          return;
        }

        // Otherwise, say why under the comment
        commentError(commentContainer, commentId, response.status == 401 ||
          response.status == 403 ? 'Sign in again to save your edits.' :
          "Your edits didn't go through. Try again in a moment.");

        // Reset menu buttons and cursor style
        restoreSubmit();
        cancelButton.disabled = false;
        modifyButton.disabled = false;
        deleteButton.disabled = false;
        document.body.style.cursor = '';

        return;
      }
    });
}

// Show an error under a comment, where its edit buttons are
function commentError(commentContainer, commentId, message) {
  var error = document.createElement('div');
  error.id = 'error' + commentId;
  error.classList.add('error');
  error.setAttribute('role', 'alert');
  error.textContent = message;
  commentContainer.appendChild(error);
  return;
}


// Delete comment from server when user clicks Delete button
function deleteComment() {
  var commentId = this.dataset.deleteid;
  var deleteButton = this;
  var buttonContainer = deleteButton.parentNode;
  var submitButton = document.querySelectorAll('[data-submitid="' +
    commentId + '"]')[0];
  var cancelButton = document.querySelectorAll('[data-cancelid="' +
    commentId + '"]')[0];
  var modifyButton = document.querySelectorAll('[data-modifyid="' +
    commentId + '"]')[0];
  clearInlineError(deleteButton);

  // Ask in the page, under the comment, before deleting it
  inlineConfirm(deleteButton, 'Delete this comment?', 'Delete', function() {
    /* Disable menu buttons and set cursor style to waiting until server
    request goes through */
    var restoreDelete = setBusy(deleteButton, 'Deleting…');
    submitButton.disabled = true;
    cancelButton.disabled = true;
    modifyButton.disabled = true;
    document.body.style.cursor = 'wait';

    function reset() {
      restoreDelete();
      submitButton.disabled = false;
      cancelButton.disabled = false;
      modifyButton.disabled = false;
      document.body.style.cursor = '';
      return;
    }

    return fetchWithTimeout(api + '/thought-writer/comment/' + commentId, {
      credentials: 'include',
      headers: {'Content-Type': 'application/json'},
      method: 'DELETE',
    })

      .then(function(response) {
        // Remove server down banner from page (from common.js script)
        pingServer();
        reset();

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

        // Otherwise, say why under the comment
        inlineError(deleteButton, response.status == 401 ||
          response.status == 403 ? 'Sign in again to delete this comment.' :
          "The comment wasn't deleted. Try again in a moment.",
          buttonContainer);
        return;
      }, function() {
        // Add server down banner to page (from common.js script)
        pingServer(retryFunctions);
        reset();
        inlineError(deleteButton, "The comment wasn't deleted. Check your " +
          'connection and try again.', buttonContainer);
        return;
      });
  }, buttonContainer);

  return;
}


// Request more comments as user scrolls down page (infinite scroll)
window.addEventListener('scroll', requestMoreComments, false);

function requestMoreComments() {
  if (scrolled) {
    /* If user has scrolled more than 90% of way down page and the server has
    more comments, update request numbers */
    if (percentScrolled() > 90 && moreCommentsToDisplay && !loadingComments) {
      // Set comment request start number to previous end number - 1
      requestStart = requestEnd - 1;

      // Set comment request end number to previous end number + 10
      requestEnd = requestEnd + 10;

      // Load comments with new request numbers
      loadComments(postId);
    }
  }

  /* Otherwise, set scrolled variable to true to indicate user scrolled down
  infinite scroll page (used for smooth scrolling in common.js file) */
  scrolled = true;

  return;
}
