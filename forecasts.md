---
layout: default
title: /forecasts
permalink: /forecasts/
---

<link rel="stylesheet" href="/assets/css/reading.css">

<div class="reading-container">
  <h1>Forecast Stats</h1>
  <p class="reading-intro">Calibration and prediction tracking from <a href="https://fatebook.io" target="_blank">Fatebook</a>.</p>

  <div class="stats-grid" id="statsGrid">
    <div class="stat-card">
      <span class="stat-value" id="statTotal">-</span>
      <span class="stat-label">Predictions</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" id="statBrier">-</span>
      <span class="stat-label">Brier Score</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" id="statAccuracy">-</span>
      <span class="stat-label">Accuracy</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" id="statResolved">-</span>
      <span class="stat-label">Resolved</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" id="statConfidence">-</span>
      <span class="stat-label">Avg Confidence</span>
    </div>
  </div>

  <div class="charts-grid">
    <div class="chart-container">
      <h2>Calibration</h2>
      <canvas id="calibrationChart"></canvas>
    </div>

    <div class="chart-container">
      <h2>Outcome Breakdown</h2>
      <canvas id="outcomeChart"></canvas>
    </div>

    <div class="chart-container">
      <h2>Timeline</h2>
      <canvas id="timelineChart"></canvas>
    </div>

    <div class="chart-container">
      <h2>Confidence Distribution</h2>
      <canvas id="confidenceChart"></canvas>
    </div>

    <div class="chart-container">
      <h2>Categories</h2>
      <canvas id="categoryChart"></canvas>
    </div>

    <div class="chart-container" id="categoryAccuracySection">
      <h2>Brier by Category</h2>
      <canvas id="categoryBrierChart"></canvas>
    </div>
  </div>

</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script src="/assets/js/forecast-charts.js"></script>
