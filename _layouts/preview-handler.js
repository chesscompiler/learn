/**
 * Post Preview Handler for Chess Blog Editor
 * Handles postMessage communication and updates liquid template content
 */
(function() {
  'use strict';

  // Enhanced markdown to HTML converter
  function markdownToHtml(markdown) {
    if (!markdown) return '';
    
    let html = markdown;
    
    // Headers (process from h6 to h1 to avoid conflicts)
    html = html.replace(/^###### (.*$)/gm, '<h6>$1</h6>');
    html = html.replace(/^##### (.*$)/gm, '<h5>$1</h5>');
    html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // Code blocks (process before inline code)
    html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, function(match, language, content) {
      const lang = language ? ` class="language-${language}"` : '';
      return `<pre><code${lang}>${content.trim()}</code></pre>`;
    });
    
    // Inline code
    html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    
    // Bold and italic (process in correct order)
    html = html.replace(/\*\*\*([^*\n]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    html = html.replace(/___([^_\n]+)___/g, '<strong><em>$1</em></strong>');
    html = html.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');
    html = html.replace(/_([^_\n]+)_/g, '<em>$1</em>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">');
    
    // Blockquotes (handle multi-line)
    html = html.replace(/^> (.*)$/gm, '<blockquote-line>$1</blockquote-line>');
    html = html.replace(/(<blockquote-line>.*<\/blockquote-line>\s*)+/g, function(match) {
      const content = match.replace(/<\/?blockquote-line>/g, '').trim();
      return `<blockquote>${content}</blockquote>`;
    });
    
    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr>');
    html = html.replace(/^\*\*\*$/gm, '<hr>');
    
    // Lists (improved handling)
    // Ordered lists
    html = html.replace(/^(\d+)\. (.*)$/gm, '<li-ordered>$2</li-ordered>');
    html = html.replace(/(<li-ordered>.*<\/li-ordered>\s*)+/g, function(match) {
      const items = match.replace(/<li-ordered>/g, '<li>').replace(/<\/li-ordered>/g, '</li>');
      return `<ol>${items}</ol>`;
    });
    
    // Unordered lists
    html = html.replace(/^[\*\-\+] (.*)$/gm, '<li-unordered>$1</li-unordered>');
    html = html.replace(/(<li-unordered>.*<\/li-unordered>\s*)+/g, function(match) {
      const items = match.replace(/<li-unordered>/g, '<li>').replace(/<\/li-unordered>/g, '</li>');
      return `<ul>${items}</ul>`;
    });
    
    // Line breaks and paragraphs
    html = html.split('\n\n').map(paragraph => {
      paragraph = paragraph.trim();
      if (!paragraph) return '';
      
      // Don't wrap certain elements in paragraphs
      if (paragraph.match(/^<(h[1-6]|ul|ol|blockquote|hr|pre|div)/)) {
        return paragraph;
      }
      
      return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`;
    }).filter(p => p).join('\n\n');
    
    return html;
  }

  // Format date function
  function formatDate(dateString) {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  }

  // Format date to XML schema
  function formatDateXML(dateString) {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toISOString();
    } catch (e) {
      return dateString;
    }
  }

  // Update page title and meta tags
  function updatePageMeta(frontMatter, content) {
    // Update document title
    if (frontMatter.title) {
      document.title = `${frontMatter.title} | Chess Compiler Learn - Chess Blogs & Tutorials in 3D`;
    }

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && content) {
      const excerpt = content.substring(0, 150).replace(/<[^>]*>/g, '').trim();
      metaDesc.setAttribute('content', excerpt);
    }

    // Update Open Graph meta tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && frontMatter.title) {
      ogTitle.setAttribute('content', frontMatter.title);
    }

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && content) {
      const excerpt = content.substring(0, 150).replace(/<[^>]*>/g, '').trim();
      ogDesc.setAttribute('content', excerpt);
    }

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && frontMatter.image) {
      ogImage.setAttribute('content', frontMatter.image);
    }

    // Update Twitter meta tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle && frontMatter.title) {
      twitterTitle.setAttribute('content', frontMatter.title);
    }

    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc && content) {
      const excerpt = content.substring(0, 160).replace(/<[^>]*>/g, '').trim();
      twitterDesc.setAttribute('content', excerpt);
    }

    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage && frontMatter.image) {
      twitterImage.setAttribute('content', frontMatter.image);
    }
  }

  // Update the main article content (replaces liquid template logic)
  function updateArticleContent(frontMatter, content) {
    const article = document.querySelector('.markdown-body');
    if (!article) {
      console.error('Article container (.markdown-body) not found');
      return;
    }

    // Clear existing content
    article.innerHTML = '';

    // 1. Update title ({{ page.title }})
    if (frontMatter.title) {
      const h1 = document.createElement('h1');
      h1.textContent = frontMatter.title;
      article.appendChild(h1);
    }

    // 2. Update article image ({% if page.image %})
    if (frontMatter.image) {
      const imageWrapper = document.createElement('div');
      imageWrapper.className = 'article-image-wrapper';
      
      const skeleton = document.createElement('span');
      skeleton.className = 'article-skeleton';
      
      const img = document.createElement('img');
      img.setAttribute('data-src', frontMatter.image);
      img.alt = frontMatter.title || '';
      
      // Simulate the lazy loading behavior
      setTimeout(() => {
        img.src = img.getAttribute('data-src');
        img.onload = () => {
          img.classList.add('loaded');
          skeleton.classList.add('hide');
        };
      }, 100); // Small delay to simulate loading
      
      imageWrapper.appendChild(skeleton);
      imageWrapper.appendChild(img);
      article.appendChild(imageWrapper);
    }

    // 3. Update date and last modified (liquid date logic)
    if (frontMatter.date || frontMatter.last_modified_at) {
      const dateDiv = document.createElement('div');
      dateDiv.style.cssText = 'color:#888;font-size:0.95em;margin-bottom:2em;';
      
      if (frontMatter.date) {
        const time = document.createElement('time');
        time.setAttribute('datetime', formatDateXML(frontMatter.date));
        time.textContent = formatDate(frontMatter.date);
        dateDiv.appendChild(time);
      }
      
      if (frontMatter.last_modified_at) {
        dateDiv.appendChild(document.createTextNode(' • Updated: '));
        const timeUpdated = document.createElement('time');
        timeUpdated.setAttribute('datetime', formatDateXML(frontMatter.last_modified_at));
        timeUpdated.textContent = formatDate(frontMatter.last_modified_at);
        dateDiv.appendChild(timeUpdated);
      }
      
      article.appendChild(dateDiv);
    }

    // 4. Update main content ({{ content }})
    if (content && content.trim()) {
      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = markdownToHtml(content);
      article.appendChild(contentDiv);
      
      // Process chess boards after content is inserted
      setTimeout(() => {
        processChessBoards(contentDiv);
      }, 50);
    }
  }

  // Process chess board elements
  function processChessBoards(container) {
    const chessBoardElements = container.querySelectorAll('chess-board');
    
    chessBoardElements.forEach(el => {
      const fen = el.getAttribute('fen') || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const highlights = (el.getAttribute('highlight') || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      const arrows = (el.getAttribute('arrows') || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      
      // Use the existing renderChessBoard function from post.html
      if (typeof window.renderChessBoard === 'function') {
        try {
          window.renderChessBoard(el, fen, highlights, arrows);
        } catch (error) {
          console.error('Error rendering chess board:', error);
        }
      } else {
        console.warn('renderChessBoard function not found. Make sure your post.html chess board script is loaded.');
        
        // Fallback: replace with text representation
        el.innerHTML = `<div style="padding: 1rem; border: 1px solid #ccc; text-align: center; background: #f5f5f5;">
          <strong>Chess Board</strong><br>
          FEN: ${fen}<br>
          ${highlights.length ? `Highlighted: ${highlights.join(', ')}` : ''}
          ${arrows.length ? `<br>Arrows: ${arrows.join(', ')}` : ''}
        </div>`;
      }
    });
  }

  // Main update function
  function updatePageContent(frontMatter, content) {
    try {
      // Update page meta information
      updatePageMeta(frontMatter, content);
      
      // Update the main article content
      updateArticleContent(frontMatter, content);
      
      // Notify parent that update is complete
      window.parent.postMessage({
        type: 'preview-updated',
        success: true
      }, '*');
      
    } catch (error) {
      console.error('Error updating preview content:', error);
      
      // Notify parent of error
      window.parent.postMessage({
        type: 'preview-error',
        error: error.message,
        stack: error.stack
      }, '*');
    }
  }

  // Listen for messages from parent window (editor)
  window.addEventListener('message', function(event) {
    // Basic security check - you might want to add origin checking
    if (!event.data || typeof event.data !== 'object') {
      return;
    }
    
    switch(event.data.type) {
      case 'update-content':
        updatePageContent(event.data.frontMatter || {}, event.data.content || '');
        break;
        
      case 'ping':
        // Health check from parent
        window.parent.postMessage({ type: 'pong' }, '*');
        break;
        
      default:
        console.log('Unknown message type:', event.data.type);
    }
  });

  // Notify parent that preview is ready when page loads
  function notifyReady() {
    window.parent.postMessage({
      type: 'preview-ready',
      url: window.location.href
    }, '*');
  }

  // Send ready notification
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', notifyReady);
  } else {
    // Already loaded
    setTimeout(notifyReady, 100);
  }

  // Also send ready notification when window loads (in case DOMContentLoaded already fired)
  window.addEventListener('load', notifyReady);

  // Debug helper (remove in production)
  window.previewHandler = {
    updateContent: updatePageContent,
    markdownToHtml: markdownToHtml,
    formatDate: formatDate
  };

})();