// Reading Visualizations using Chart.js
class ReadingVisualizer {
  constructor(dataUrl) {
    this.dataUrl = dataUrl || '/reading-2025-data.json';
    this.books = [];
    this.colors = {
      primary: ['#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f', '#edc949', '#af7aa1', '#ff9da7'],
      format: ['#59a14f', '#edc949', '#af7aa1'],
      rating: '#76b7b2'
    };
    this.init();
  }

  async init() {
    try {
      const response = await fetch(this.dataUrl);
      if (!response.ok) throw new Error('Failed to load reading data');
      this.books = await response.json();

      this.renderCategoryChart();
      this.renderTimelineChart();
      this.renderFormatChart();
      this.renderRatingChart();
      this.renderTable();
    } catch (error) {
      console.error('Error loading reading data:', error);
      document.querySelector('.charts-grid').innerHTML =
        '<p class="loading">Error loading reading data. Please try refreshing.</p>';
    }
  }

  // 1. Category Breakdown (Pie Chart)
  renderCategoryChart() {
    const categories = {};
    this.books.forEach(book => {
      categories[book.category] = (categories[book.category] || 0) + 1;
    });

    new Chart(document.getElementById('categoryChart'), {
      type: 'pie',
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

  // 2. Reading Timeline (Bar Chart by Month)
  renderTimelineChart() {
    const monthlyData = {};
    this.books.forEach(book => {
      const date = new Date(book.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });

    const sortedMonths = Object.keys(monthlyData).sort();

    new Chart(document.getElementById('timelineChart'), {
      type: 'bar',
      data: {
        labels: sortedMonths.map(m => {
          const [year, month] = m.split('-');
          return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short' });
        }),
        datasets: [{
          label: 'Books',
          data: sortedMonths.map(m => monthlyData[m]),
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

  // 3. Format Distribution (Doughnut Chart)
  renderFormatChart() {
    const formats = {};
    this.books.forEach(book => {
      formats[book.format] = (formats[book.format] || 0) + 1;
    });

    new Chart(document.getElementById('formatChart'), {
      type: 'doughnut',
      data: {
        labels: Object.keys(formats),
        datasets: [{
          data: Object.values(formats),
          backgroundColor: this.colors.format
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

  // 4. Rating Distribution (Bar Chart)
  renderRatingChart() {
    const ratings = {};
    for (let i = 1; i <= 10; i++) ratings[i] = 0;
    this.books.forEach(book => {
      const r = parseInt(book.rating, 10);
      if (r >= 1 && r <= 10) ratings[r]++;
    });

    new Chart(document.getElementById('ratingChart'), {
      type: 'bar',
      data: {
        labels: Object.keys(ratings),
        datasets: [{
          label: 'Books',
          data: Object.values(ratings),
          backgroundColor: this.colors.rating
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
            title: { display: true, text: 'Rating' }
          }
        }
      }
    });
  }

  // Render data table
  renderTable() {
    const tbody = document.querySelector('#booksTable tbody');
    if (!tbody) return;

    const sortedBooks = [...this.books].sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );

    sortedBooks.forEach(book => {
      const row = document.createElement('tr');
      const date = new Date(book.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      row.innerHTML = `
        <td>${date}</td>
        <td>${book.title}</td>
        <td>${book.category}</td>
        <td>${book.format}</td>
        <td class="rating">${book.rating}/10</td>
      `;
      tbody.appendChild(row);
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ReadingVisualizer(window.READING_DATA_URL);
});
