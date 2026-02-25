---
layout: default
title: /goals/2026
permalink: /goals/2026/
---

<link rel="stylesheet" href="/assets/css/reading.css">

<div class="reading-container">
  <h1><b><u>Goals 2026</u></b></h1>
  <p class="reading-intro"><a href="/about/">&larr; back</a></p>

  <div class="stats-grid" id="statsGrid">
    <div class="stat-card">
      <span class="stat-value" id="statTotal">-</span>
      <span class="stat-label">Total Goals</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" id="statCompleted">-</span>
      <span class="stat-label">Completed</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" id="statInProgress">-</span>
      <span class="stat-label">In Progress</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" id="statCompletionRate">-</span>
      <span class="stat-label">Completion %</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" id="statTopCategory">-</span>
      <span class="stat-label">Top Category</span>
    </div>
  </div>

  <div class="charts-grid">
    <div class="chart-container">
      <h2>Category Breakdown</h2>
      <canvas id="categoryChart"></canvas>
    </div>

    <div class="chart-container">
      <h2>Status Distribution</h2>
      <canvas id="statusChart"></canvas>
    </div>

    <div class="chart-container">
      <h2>Completion Timeline</h2>
      <canvas id="timelineChart"></canvas>
    </div>

    <div class="chart-container">
      <h2>Category Progress</h2>
      <canvas id="categoryProgressChart"></canvas>
    </div>
  </div>

  <div class="goals-lists" id="goalsLists">
    <div class="goals-section" id="goalsInProgress">
      <h2>In Progress</h2>
      <div class="goals-list"></div>
    </div>
    <div class="goals-section" id="goalsNotStarted">
      <h2>Not Started</h2>
      <div class="goals-list"></div>
    </div>
    <div class="goals-section" id="goalsDone">
      <h2>Done</h2>
      <div class="goals-list"></div>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script>window.GOALS_DATA_URL = '/goals-2026-data.json';</script>
<script src="/assets/js/goals-charts-2026.js"></script>
