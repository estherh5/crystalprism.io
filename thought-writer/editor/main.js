// Define global variables
var requestStart = 0; // Range start for number of posts to request from server
var requestEnd = 11; // Range end for number of posts to request from server
var morePostsOnServer = false;
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
  // Create page header (from common.js script)
  createPageHeader();

  // Create page footer (from common.js script)
  createPageFooter();

  // Check if user is logged in (from common.js script)
  checkIfLoggedIn();

  // Display in-progress post if user has one
  displayDraft();

  // Auto-save post every second
  saveInterval = setInterval(savePost, 1000);

  /* If user has post stored in sessionStorage (by clicking post from My
  Account page), request post from server */
  if (sessionStorage.getItem('post-timestamp') != null) {
    openPost(sessionStorage.getItem('post-timestamp'));
    /* Clear sessionStorage item to allow user to open another previous post
    (i.e., from cabinet) */
    sessionStorage.removeItem('post-timestamp');
  }

  // Load user's previous posts to cabinet
  loadPosts();

  // Set focus in contenteditable post for immediate editing
  post.focus();

  return;
}


// Display in-progress post if one is stored locally
function displayDraft() {
  // Display in-progress post title if it is stored
  if (localStorage.getItem('post-title') != null) {
    postTitle.value = localStorage.getItem('post-title');
  }

  // Display in-progress post content if it is stored
  if (localStorage.getItem('post-content') != null) {
    post.innerHTML = localStorage.getItem('post-content');
  }

  // Display whether or not in-progress post is public if stored
  if (localStorage.getItem('post-public') != null) {

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
  if (localStorage.getItem('token') == null) {
    return;
  }

  // Otherwise, load previously written posts to cabinet
  return fetch(api + '/thought-writer/post-board/' +
    encodeURIComponent(localStorage.getItem('username')) + '?start=' +
    requestStart + '&end=' + requestEnd, {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
      method: 'GET',
    })

    .then(function(response) {
      response.json().then(function(posts) {

        // Clear posts from cabinet to replace with served posts
        postsContainer.innerHTML = '';

        if (posts.length != 0) {

          /* Assess if there are more than requested posts - 1 (number of loaded
          posts) on server */
          if (posts.length > (requestEnd - requestStart - 1)) {
            morePostsOnServer = true;
            var loadNumber = requestEnd - requestStart - 1;
          }

          /* If there are not, load all posts sent from server to post area in
          cabinet */
          else {
            morePostsOnServer = false;
            var loadNumber = posts.length;
          }

          for (var i = 0; i < loadNumber; i++) {
            // Create container for post and its components
            var previousPost = document.createElement('div');
            previousPost.classList.add('previous-post');

            // Add display class to post if cabinet is open
            if (cabinetOpen) {
              previousPost.classList.add('display');
            }

            /* Set data-title and data-timestamp attribute to use if post is
            clicked from cabinet */
            previousPost.dataset.title = posts[i].title;
            previousPost.dataset.timestamp = posts[i].timestamp;

            /* Set data-number attribute to track the post number for displaying
            more posts later */
            previousPost.dataset.number = requestStart + i;

            /* Display hover title for post as post title and local timestamp in
            'MM/DD/YYYY, HH:MM AM/PM' format */
            previousPost.title = previousPost.dataset.title + '  ' +
              moment(posts[i].timestamp).format('MM/DD/YYYY, LT');
            previousPost.dataset.public = posts[i].public;

            // Create container with post content
            var postContent = document.createElement('div');
            postContent.classList.add('previous-post-content');
            postContent.innerHTML = posts[i].content;
            postsContainer.appendChild(previousPost);
            previousPost.appendChild(postContent);

            // Open post in post editor when user clicks it
            previousPost.onclick = function() {
              openPost(this.dataset.timestamp);
              return;
            }
          }

          // If cabinet is open, display/hide right/left arrows
          if (cabinetOpen) {

            /* If first post displayed in cabinet is not post 0 (i.e., there are
            lower-numbered posts to display), display left navigation arrow */
            if (postsContainer.getElementsByClassName('previous-post')[0]
              .dataset.number != 0) {
                document.getElementById('left-arrow').classList.add('display');
              }

            // Otherwise, hide left arrow
            else {
              document.getElementById('left-arrow').classList.remove('display');
            }

            /* If there are more posts on the server, display right navigation
            arrow */
            if (morePostsOnServer) {
              document.getElementById('right-arrow').classList.add('display');
            }

            // Otherwise, hide right arrow
            else {
              document.getElementById('right-arrow').classList
                .remove('display');
            }
          }
        }
      });
    });
}


// Open post that has passed timestamp in editor
function openPost(timestamp) {
  var postPath = encodeURIComponent(localStorage
    .getItem('username')) + '/' + encodeURIComponent(timestamp);

  return fetch(api + '/thought-writer/post/' + postPath, {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')},
    })

    // Display error message if server is down
    .catch(function(error) {
      window.alert('Your request did not go through. Please try again soon.');
      return;
    })

    .then(function(response) {
      response.json().then(function(requestedPost) {
        // Set post title, content, data-timestamp attribute, and public status
        postTitle.value = requestedPost.title;
        post.innerHTML = requestedPost.content;
        post.dataset.timestamp = requestedPost.timestamp;
        publicInput.checked = requestedPost.public;

        if (requestedPost.public) {
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

      });
    });
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


/* Click hidden color picker input when font color icon is clicked (must focus
first to open) */
document.getElementById('font-color-icon').addEventListener('click',
  function() {
    document.getElementById('font-color-picker').focus();
    document.getElementById('font-color-picker').click();
    return;
  }, false);


// Format post content when font color is chosen from color picker input
document.getElementById('font-color-picker').oninput = formatContent;

function formatContent() {
  // Get data-command from clicked button/input
  var command = this.dataset.command;

  // Update font color icon and font color when color is chosen from input
  if (command == 'foreColor') {
    document.getElementById('font-color-icon').style.color = this.value;
    document.execCommand(command, false, this.value);
    return;
  }

  // Prompt for URL and insert image or link if those buttons are clicked
  else if (command == 'insertImage' || command == 'createLink') {
    var url = prompt('Specify link here: ', 'http:\/\/');
    document.execCommand(command, false, url);
    return;
  }

  // Otherwise, execute command with no additional actions
  document.execCommand(command, false, null);

  return;
}


// Toggle post's public status when user clicks Public checkbox
publicCheckbox.onclick = togglePublic;

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
  clearPost();

  // Save cleared state to localStorage
  savePost();

  return;
}

function clearPost() {
  // Clear post title, content, public checkbox, and data-timestamp attribute
  postTitle.value = '';
  post.innerHTML = '';
  publicInput.checked = false;
  publicCheckbox.classList.remove('checked');
  delete post.dataset.timestamp;
  return;
}


// Submit post to server when user clicks Submit button
document.getElementById('submit-post').onclick = submitPost;

function submitPost() {
  /* If post is blank, warn user that blank post cannot be submitted (excludes
  empty elements) */
  if (!/\S/.test(post.textContent)) {
    window.alert('Your post must contain text.');
    return;
  }

  /* While post title has no non-space characters, prompt user for title until
  they enter one or cancel */
  while (!/\S/.test(postTitle.value)) {
    var enteredTitle = prompt('Enter a title for your post. Tip: Click ' +
      '"[title]" to enter a title at any time.');

    if (!/\S/.test(enteredTitle.value)) {
      enteredTitle = prompt('Enter a title for your post. Tip: Click ' +
        '"[title]" to enter a title at any time.');
    }

    else if (enteredTitle == null) {
      return;
    }

    else {
      postTitle.value = enteredTitle;
    }
  }

  // If user is not logged in, warn user that login is required to submit post
  if (localStorage.getItem('token') == null) {
    window.alert('You must log in to create a post.');
    return;
  }

  // Otherwise, submit post to server
  var data = JSON.stringify({'title': postTitle.value, 'content': post
    .innerHTML, 'public': publicInput.checked});

  return fetch(api + '/thought-writer/post', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'),
      'Content-Type': 'application/json'},
    method: 'POST',
    body: data,
  })

    // Display error message if server is down
    .catch(function(error) {
      window.alert('Your post did not go through. Please try again soon.');
      return;
    })

    .then(function(response) {
      // If post was submitted successfully, clear post and flip board
      if (response.ok) {
        response.text().then(function(text) {

          // If cabinet is open, close it to refresh posts
          if (cabinetOpen) {
            toggleCabinet();
          }

          // Reload user's posts to cabinet to include newly submitted post
          loadPosts();

          /* Set data-timestamp attribute for Modify Last Post button in case
          user wants to modify last post */
          document.getElementById('go-back').dataset.timestamp = text;

          // Clear post title and content
          clearPost();

          // Save cleared state to localStorage
          savePost();

          // Flip to back of post board
          flipBoard();
        });

        return;
      }

      // Otherwise, display error message
      window.alert('You must log in to create a post.');

      return;
    });
}


