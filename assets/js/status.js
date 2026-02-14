(function () {
  // Schedule defined in Europe/London time (weekdays Mon-Fri)
  // Times in minutes from midnight. Events crossing midnight use >1440.
  // CSS classes used instead of inline styles (CSP blocks inline styles)
  var schedule = [
    { name: 'Sleep',            startMin: 120,  endMin: 600,  cls: 'status-dot--sleep' },
    { name: 'Morning Routine',  startMin: 600,  endMin: 660,  cls: 'status-dot--morning-routine' },
    { name: 'Free Time',        startMin: 660,  endMin: 780,  cls: 'status-dot--free-time' },
    { name: 'Light Work',       startMin: 780,  endMin: 1020, cls: 'status-dot--light-work' },
    { name: 'Free Time',        startMin: 1020, endMin: 1380, cls: 'status-dot--free-time' },
    { name: 'Deep Work',        startMin: 1380, endMin: 1530, cls: 'status-dot--deep-work' },
    { name: 'Evening Routine',  startMin: 1530, endMin: 1560, cls: 'status-dot--evening-routine' }
  ];
  // Full cycle: Sleep 02:00-10:00, Morning 10:00-11:00, Free 11:00-13:00,
  //   Light Work 13:00-17:00, Free 17:00-23:00, Deep Work 23:00-01:30(+1),
  //   Evening Routine 01:30-02:00(+1)

  var offCls = 'status-dot--off-schedule';

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
        // Monday: no tail from Sunday, schedule starts at 10:00
        if (nowMin >= 600) {
          active = true;
          currentMinInCycle = nowMin;
        }
      } else {
        // Tue-Fri: tail from previous day (00:00-02:00) + own schedule from 02:00
        active = true;
        currentMinInCycle = nowMin;
        if (nowMin < 120) {
          currentMinInCycle = nowMin + 1440;
        }
      }
    } else if (isSat) {
      // Saturday 00:00-02:00 is the tail of Friday's cycle
      if (nowMin < 120) {
        active = true;
        currentMinInCycle = nowMin + 1440;
      }
    }

    if (!active) {
      return { name: 'Off Schedule', cls: offCls, remaining: -1 };
    }

    for (var i = 0; i < schedule.length; i++) {
      var slot = schedule[i];
      if (currentMinInCycle >= slot.startMin && currentMinInCycle < slot.endMin) {
        var remaining = slot.endMin - currentMinInCycle;
        return { name: slot.name, cls: slot.cls, remaining: remaining };
      }
    }

    return { name: 'Off Schedule', cls: offCls, remaining: -1 };
  }

  function render() {
    var status = getCurrentStatus();
    var el = document.getElementById('status');
    if (!el) return;

    var html = '<span class="status-dot ' + status.cls + '"></span>';
    html += '<span class="status-text">' + status.name;
    if (status.remaining > 0) {
      html += ' \u2014 ' + formatRemaining(status.remaining);
    }
    html += '</span>';
    el.innerHTML = html;
  }

  render();
  setInterval(render, 60000);
})();
