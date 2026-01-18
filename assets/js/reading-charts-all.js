class ReadingVisualizerAll {
  constructor(dataUrl) {
    this.dataUrl = dataUrl || '/reading-all-data.json';
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
      this.renderYearlyTotalsChart();
      this.renderYearlyRatingChart();
      this.renderTimelineChart();
      this.renderCategoryChart();
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
        '<p class="loading">broken</p>';
    }
  }

  renderStats() {
    const total = this.books.length;
    document.getElementById('statTotal').textContent = total;

    const avgRating = this.books.reduce((sum, b) => sum + parseInt(b.rating, 10), 0) / total;
    document.getElementById('statAvgRating').textContent = avgRating.toFixed(1);

    const categories = {};
    this.books.forEach(b => categories[b.category] = (categories[b.category] || 0) + 1);
    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
    document.getElementById('statTopCategory').textContent = topCategory ? topCategory[0] : '-';

    const formats = {};
    this.books.forEach(b => formats[b.format] = (formats[b.format] || 0) + 1);
    const topFormat = Object.entries(formats).sort((a, b) => b[1] - a[1])[0];
    document.getElementById('statTopFormat').textContent = topFormat ? topFormat[0] : '-';

    const years = new Set(this.books.map(b => b.year));
    const yearsCount = years.size;
    const avgPerYear = yearsCount > 0 ? (total / yearsCount).toFixed(1) : '-';
    document.getElementById('statAvgPerYear').textContent = avgPerYear;
  }

  renderYearlyTotalsChart() {
    const yearlyTotals = {};
    this.books.forEach(book => {
      yearlyTotals[book.year] = (yearlyTotals[book.year] || 0) + 1;
    });

    const years = Object.keys(yearlyTotals).sort();

    new Chart(document.getElementById('yearlyTotalsChart'), {
      type: 'bar',
      data: {
        labels: years,
        datasets: [{
          label: 'Books',
          data: years.map(y => yearlyTotals[y]),
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
            ticks: { stepSize: 5 }
          }
        }
      }
    });
  }

  renderYearlyRatingChart() {
    const yearlyRatings = {};
    const yearlyCounts = {};

    this.books.forEach(book => {
      yearlyRatings[book.year] = (yearlyRatings[book.year] || 0) + parseInt(book.rating, 10);
      yearlyCounts[book.year] = (yearlyCounts[book.year] || 0) + 1;
    });

    const years = Object.keys(yearlyRatings).sort();
    const avgRatings = years.map(y => (yearlyRatings[y] / yearlyCounts[y]).toFixed(1));

    new Chart(document.getElementById('yearlyRatingChart'), {
      type: 'line',
      data: {
        labels: years,
        datasets: [{
          label: 'Avg Rating',
          data: avgRatings,
          borderColor: this.colors.primary[1],
          backgroundColor: this.colors.primary[1] + '40',
          fill: true,
          tension: 0.3
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
            beginAtZero: false,
            min: 0,
            max: 10,
            ticks: { stepSize: 2 }
          }
        }
      }
    });
  }

  renderTimelineChart() {
    const yearMonthData = {};
    const years = new Set();

    this.books.forEach(book => {
      const date = new Date(book.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      years.add(year);

      if (!yearMonthData[year]) yearMonthData[year] = {};
      yearMonthData[year][month] = (yearMonthData[year][month] || 0) + 1;
    });

    const sortedYears = Array.from(years).sort();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const datasets = sortedYears.map((year, index) => {
      const data = [];
      for (let m = 1; m <= 12; m++) {
        data.push(yearMonthData[year]?.[m] || 0);
      }
      return {
        label: year.toString(),
        data: data,
        borderColor: this.colors.primary[index % this.colors.primary.length],
        backgroundColor: this.colors.primary[index % this.colors.primary.length] + '20',
        fill: false,
        tension: 0.3
      };
    });

    new Chart(document.getElementById('timelineChart'), {
      type: 'line',
      data: {
        labels: months,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 10 }
          }
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

  renderSubcategoryCharts() {
    const grid = document.getElementById('subcategoryChartsGrid');
    if (!grid) return;

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

    Object.keys(categorySubcats).sort().forEach((category, index) => {
      const subcats = categorySubcats[category];

      const container = document.createElement('div');
      container.className = 'chart-container';
      container.innerHTML = `<h2>${category}</h2><canvas id="subcat-${index}"></canvas>`;
      grid.appendChild(container);

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

    if (Object.keys(categorySubcats).length === 0) {
      const section = document.querySelector('.subcategory-charts');
      if (section) section.style.display = 'none';
    }
  }

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
      li.innerHTML = `<strong>${book.title}</strong> <span class="highlight-meta">${book.category} &middot; ${book.rating}/10 &middot; ${book.year}</span>`;
      list.appendChild(li);
    });
  }

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
        <td><span class="review-link">${book.title}</span></td>
        <td>${book.category}</td>
        <td>${book.format}</td>
        <td class="rating">${book.rating}/10</td>
      `;

      const link = row.querySelector('.review-link');
      link.addEventListener('click', () => {
        const reviewRow = row.nextElementSibling;
        if (reviewRow && reviewRow.classList.contains('review-row')) {
          link.classList.toggle('expanded');
          reviewRow.classList.toggle('expanded');
        }
      });

      tbody.appendChild(row);

      const reviewRow = document.createElement('tr');
      reviewRow.className = 'review-row';
      reviewRow.innerHTML = `<td colspan="5" class="review-content">${book.review}</td>`;
      tbody.appendChild(reviewRow);
    });

    this.setupExpandAll();
  }

  setupExpandAll() {
    const btn = document.getElementById('expandAllBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const reviewRows = document.querySelectorAll('.review-row');
      const links = document.querySelectorAll('.review-link');
      const allExpanded = btn.textContent === 'collapse all';

      reviewRows.forEach(row => row.classList.toggle('expanded', !allExpanded));
      links.forEach(link => link.classList.toggle('expanded', !allExpanded));
      btn.textContent = allExpanded ? 'expand all' : 'collapse all';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ReadingVisualizerAll(window.READING_DATA_URL);
});
