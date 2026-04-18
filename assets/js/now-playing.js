(function() {
  var API_KEY = '97e06ba5d69dbbb34d73bc9052bd32ce';
  var USER = 'f0ldspace';
  var REFRESH_MS = 30000;

  function timeAgo(dateObj) {
    if (!dateObj || !dateObj.uts) return '';
    var now = Math.floor(Date.now() / 1000);
    var then = parseInt(dateObj.uts, 10);
    var diff = now - then;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  }

  function update(data) {
    var container = document.getElementById('nowPlaying');
    if (!container) return;

    var tracks = data.recenttracks && data.recenttracks.track;
    if (!tracks || !tracks.length) {
      container.style.display = 'none';
      return;
    }

    var track = tracks[0];
    var isPlaying = track['@attr'] && track['@attr'].nowplaying === 'true';
    var artist = track.artist && track.artist['#text'] ? track.artist['#text'] : '';
    var title = track.name || '';
    var albumArt = '';
    if (track.image && track.image.length) {
      var small = track.image.find(function(img) { return img.size === 'small'; });
      if (small && small['#text']) albumArt = small['#text'];
    }

    if (!artist && !title) {
      container.style.display = 'none';
      return;
    }

    container.style.display = '';

    var dot = container.querySelector('.np-dot');
    var trackEl = container.querySelector('.np-track');
    var artistEl = container.querySelector('.np-artist');
    var statusEl = container.querySelector('.np-status');
    var artEl = container.querySelector('.np-art');

    if (dot) {
      if (isPlaying) {
        dot.classList.add('np-dot-active');
        dot.classList.remove('np-dot-idle');
      } else {
        dot.classList.remove('np-dot-active');
        dot.classList.add('np-dot-idle');
      }
    }

    if (trackEl) trackEl.textContent = title;
    if (artistEl) artistEl.textContent = artist;
    if (statusEl) {
      if (isPlaying) {
        statusEl.textContent = 'now playing';
        statusEl.classList.add('np-status-live');
        statusEl.classList.remove('np-status-idle');
      } else {
        statusEl.textContent = timeAgo(track.date);
        statusEl.classList.remove('np-status-live');
        statusEl.classList.add('np-status-idle');
      }
    }

    if (artEl) {
      if (albumArt) {
        artEl.style.backgroundImage = 'url(' + albumArt + ')';
        artEl.style.display = '';
      } else {
        artEl.style.display = 'none';
      }
    }
  }

  function fetchNowPlaying() {
    var url = 'https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=' +
      USER + '&api_key=' + API_KEY + '&format=json&limit=1';

    fetch(url)
      .then(function(res) { return res.json(); })
      .then(update)
      .catch(function(e) { console.error('Error fetching now playing:', e); });
  }

  fetchNowPlaying();
  setInterval(fetchNowPlaying, REFRESH_MS);
})();