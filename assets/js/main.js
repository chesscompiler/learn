document.addEventListener('DOMContentLoaded', () => {
  // --- Theme Toggle Logic ---
  const themeToggleBtn = document.getElementById('theme-toggle');

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
  let searchActive = false;

  // --- Ad Injection System Helpers ---
  function constructAd(snippet, isCard = true) {
    const wrapper = document.createElement('div');

    if (isCard) {
        wrapper.className = 'blog-card ad-card';
        // Inner container for padding/centering
        const inner = document.createElement('div');
        inner.className = 'ad-card-inner';
        wrapper.appendChild(inner);

        // Default text
        const text = document.createElement('div');
        text.innerText = 'Advertisement';
        text.style.color = 'var(--text-muted)';
        text.style.fontSize = '0.85rem';
        text.style.marginBottom = '0.5rem';
        text.style.textTransform = 'uppercase';
        text.style.letterSpacing = '0.05em';
        inner.appendChild(text);

        // Execute factory
        try {
            const factory = new Function('return ' + snippet.jsFactory)();
            const result = factory();
            if (result && result.elements && result.elements.length > 0) {
                result.elements.forEach(el => inner.appendChild(el));
                // Only activate if content added
                wrapper.classList.add('active-ad');
            }
        } catch (e) {
            console.error('Ad Factory Error:', e);
        }
    } else {
        // Side Ad Container
        wrapper.className = 'side-ad-container';

        const text = document.createElement('div');
        text.innerText = 'Sponsored';
        text.style.color = 'var(--text-muted)';
        text.style.fontSize = '0.75rem';
        text.style.marginBottom = '0.5rem';
        text.style.textAlign = 'center';
        wrapper.appendChild(text);

        try {
            const factory = new Function('return ' + snippet.jsFactory)();
            const result = factory();
            if (result && result.elements && result.elements.length > 0) {
                result.elements.forEach(el => wrapper.appendChild(el));
                wrapper.classList.add('active-ad');
            }
        } catch (e) {
            console.error('Ad Factory Error:', e);
        }
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
        if (blogList) blogList.style.display = 'grid';
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

    results.forEach((post, index) => {
      // Just use basic card HTML construction here for search results
      // Since we don't have Liquid, we approximate the Tines/Oyster style

      let cardHtml = '';

      if (post.image) {
          // Oyster Style
          cardHtml = `
          <article class="blog-card has-image">
            <a href="${post.url}" class="card-image-link">
                <img src="${post.image}" alt="${post.title}" class="card-image">
            </a>
            <div class="card-content">
                <div>
                    <a href="${post.url}" class="card-title">${highlightMatch(post.title, query)} <span class="arrow">→</span></a>
                    <p class="card-excerpt">${highlightMatch(post.excerpt, query)}</p>
                </div>
                <div class="card-tags">
                    ${post.tags.split(', ').filter(t => t).map(tag =>
                        `<a href="/learn/tags/${tag.toLowerCase().replace(/\s+/g, '-')}/" class="tag-chip mini">${highlightMatch(tag, query)}</a>`
                    ).join('')}
                </div>
            </div>
          </article>`;
      } else {
          // Tines Style (Random color since we don't have cycle)
          const colors = ['tines-card-1', 'tines-card-2', 'tines-card-3', 'tines-card-4'];
          const colorClass = colors[index % 4];
          const firstChar = post.title.charAt(0).toUpperCase();

          cardHtml = `
          <article class="blog-card no-image ${colorClass}">
            <div class="tines-left">
                <div class="tines-excerpt">${highlightMatch(post.excerpt, query)}</div>
            </div>
            <div class="tines-right">
                <div class="bookmark-icon"><span class="material-icons">bookmark</span></div>
                <div class="tines-content">
                    <a href="${post.url}" class="tines-title">${highlightMatch(post.title, query)}</a>
                    <div class="tines-footer">
                        <div class="tines-stats">${post.date}</div>
                        <div class="card-tags">
                            ${post.tags.split(', ').slice(0,2).map(tag =>
                                `<a href="/learn/tags/${tag.toLowerCase().replace(/\s+/g, '-')}/" class="tag-chip mini tines-tag">${highlightMatch(tag, query)}</a>`
                            ).join('')}
                        </div>
                    </div>
                </div>
            </div>
          </article>`;
      }

      searchResults.insertAdjacentHTML('beforeend', cardHtml);

      // Inject Ad Card after every 4th item
      if (globalAdSnippet && (index + 1) % 4 === 0) {
         const adWrapper = constructAd(globalAdSnippet, true);
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

    function injectAds(config) {
      console.log('Ad config loaded:', config);
      const snippets = config.adSnippets;
      if (!snippets || !snippets.length) return;

      globalAdSnippet = snippets[0];

      // 1. Blog List Injection (Main Page)
      const blogList = document.getElementById('blog-list');
      if (blogList) {
        const cards = Array.from(blogList.children);
        let injectedCount = 0;

        // Inject ad after every 4th card
        cards.forEach((card, index) => {
           if ((index + 1) % 4 === 0) {
               const adCard = constructAd(globalAdSnippet, true);
               // Insert after current card
               // Need to account for previously injected ads shifting indices?
               // Easier to just insertBefore next sibling
               if (card.nextSibling) {
                   blogList.insertBefore(adCard, card.nextSibling);
               } else {
                   blogList.appendChild(adCard);
               }
               injectedCount++;
           }
        });
      }

      // If search is active, re-trigger to inject into search results
      if (searchActive && searchInput && searchInput.value) {
          searchInput.dispatchEvent(new Event('input'));
      }

      // 2. Reading Page Injection
      const articleBody = document.querySelector('.markdown-body');
      if (articleBody) {
         const headings = Array.from(articleBody.querySelectorAll('h2'));
         const width = window.innerWidth;
         const isDesktop = width >= 1300; // Based on CSS breakpoint

         headings.forEach((heading, index) => {
             // Limit to max 3 ads?
             if (index >= 3) return;

             const adContainer = constructAd(globalAdSnippet, false);

             // Position relative to heading
             // We insert it *before* the heading so it's near the top of the section in DOM flow
             // CSS will handle absolute positioning on desktop
             heading.parentNode.insertBefore(adContainer, heading);

             if (isDesktop) {
                 // Ensure container has position relative if needed?
                 // Actually markdown-body has position: relative
                 // We need to set top offset manually if we want it exact,
                 // OR rely on DOM order + absolute positioning relative to a wrapper.
                 // But standard markdown-body is one big block.
                 // Simpler: insert inside the markdown body.
                 // CSS: .side-ad-container { position: absolute; right: 0; transform... }
                 // The problem is `top`. If absolute, it goes to top of relative parent (markdown-body).
                 // We need it at the vertical level of the heading.
                 // Solution: Wrap heading in a relative container? No, disrupts layout.
                 // Solution 2: Use JS to set top.

                 adContainer.style.top = (heading.offsetTop) + 'px';
             }
         });
      }
    }

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
