document.addEventListener('DOMContentLoaded', () => {
  // --- Theme Toggle Logic ---
  const themeToggleBtn = document.getElementById('theme-toggle');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

  // Load saved preference or default to system
  const currentTheme = localStorage.getItem('theme');
  if (currentTheme == 'dark') {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
  } else if (currentTheme == 'light') {
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
  } else {
    // System preference
    if (prefersDarkScheme.matches) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.add('light-theme');
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      let theme = 'light';
      if (document.body.classList.contains('light-theme')) {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        theme = 'dark';
      } else {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        theme = 'light';
      }
      localStorage.setItem('theme', theme);
    });
  }

  // --- Search Logic ---
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const blogList = document.getElementById('blog-list'); // The original list to hide

  if (searchInput) {
    let posts = [];

    // Fetch the search index
    fetch('/learn/search.json')
      .then(response => response.json())
      .then(data => {
        posts = data;
      })
      .catch(err => console.error('Error loading search index:', err));

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();

      if (query.length === 0) {
        searchResults.style.display = 'none';
        searchResults.innerHTML = '';
        if (blogList) blogList.style.display = 'grid'; // Show original list
        return;
      }

      if (blogList) blogList.style.display = 'none'; // Hide original list
      searchResults.style.display = 'grid';

      const filteredPosts = posts.filter(post => {
        const titleMatch = post.title.toLowerCase().includes(query);
        const excerptMatch = post.excerpt.toLowerCase().includes(query);
        const tagsMatch = post.tags.toLowerCase().includes(query);
        return titleMatch || excerptMatch || tagsMatch;
      });

      displayResults(filteredPosts);
    });
  }

  function displayResults(results) {
    if (results.length === 0) {
      searchResults.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: var(--text-muted);">No results found.</p>';
      return;
    }

    const html = results.map(post => `
      <div class="blog-card glass-panel">
        <div class="blog-card-text">
          <a href="${post.url}" class="blog-title">${post.title}</a>
          <div class="blog-desc">${post.excerpt}</div>
          <div class="tags-container">
            ${post.tags.split(', ').filter(t => t).map(tag => `<span class="tag-chip mini">${tag}</span>`).join('')}
          </div>
        </div>
        ${post.image ? `
        <div class="image-skeleton-container">
             <img src="${post.image}" alt="${post.title}" class="loaded" />
             <div class="blog-date">${post.date}</div>
        </div>` : `<div class="blog-date">${post.date}</div>`}
      </div>
    `).join('');

    searchResults.innerHTML = html;
  }
});
