document.addEventListener('DOMContentLoaded', () => {
  // --- Theme Toggle Logic ---
  const themeToggleBtn = document.getElementById('theme-toggle');

  // Note: Initial theme application is now handled by _includes/theme-script.html
  // to prevent flash of unstyled content (FOUC).

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      let theme = 'light';
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
  const blogList = document.getElementById('blog-list');
  const searchStatus = document.getElementById('search-status');

  // Global access to ad config for search results
  let globalAdSnippet = null;
  let searchActive = false; // To track if a search is active waiting for ads

  // --- Ad Injection System Helpers ---
  function constructAd(snippet) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ad-wrapper glass-panel';
    // "curvy" and "default show text"
    wrapper.style.borderRadius = '16px';
    wrapper.style.padding = '1rem';
    wrapper.style.margin = '2rem auto';
    wrapper.style.textAlign = 'center';
    wrapper.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
    wrapper.style.border = '1px solid var(--card-border)';
    wrapper.style.overflow = 'hidden';

    // Default text
    const text = document.createElement('div');
    text.innerText = 'Advertisement';
    text.style.color = 'var(--text-muted)';
    text.style.fontSize = '0.85rem';
    text.style.marginBottom = '0.5rem';
    text.style.textTransform = 'uppercase';
    text.style.letterSpacing = '0.05em';
    wrapper.appendChild(text);

    // Execute factory
    try {
      const factory = new Function('return ' + snippet.jsFactory)();
      const result = factory();
      if (result && result.elements) {
        result.elements.forEach(el => wrapper.appendChild(el));
      }
    } catch (e) {
      console.error('Ad Factory Error:', e);
    }

    return wrapper;
  }


  if (searchInput) {
    let posts = [];

    // Check for URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('q') || urlParams.get('tag');

    // If query param exists, set input
    if (queryParam) {
      searchInput.value = queryParam;
      searchActive = true;
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
        searchActive = false;
        searchResults.style.display = 'none';
        searchResults.innerHTML = '';
        if (blogList) blogList.style.display = 'grid'; // Show original list
        if (searchStatus) searchStatus.innerText = '';

        const url = new URL(window.location);
        url.searchParams.delete('q');
        url.searchParams.delete('tag');
        window.history.replaceState({}, '', url);

        return;
      }

      searchActive = true;
      if (blogList) blogList.style.display = 'none';
      searchResults.style.display = 'grid';

      const filteredPosts = posts.filter(post => {
        const titleMatch = post.title.toLowerCase().includes(query);
        const excerptMatch = post.excerpt.toLowerCase().includes(query);
        const tagsMatch = post.tags.toLowerCase().includes(query);
        return titleMatch || excerptMatch || tagsMatch;
      });

      const url = new URL(window.location);
      url.searchParams.set('q', query);
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

    searchResults.innerHTML = '';

    const isDesktop = window.innerWidth >= 1024;

    results.forEach((post, index) => {
      const cardHtml = `
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
      `;

      searchResults.insertAdjacentHTML('beforeend', cardHtml);

      // Mobile Search Ad Injection: Inject after 2nd item (index 1)
      if (!isDesktop && globalAdSnippet && index === 1) {
         const adWrapper = constructAd(globalAdSnippet);
         searchResults.appendChild(adWrapper);
      }
    });
  }

  function highlightMatch(text, query) {
      if (!query) return text;
      const regex = new RegExp(`(${query})`, 'gi');
      return text.replace(regex, '<span class="highlight">$1</span>');
  }

  // --- Ad Injection System ---
  (function() {
    const baseUrl = window.location.pathname.startsWith('/learn') ? '/learn' : '';
    const AD_CONFIG_URL = `${baseUrl}/assets/js/ad_config.json`;
    const MAX_ADS_PER_PAGE = 3;

    function injectAds(config) {
      console.log('Ad config loaded:', config);
      const snippets = config.adSnippets;
      if (!snippets || !snippets.length) return;

      globalAdSnippet = snippets[0];

      // If search is active, we might need to re-render results to show ads
      // But wait, displayResults uses globalAdSnippet. If we re-render, it will pick it up.
      if (searchActive && searchInput && searchInput.value) {
          // Trigger search again to inject ads into results if results are already shown
          searchInput.dispatchEvent(new Event('input'));
      }

      const width = window.innerWidth;
      const isDesktop = width >= 1024;

      let placed = 0;
      const snippet = snippets[0];

      if (isDesktop) {
        const contentWidth = 800;
        const margin = (width - contentWidth) / 2;
        const sidebarWidth = 240;

        // Relaxed Logic: Check if we have space, or if very large screen
        // Or just check if margin > sidebarWidth + padding
        if (margin > (sidebarWidth + 20)) {
          console.log('Injecting desktop sidebar ads');
          const sideContainer = document.createElement('div');
          sideContainer.id = 'ad-sidebar-right';
          sideContainer.style.position = 'fixed';
          sideContainer.style.top = '150px';

          const rightPos = (margin - sidebarWidth) / 2;
          sideContainer.style.right = Math.max(20, rightPos) + 'px';
          sideContainer.style.width = sidebarWidth + 'px';
          sideContainer.style.zIndex = '90';
          sideContainer.style.display = 'flex';
          sideContainer.style.flexDirection = 'column';
          sideContainer.style.gap = '2rem';

          document.body.appendChild(sideContainer);

          for (let i = 0; i < MAX_ADS_PER_PAGE; i++) {
             const ad = constructAd(snippet);
             ad.style.margin = '0';
             sideContainer.appendChild(ad);
             placed++;
          }
        } else {
            console.log('Not enough space for sidebar ads. Margin:', margin);
        }

      } else {
        // Mobile Logic
        const articleBody = document.querySelector('.markdown-body');
        if (articleBody) {
          let targets = Array.from(articleBody.querySelectorAll('h2, h3'));

          // Fallback to paragraphs if no headings
          if (targets.length === 0) {
             console.log('No headings found, using paragraphs for ad injection.');
             targets = Array.from(articleBody.querySelectorAll('p'));
             // Filter out short paragraphs or p in blockquotes if possible? No, keep simple.
          }

          if (targets.length > 0) {
             console.log(`Found ${targets.length} targets for ad injection.`);
             targets.sort(() => Math.random() - 0.5);

             for (const t of targets) {
                if (placed >= MAX_ADS_PER_PAGE) break;
                const ad = constructAd(snippet);
                t.parentNode.insertBefore(ad, t.nextSibling);
                placed++;
             }
          } else {
              console.log('No suitable targets found for mobile ad injection.');
          }
        }
      }
    }

    // Initialize
    console.log('Fetching ad config from:', AD_CONFIG_URL);
    fetch(AD_CONFIG_URL)
      .then(r => {
          if (!r.ok) throw new Error('Network response was not ok ' + r.statusText);
          return r.json();
      })
      .then(injectAds)
      .catch(e => console.warn('Ad config not loaded', e));

  })();
});
