class ForecastVisualizer {
  constructor() {
    this.dataUrl = '/fatebook-stats.json';
    this.data = null;
    this.colors = {
      primary: ['#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f', '#edc949', '#af7aa1', '#ff9da7'],
      calibration: '#4e79a7',
      perfect: '#76b7b2',
      correct: '#59a14f',
      incorrect: '#e15759',
      pending: '#edc949'
    };
    this.init();
  }

  async init() {
    try {
      const response = await fetch(this.dataUrl);
      if (!response.ok) throw new Error('Failed to load forecast data');
      this.data = await response.json();

      this.renderStats();
      this.renderCalibrationChart();
      this.renderOutcomeChart();
      this.renderTimelineChart();
      this.renderConfidenceChart();
      this.renderCategoryChart();
      this.renderCategoryBrierChart();
    } catch (error) {
      console.error('Error loading forecast data:', error);
      document.querySelector('.charts-grid').innerHTML =
        '<p class="loading">Error loading forecast data. Run the generation script first.</p>';
    }
  }

  renderStats() {
    const s = this.data.summary;

    document.getElementById('statTotal').textContent = s.total;
    document.getElementById('statBrier').textContent = s.brierScore !== null ? s.brierScore.toFixed(2) : '-';

    const accuracy = s.resolved > 0 ? Math.round((s.correct / s.resolved) * 100) : 0;
    document.getElementById('statAccuracy').textContent = `${accuracy}%`;

    document.getElementById('statResolved').textContent = `${s.resolved}/${s.total}`;
    document.getElementById('statConfidence').textContent = `${Math.round(s.avgConfidence)}%`;
  }

  renderCalibrationChart() {
    const cal = this.data.calibration;
    if (!cal || cal.length === 0) return;

    // Filter to buckets with data (count > 0)
    const bucketsWithData = cal.filter(c => c.count > 0);
    const labels = bucketsWithData.map(c => c.bucket + '%');
    const actualRates = bucketsWithData.map(c => c.actualRate * 100);

    // Perfect calibration line (midpoint of each bucket with data)
    const perfectLine = bucketsWithData.map(c => {
      const [low] = c.bucket.split('-').map(Number);
      return low + 5; // midpoint of bucket
    });

    new Chart(document.getElementById('calibrationChart'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Actual',
            data: actualRates,
            borderColor: this.colors.calibration,
            backgroundColor: this.colors.calibration,
            tension: 0.1,
            pointRadius: 5,
            pointHoverRadius: 7
          },
          {
            label: 'Perfect',
            data: perfectLine,
            borderColor: this.colors.perfect,
            borderDash: [5, 5],
            pointRadius: 0,
            tension: 0
          }
        ]
      },
      options: {
        responsive: true,
        aspectRatio: 1.5,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 10 }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const bucket = bucketsWithData[ctx.dataIndex];
                if (ctx.dataset.label === 'Actual' && bucket) {
                  return `Actual: ${ctx.parsed.y.toFixed(1)}% (n=${bucket.count})`;
                }
                return `${ctx.dataset.label}: ${ctx.parsed.y}%`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: 'Outcome Rate (%)' }
          },
          x: {
            title: { display: true, text: 'Predicted Probability' }
          }
        }
      }
    });
  }

  renderOutcomeChart() {
    const s = this.data.summary;

    new Chart(document.getElementById('outcomeChart'), {
      type: 'doughnut',
      data: {
        labels: ['Correct', 'Incorrect', 'Pending'],
        datasets: [{
          data: [s.correct, s.incorrect, s.pending],
          backgroundColor: [this.colors.correct, this.colors.incorrect, this.colors.pending]
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
    const monthly = this.data.monthlyActivity;
    if (!monthly || Object.keys(monthly).length === 0) return;

    const months = Object.keys(monthly).sort();
    const madeData = months.map(m => monthly[m].made);

    new Chart(document.getElementById('timelineChart'), {
      type: 'bar',
      data: {
        labels: months.map(m => {
          const [year, month] = m.split('-');
          return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        }),
        datasets: [{
          label: 'Predictions',
          data: madeData,
          backgroundColor: this.colors.primary[0]
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
            ticks: { stepSize: 1 }
          }
        }
      }
    });
  }

  renderConfidenceChart() {
    const dist = this.data.confidenceDistribution;
    if (!dist || dist.length === 0) return;

    new Chart(document.getElementById('confidenceChart'), {
      type: 'bar',
      data: {
        labels: dist.map(d => d.range + '%'),
        datasets: [{
          label: 'Count',
          data: dist.map(d => d.count),
          backgroundColor: this.colors.primary[1]
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
            ticks: { stepSize: 1 }
          },
          x: {
            title: { display: true, text: 'Confidence' }
          }
        }
      }
    });
  }

  renderCategoryChart() {
    const cats = this.data.categories;
    if (!cats || Object.keys(cats).length === 0) {
      document.getElementById('categoryChart').parentElement.style.display = 'none';
      return;
    }

    const sorted = Object.entries(cats).sort((a, b) => b[1].count - a[1].count);
    const labels = sorted.map(([name]) => name);
    const counts = sorted.map(([, data]) => data.count);

    new Chart(document.getElementById('categoryChart'), {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: counts,
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

  renderCategoryBrierChart() {
    const cats = this.data.categories;
    if (!cats || Object.keys(cats).length === 0) {
      document.getElementById('categoryAccuracySection').style.display = 'none';
      return;
    }

    // Filter to categories with Brier scores and sort
    const withBrier = Object.entries(cats)
      .filter(([, data]) => data.brierScore !== null)
      .sort((a, b) => a[1].brierScore - b[1].brierScore);

    if (withBrier.length === 0) {
      document.getElementById('categoryAccuracySection').style.display = 'none';
      return;
    }

    const labels = withBrier.map(([name]) => name);
    const scores = withBrier.map(([, data]) => data.brierScore);

    new Chart(document.getElementById('categoryBrierChart'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Brier Score',
          data: scores,
          backgroundColor: this.colors.primary[3]
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Brier: ${ctx.parsed.x.toFixed(3)} (lower is better)`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 0.5,
            title: { display: true, text: 'Brier Score (lower = better)' }
          }
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ForecastVisualizer();
});
