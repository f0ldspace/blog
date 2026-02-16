---
layout: default
title: /programming/2026
permalink: /programming/2026/
---

<link rel="stylesheet" href="/assets/css/reading.css">

<div class="reading-container">
  <h1>Programming Stats 2026</h1>
  <p class="reading-intro">Coding statistics for 2026, tracked via Wakapi.</p>

<div class="stats-grid" id="statsGrid">
    <div class="stat-card">
      <span class="stat-value" id="statTotalHours">-</span>
      <span class="stat-label">Total Hours</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" id="statAvgDaily">-</span>
      <span class="stat-label">Avg Hours/Day</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" id="statTopLanguage">-</span>
      <span class="stat-label">Top Language</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" id="statTopAiLanguage">-</span>
      <span class="stat-label">Top AI</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" id="statAiPercent">-</span>
      <span class="stat-label">AI Coding %</span>
    </div>
  </div>

<div class="charts-grid">
<!---
    <div class="chart-container">
      <h2>Hours per Day</h2>
      <canvas id="dailyChart"></canvas>
    </div>
--->
    <div class="chart-container">
      <h2>Coding by Hour</h2>
      <canvas id="hourChart"></canvas>
    </div>
    <div class="chart-container">
      <h2>Weekly Trend</h2>
      <canvas id="weeklyChart"></canvas>
    </div>
    <div class="chart-container">
      <h2>Languages (Manual)</h2>
      <canvas id="manualLanguageChart"></canvas>
    </div>
    <div class="chart-container">
      <h2>Languages (AI)</h2>
      <canvas id="aiLanguageChart"></canvas>
    </div>
    <div class="chart-container">
      <h2>AI vs Manual Coding</h2>
      <canvas id="aiChart"></canvas>
    </div>
</div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script>window.PROGRAMMING_DATA_URL = '/programming-2026-data.json';</script>
<script src="/assets/js/programming-charts-2026.js"></script>
