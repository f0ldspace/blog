/* Chart.js global defaults for Dune dark theme */
Chart.defaults.color = '#6b5d45';
Chart.defaults.borderColor = '#2a2520';
Chart.defaults.elements.arc.borderColor = '#6b5d45';
Chart.defaults.elements.arc.borderWidth = 2;
Chart.defaults.scale.grid.color = '#2a2520';
Chart.defaults.scale.grid.drawBorder = false;
Chart.defaults.scale.ticks.color = '#6b5d45';
Chart.defaults.plugins.legend.labels.color = '#6b5d45';

class AnkiVisualizer {
  constructor(dataUrl) {
    this.dataUrl = dataUrl || '/anki-2026-data.json';
    this.reviews = [];
    this.colors = {
      primary: ['#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f', '#edc949'],
      buttons: {
        again: '#e15759',
        hard: '#f28e2c',
        good: '#59a14f',
        easy: '#4e79a7'
      },
      types: {
        learning: '#4e79a7',
        review: '#59a14f',
        relearn: '#f28e2c'
      }
    };
    this.init();
  }

  async init() {
    try {
      const response = await fetch(this.dataUrl);
      if (!response.ok) throw new Error('Failed to load Anki data');
      this.reviews = await response.json();

      this.renderStats();
      this.renderReviewsChart();
      this.renderTimeChart();
      this.renderButtonChart();
      this.renderTypeChart();
      this.renderSuccessChart();
      this.renderHourChart();
    } catch (error) {
      console.error('Error loading Anki data:', error);
      document.querySelector('.charts-grid').innerHTML =
        '<p class="loading">Error loading Anki data. Please try refreshing.</p>';
    }
  }

  getDateKey(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  renderStats() {
    const total = this.reviews.length;
    document.getElementById('statTotal').textContent = total.toLocaleString();

    const totalSeconds = this.reviews.reduce((sum, r) => sum + parseFloat(r.time || 0), 0);
    const hours = (totalSeconds / 3600).toFixed(1);
    document.getElementById('statTime').textContent = hours;

    // Calculate unique days
    const days = new Set(this.reviews.map(r => this.getDateKey(r.date)));
    const avgDaily = Math.round(total / days.size);
    document.getElementById('statAvgDaily').textContent = avgDaily;

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
        // Allow for checking yesterday if today hasn't been done yet
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
    document.getElementById('statStreak').textContent = streak + 'd';

    // Success rate (good + easy)
    const successful = this.reviews.filter(r => r.button === 'good' || r.button === 'easy').length;
    const successRate = ((successful / total) * 100).toFixed(0);
    document.getElementById('statSuccess').textContent = successRate + '%';
  }

  renderReviewsChart() {
    const dailyData = {};
    this.reviews.forEach(r => {
      const key = this.getDateKey(r.date);
      dailyData[key] = (dailyData[key] || 0) + 1;
    });

    const sortedDays = Object.keys(dailyData).sort();

    new Chart(document.getElementById('reviewsChart'), {
      type: 'bar',
      data: {
        labels: sortedDays.map(d => {
          const date = new Date(d);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [{
          label: 'Reviews',
          data: sortedDays.map(d => dailyData[d]),
          backgroundColor: this.colors.primary[0]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true },
          x: { ticks: { maxTicksLimit: 10 } }
        }
      }
    });
  }

  renderTimeChart() {
    const dailyTime = {};
    this.reviews.forEach(r => {
      const key = this.getDateKey(r.date);
      dailyTime[key] = (dailyTime[key] || 0) + parseFloat(r.time || 0);
    });

    const sortedDays = Object.keys(dailyTime).sort();

    new Chart(document.getElementById('timeChart'), {
      type: 'bar',
      data: {
        labels: sortedDays.map(d => {
          const date = new Date(d);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [{
          label: 'Minutes',
          data: sortedDays.map(d => (dailyTime[d] / 60).toFixed(1)),
          backgroundColor: this.colors.primary[1]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true },
          x: { ticks: { maxTicksLimit: 10 } }
        }
      }
    });
  }

  renderButtonChart() {
    const buttons = { again: 0, hard: 0, good: 0, easy: 0 };
    this.reviews.forEach(r => {
      if (buttons.hasOwnProperty(r.button)) {
        buttons[r.button]++;
      }
    });

    new Chart(document.getElementById('buttonChart'), {
      type: 'doughnut',
      data: {
        labels: ['Again', 'Hard', 'Good', 'Easy'],
        datasets: [{
          data: [buttons.again, buttons.hard, buttons.good, buttons.easy],
          backgroundColor: [
            this.colors.buttons.again,
            this.colors.buttons.hard,
            this.colors.buttons.good,
            this.colors.buttons.easy
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 10 }
          }
        }
      }
    });
  }

  renderTypeChart() {
    const types = { learning: 0, review: 0, relearn: 0 };
    this.reviews.forEach(r => {
      if (types.hasOwnProperty(r.type)) {
        types[r.type]++;
      }
    });

    new Chart(document.getElementById('typeChart'), {
      type: 'doughnut',
      data: {
        labels: ['Learning', 'Review', 'Relearn'],
        datasets: [{
          data: [types.learning, types.review, types.relearn],
          backgroundColor: [
            this.colors.types.learning,
            this.colors.types.review,
            this.colors.types.relearn
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 10 }
          }
        }
      }
    });
  }

  renderSuccessChart() {
    const dailySuccess = {};
    const dailyTotal = {};

    this.reviews.forEach(r => {
      const key = this.getDateKey(r.date);
      dailyTotal[key] = (dailyTotal[key] || 0) + 1;
      if (r.button === 'good' || r.button === 'easy') {
        dailySuccess[key] = (dailySuccess[key] || 0) + 1;
      }
    });

    const sortedDays = Object.keys(dailyTotal).sort();
    const successRates = sortedDays.map(d => {
      const success = dailySuccess[d] || 0;
      return ((success / dailyTotal[d]) * 100).toFixed(1);
    });

    new Chart(document.getElementById('successChart'), {
      type: 'line',
      data: {
        labels: sortedDays.map(d => {
          const date = new Date(d);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [{
          label: 'Success %',
          data: successRates,
          borderColor: this.colors.primary[4],
          backgroundColor: this.colors.primary[4] + '33',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, max: 100 },
          x: { ticks: { maxTicksLimit: 10 } }
        }
      }
    });
  }

  renderHourChart() {
    const hourly = {};
    for (let i = 0; i < 24; i++) hourly[i] = 0;

    this.reviews.forEach(r => {
      const hour = new Date(r.date).getHours();
      hourly[hour]++;
    });

    new Chart(document.getElementById('hourChart'), {
      type: 'bar',
      data: {
        labels: Object.keys(hourly).map(h => `${h}:00`),
        datasets: [{
          label: 'Reviews',
          data: Object.values(hourly),
          backgroundColor: this.colors.primary[3]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AnkiVisualizer(window.ANKI_DATA_URL);
});
