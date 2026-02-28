/* Chart.js global defaults for Dune dark theme */
Chart.defaults.color = '#6b5d45';
Chart.defaults.borderColor = '#2a2520';
Chart.defaults.elements.arc.borderColor = '#6b5d45';
Chart.defaults.elements.arc.borderWidth = 2;
Chart.defaults.scale.grid.color = '#2a2520';
Chart.defaults.scale.grid.drawBorder = false;
Chart.defaults.scale.ticks.color = '#6b5d45';
Chart.defaults.plugins.legend.labels.color = '#6b5d45';

class GoalsVisualizer {
  constructor(dataUrl) {
    this.dataUrl = dataUrl || '/2026/goals-2026-data.json';
    this.goals = [];
    this.colors = {
      primary: ['#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f', '#edc949', '#af7aa1', '#ff9da7'],
      status: {
        done: '#59a14f',
        in_progress: '#f28e2c',
        not_started: '#6b5d45'
      }
    };
    this.init();
  }

  async init() {
    try {
      const response = await fetch(this.dataUrl);
      if (!response.ok) throw new Error('Failed to load goals data');
      this.goals = await response.json();

      this.renderStats();
      this.renderCategoryChart();
      this.renderStatusChart();
      this.renderTimelineChart();
      this.renderCategoryProgressChart();
      this.renderLists();
    } catch (error) {
      console.error('Error loading goals data:', error);
      document.querySelector('.charts-grid').innerHTML =
        '<p class="loading">Error loading goals data. Please try refreshing.</p>';
    }
  }

  renderStats() {
    const total = this.goals.length;
    const completed = this.goals.filter(g => g.status === 'done').length;
    const inProgress = this.goals.filter(g => g.status === 'in_progress').length;
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(0) : 0;

    const categories = {};
    this.goals.forEach(g => {
      categories[g.category] = (categories[g.category] || 0) + 1;
    });
    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statCompleted').textContent = completed;
    document.getElementById('statInProgress').textContent = inProgress;
    document.getElementById('statCompletionRate').textContent = completionRate + '%';
    document.getElementById('statTopCategory').textContent = topCategory ? topCategory[0] : '-';
  }

  renderCategoryChart() {
    const categories = {};
    this.goals.forEach(g => {
      categories[g.category] = (categories[g.category] || 0) + 1;
    });

    new Chart(document.getElementById('categoryChart'), {
      type: 'doughnut',
      data: {
        labels: Object.keys(categories),
        datasets: [{
          data: Object.values(categories),
          backgroundColor: this.colors.primary
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

  renderStatusChart() {
    const statuses = { done: 0, in_progress: 0, not_started: 0 };
    this.goals.forEach(g => {
      if (statuses.hasOwnProperty(g.status)) {
        statuses[g.status]++;
      }
    });

    const labels = {
      done: 'Done',
      in_progress: 'In Progress',
      not_started: 'Not Started'
    };

    new Chart(document.getElementById('statusChart'), {
      type: 'doughnut',
      data: {
        labels: Object.keys(statuses).map(k => labels[k]),
        datasets: [{
          data: Object.values(statuses),
          backgroundColor: [
            this.colors.status.done,
            this.colors.status.in_progress,
            this.colors.status.not_started
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

  renderTimelineChart() {
    const completedGoals = this.goals
      .filter(g => g.status === 'done' && g.dateCompleted)
      .sort((a, b) => new Date(a.dateCompleted) - new Date(b.dateCompleted));

    if (completedGoals.length === 0) {
      const canvas = document.getElementById('timelineChart');
      const container = canvas.parentElement;
      container.innerHTML = '<h2>Completion Timeline</h2><p class="loading">No completed goals yet</p>';
      return;
    }

    // Build cumulative completion data by month
    const monthlyData = {};
    completedGoals.forEach(g => {
      const date = new Date(g.dateCompleted);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });

    // Fill in all months from Jan to latest completion
    const lastMonth = Object.keys(monthlyData).sort().pop();
    const [year, endMonth] = lastMonth.split('-').map(Number);
    const months = [];
    for (let m = 1; m <= endMonth; m++) {
      const key = `${year}-${String(m).padStart(2, '0')}`;
      months.push(key);
      if (!monthlyData[key]) monthlyData[key] = 0;
    }

    // Cumulative
    let cumulative = 0;
    const cumulativeData = months.map(m => {
      cumulative += monthlyData[m];
      return cumulative;
    });

    new Chart(document.getElementById('timelineChart'), {
      type: 'line',
      data: {
        labels: months.map(m => {
          const [y, mo] = m.split('-');
          return new Date(y, mo - 1).toLocaleDateString('en-US', { month: 'short' });
        }),
        datasets: [{
          label: 'Goals Completed',
          data: cumulativeData,
          borderColor: '#c8a44e',
          backgroundColor: 'rgba(200, 164, 78, 0.1)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#c8a44e',
          pointBorderColor: '#c8a44e',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
            max: this.goals.length
          }
        }
      }
    });
  }

  renderCategoryProgressChart() {
    const categoryStats = {};
    this.goals.forEach(g => {
      if (!categoryStats[g.category]) {
        categoryStats[g.category] = { total: 0, completed: 0 };
      }
      categoryStats[g.category].total++;
      if (g.status === 'done') {
        categoryStats[g.category].completed++;
      }
    });

    const categories = Object.keys(categoryStats).sort();
    const completionPcts = categories.map(c =>
      ((categoryStats[c].completed / categoryStats[c].total) * 100).toFixed(0)
    );

    new Chart(document.getElementById('categoryProgressChart'), {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [{
          label: 'Completion %',
          data: completionPcts,
          backgroundColor: categories.map((_, i) => this.colors.primary[i % this.colors.primary.length])
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) { return value + '%'; }
            }
          }
        }
      }
    });
  }

  renderLists() {
    const sections = {
      in_progress: document.querySelector('#goalsInProgress .goals-list'),
      not_started: document.querySelector('#goalsNotStarted .goals-list'),
      done: document.querySelector('#goalsDone .goals-list')
    };

    if (!sections.in_progress) return;

    const grouped = { in_progress: [], not_started: [], done: [] };
    this.goals.forEach(g => {
      if (grouped[g.status]) grouped[g.status].push(g);
    });

    Object.entries(grouped).forEach(([status, goals]) => {
      const container = sections[status];
      if (!container) return;

      // Hide section if empty
      if (goals.length === 0) {
        container.parentElement.style.display = 'none';
        return;
      }

      goals.forEach(goal => {
        const item = document.createElement('div');
        item.className = 'goal-list-item' + (status === 'done' ? ' goal-done' : '');

        let progressHtml = '';
        if (goal.unit !== 'binary' && status !== 'done') {
          const pct = goal.target > 0 ? ((goal.current / goal.target) * 100).toFixed(0) : 0;
          progressHtml = `<span class="goal-progress">${goal.current}/${goal.target} ${goal.unit} (${pct}%)</span>`;
        }

        item.innerHTML = `
          <span class="goal-dot goal-dot-${status}">&#9670;</span>
          <span class="goal-name">${goal.goal}</span>
          <span class="goal-category">${goal.category}</span>
          ${progressHtml}
        `;

        container.appendChild(item);
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new GoalsVisualizer(window.GOALS_DATA_URL);
});
