/* Chart.js global defaults for Dune dark theme */
Chart.defaults.color = '#6b5d45';
Chart.defaults.borderColor = '#2a2520';
Chart.defaults.elements.arc.borderColor = '#6b5d45';
Chart.defaults.elements.arc.borderWidth = 2;
Chart.defaults.scale.grid.color = '#2a2520';
Chart.defaults.scale.grid.drawBorder = false;
Chart.defaults.scale.ticks.color = '#6b5d45';
Chart.defaults.plugins.legend.labels.color = '#6b5d45';

class ProgrammingVisualizer {
  constructor(dataUrl) {
    this.dataUrl = dataUrl || '/programming-2026-data.json';
    this.entries = [];
    this.colors = {
      primary: ['#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f', '#edc949', '#af7aa1', '#ff9da7'],
      ai: {
        manual: '#59a14f',
        ai: '#4e79a7'
      }
    };
    this.init();
  }

  async init() {
    try {
      const response = await fetch(this.dataUrl);
      if (!response.ok) throw new Error('Failed to load programming data');
      this.entries = await response.json();

      this.renderStats();
      this.renderDailyChart();
      this.renderManualLanguageChart();
      this.renderAiLanguageChart();
      this.renderAiChart();
      this.renderWeeklyChart();
      this.renderHourChart();
    } catch (error) {
      console.error('Error loading programming data:', error);
      document.querySelector('.charts-grid').innerHTML =
        '<p class="loading">Error loading programming data. Please try refreshing.</p>';
    }
  }

  filterByType(type) {
    return this.entries.filter(e => e.type === type);
  }

  aggregateByName(entries) {
    const result = {};
    entries.forEach(e => {
      const name = e.name || 'Unknown';
      result[name] = (result[name] || 0) + parseFloat(e.totalSeconds);
    });
    return result;
  }

  renderStats() {
    const excluded = ['yaml', 'Unknown', 'css', 'markdown', 'json', 'text', 'git', 'gitignore', 'org', ''];

    const dailyTotals = this.filterByType('daily_total');
    const totalSeconds = dailyTotals.reduce((sum, e) => sum + parseFloat(e.totalSeconds), 0);
    const totalHours = (totalSeconds / 3600).toFixed(1);
    document.getElementById('statTotalHours').textContent = totalHours;

    const uniqueDays = new Set(dailyTotals.map(e => e.date)).size;
    const avgDaily = uniqueDays > 0 ? (totalSeconds / 3600 / uniqueDays).toFixed(1) : '0';
    document.getElementById('statAvgDaily').textContent = avgDaily;

    // Top manual language (filtered)
    const manualLangs = this.aggregateByName(this.filterByType('manual_language'));
    const topManualLang = Object.entries(manualLangs)
      .filter(([name]) => !excluded.includes(name.toLowerCase()))
      .sort((a, b) => b[1] - a[1])[0];
    document.getElementById('statTopLanguage').textContent = topManualLang ? topManualLang[0] : '-';

    // Top AI language (filtered)
    const aiLangs = this.aggregateByName(this.filterByType('ai_language'));
    const topAiLang = Object.entries(aiLangs)
      .filter(([name]) => !excluded.includes(name.toLowerCase()))
      .sort((a, b) => b[1] - a[1])[0];
    document.getElementById('statTopAiLanguage').textContent = topAiLang ? topAiLang[0] : '-';

    const categories = this.aggregateByName(this.filterByType('category'));
    const aiSeconds = categories['ai coding'] || 0;
    const aiPercent = totalSeconds > 0 ? ((aiSeconds / totalSeconds) * 100).toFixed(0) : 0;
    document.getElementById('statAiPercent').textContent = aiPercent + '%';
  }

