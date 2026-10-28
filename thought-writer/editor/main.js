// Define global variables
var requestStart = 0; // Range start for number of posts to request from server
var requestEnd = 11; // Range end for number of posts to request from server
var morePostsToDisplay = false;
var postsContainer = document.getElementById('posts-container');
var postTitle = document.getElementById('post-title');
var post = document.getElementById('post-content');
var toolbar = document.getElementById('format-toolbar');
var toolbarButtons = toolbar.getElementsByTagName('button');
var publicCheckbox = document.getElementById('public-checkbox');
var publicInput = document.getElementById('public-input');
var postBoard = document.getElementById('post-background');
var cabinetOpen = false;
var boardFlipped = false; // Used to track when post board is flipped to back
var viewingPost = false; // Used to track when user is viewing a previous post
var postDeleted = false; // Used to track when user has just deleted a post


// Define load functions
window.onload = function() {
  // Display in-progress post if user has one
  displayDraft();

  // Auto-save post every second
  saveInterval = setInterval(savePost, 1000);

  /* Post to edit, named in the URL (by the Edit button on a post, or a post
  title on My Account) */
  var postId = new URLSearchParams(window.location.search).get('post');

  /* Consume it, so a reload or Back reopens the draft rather than this post
  (the same pattern sign-in uses) */
  if (postId && window.history && history.replaceState) {
    history.replaceState(null, '', location.pathname + location.hash);
  }

  // Set focus in contenteditable post for immediate editing
  post.focus();

  // Create page header (from common.js script)
  createPageHeader();

  /* Check if user is logged in (from common.js script), then request posts:
  until any one-time token migration lands, the session cookie may not exist */
  updatePostAccess();
  Promise.resolve(checkIfLoggedIn()).then(function() {
    updatePostAccess();

    if (postId) {
      loadPost(postId);
    }

    // Load user's previous posts to cabinet
    loadPosts();
  });

  // Check if Crystal Prism API is online (from common.js script)
  pingServer(retryFunctions);

  // Create page footer (from common.js script)
  createPageFooter();

  return;
}


// Functions to run when Retry button is clicked from server down banner
function retryFunctions() {
  checkIfLoggedIn();
  loadPosts();
  return;
}


// Display in-progress post if one is stored locally
function displayDraft() {
  // Display in-progress post title if it is stored
  if (localStorage.getItem('post-title')) {
    postTitle.value = localStorage.getItem('post-title');
  }

  // Display in-progress post content if it is stored
  if (localStorage.getItem('post-content')) {
    setRichText(post, localStorage.getItem('post-content'));
  }

  // Display whether or not in-progress post is public if stored
  if (localStorage.getItem('post-public')) {

    // If draft is public, display checked checkbox
    if (localStorage.getItem('post-public') == 'true') {
      publicInput.checked = true;
      publicCheckbox.classList.add('checked');
    }

    // Otherwise, display unchecked checkbox
    else {
      publicInput.checked = false;
      publicCheckbox.classList.remove('checked');
    }
  }

  // Display appropriate editing buttons for in-progress post
  toggleButtons();

  return;
}


/* Submit shows only to signed-in writers; anyone else gets a link to sign in
and come back to this draft (it stays saved in this browser) */
function updatePostAccess() {
  var signedIn = !!localStorage.getItem('username');
  var signIn = document.getElementById('post-sign-in');

  signIn.href = signInHref();
  document.body.classList.toggle('signed-out', !signedIn);

  if (!signedIn) {
    clearInlineError(document.getElementById('submit-post'));
  }

  return;
}


// Toggle editing buttons on post board
function toggleButtons() {
  // If user is viewing previous post, display Close, Modify, and Delete buttons
  if (viewingPost) {
    document.getElementById('clear-post').style.display = 'none';
    document.getElementById('submit-post').style.display = 'none';
    document.getElementById('close-post').style.display = 'inline-block';
    document.getElementById('modify-post').style.display = 'inline-block';
    document.getElementById('delete-post').style.display = 'inline-block';
    return;
  }

  // Otherwise, display Clear and Submit buttons
  document.getElementById('clear-post').style.display = 'inline-block';
  document.getElementById('submit-post').style.display = 'inline-block';
  document.getElementById('close-post').style.display = 'none';
  document.getElementById('modify-post').style.display = 'none';
  document.getElementById('delete-post').style.display = 'none';

  return;
}


