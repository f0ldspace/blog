document.addEventListener('DOMContentLoaded', function() {
  var API_KEY = '97e06ba5d69dbbb34d73bc9052bd32ce';
  var USER = 'f0ldspace';
  var POLL_MS = 30000;
  var el = document.getElementById('nowPlaying');
  if (!el) return;

  function timeAgo(uts) {
    var diff = Math.floor(Date.now() / 1000) - parseInt(uts, 10);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  }

  function poll() {
    var url = 'https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks' +
      '&user=' + USER + '&api_key=' + API_KEY + '&format=json&limit=1';

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function() {
      if (xhr.status !== 200) return;
      try {
        var data = JSON.parse(xhr.responseText);
      } catch(e) { return; }
      var tracks = data && data.recenttracks && data.recenttracks.track;
      if (!tracks) return;
      if (!Array.isArray(tracks)) tracks = [tracks];
      if (!tracks.length) return;

      var t = tracks[0];
      var playing = !!(t['@attr'] && t['@attr'].nowplaying === 'true');
      var name = t.name || '';
      var artist = (t.artist && t.artist['#text']) || '';
      if (!name && !artist) return;

      var status = playing ? 'now playing' : (t.date ? timeAgo(t.date.uts) : '');

      el.querySelector('.np-track').textContent = name;
      el.querySelector('.np-artist').textContent = artist;
      el.querySelector('.np-status').textContent = status;
      el.style.display = '';
    };
    xhr.onerror = function() {
      console.error('[now-playing] XHR error');
    };
    xhr.send();
  }

  poll();
  setInterval(poll, POLL_MS);
});