  renderDailyChart() {
    const excluded = ['unknown', 'text', 'git', 'gitignore', 'ini', 'csv', 'markdown', 'netrw', 'toml', 'conf', 'hyprlang', 'scss', 'taskrc', 'org'];
    const langEntries = this.filterByType('language');

    // Group by date and language
    const byDateLang = {};
    const byDateTotal = {};
    const langTotals = {};
    langEntries.forEach(e => {
      if (!e.date) return;
      const lang = e.name || 'Unknown';
      const seconds = parseFloat(e.totalSeconds);

      if (!byDateLang[e.date]) byDateLang[e.date] = {};
      byDateLang[e.date][lang] = (byDateLang[e.date][lang] || 0) + seconds;
      byDateTotal[e.date] = (byDateTotal[e.date] || 0) + seconds;

      if (!excluded.includes(lang.toLowerCase())) {
        langTotals[lang] = (langTotals[lang] || 0) + seconds;
      }
    });

    const sortedDays = Object.keys(byDateLang).sort();

    // Get top 5 languages by total time
    const topLangs = Object.entries(langTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang]) => lang);

    // Build datasets for top languages
    const datasets = topLangs.map((lang, i) => ({
      label: lang,
      data: sortedDays.map(d => ((byDateLang[d][lang] || 0) / 3600).toFixed(2)),
      backgroundColor: this.colors.primary[i % this.colors.primary.length]
    }));

    // Add "Other" category for remaining time
    datasets.push({
      label: 'Other',
      data: sortedDays.map(d => {
        const topTotal = topLangs.reduce((sum, lang) => sum + (byDateLang[d][lang] || 0), 0);
        const other = (byDateTotal[d] || 0) - topTotal;
        return (other / 3600).toFixed(2);
      }),
      backgroundColor: '#999999'
    });

    new Chart(document.getElementById('dailyChart'), {
      type: 'bar',
      data: {
        labels: sortedDays.map(d => {
          const date = new Date(d + 'T00:00:00');
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, stacked: true },
          x: { stacked: true, ticks: { maxTicksLimit: 15 } }
        }
      }
    });
  }

  renderManualLanguageChart() {
    const languages = this.aggregateByName(this.filterByType('manual_language'));
    const excluded = ['yaml', 'unknown', 'css', 'markdown', 'json', 'text', 'git', 'gitignore', 'ini', 'csv', 'netrw', 'toml', 'conf', 'hyprlang', 'taskrc', 'org'];
    const filtered = Object.fromEntries(
      Object.entries(languages).filter(([name]) => !excluded.includes(name.toLowerCase()))
    );
    const sorted = Object.entries(filtered).sort((a, b) => b[1] - a[1]).slice(0, 8);

    const allTotal = sorted.reduce((a, [, secs]) => a + secs, 0);
    const aboveThreshold = sorted.filter(([, secs]) => (secs / allTotal) * 100 >= 5);

    const langData = aboveThreshold.map(([, secs]) => secs);
    const langTotal = langData.reduce((a, b) => a + b, 0);

    new Chart(document.getElementById('manualLanguageChart'), {
      type: 'doughnut',
      data: {
        labels: aboveThreshold.map(([lang]) => lang),
        datasets: [{
          data: langData,
          backgroundColor: this.colors.primary
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10 } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ${((ctx.raw / langTotal) * 100).toFixed(0)}%`
            }
          }
        }
      }
    });
  }

  renderAiLanguageChart() {
    const languages = this.aggregateByName(this.filterByType('ai_language'));
    const excluded = ['yaml', 'unknown', 'markdown', 'text', 'git', 'gitignore', 'ini', 'scss', 'ruby', 'org', 'csv', 'css', 'toml', 'typst', 'json'];
    const filtered = Object.fromEntries(
      Object.entries(languages).filter(([name]) => !excluded.includes(name.toLowerCase()))
    );
    const sorted = Object.entries(filtered).sort((a, b) => b[1] - a[1]).slice(0, 8);

    const allTotal = sorted.reduce((a, [, secs]) => a + secs, 0);
    const aboveThreshold = sorted.filter(([, secs]) => (secs / allTotal) * 100 >= 5);

    const langData = aboveThreshold.map(([, secs]) => secs);
    const langTotal = langData.reduce((a, b) => a + b, 0);

    new Chart(document.getElementById('aiLanguageChart'), {
      type: 'doughnut',
      data: {
        labels: aboveThreshold.map(([lang]) => lang),
        datasets: [{
          data: langData,
          backgroundColor: this.colors.primary.slice(2)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10 } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ${((ctx.raw / langTotal) * 100).toFixed(0)}%`
            }
          }
        }
      }
    });
  }

  renderAiChart() {
    const categories = this.aggregateByName(this.filterByType('category'));
    const aiTime = categories['ai coding'] || 0;
    const codingTime = categories['coding'] || 0;
    const docsTime = categories['writing docs'] || 0;
    const manualTime = codingTime + docsTime;

    const aiData = [manualTime, aiTime];
    const aiTotal = manualTime + aiTime;

    new Chart(document.getElementById('aiChart'), {
      type: 'doughnut',
      data: {
        labels: ['Manual', 'AI-Assisted'],
        datasets: [{
          data: aiData,
          backgroundColor: [this.colors.ai.manual, this.colors.ai.ai]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10 } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ${((ctx.raw / aiTotal) * 100).toFixed(0)}%`
            }
          }
        }
      }
    });
  }

  renderWeeklyChart() {
    const categories = this.filterByType('category');
    const weeklyManual = {};
    const weeklyAi = {};

    categories.forEach(e => {
      if (!e.date) return;
      const week = this.getISOWeek(e.date);
      const name = (e.name || '').toLowerCase();
      const seconds = parseFloat(e.totalSeconds);

      if (name === 'coding' || name === 'writing docs') {
        weeklyManual[week] = (weeklyManual[week] || 0) + seconds;
      } else if (name === 'ai coding') {
        weeklyAi[week] = (weeklyAi[week] || 0) + seconds;
      }
    });

    const allWeeks = new Set([...Object.keys(weeklyManual), ...Object.keys(weeklyAi)]);
    const sortedWeeks = Array.from(allWeeks).sort();

    new Chart(document.getElementById('weeklyChart'), {
      type: 'line',
      data: {
        labels: sortedWeeks.map(w => `Week ${w.split('-W')[1]}`),
        datasets: [
          {
            label: 'Manual',
            data: sortedWeeks.map(w => ((weeklyManual[w] || 0) / 3600).toFixed(1)),
            borderColor: this.colors.ai.manual,
            backgroundColor: this.colors.ai.manual + '33',
            fill: true,
            tension: 0.3
          },
          {
            label: 'AI-Assisted',
            data: sortedWeeks.map(w => ((weeklyAi[w] || 0) / 3600).toFixed(1)),
            borderColor: this.colors.ai.ai,
            backgroundColor: this.colors.ai.ai + '33',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: true, position: 'bottom' } },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  getISOWeek(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }

  renderHourChart() {
    const hourlyEntries = this.filterByType('hourly');
    const hourly = {};
    for (let i = 0; i < 24; i++) hourly[i] = 0;

    hourlyEntries.forEach(e => {
      const hour = parseInt(e.name);
      if (!isNaN(hour)) {
        hourly[hour] = parseFloat(e.totalSeconds);
      }
    });

    new Chart(document.getElementById('hourChart'), {
      type: 'bar',
      data: {
        labels: Object.keys(hourly).map(h => `${h}:00`),
        datasets: [{
          label: 'Hours',
          data: Object.values(hourly).map(s => (s / 3600).toFixed(2)),
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
  new ProgrammingVisualizer(window.PROGRAMMING_DATA_URL);
});
