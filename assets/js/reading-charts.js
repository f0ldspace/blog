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

      this.renderStats();
      this.renderCategoryChart();
      this.renderTimelineChart();
      this.renderFormatChart();
      this.renderRatingChart();
      this.renderTypeChart();
      this.renderAvgRatingChart();
      this.renderSubcategoryCharts();
      this.renderHighlights();
      this.renderTable();
    } catch (error) {
      console.error('Error loading reading data:', error);
      document.querySelector('.charts-grid').innerHTML =
        '<p class="loading">Error loading reading data. Please try refreshing.</p>';
    }
  }

  // Summary Stats
  renderStats() {
    const total = this.books.length;
    document.getElementById('statTotal').textContent = total;

    // Average rating
    const avgRating = this.books.reduce((sum, b) => sum + parseInt(b.rating, 10), 0) / total;
    document.getElementById('statAvgRating').textContent = avgRating.toFixed(1);

    // Top category
    const categories = {};
    this.books.forEach(b => categories[b.category] = (categories[b.category] || 0) + 1);
    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
    document.getElementById('statTopCategory').textContent = topCategory ? topCategory[0] : '-';

    // Top format
    const formats = {};
    this.books.forEach(b => formats[b.format] = (formats[b.format] || 0) + 1);
    const topFormat = Object.entries(formats).sort((a, b) => b[1] - a[1])[0];
    document.getElementById('statTopFormat').textContent = topFormat ? topFormat[0] : '-';

    // Projected year-end total
    const sortedDates = this.books.map(b => new Date(b.date)).sort((a, b) => a - b);
    if (sortedDates.length > 0) {
      const lastDate = sortedDates[sortedDates.length - 1];
      const startOfYear = new Date(lastDate.getFullYear(), 0, 1);
      const endOfYear = new Date(lastDate.getFullYear(), 11, 31);
      const daysElapsed = (lastDate - startOfYear) / (1000 * 60 * 60 * 24);
      const daysInYear = (endOfYear - startOfYear) / (1000 * 60 * 60 * 24);
      const projected = Math.round(total * (daysInYear / daysElapsed));
      document.getElementById('statProjected').textContent = projected;
    } else {
      document.getElementById('statProjected').textContent = '-';
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

  // 5. Fiction vs Non-Fiction (Doughnut Chart)
  renderTypeChart() {
    const types = {};
    this.books.forEach(book => {
      types[book.type] = (types[book.type] || 0) + 1;
    });

    new Chart(document.getElementById('typeChart'), {
      type: 'doughnut',
      data: {
        labels: Object.keys(types),
        datasets: [{
          data: Object.values(types),
          backgroundColor: ['#4e79a7', '#f28e2c']
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

  // 6. Average Rating by Category (Bar Chart)
  renderAvgRatingChart() {
    const categoryRatings = {};
    const categoryCounts = {};

    this.books.forEach(book => {
      const cat = book.category;
      categoryRatings[cat] = (categoryRatings[cat] || 0) + parseInt(book.rating, 10);
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const categories = Object.keys(categoryRatings).sort((a, b) => {
      const avgA = categoryRatings[a] / categoryCounts[a];
      const avgB = categoryRatings[b] / categoryCounts[b];
      return avgB - avgA;
    });

    const avgRatings = categories.map(cat =>
      (categoryRatings[cat] / categoryCounts[cat]).toFixed(1)
    );

    new Chart(document.getElementById('avgRatingChart'), {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [{
          label: 'Avg Rating',
          data: avgRatings,
          backgroundColor: this.colors.primary[1]
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
            max: 10,
            ticks: { stepSize: 2 }
          }
        }
      }
    });
  }

  // 7. Subcategory Breakdowns (Dynamic Pie Charts)
  renderSubcategoryCharts() {
    const grid = document.getElementById('subcategoryChartsGrid');
    if (!grid) return;

    // Group books by category and collect subcategories
    const categorySubcats = {};
    this.books.forEach(book => {
      if (book.subcategory) {
        if (!categorySubcats[book.category]) {
          categorySubcats[book.category] = {};
        }
        categorySubcats[book.category][book.subcategory] =
          (categorySubcats[book.category][book.subcategory] || 0) + 1;
      }
    });

    // Create a chart for each category that has subcategories
    Object.keys(categorySubcats).sort().forEach((category, index) => {
      const subcats = categorySubcats[category];

      // Create container
      const container = document.createElement('div');
      container.className = 'chart-container';
      container.innerHTML = `<h2>${category}</h2><canvas id="subcat-${index}"></canvas>`;
      grid.appendChild(container);

      // Render pie chart with rotated colors for variety
      const colorOffset = index * 2;
      const chartColors = [...this.colors.primary.slice(colorOffset), ...this.colors.primary.slice(0, colorOffset)];
      new Chart(document.getElementById(`subcat-${index}`), {
        type: 'pie',
        data: {
          labels: Object.keys(subcats),
          datasets: [{
            data: Object.values(subcats),
            backgroundColor: chartColors
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
    });

    // Hide section if no subcategories exist
    if (Object.keys(categorySubcats).length === 0) {
      const section = document.querySelector('.subcategory-charts');
      if (section) section.style.display = 'none';
    }
  }

  // 8. Highlights (Books rated 9-10)
  renderHighlights() {
    const section = document.getElementById('highlightsSection');
    const list = document.getElementById('highlightsList');
    if (!section || !list) return;

    const favorites = this.books
      .filter(book => parseInt(book.rating, 10) >= 8)
      .sort((a, b) => parseInt(b.rating, 10) - parseInt(a.rating, 10));

    if (favorites.length === 0) {
      section.style.display = 'none';
      return;
    }

    favorites.forEach(book => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${book.title}</strong> <span class="highlight-meta">${book.category} &middot; ${book.rating}/10</span>`;
      list.appendChild(li);
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
