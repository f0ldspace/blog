(function() {
  var API_KEY = '97e06ba5d69dbbb34d73bc9052bd32ce';
  var USER = 'f0ldspace';
  var POLL_MS = 30000;
  var el = document.getElementById('nowPlaying');
  if (!el) return;

  var trackEl = el.querySelector('.np-track');
  var artistEl = el.querySelector('.np-artist');
  var statusEl = el.querySelector('.np-status');
  var dotEl = el.querySelector('.np-dot');
  var artEl = el.querySelector('.np-art');

  function timeAgo(uts) {
    var diff = Math.floor(Date.now() / 1000) - parseInt(uts, 10);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  }

  function render(track, playing) {
    trackEl.textContent = track.name || '';
    artistEl.textContent = (track.artist && track.artist['#text']) || '';

    if (playing) {
      dotEl.className = 'np-dot np-dot-active';
      statusEl.textContent = 'now playing';
      statusEl.className = 'np-status np-status-live';
    } else {
      dotEl.className = 'np-dot np-dot-idle';
      statusEl.textContent = track.date ? timeAgo(track.date.uts) : '';
      statusEl.className = 'np-status np-status-idle';
    }

    var img = '';
    if (track.image) {
      for (var i = 0; i < track.image.length; i++) {
        if (track.image[i].size === 'small' && track.image[i]['#text']) {
          img = track.image[i]['#text'];
          break;
        }
      }
    }
    if (img) {
      artEl.style.backgroundImage = 'url(' + img + ')';
      artEl.style.display = '';
    } else {
      artEl.style.display = 'none';
    }

    el.style.display = '';
  }

  function poll() {
    fetch('https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=' +
      USER + '&api_key=' + API_KEY + '&format=json&limit=1')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var tracks = data && data.recenttracks && data.recenttracks.track;
        if (!tracks) return;
        if (!Array.isArray(tracks)) tracks = [tracks];
        if (!tracks.length) return;
        var t = tracks[0];
        var playing = !!(t['@attr'] && t['@attr'].nowplaying === 'true');
        render(t, playing);
      })
      .catch(function(e) {
        console.error('[now-playing]', e);
      });
  }

  poll();
  setInterval(poll, POLL_MS);
})();
