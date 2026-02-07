---
layout: default
title: Thoughts
permalink: /thoughts/
---

<link rel="stylesheet" href="/assets/css/thoughts.css">

<div class="thoughts-container">
  <h1>Thoughts</h1>
  <p class="thoughts-intro">Quick notes, observations, and half-formed ideas.</p>

  <div class="thoughts-stats">
    <div class="thoughts-stat-card">
      <span class="thoughts-stat-value" id="thoughts-total">-</span>
      <span class="thoughts-stat-label">Total</span>
    </div>
    <div class="thoughts-stat-card">
      <span class="thoughts-stat-value" id="thoughts-month">-</span>
      <span class="thoughts-stat-label">This Month</span>
    </div>
    <div class="thoughts-stat-card">
      <span class="thoughts-stat-value" id="thoughts-per-day">-</span>
      <span class="thoughts-stat-label">Avg / Day</span>
    </div>
    <div class="thoughts-stat-card">
      <span class="thoughts-stat-value" id="thoughts-per-week">-</span>
      <span class="thoughts-stat-label">Avg / Week</span>
    </div>
  </div>

  <div class="thoughts-timeline" id="thoughts-timeline" data-url="/thoughts-2026-data.json">
    <p class="thoughts-loading">Loading thoughts...</p>
  </div>
</div>

<script src="/assets/js/thoughts.js"></script>