// Load user's posts from server
function loadPosts() {
  // Do nothing if user is not logged in
  if (!localStorage.getItem('username')) {
    return;
  }

  // Otherwise, load previously written posts to cabinet
  return fetch(api + '/thought-writer/posts/' +
    encodeURIComponent(localStorage.getItem('username')) + '?start=' + requestStart + '&end=' +
    requestEnd, {
      credentials: 'include',
      method: 'GET',
    })

    .catch(function(error) {
      // Add server down banner to page (from common.js script)
      pingServer(retryFunctions);

      // Display cached posts if they are stored in localStorage
      if (localStorage.getItem('thought-writer-personal-posts')) {
        var posts = JSON.parse(localStorage
          .getItem('thought-writer-personal-posts'));

        /* Assess if there are more than requested posts - 1 (number of
        loaded posts) */
        if (posts.length > (requestEnd - 1)) {
          morePostsToDisplay = true;
          var loadNumber = requestEnd - 1;
        }

        // If there are not, load all posts to post area in cabinet
        else {
          morePostsToDisplay = false;
          var loadNumber = posts.length;
        }

        displayPosts(posts.slice(requestStart, loadNumber));
      }

      return;
    })

    .then(function(response) {
      if (response) {
        // Remove server down banner from page (from common.js script)
        pingServer();

        response.json().then(function(posts) {
          // Display posts in cabinet if at least one is sent from server
          if (posts.length != 0) {

            /* Assess if there are more than requested posts - 1 (number of
            loaded posts) on server */
            if (posts.length > (requestEnd - requestStart - 1)) {
              morePostsToDisplay = true;
              var loadNumber = requestEnd - requestStart - 1;
            }

            /* If there are not, load all posts sent from server to post area
            in cabinet */
            else {
              morePostsToDisplay = false;
              var loadNumber = posts.length;
            }

            displayPosts(posts.slice(0, loadNumber));

            /* Remove locally stored posts if this is the initial request
            to replace with latest posts from server */
            if (requestStart == 0) {
              localStorage.removeItem('thought-writer-personal-posts');
              var localPosts = [];
            }

            // Otherwise, get locally stored posts list
            else {
              var localPosts = JSON.parse(localStorage
                .getItem('thought-writer-personal-posts'));
            }

            /* Add each post to locally stored posts list based on requestStart
            and requestEnd values */
            for (var i = 0; i < posts.length; i++) {
              localPosts[requestStart + i] = posts[i];
            }

            // Store posts in localStorage for offline loading
            localStorage.setItem('thought-writer-personal-posts', JSON
              .stringify(localPosts));
          }
        });
      }
    });
}


// Display passed posts in cabinet
function displayPosts(posts) {
  // Clear posts from cabinet to replace with passed posts
  postsContainer.innerHTML = '';

  for (var i = 0; i < posts.length; i++) {
    // Create container for post and its components
    var previousPost = document.createElement('div');
    previousPost.classList.add('previous-post');

    // Add display class to post if cabinet is open
    if (cabinetOpen) {
      previousPost.classList.add('display');
    }

    /* Set data-postid attribute to use if post is clicked from
    cabinet */
    previousPost.dataset.postid = posts[i].post_id;

    /* Set data-number attribute to track the post number for
    displaying more posts later */
    previousPost.dataset.number = requestStart + i;

    /* Display hover title for post as post title and local timestamp
    in 'MM/DD/YYYY, HH:MM AM/PM' format */
    previousPost.title = posts[i].title + '  ' + moment(posts[i].created)
      .format('MM/DD/YYYY, LT');
    previousPost.dataset.public = posts[i].public;

    // Create container with post content
    var postContent = document.createElement('div');
    postContent.classList.add('previous-post-content');
    setRichText(postContent, posts[i].content);
    postsContainer.appendChild(previousPost);
    previousPost.appendChild(postContent);

    // Load post when user clicks it in cabinet
    previousPost.onclick = function() {
      loadPost(this.dataset.postid);
      return;
    }
    keyboardButton(previousPost, 'Open ' + posts[i].title);
  }

  // If cabinet is open, display/hide right/left arrows
  if (cabinetOpen) {

    /* If first post displayed in cabinet is not post 0 (i.e., there
    are lower-numbered posts to display), display left navigation
    arrow */
    if (postsContainer.getElementsByClassName('previous-post')[0]
      .dataset.number != 0) {
        document.getElementById('left-arrow').classList.add('display');
      }

    // Otherwise, hide left arrow
    else {
      document.getElementById('left-arrow').classList.remove('display');
    }

    /* If there are more posts on the server, display right
    navigation arrow */
    if (morePostsToDisplay) {
      document.getElementById('right-arrow').classList.add('display');
    }

    // Otherwise, hide right arrow
    else {
      document.getElementById('right-arrow').classList.remove('display');
    }
  }

  return;
}


