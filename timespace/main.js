// Define load functions
window.onload = function() {
  // Create page header (from common.js script)
  createPageHeader();

  // Create page footer (from common.js script)
  createPageFooter();

  // Check if user is logged in (from common.js script)
  checkIfLoggedIn();

  return;
}


// Display current time, move circles, and change circles' color every second
setInterval(moveThroughTime, 1000);

function moveThroughTime() {
  // Get current time in milliseconds and convert to string
  var now = new Date();
  var time = now.getTime().toString();

  // Slice time string to get hours, minutes, seconds
  var hours = ('0' + now.getHours()).slice(-2);
  var minutes = ('0' + now.getMinutes()).slice(-2);
  var seconds = ('0' + now.getSeconds()).slice(-2);
  var timeDisplay = document.getElementById('time');

  // Display current time in HH:MM:SS format
  timeDisplay.innerHTML = hours + ':' + minutes + ':' + seconds;

  // Set circle coordinates and colors based on time string digits
  var circleOne = document.getElementById('circle-one');
  var circleTwo = document.getElementById('circle-two');
  var circleThree = document.getElementById('circle-three');
  var circleFour = document.getElementById('circle-four');
  var digitOne = time.slice(-1);
  var digitTwo = time.slice(-2,-1);
  var digitThree = time.slice(-3,-2);
  var digitFour = time.slice(-4,-3);
  var digitFive = time.slice(-5,-4);

  circleOne.style.bottom = digitTwo + digitFour + '.' + digitFour + '%';
  circleOne.style.right = digitFour + digitTwo + '.' + digitOne + '%';
  circleOne.style.backgroundColor = '#' + time.slice(-6);
  circleTwo.style.top = digitThree + digitFour + '.' + digitTwo + '%';
  circleTwo.style.right = digitFour + digitFive + '.' + digitTwo + '%';
  circleTwo.style.backgroundColor = '#' + time.slice(-7,-1);
  circleThree.style.bottom = digitFive + digitFour + '.' + digitThree + '%';
  circleThree.style.left = digitFour + digitTwo + '.' + digitFive + '%';
  circleThree.style.backgroundColor = '#' + time.slice(-8,-2);
  circleFour.style.top = digitFour + digitOne + '.' + digitThree + '%';
  circleFour.style.left = digitOne + digitFour + '.' + digitThree + '%';
  circleFour.style.backgroundColor = '#' + time.slice(-9,-3);

  return;
}
