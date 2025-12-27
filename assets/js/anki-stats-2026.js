// Lightweight Anki stats renderer (no charts)
(function() {
  const dataUrl = window.ANKI_DATA_URL || '/anki-2026-data.json';

  function getDateKey(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function renderStats(reviews) {
    const container = document.getElementById('ankiStats');
    if (!container) return;

    const total = reviews.length;
    const totalSeconds = reviews.reduce((sum, r) => sum + parseFloat(r.time || 0), 0);
    const hours = (totalSeconds / 3600).toFixed(1);

    // Calculate unique days
    const days = new Set(reviews.map(r => getDateKey(r.date)));
    const avgDaily = Math.round(total / days.size);

    // Calculate current streak
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
      } else if (diffDays === 1) {
        if (streak === 0) {
          checkDate = dayDate;
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      } else {
        break;
      }
    }

    // Success rate (good + easy)
    const successful = reviews.filter(r => r.button === 'good' || r.button === 'easy').length;
    const successRate = ((successful / total) * 100).toFixed(0);

    // Update the stat cards
    const cards = container.querySelectorAll('.anki-stat-card');
    const stats = [
      { value: hours, label: 'Hours Studied' },
      { value: avgDaily, label: 'Avg/Day' },
      { value: streak + 'd', label: 'Streak' },
      { value: successRate + '%', label: 'Success Rate' }
    ];

    cards.forEach((card, i) => {
      if (stats[i]) {
        card.querySelector('.anki-stat-value').textContent = stats[i].value;
      }
    });
  }

  async function init() {
    try {
      const response = await fetch(dataUrl);
      if (!response.ok) throw new Error('Failed to load Anki data');
      const reviews = await response.json();
      renderStats(reviews);
    } catch (error) {
      console.error('Error loading Anki data:', error);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