// Load post that has passed post id
function loadPost(postId) {
  var actions = document.getElementById('action-buttons');
  clearInlineError(post);

  return fetchWithTimeout(api + '/thought-writer/post/' + postId, {
      credentials: 'include',
    })

    .then(function(response) {
      if (!response.ok) {
        throw new Error('Server answered ' + response.status);
      }

      // Remove server down banner from page (from common.js script)
      pingServer();

      return response.json();
    })

    .then(function(requestedPost) {
      displayPost(requestedPost);

      /* Store post in localStorage for offline loading and checking for
      edits */
      try {
        localStorage.setItem('thought-writer-personal-post-' + postId, JSON
          .stringify(requestedPost));
      } catch (e) {}

      return;
    })

    .catch(function() {
      // Display cached post if it is stored in localStorage
      try {
        var cached = JSON.parse(localStorage
          .getItem('thought-writer-personal-post-' + postId));
      } catch (e) {
        var cached = null;
      }

      if (cached) {
        displayPost(cached);
        return;
      }

      // Otherwise say so under the post board, with a way to try again
      var note = inlineError(post, "Couldn't open that post.", actions);
      var retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'inline-retry';
      retry.textContent = 'Retry';
      retry.onclick = function() {
        loadPost(postId);
        return;
      };
      note.appendChild(document.createTextNode(' '));
      note.appendChild(retry);

      return;
    });
}


// Display passed post in post editor
function displayPost(postToEdit) {
  // Set post title, content, data-id attribute, and public status
  postTitle.value = postToEdit.title;
  setRichText(post, postToEdit.content);
  post.dataset.postid = postToEdit.post_id;
  publicInput.checked = postToEdit.public;

  /* Save original post content to check if user makes changes after
  editing */
  post.dataset.original = post.innerHTML;

  if (postToEdit.public) {
    publicCheckbox.classList.add('checked');
  } else {
    publicCheckbox.classList.remove('checked');
  }

  // Stop auto-save function (used for in-progress posts)
  clearInterval(saveInterval);

  // Set viewingPost to true and toggle editing buttons
  viewingPost = true;
  toggleButtons();

  // If post board is flipped to back, flip to initial state
  if (boardFlipped) {
    flipBoard();
  }

  return;
}


// Define post editing functions

// Save post title, content, and public status
function savePost() {
  localStorage.setItem('post-title', postTitle.value);
  localStorage.setItem('post-content', post.innerHTML);
  localStorage.setItem('post-public', publicInput.checked.toString());
  return;
}


// Clear post title if it contains no non-space characters
window.onclick = clearEmptyTitle;

function clearEmptyTitle(e) {
  /* If user clicks anywhere on page that is not the post title, clear the post
  title if there are no non-space characters */
  if (!postTitle.contains(e.target)) {

    if (!/\S/.test(postTitle.value)) {
      postTitle.value = '';
    }

  }

  return;
}


// Format post content when toolbar button is clicked
for (var i = 0; i < toolbarButtons.length; i++) {
  toolbarButtons[i].addEventListener('click', formatContent, false);
}


// Click hidden color picker input when font color icon is clicked
document.getElementById('font-color-icon').addEventListener('click',
  function() {
    document.getElementById('font-color-picker').jscolor.show();
    return;
  }, false);


  // Update font color icon and font color when color is chosen from input
function formatFontColor(color) {
  document.getElementById('font-color-icon').style.color = '#' + color;
  document.execCommand('foreColor', false, '#' + color);
  document.getElementById('font-color-picker').value = '#' + color;
  return;
}


function formatContent() {
  // Get data-command from clicked button/input
  var command = this.dataset.command;

  // Prompt for URL and insert image or link if those buttons are clicked
  if (command == 'insertImage' || command == 'createLink') {
    openAddressForm(this, command);
    return;
  }

  /* Return font color icon to black and clear formatting when clear format
  button is clicked */
  else if (command == 'removeFormat') {
    document.getElementById('font-color-icon').style.color = '#000000';
    document.getElementById('font-color-picker').value = '#000000';
    document.getElementById('font-color-picker').jscolor.fromString('#000000');
    document.execCommand(command, false, null);
    return;
  }

  // Otherwise, execute command with no additional actions
  document.execCommand(command, false, null);

  return;
}


