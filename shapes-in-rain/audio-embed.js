/*
 YouTube Audio Embed
 --------------------

 Original Author: Amit Agarwal
 Web: http://www.labnol.org/?p=26740
*/

function onYouTubeIframeAPIReady() {
  var audioDiv = document.getElementById('audio-div');
  var audioIcon = document.createElement('img');
  audioIcon.id = 'audio-icon';
  audioDiv.append(audioIcon);
  var audioPlayer = document.createElement('div');
  audioPlayer.id = 'audio-player';
  audioDiv.append(audioPlayer);
  function audioFunction(audioDiv) {
    var audioPlayer = audioDiv ? 'on-black.png' : 'off-black.png';
    audioIcon.src = 'images/' + audioPlayer;
  }
  audioDiv.onclick = function() {
    audioiFrame.getPlayerState() === YT.PlayerState.PLAYING || audioiFrame.getPlayerState() === YT.PlayerState.BUFFERING ? (audioiFrame.pauseVideo(), audioFunction(!1)) : (audioiFrame.playVideo(), audioFunction(!0));
  }
  var audioiFrame = new YT.Player('audio-player', {
    height: '0',
    width: '0',
    videoId: audioDiv.dataset.video,
    playerVars: {
      autoplay: audioDiv.dataset.autoplay,
      loop: audioDiv.dataset.loop,
      start: 1
    },
    events: {
      onReady: function(audioDiv) {
        audioiFrame.setPlaybackQuality('small'),
        audioFunction(audioiFrame.getPlayerState() !== YT.PlayerState.CUED)
      },
      onStateChange: function(audioDiv) {
        audioDiv.data === YT.PlayerState.ENDED && audioFunction(!1)
      }
    }
  })
}
