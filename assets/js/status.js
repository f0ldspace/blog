(function () {
  var schedule = [
    { name: 'Sleep',            startMin: 120,  endMin: 600,  color: '#4a3d28' },
    { name: 'Morning Routine',  startMin: 600,  endMin: 660,  color: '#d4763a' },
    { name: 'Free Time',        startMin: 660,  endMin: 780,  color: '#c8a44e' },
    { name: 'Light Work',       startMin: 780,  endMin: 1020, color: '#7a8a5a' },
    { name: 'Free Time',        startMin: 1020, endMin: 1380, color: '#c8a44e' },
    { name: 'Deep Work',        startMin: 1380, endMin: 1530, color: '#a83a2a' },
    { name: 'Evening Routine',  startMin: 1530, endMin: 1560, color: '#d4763a' }
  ];

  var offColor = '#3d352a';

  function getUKTime() {
    var now = new Date();
    var opts = { timeZone: 'Europe/London', hour12: false };
    var parts = {};
    var fields = [
      ['year', 'numeric'], ['month', 'numeric'], ['day', 'numeric'],
      ['hour', 'numeric'], ['minute', 'numeric'], ['second', 'numeric'],
      ['weekday', 'short']
    ];
    for (var i = 0; i < fields.length; i++) {
      var o = Object.assign({}, opts);
      o[fields[i][0]] = fields[i][1];
      parts[fields[i][0]] = new Intl.DateTimeFormat('en-GB', o).format(now);
    }
    return {
      hour: parseInt(parts.hour, 10),
      minute: parseInt(parts.minute, 10),
      weekday: parts.weekday
    };
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function formatRemaining(minutes) {
    if (minutes <= 0) return '';
    var h = Math.floor(minutes / 60);
    var m = minutes % 60;
    if (h > 0 && m > 0) return h + 'h ' + m + 'm remaining';
    if (h > 0) return h + 'h remaining';
    return m + 'm remaining';
  }

  function getCurrentStatus() {
    var uk = getUKTime();
    var day = uk.weekday;
    var nowMin = uk.hour * 60 + uk.minute;

    var isWeekday = (day === 'Mon' || day === 'Tue' || day === 'Wed' || day === 'Thu' || day === 'Fri');
    var isSat = (day === 'Sat');

    var active = false;
    var currentMinInCycle = 0;

    if (isWeekday) {
      if (day === 'Mon') {
        if (nowMin >= 600) {
          active = true;
          currentMinInCycle = nowMin;
        }
      } else {
        active = true;
        currentMinInCycle = nowMin;
        if (nowMin < 120) {
          currentMinInCycle = nowMin + 1440;
        }
      }
    } else if (isSat) {
      if (nowMin < 120) {
        active = true;
        currentMinInCycle = nowMin + 1440;
      }
    }

    if (!active) {
      return { name: 'Off Schedule', color: offColor, remaining: -1, progress: 0 };
    }

    for (var i = 0; i < schedule.length; i++) {
      var slot = schedule[i];
      if (currentMinInCycle >= slot.startMin && currentMinInCycle < slot.endMin) {
        var elapsed = currentMinInCycle - slot.startMin;
        var duration = slot.endMin - slot.startMin;
        var remaining = slot.endMin - currentMinInCycle;
        return {
          name: slot.name,
          color: slot.color,
          remaining: remaining,
          progress: (elapsed / duration) * 100
        };
      }
    }

    return { name: 'Off Schedule', color: offColor, remaining: -1, progress: 0 };
  }

  function render() {
    var status = getCurrentStatus();
    var uk = getUKTime();

    var nameEl = document.getElementById('schedule-name');
    var barEl = document.getElementById('schedule-bar');
    var remainEl = document.getElementById('schedule-remaining');

    if (nameEl) {
      nameEl.innerHTML = '<span class="schedule-dot" style="background-color:' + status.color + '"></span>' + status.name + '<span class="schedule-time">' + pad(uk.hour) + ':' + pad(uk.minute) + '</span>';
    }

    if (barEl) {
      barEl.style.width = status.progress + '%';
      barEl.style.background = status.color;
    }

    if (remainEl) {
      remainEl.textContent = status.remaining > 0 ? formatRemaining(status.remaining) : '';
    }
  }

  render();
  setInterval(render, 60000);
})();