/* Ask for a link or image address in the page, under the toolbar: the
selection is kept so the link lands on the words that were selected */
function openAddressForm(button, command) {
  var existing = document.getElementById('address-form');
  if (existing) {
    existing.parentNode.removeChild(existing);
  }

  var selection = window.getSelection();
  var range = selection.rangeCount ? selection.getRangeAt(0).cloneRange() :
    null;
  var isImage = command == 'insertImage';

  var form = document.createElement('form');
  form.id = 'address-form';
  var label = document.createElement('label');
  label.htmlFor = 'address-input';
  label.textContent = isImage ? 'Image address' : 'Link address';
  var input = document.createElement('input');
  input.id = 'address-input';
  input.type = 'url';
  input.value = 'https://';
  input.required = true;
  var add = document.createElement('button');
  add.type = 'submit';
  add.textContent = isImage ? 'Insert image' : 'Add link';
  var cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.textContent = 'Cancel';
  form.appendChild(label);
  form.appendChild(input);
  form.appendChild(add);
  form.appendChild(cancel);

  function close() {
    if (form.parentNode) {
      form.parentNode.removeChild(form);
    }
    return;
  }

  function restoreSelection() {
    post.focus();
    if (range) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    return;
  }

  form.onsubmit = function(e) {
    e.preventDefault();
    var url = input.value.trim();
    close();
    restoreSelection();

    // Add image/link to post if an address was given
    if (url && url != 'https://') {
      document.execCommand(command, false, url);
    }
    return;
  };

  cancel.onclick = function() {
    close();
    restoreSelection();
    return;
  };

  form.addEventListener('keydown', function(e) {
    if (e.key == 'Escape') {
      e.preventDefault();
      cancel.click();
    }
    return;
  }, false);

  toolbar.insertAdjacentElement('afterend', form);
  input.focus();
  input.select();
  return;
}


// Toggle post's public status when user clicks Public checkbox or public text
publicCheckbox.onclick = togglePublic;

// The drawn checkbox works from the keyboard and reads as a checkbox
keyboardButton(publicCheckbox);
publicCheckbox.setAttribute('role', 'checkbox');
publicCheckbox.setAttribute('aria-labelledby', 'public-text');
publicCheckbox.setAttribute('aria-checked',
  String(publicCheckbox.classList.contains('checked')));
new MutationObserver(function() {
  publicCheckbox.setAttribute('aria-checked',
    String(publicCheckbox.classList.contains('checked')));
  return;
}).observe(publicCheckbox, {attributes: true, attributeFilter: ['class']});
document.getElementById('public-text').onclick = togglePublic;

function togglePublic() {
  // If public status checkbox is currently checked, uncheck it
  if (publicInput.checked) {
    publicInput.checked = false;
    publicCheckbox.classList.remove('checked');
    return;
  }

  // Otherwise, check public status checkbox
  publicInput.checked = true;
  publicCheckbox.classList.add('checked');

  return;
}


// Define post action button functions

/* Clear in-progress post when user clicks Clear button or when called from
another function */
document.getElementById('clear-post').onclick = function() {
  // Ask in the page before clearing the post
  inlineConfirm(this, 'Clear your post?', 'Clear', function() {
    clearPost();

    // Save cleared state to localStorage
    savePost();
    return;
  }, document.getElementById('action-buttons'));

  return;
}

function clearPost() {
  // Clear post title, content, public checkbox, and data attributes
  postTitle.value = '';
  post.innerHTML = '';
  publicInput.checked = false;
  publicCheckbox.classList.remove('checked');
  delete post.dataset.postid;
  delete post.dataset.original;
  return;
}


// Submit post to server when user clicks Submit button
document.getElementById('submit-post').onclick = submitPost;

