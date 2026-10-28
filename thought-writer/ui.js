/* In-page feedback for this app, in place of native alert/confirm/prompt
dialogs: an error appears beside the control that failed and clears on the
next attempt; a destructive action asks for a second, in-page confirmation */

// Show message beside control (or after anchor, when the control sits in a row)
function inlineError(control, message, anchor) {
  clearInlineError(control);
  var note = document.createElement('p');
  note.className = 'inline-error';
  note.setAttribute('role', 'alert');
  note.textContent = message;
  (anchor || control).insertAdjacentElement('afterend', note);
  control.inlineErrorNote = note;
  return note;
}

function clearInlineError(control) {
  var note = control.inlineErrorNote;
  if (note && note.parentNode) {
    note.parentNode.removeChild(note);
  }
  control.inlineErrorNote = null;
  return;
}

/* Ask "question" beside control; confirmLabel runs onConfirm, Cancel (or
Escape) puts focus back on control */
function inlineConfirm(control, question, confirmLabel, onConfirm, anchor) {
  clearInlineError(control);
  if (control.inlineConfirmBox && control.inlineConfirmBox.parentNode) {
    control.inlineConfirmBox.querySelector('.inline-confirm-yes').focus();
    return;
  }

  var box = document.createElement('div');
  box.className = 'inline-confirm';
  box.setAttribute('role', 'group');
  box.setAttribute('aria-label', question);
  var text = document.createElement('p');
  text.textContent = question;
  var yes = document.createElement('button');
  yes.type = 'button';
  yes.className = 'inline-confirm-yes';
  yes.textContent = confirmLabel;
  var no = document.createElement('button');
  no.type = 'button';
  no.className = 'inline-confirm-no';
  no.textContent = 'Cancel';
  box.appendChild(text);
  box.appendChild(yes);
  box.appendChild(no);

  function close() {
    if (box.parentNode) {
      box.parentNode.removeChild(box);
    }
    control.inlineConfirmBox = null;
    return;
  }

  yes.onclick = function() {
    close();
    onConfirm();
    return;
  };

  no.onclick = function() {
    close();
    control.focus();
    return;
  };

  box.addEventListener('keydown', function(e) {
    if (e.key == 'Escape') {
      e.preventDefault();
      no.click();
    }
    return;
  }, false);

  (anchor || control).insertAdjacentElement('afterend', box);
  control.inlineConfirmBox = box;
  yes.focus();
  return box;
}

// The account app's sign-in page, returning here afterwards
function signInHref() {
  return appUrl('account', 'sign-in/') + '?next=' +
    encodeURIComponent(window.location.href);
}


// A clickable icon or tile that keyboards and screen readers can use too
function keyboardButton(element, label) {
  element.setAttribute('role', 'button');
  element.tabIndex = 0;

  if (label) {
    element.setAttribute('aria-label', label);
  }

  element.addEventListener('keydown', function(e) {
    if (e.key == 'Enter' || e.key == ' ') {
      e.preventDefault();
      // dispatchEvent, not click(): SVG elements have no click() method
      element.dispatchEvent(new MouseEvent('click', {bubbles: true}));
    }

    return;
  }, false);

  return;
}
