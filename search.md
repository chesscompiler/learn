---
layout: default
title: Search Results
permalink: /search/
---

<div class="search-page-container">
  <h1 style="text-align: center; margin-bottom: 2rem; color: var(--blue1);">Search</h1>

  {% include search.html %}

  <div id="search-status" style="text-align: center; margin-top: 1rem; color: var(--text-muted);"></div>
</div>

<script>
  // Helper to update page title based on query
  const params = new URLSearchParams(window.location.search);
  const query = params.get('q') || params.get('tag');
  if (query) {
    document.querySelector('h1').textContent = `Results for "${query}"`;
    document.title = `Search: ${query} - Chess Compiler Learn`;
  }
</script>