function submitPost() {
  var submitButton = document.getElementById('submit-post');
  // If user is not logged in, warn user that login is required to submit post
  clearInlineError(submitButton);
  clearInlineError(postTitle);

  if (!localStorage.getItem('username')) {
    updatePostAccess();
    return;
  }

  /* If post is blank, warn user that blank post cannot be submitted (excludes
  empty elements) */
  if (!/\S/.test(post.textContent)) {
    inlineError(submitButton, 'Write your post first, then submit it.',
      document.getElementById('action-buttons'));
    post.focus();
    return;
  }

  // A post needs a title: ask for one at the title field
  if (!/\S/.test(postTitle.value)) {
    inlineError(postTitle, 'Give your post a title, then submit it.');
    postTitle.focus();
    return;
  }

  // Otherwise, submit post to server
  var data = JSON.stringify({'title': postTitle.value, 'content': post
    .innerHTML, 'public': publicInput.checked});

  /* Disable menu buttons and set cursor style to waiting until server request
  goes through */
  var restoreBusy = setBusy(document.getElementById('submit-post'),
    'Submitting…');
  document.getElementById('clear-post').disabled = true;
  document.getElementById('submit-post').disabled = true;
  document.body.style.cursor = 'wait';

  return fetchWithTimeout(api + '/thought-writer/post', {
    credentials: 'include',
    headers: {'Content-Type': 'application/json'},
    method: 'POST',
    body: data,
  })

    // Display error message if server is down
    .catch(function(error) {
      // Add server down banner to page (from common.js script)
      pingServer(retryFunctions);

      inlineError(submitButton, "Your post didn't go through. Check your " +
        'connection and try again.', document.getElementById('action-buttons'));

      // Reset menu buttons and cursor style
      document.getElementById('clear-post').disabled = false;
      document.getElementById('submit-post').disabled = false;
      document.body.style.cursor = '';
      restoreBusy();

      return;
    })

    .then(function(response) {
      if (response) {
        // Remove server down banner from page (from common.js script)
        pingServer();

        // If post was submitted successfully, clear post and flip board
        if (response.ok) {
          response.text().then(function(postId) {

            // If cabinet is open, close it to refresh posts
            if (cabinetOpen) {
              toggleCabinet();
            }

            // Reload user's posts to cabinet to include newly submitted post
            loadPosts();

            /* Set data-postid attribute for Modify Last Post button in case
            user wants to modify last post */
            document.getElementById('go-back').dataset.postid = postId;

            // Clear post title and content
            clearPost();

            // Save cleared state to localStorage
            savePost();

            // Flip to back of post board
            flipBoard();
          });

          // Reset menu buttons and cursor style
          document.getElementById('clear-post').disabled = false;
          document.getElementById('submit-post').disabled = false;
          document.body.style.cursor = '';
          restoreBusy();

          return;
        }

        // If server rejects the post (e.g. HTML in title), display its reason
        if (response.status == 400) {
          response.text().then(function(reason) {
            inlineError(submitButton, reason, document.getElementById('action-buttons'));
          });
        }

        // Otherwise, display error message
        else {
          if (response.status == 401 || response.status == 403) {
            localStorage.removeItem('username');
            updatePostAccess();
          } else {
            inlineError(submitButton, "Your post didn't go through. Try " +
              'again in a moment.', document.getElementById('action-buttons'));
          }
        }

        // Reset menu buttons and cursor style
        document.getElementById('clear-post').disabled = false;
        document.getElementById('submit-post').disabled = false;
        document.body.style.cursor = '';
        restoreBusy();

        return;
      }
    });
}


// Close previous post in post editor
document.getElementById('close-post').onclick = function() {
  // Ask in the page before closing a post with unsaved changes
  if (post.innerHTML != post.dataset.original) {
    inlineConfirm(this, 'Close without saving? Modify saves your changes.',
      'Close', closePost, document.getElementById('action-buttons'));
    return;
  }

  closePost();
  return;
}

function closePost() {
  clearInlineError(document.getElementById('modify-post'));
  clearInlineError(document.getElementById('delete-post'));

  // Clear post in post editor
  clearPost();

  // Display in-progress draft if one exists
  displayDraft();

  // Restart auto-save interval
  saveInterval = setInterval(savePost, 1000);

  // Set viewingPost to false and toggle editing buttons
  viewingPost = false;
  toggleButtons();

  return;
}


// Submit modified post to server when user clicks Modify button
document.getElementById('modify-post').onclick = modifyPost;

