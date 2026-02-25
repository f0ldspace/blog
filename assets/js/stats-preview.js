// Lightweight stats preview for hub page
(function() {
  // Programming stats
  async function loadProgrammingStats() {
    try {
      const response = await fetch('/programming-2026-data.json');
      if (!response.ok) return;
      const entries = await response.json();

      const container = document.getElementById('progStats');
      if (!container) return;

      const dailyTotals = entries.filter(e => e.type === 'daily_total');
      const totalSeconds = dailyTotals.reduce((sum, e) => sum + parseFloat(e.totalSeconds), 0);
      const hours = (totalSeconds / 3600).toFixed(1);

      const uniqueDays = new Set(dailyTotals.map(e => e.date)).size;
      const avgDaily = uniqueDays > 0 ? (totalSeconds / 3600 / uniqueDays).toFixed(1) : '0';

      const excluded = ['yaml', 'unknown', 'css', 'markdown', 'json', 'text', 'git', 'gitignore', 'org', ''];
      const languages = {};
      entries.filter(e => e.type === 'manual_language').forEach(e => {
        languages[e.name] = (languages[e.name] || 0) + parseFloat(e.totalSeconds);
      });
      const topLang = Object.entries(languages)
        .filter(([name]) => !excluded.includes(name.toLowerCase()))
        .sort((a, b) => b[1] - a[1])[0];

      const categories = {};
      entries.filter(e => e.type === 'category').forEach(e => {
        categories[e.name] = (categories[e.name] || 0) + parseFloat(e.totalSeconds);
      });
      const aiSeconds = categories['ai coding'] || 0;
      const aiPercent = totalSeconds > 0 ? ((aiSeconds / totalSeconds) * 100).toFixed(0) : 0;

      const cards = container.querySelectorAll('.home-stat, .anki-stat-card');
      const stats = [hours, avgDaily, topLang ? topLang[0] : '-', aiPercent + '%'];
      cards.forEach((card, i) => {
        var el = card.querySelector('.home-stat-value, .anki-stat-value');
        if (el) el.textContent = stats[i];
      });
    } catch (e) {
      console.error('Error loading programming stats:', e);
    }
  }

  // Anki stats
  async function loadAnkiStats() {
    try {
      const response = await fetch('/anki-2026-data.json');
      if (!response.ok) return;
      const reviews = await response.json();

      const container = document.getElementById('ankiStats');
      if (!container) return;

      const total = reviews.length;
      const totalSeconds = reviews.reduce((sum, r) => sum + parseFloat(r.time || 0), 0);
      const hours = (totalSeconds / 3600).toFixed(1);

      const days = new Set(reviews.map(r => {
        const d = new Date(r.date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }));
      const avgDaily = Math.round(total / days.size);

      // Streak calculation
      const sortedDays = [...days].sort().reverse();
      let streak = 0;
      const today = new Date();
      let checkDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      for (const day of sortedDays) {
        const dayDate = new Date(day);
        const diffDays = Math.floor((checkDate - dayDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (diffDays === 1 && streak === 0) {
          checkDate = dayDate;
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      const successful = reviews.filter(r => r.button === 'good' || r.button === 'easy').length;
      const successRate = ((successful / total) * 100).toFixed(0);

      const cards = container.querySelectorAll('.home-stat, .anki-stat-card');
      const stats = [hours, avgDaily, streak + 'd', successRate + '%'];
      cards.forEach((card, i) => {
        var el = card.querySelector('.home-stat-value, .anki-stat-value');
        if (el) el.textContent = stats[i];
      });
    } catch (e) {
      console.error('Error loading anki stats:', e);
    }
  }

  // Reading stats
  async function loadReadingStats() {
    try {
      const response = await fetch('/reading-2026-data.json');
      if (!response.ok) return;
      const books = await response.json();

      const container = document.getElementById('readingStats');
      if (!container) return;

      if (books.length === 0) {
        const cards = container.querySelectorAll('.home-stat, .anki-stat-card');
        cards.forEach(card => {
          var el = card.querySelector('.home-stat-value, .anki-stat-value');
          if (el) el.textContent = '-';
        });
        return;
      }

      const totalBooks = books.length;
      const avgRating = (books.reduce((sum, b) => sum + parseFloat(b.rating || 0), 0) / totalBooks).toFixed(1);

      const categories = {};
      books.forEach(b => {
        const cat = b.category || 'Unknown';
        categories[cat] = (categories[cat] || 0) + 1;
      });
      const topCat = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];

      const fiction = books.filter(b => b.type === 'Fiction').length;
      const fictionPercent = ((fiction / totalBooks) * 100).toFixed(0);

      const cards = container.querySelectorAll('.home-stat, .anki-stat-card');
      const stats = [totalBooks, avgRating, topCat ? topCat[0] : '-', fictionPercent + '%'];
      cards.forEach((card, i) => {
        var el = card.querySelector('.home-stat-value, .anki-stat-value');
        if (el) el.textContent = stats[i];
      });
    } catch (e) {
      console.error('Error loading reading stats:', e);
    }
  }

  // Goals stats
  async function loadGoalsStats() {
    try {
      const response = await fetch('/goals-2026-data.json');
      if (!response.ok) return;
      const goals = await response.json();

      const container = document.getElementById('goalsStats');
      if (!container) return;

      const total = goals.length;
      const completed = goals.filter(g => g.status === 'done').length;
      const completionPct = total > 0 ? ((completed / total) * 100).toFixed(0) : 0;

      const categories = {};
      goals.forEach(g => {
        categories[g.category] = (categories[g.category] || 0) + 1;
      });
      const topCat = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];

      const cards = container.querySelectorAll('.home-stat, .anki-stat-card');
      const stats = [total, completed, completionPct + '%', topCat ? topCat[0] : '-'];
      cards.forEach((card, i) => {
        var el = card.querySelector('.home-stat-value, .anki-stat-value');
        if (el) el.textContent = stats[i];
      });
    } catch (e) {
      console.error('Error loading goals stats:', e);
    }
  }

  // Forecast stats
  async function loadForecastStats() {
    try {
      const response = await fetch('/fatebook-stats.json');
      if (!response.ok) return;
      const data = await response.json();

      const container = document.getElementById('forecastStats');
      if (!container) return;

      const s = data.summary;
      const accuracy = s.resolved > 0 ? Math.round((s.correct / s.resolved) * 100) + '%' : '-';
      const resolvedRatio = `${s.resolved}/${s.total}`;

      const cards = container.querySelectorAll('.home-stat, .anki-stat-card');
      const stats = [s.total, s.brierScore?.toFixed(2) || '-', accuracy, resolvedRatio];
      cards.forEach((card, i) => {
        var el = card.querySelector('.home-stat-value, .anki-stat-value');
        if (el) el.textContent = stats[i];
      });
    } catch (e) {
      console.error('Error loading forecast stats:', e);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadProgrammingStats();
    loadAnkiStats();
    loadReadingStats();
    loadForecastStats();
    loadGoalsStats();
  });
})();