// Close previous post in post editor
document.getElementById('close-post').onclick = function() {
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
  // If user is not logged in, warn user that login is required to modify post
  if (localStorage.getItem('token') == null) {
    window.alert('You must log in to edit a post.');
    return;
  }

  // Otherwise, submit modified post to server
  var data = JSON.stringify({'title': postTitle.value, 'timestamp': post.dataset
    .timestamp, 'content': post.innerHTML, 'public': publicInput.checked});

  return fetch(api + '/thought-writer/post', {
    headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'),
      'Content-Type': 'application/json'},
    method: 'PATCH',
    body: data,
  })

    // Display error message if server is down
    .catch(function(error) {
      window.alert('Your post did not go through. Please try again soon.');
      return;
    })

    .then(function(response) {
      // If modified post was submitted successfully, clear post and flip board
      if (response.ok) {

        // If cabinet is open, close it to refresh posts
        if (cabinetOpen) {
          toggleCabinet();
        }

        // Reload user's posts to cabinet to include newly modified post
        loadPosts();

        /* Set data-timestamp attribute for Modify Last Post button in case user
        wants to modify last post */
        document.getElementById('go-back').dataset.timestamp = post.dataset
          .timestamp;

        // Clear post title and content
        clearPost();

        // Set viewingPost to false
        viewingPost = false;

        // Flip to back of post board
        flipBoard();

        return;
      }

      // Otherwise, display error message
      window.alert('You must log in to edit a post.');

      return;
    });
}


// Delete post from server when user clicks Delete button
document.getElementById('delete-post').onclick = deletePost;

function deletePost() {
  // Prompt for confirmation to delete post
  var confirmDelete = confirm('Are you sure you want to delete this post?');
  var data = JSON.stringify({'timestamp': post.dataset.timestamp});

  if (confirmDelete == true) {

    return fetch(api + '/thought-writer/post', {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('token'),
        'Content-Type': 'application/json'},
      method: 'DELETE',
      body: data,
    })

      // Display error message if server is down
      .catch(function(error) {
        window.alert('Your request did not go through. Please try again soon.');
        return;
      })

      .then(function(response) {
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

          return;
        }

        // Otherwise, display error message
        window.alert('You must log in to delete a post.');

        return;
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


/* Open last post when user clicks Modify Last Post button from back of post
board */
document.getElementById('go-back').onclick = function() {
  openPost(this.dataset.timestamp);
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
  if (morePostsOnServer) {
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