function modifyPost() {
  var postId = post.dataset.postid;
  var modifyButton = document.getElementById('modify-post');
  clearInlineError(modifyButton);
  clearInlineError(postTitle);

  // If post is blank, ask if user wants to delete post
  if (!/\S/.test(post.textContent)) {
    deletePost();
    return;
  }

  /* While post title has no non-space characters, prompt user for title until
  they enter one or cancel */
  if (!/\S/.test(postTitle.value)) {
    inlineError(postTitle, 'Give your post a title, then save it.');
    postTitle.focus();
    return;
  }

  // If user is not logged in, warn user that login is required to modify post
  if (!localStorage.getItem('username')) {
    inlineError(modifyButton, 'Sign in to save changes to this post.',
      document.getElementById('action-buttons'));
    return;
  }

  // Display error message if user made no changes to post
  var previousPost = JSON.parse(localStorage
    .getItem('thought-writer-personal-post-' + postId));

  var previousPostTitle = previousPost.title;
  var previousPostContent = previousPost.content;
  var previousPostPublic = previousPost.public;

  if (previousPostTitle == postTitle.value &&
    previousPostContent == post.innerHTML &&
    previousPostPublic == publicInput.checked) {
      inlineError(modifyButton, "You haven't changed anything yet.",
        document.getElementById('action-buttons'));
      return;
  }

  // Otherwise, submit modified post to server
  var data = JSON.stringify({'title': postTitle.value,
    'content': post.innerHTML, 'public': publicInput.checked});

  /* Disable menu buttons and set cursor style to waiting until server request
  goes through */
  var restoreBusy = setBusy(document.getElementById('modify-post'),
    'Saving…');
  document.getElementById('clear-post').disabled = true;
  document.getElementById('submit-post').disabled = true;
  document.body.style.cursor = 'wait';

  return fetchWithTimeout(api + '/thought-writer/post/' + postId, {
    credentials: 'include',
    headers: {'Content-Type': 'application/json'},
    method: 'PATCH',
    body: data,
  })

    // Display error message if server is down
    .catch(function(error) {
      // Add server down banner to page (from common.js script)
      pingServer(retryFunctions);

      inlineError(modifyButton, "Your changes didn't save. Check your " +
        'connection and try again.', document.getElementById('action-buttons'));

      // Reset menu buttons and cursor style
      document.getElementById('clear-post').disabled = false;
      document.getElementById('submit-post').disabled = false;
      document.body.style.cursor = '';
      restoreBusy();

      return;
    })

    .then(function(response) {
      if (response) {
        // Remove server down banner from page (from common.js script)
        pingServer();

        /* If modified post was submitted successfully, clear post and flip
        board */
        if (response.ok) {

          // If cabinet is open, close it to refresh posts
          if (cabinetOpen) {
            toggleCabinet();
          }

          // Reload user's posts to cabinet to include newly modified post
          loadPosts();

          /* Set data-postid attribute for Modify Last Post button in case user
          wants to modify last post */
          document.getElementById('go-back').dataset.postid = post.dataset
            .postid;

          // Clear post title and content
          clearPost();

          // Set viewingPost to false
          viewingPost = false;

          // Flip to back of post board
          flipBoard();

          // Reset menu buttons and cursor style
          document.getElementById('clear-post').disabled = false;
          document.getElementById('submit-post').disabled = false;
          document.body.style.cursor = '';
          restoreBusy();

          return;
        }

        // Display error message if user made no changes
        else if (response.status == 409) {
          inlineError(modifyButton, "You haven't changed anything yet.",
            document.getElementById('action-buttons'));

          // Reset menu buttons and cursor style
          document.getElementById('clear-post').disabled = false;
          document.getElementById('submit-post').disabled = false;
          document.body.style.cursor = '';
          restoreBusy();

          return;
        }

        // If server rejects the post (e.g. HTML in title), display its reason
        else if (response.status == 400) {
          response.text().then(function(reason) {
            inlineError(modifyButton, reason, document.getElementById('action-buttons'));
          });
        }

        // Otherwise, display login error message
        else {
          inlineError(modifyButton, response.status == 401 ||
            response.status == 403 ? 'Sign in again to save your changes.' :
            "Your changes didn't save. Try again in a moment.", document.getElementById('action-buttons'));
        }

        // Reset menu buttons and cursor style
        document.getElementById('clear-post').disabled = false;
        document.getElementById('submit-post').disabled = false;
        document.body.style.cursor = '';
        restoreBusy();

        return;
      }
    });
}


// Delete post from server when user clicks Delete button
document.getElementById('delete-post').onclick = deletePost;

function deletePost() {
  var deleteButton = document.getElementById('delete-post');
  clearInlineError(deleteButton);

  // Ask in the page, under the post, before deleting it
  inlineConfirm(deleteButton, 'Delete this post?', 'Delete',
    confirmedDeletePost, document.getElementById('action-buttons'));
  return;
}

