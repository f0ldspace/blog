---
layout: default
title: /reading/2025
permalink: /reading/2025/
---

<link rel="stylesheet" href="/assets/css/reading.css">

<div class="reading-container">
  <h1>Reading Log 2025</h1>
  <p class="reading-intro">Visualization of my reading throughout 2025. <a href="/reading/">&larr; All years</a></p>

  <div class="stats-grid" id="statsGrid">
    <div class="stat-card">
      <span class="stat-value" id="statTotal">-</span>
      <span class="stat-label">Books Read</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" id="statAvgRating">-</span>
      <span class="stat-label">Avg Rating</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" id="statTopCategory">-</span>
      <span class="stat-label">Top Category</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" id="statTopFormat">-</span>
      <span class="stat-label">Top Format</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" id="statProjected">-</span>
      <span class="stat-label">Projected Total</span>
    </div>
  </div>
  <div class="highlights-section" id="highlightsSection">
    <h2>Favorites</h2>
    <ul id="highlightsList"></ul>
  </div>
  <div class="charts-grid">
    <div class="chart-container">
      <h2>Category Breakdown</h2>
      <canvas id="categoryChart"></canvas>
    </div>

    <div class="chart-container">
      <h2>Reading Timeline</h2>
      <canvas id="timelineChart"></canvas>
    </div>

    <div class="chart-container">
      <h2>Format Distribution</h2>
      <canvas id="formatChart"></canvas>
    </div>

    <div class="chart-container">
      <h2>Rating Distribution</h2>
      <canvas id="ratingChart"></canvas>
    </div>

    <div class="chart-container">
      <h2>Fiction vs Non-Fiction</h2>
      <canvas id="typeChart"></canvas>
    </div>

    <div class="chart-container">
      <h2>Avg Rating by Category</h2>
      <canvas id="avgRatingChart"></canvas>
    </div>
  </div>

  <div class="subcategory-charts">
    <h2>Subcategory Breakdowns</h2>
    <div class="charts-grid" id="subcategoryChartsGrid"></div>
  </div>



  <div class="reading-table">
    <h2>All Books</h2>
    <table id="booksTable">
      <thead>
        <tr>
          <th>Date</th>
          <th>Title</th>
          <th>Category</th>
          <th>Format</th>
          <th>Rating</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script>window.READING_DATA_URL = '/reading-2025-data.json';</script>
<script src="/assets/js/reading-charts.js"></script>
