(function () {
  function parseDate(str) {
    return new Date(str.replace(' ', 'T'));
  }

  class ThoughtsFeed {
    constructor(dataUrl) {
      this.dataUrl = dataUrl;
      this.thoughts = [];
    }

    async load() {
      try {
        const response = await fetch(this.dataUrl);
        if (!response.ok) throw new Error('Failed to load thoughts data');
        this.thoughts = await response.json();
        this.thoughts.sort((a, b) => parseDate(b.date) - parseDate(a.date));
        this.renderStats();
        this.renderTimeline();
      } catch (e) {
        console.error('Error loading thoughts:', e);
        const container = document.getElementById('thoughts-timeline');
        if (container) {
          container.innerHTML = '<p class="thoughts-loading">Failed to load thoughts.</p>';
        }
      }
    }

    renderStats() {
      const totalEl = document.getElementById('thoughts-total');
      const monthEl = document.getElementById('thoughts-month');
      const perDayEl = document.getElementById('thoughts-per-day');
      const perWeekEl = document.getElementById('thoughts-per-week');

      const total = this.thoughts.length;
      if (totalEl) totalEl.textContent = total;

      const now = new Date();
      if (monthEl) {
        const thisMonth = this.thoughts.filter(t => {
          const d = parseDate(t.date);
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        }).length;
        monthEl.textContent = thisMonth;
      }

      if ((perDayEl || perWeekEl) && total > 0) {
        const dates = this.thoughts.map(t => {
          const d = parseDate(t.date);
          return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        });
        const earliest = new Date(Math.min(...dates));
        const latest = new Date(Math.max(...dates));
        const spanDays = Math.max(1, Math.ceil((latest - earliest) / 86400000) + 1);
        const spanWeeks = Math.max(1, spanDays / 7);

        if (perDayEl) perDayEl.textContent = Math.round(total / spanDays);
        if (perWeekEl) perWeekEl.textContent = Math.round(total / spanWeeks);
      }
    }

    renderTimeline() {
      const container = document.getElementById('thoughts-timeline');
      if (!container) return;

      if (this.thoughts.length === 0) {
        container.innerHTML = '<p class="thoughts-loading">No thoughts yet.</p>';
        return;
      }

      // Group by day
      const groups = {};
      this.thoughts.forEach(t => {
        const d = parseDate(t.date);
        const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!groups[dayKey]) groups[dayKey] = [];
        groups[dayKey].push(t);
      });

      const sortedDays = Object.keys(groups).sort().reverse();
      let html = '';

      sortedDays.forEach(dayKey => {
        const dayDate = new Date(dayKey + 'T00:00:00');
        const dayLabel = this.formatDayLabel(dayDate);

        html += `<div class="thoughts-day">`;
        html += `<div class="thoughts-day-header">${dayLabel}</div>`;

        groups[dayKey].forEach(t => {
          const d = parseDate(t.date);
          const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          const relativeStr = this.relativeTime(d);
          const fullDate = d.toLocaleString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: 'numeric', minute: '2-digit'
          });

          html += `<div class="thought-entry">`;
          html += `<p class="thought-content">${this.escapeHtml(t.content)}</p>`;
          html += `<span class="thought-time">`;
          html += `<span class="thought-time-relative" title="${fullDate}">${timeStr} &middot; ${relativeStr}</span>`;
          html += `</span>`;
          html += `</div>`;
        });

        html += `</div>`;
      });

      container.innerHTML = html;
    }

    formatDayLabel(date) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      if (target.getTime() === today.getTime()) return 'Today';
      if (target.getTime() === yesterday.getTime()) return 'Yesterday';

      return date.toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
      });
    }

    relativeTime(date) {
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
      return `${Math.floor(diffDays / 30)}mo ago`;
    }

    escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  }

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('thoughts-timeline');
    if (!container) return;
    const dataUrl = container.getAttribute('data-url');
    if (!dataUrl) return;
    const feed = new ThoughtsFeed(dataUrl);
    feed.load();
  });
})();