function confirmedDeletePost() {
  var deleteButton = document.getElementById('delete-post');

  {
    /* Disable menu buttons and set cursor style to waiting until server
    request goes through */
    var restoreBusy = setBusy(document.getElementById('delete-post'),
      'Deleting…');
    document.getElementById('clear-post').disabled = true;
    document.getElementById('submit-post').disabled = true;
    document.body.style.cursor = 'wait';

    return fetchWithTimeout(api + '/thought-writer/post/' + post.dataset.postid, {
      credentials: 'include',
      headers: {'Content-Type': 'application/json'},
      method: 'DELETE',
    })

      // Display error message if server is down
      .catch(function(error) {
        // Add server down banner to page (from common.js script)
        pingServer(retryFunctions);

        inlineError(deleteButton, "The post wasn't deleted. Check your " +
          'connection and try again.', document.getElementById('action-buttons'));

        // Reset menu buttons and cursor style
        document.getElementById('clear-post').disabled = false;
        document.getElementById('submit-post').disabled = false;
        document.body.style.cursor = '';
        restoreBusy();

        return;
      })

      .then(function(response) {
        if (response) {
          // Remove server down banner from page (from common.js script)
          pingServer();

          if (response.ok) {

            // If cabinet is open, close it to refresh posts
            if (cabinetOpen) {
              toggleCabinet();
            }

            // Reload user's posts to cabinet to reflect newly deleted post
            loadPosts();

            // Clear post title and content
            clearPost();

            // Set viewingPost to false
            viewingPost = false;

            // Set postDeleted to true and flip to back of post board
            postDeleted = true;
            flipBoard();

            // Reset menu buttons and cursor style
            document.getElementById('clear-post').disabled = false;
            document.getElementById('submit-post').disabled = false;
            document.body.style.cursor = '';
            restoreBusy();

            return;
          }

          // Otherwise, display error message
          inlineError(deleteButton, response.status == 401 ||
            response.status == 403 ? 'Sign in again to delete this post.' :
            "The post wasn't deleted. Try again in a moment.", document.getElementById('action-buttons'));

          // Reset menu buttons and cursor style
          document.getElementById('clear-post').disabled = false;
          document.getElementById('submit-post').disabled = false;
          document.body.style.cursor = '';
          restoreBusy();

          return;
        }
      });
    }

    return;
}


// Define functions for after post is submitted

/* Flip board after post is submitted and/or when user clicks button on back
of post board */
function flipBoard() {
  // If post board is not flipped already, flip to back of post board
  if (!boardFlipped) {

    /* If user has an in-progress post, display the Continue In-Progress Post
    button */
    if (localStorage.getItem('post-content') != '') {
      document.getElementById('continue-post').classList.add('finished');
      setTimeout(function() {
        document.getElementById('continue-post').style.display = 'initial';
        return;
      }, 200);
    }

    // If user did not just delete a post, display the Modify Last Post button
    if (!postDeleted) {
      document.getElementById('go-back').classList.add('finished');
      setTimeout(function() {
        document.getElementById('go-back').style.display = 'initial';
        return;
      }, 200);
    }

    postBoard.classList.add('finished');
    toolbar.classList.add('finished');
    post.classList.add('finished');
    document.getElementById('action-buttons').classList.add('finished');
    document.getElementById('go-board').classList.add('finished');
    document.getElementById('new-post').classList.add('finished');

    // Delay element display changes to create post board flipping effect
    setTimeout(function() {
      postBoard.classList.remove('justify-content-start');
      toolbar.style.display = 'none';
      post.style.display = 'none';
      document.getElementById('action-buttons').style.display = 'none';
      document.getElementById('go-board').style.display = 'initial';
      document.getElementById('new-post').style.display = 'initial';
      return;
    }, 200);

    // Set post title placeholder and disable typing in field
    postTitle.disabled = true;
    postTitle.style.userSelect = 'none';
    postTitle.placeholder = 'Thank you for your post';

    /* Set boardFlipped to true and postDeleted to false to allow flipping
    board back to initial state */
    boardFlipped = true;
    postDeleted = false;

    // Stop auto-save interval
    clearInterval(saveInterval);

    return;
  }

  // Otherwise, flip to front of post board (initial state)
  postBoard.classList.remove('finished');
  postBoard.classList.add('justify-content-start');
  toolbar.style.display = 'flex';
  post.style.display = 'block';
  document.getElementById('action-buttons').style.display = 'flex';
  document.getElementById('go-board').style.display = 'none';
  document.getElementById('go-back').style.display = 'none';
  document.getElementById('continue-post').style.display = 'none';
  document.getElementById('new-post').style.display = 'none';
  toolbar.classList.remove('finished');
  post.classList.remove('finished');
  document.getElementById('action-buttons').classList.remove('finished');
  document.getElementById('go-board').classList.remove('finished');
  document.getElementById('go-back').classList.remove('finished');
  document.getElementById('continue-post').classList.remove('finished');
  document.getElementById('new-post').classList.remove('finished');

  // Reset post title placeholder and enable typing in field
  postTitle.disabled = false;
  postTitle.style.userSelect = 'text';
  postTitle.placeholder = '[title]';

  // Set boardFlipped to false to allow flipping to back of board
  boardFlipped = false;

  return;
}


