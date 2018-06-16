/*
 YouTube Audio Embed
 --------------------

 Original Author: Amit Agarwal
 Web: http://www.labnol.org/?p=26740
*/

var audioiFrame;
var audioStarted = false; // Stores whether user turned audio on


// Define function to run when YouTube video is ready
function onYouTubeIframeAPIReady() {
  // Add audio icon to webpage
  var audioContainer = document.getElementById('audio-container');
  var audioIcon = document.createElement('img');
  audioIcon.id = 'audio-icon';
  audioContainer.appendChild(audioIcon);

  // Add audio player to webpage
  var audioPlayer = document.createElement('div');
  audioPlayer.id = 'audio-player';
  audioContainer.appendChild(audioPlayer);

  // Change icon to on/off view depending on if video is playing
  function audioFunction(playing) {
    var image = playing ? 'on.svg' : 'off.svg';
    audioIcon.src = 'images/' + image;
    return;
  }

  /* Play or pause video when audio control is clicked and change icon
  accordingly */
  audioContainer.onclick = function() {
    audioiFrame.getPlayerState() === YT.PlayerState.PLAYING || audioiFrame
      .getPlayerState() === YT.PlayerState.BUFFERING ? (audioiFrame
      .pauseVideo(), audioFunction(!1), audioStarted = false) : (audioiFrame
      .playVideo(), audioFunction(!0), audioStarted = true);

    return;
  }

  // Set attributes of embedded audio player
  audioiFrame = new YT.Player('audio-player', {
    height: '0',
    width: '0',
    videoId: audioContainer.dataset.video,
    playerVars: {
      autoplay: audioContainer.dataset.autoplay,
      loop: audioContainer.dataset.loop,
      start: 1,
    },
    events: {
      onReady: function() {
        audioiFrame.setPlaybackQuality('small'),
        audioFunction(audioiFrame.getPlayerState() !== YT.PlayerState.CUED);
        return;
      },
      onStateChange: function(audioContainer) {
        audioContainer.data === YT.PlayerState.ENDED && audioFunction(!1);
        return;
      }
    }
  });

  return;
}
