document.addEventListener('DOMContentLoaded', () => {
  // --- Theme Toggle Logic ---
  const themeToggleBtn = document.getElementById('theme-toggle');

  // Note: Initial theme application is now handled by _includes/theme-script.html
  // to prevent flash of unstyled content (FOUC).

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      let theme = 'light';
      // Check documentElement because the script applies it there, but let's check body/html compat
      const root = document.documentElement;

      if (root.classList.contains('light-theme')) {
        root.classList.remove('light-theme');
        root.classList.add('dark-theme');
        theme = 'dark';
      } else {
        root.classList.remove('dark-theme');
        root.classList.add('light-theme');
        theme = 'light';
      }
      localStorage.setItem('theme', theme);
    });
  }

  // --- Search Logic ---
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const blogList = document.getElementById('blog-list'); // The original list to hide (if present)
  const searchStatus = document.getElementById('search-status');

  if (searchInput) {
    let posts = [];

    // Check for URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('q') || urlParams.get('tag');

    // If query param exists, set input
    if (queryParam) {
      searchInput.value = queryParam;
    }

    // Fetch the search index
    fetch('/learn/search.json')
      .then(response => response.json())
      .then(data => {
        posts = data;
        // If we had a query param, trigger search immediately after load
        if (queryParam) {
           performSearch(queryParam.toLowerCase().trim());
        }
      })
      .catch(err => console.error('Error loading search index:', err));

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      performSearch(query);
    });

    function performSearch(query) {
      if (query.length === 0) {
        searchResults.style.display = 'none';
        searchResults.innerHTML = '';
        if (blogList) blogList.style.display = 'grid'; // Show original list
        if (searchStatus) searchStatus.innerText = '';

        // Clear query param without refreshing
        const url = new URL(window.location);
        url.searchParams.delete('q');
        url.searchParams.delete('tag');
        window.history.replaceState({}, '', url);

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

      // Update URL with query param
      const url = new URL(window.location);
      url.searchParams.set('q', query);
      // If on specific page, maybe nice to see, but main usage is linking
      window.history.replaceState({}, '', url);

      displayResults(filteredPosts, query);
    }
  }

  function displayResults(results, query) {
    if (results.length === 0) {
      searchResults.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: var(--text-muted); font-size: 1.1rem;">No results found for "' + query + '".</p>';
      if (searchStatus) searchStatus.innerText = `0 results found`;
      return;
    }

    if (searchStatus) searchStatus.innerText = `${results.length} result${results.length === 1 ? '' : 's'} found`;

    const html = results.map(post => `
      <div class="blog-card glass-panel">
        ${post.image ? `
        <div class="blog-card-image-wrapper">
             <img src="${post.image}" alt="${post.title}" />
        </div>` : ''}

        <div class="blog-card-content">
            <a href="${post.url}" class="blog-title">${highlightMatch(post.title, query)}</a>
            <div class="post-meta-row">
                <div class="blog-date">${post.date}</div>
            </div>
            <div class="blog-desc">${highlightMatch(post.excerpt, query)}</div>

            <div class="tags-container">
                ${post.tags.split(', ').filter(t => t).map(tag =>
                    `<a href="/learn/search/?q=${tag}" class="tag-chip mini">${highlightMatch(tag, query)}</a>`
                ).join('')}
            </div>
        </div>
      </div>
    `).join('');

    searchResults.innerHTML = html;
  }

  function highlightMatch(text, query) {
      if (!query) return text;
      // Simple highlight
      const regex = new RegExp(`(${query})`, 'gi');
      return text.replace(regex, '<span class="highlight">$1</span>');
  }
});