/* Take user to public post board when user clicks Go to Public Post Board
button */
document.getElementById('go-board').onclick = function() {
  window.location = '../';
  return;
}


/* Load last post when user clicks Modify Last Post button from back of post
board */
document.getElementById('go-back').onclick = function() {
  loadPost(this.dataset.postid);
  return;
}


/* Display in-progress draft when user clicks Continue In-Progress post button
from back of post board */
document.getElementById('continue-post').onclick = function() {
  // Flip board to initial state and display in-progress post
  flipBoard();
  displayDraft();

  // Restart auto-save interval
  saveInterval = setInterval(savePost, 1000);

  return;
}


// Start new post when user clicks Start New button from back of post board
document.getElementById('new-post').onclick = function() {
  // Flip board to initial state and restart auto-save interval
  flipBoard();
  saveInterval = setInterval(savePost, 1000);

  // Display appropriate editing buttons for new post
  toggleButtons();

  return;
}


// Define cabinet functions

// Open/close cabinet when user clicks cabinet handle
document.getElementById('handle').onclick = toggleCabinet;
keyboardButton(document.getElementById('handle'));

function toggleCabinet() {
  var previousPosts = document.getElementsByClassName('previous-post');

  // If cabinet is open, close it
  if (cabinetOpen) {
    document.getElementById('cabinet-back').classList.remove('open');
    document.getElementById('cabinet-front').classList.remove('open');

    // Hide all previous posts
    for (var i = 0; i < previousPosts.length; i++) {
      previousPosts[i].classList.remove('display');
    }

    // Hide left and right navigation arrows
    document.getElementById('left-arrow').classList.remove('display');
    document.getElementById('right-arrow').classList.remove('display');

    // Set cabinet's status to closed
    cabinetOpen = false;
    return;
  }

  // Otherwise, open cabinet
  document.getElementById('cabinet-back').classList.add('open');
  document.getElementById('cabinet-front').classList.add('open');

  // Display all previous posts
  for (var i = 0; i < previousPosts.length; i++) {
    previousPosts[i].classList.add('display');
  }

  // If there are more posts on server, display right navigation arrow
  if (morePostsToDisplay) {
    document.getElementById('right-arrow').classList.add('display');
  }

  /* If there is at least one post in cabinet and the first post is not post 0
  (i.e., there are lower-numbered posts to display), display left navigation
  arrow */
  if (postsContainer.children.length != 0) {
    if (postsContainer.getElementsByClassName('previous-post')[0].dataset
      .number != 0) {
        document.getElementById('left-arrow').classList.add('display');
      }
  }

  // Set cabinet's status to open
  cabinetOpen = true;

  return;
}


// Request more posts when user clicks left and right arrows in cabinet
document.getElementById('left-arrow').onclick = requestMorePosts;
document.getElementById('right-arrow').onclick = requestMorePosts;
keyboardButton(document.getElementById('left-arrow'), 'Previous posts');
keyboardButton(document.getElementById('right-arrow'), 'More posts');

function requestMorePosts() {
  // If arrow is displayed, update post request numbers
  if (this.classList.contains('display')) {

    // Request lower-numbered posts if left arrow is clicked
    if (this.id == 'left-arrow') {
      requestStart = requestStart - 10;
      requestEnd = requestEnd - 10;
    }

    // Otherwise, request higher-numbered posts
    else {
      requestStart = requestStart + 10;
      requestEnd = requestEnd + 10;
    }

    // Load posts with new request numbers
    loadPosts();
  }

  return;
}

// jscolor's string-valued options are evaluated with new Function, which the
// site's Content-Security-Policy forbids, so its callback is set here as a function.
window.addEventListener('load', function() {
  document.getElementById('font-color-picker').jscolor.onFineChange = function() {
    formatFontColor(this);
  };
});
