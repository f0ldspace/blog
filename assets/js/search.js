class BlogSearch {
  constructor() {
    this.posts = [];
    this.filteredPosts = [];
    this.searchInput = document.getElementById('search-input');
    this.tagFilter = document.getElementById('tag-filter');
    this.sortFilter = document.getElementById('sort-filter');
    this.searchResults = document.getElementById('search-results');
    this.searchResultsCount = document.getElementById('search-results-count');
    this.noResults = document.getElementById('no-results');
    this.searchLoading = document.getElementById('search-loading');
    
    this.init();
  }
  
  async init() {
    try {
      console.log('Attempting to fetch search data...');
      
      // Try main search.json first, fallback to test version
      let response;
      try {
        response = await fetch('/search.json');
        console.log('Main search.json response status:', response.status);
      } catch (mainError) {
        console.log('Main search.json failed, trying test version...');
        response = await fetch('/search-test.json');
        console.log('Test search.json response status:', response.status);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      console.log('Raw response:', text.substring(0, 200) + '...');
      
      this.posts = JSON.parse(text);
      console.log('Parsed posts:', this.posts.length, 'posts found');
      
      if (this.posts.length === 0) {
        throw new Error('No posts found in search data');
      }
      
      this.populateTagFilter();
      this.bindEvents();
      this.displayResults(this.posts);
    } catch (error) {
      console.error('Error loading search data:', error);
      this.searchResults.innerHTML = '<div class="search-error"><h3>Search Error</h3><p>Unable to load search data. Error: ' + error.message + '</p><p>Please check the browser console for more details.</p><p>Make sure Jekyll is running and search.json is being generated properly.</p></div>';
    }
  }
  
  populateTagFilter() {
    const allTags = new Set();
    this.posts.forEach(post => {
      if (post.tags) {
        post.tags.forEach(tag => allTags.add(tag));
      }
    });
    
    const sortedTags = Array.from(allTags).sort();
    sortedTags.forEach(tag => {
      const option = document.createElement('option');
      option.value = tag;
      option.textContent = tag;
      this.tagFilter.appendChild(option);
    });
  }
  
  bindEvents() {
    this.searchInput.addEventListener('input', () => this.handleSearch());
    this.tagFilter.addEventListener('change', () => this.handleSearch());
    this.sortFilter.addEventListener('change', () => this.handleSearch());
  }
  
  handleSearch() {
    this.searchLoading.style.display = 'block';
    
    // Debounce search
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.performSearch();
      this.searchLoading.style.display = 'none';
    }, 300);
  }
  
  performSearch() {
    const rawQuery = this.searchInput.value.toLowerCase().trim();
    const selectedTag = this.tagFilter.value;

    // Split query into individual terms (supports multiple words)
    const terms = rawQuery.split(/\s+/).filter(term => term.length > 0);

    let results = this.posts;

    // Filter by tag
    if (selectedTag) {
      results = results.filter(post =>
        post.tags && post.tags.includes(selectedTag)
      );
    }

    // Filter by search query - ALL terms must match (AND search)
    if (terms.length > 0) {
      results = results.filter(post => {
        const titleLower = post.title.toLowerCase();
        const contentLower = post.content.toLowerCase();
        const tagsLower = post.tags ? post.tags.map(t => t.toLowerCase()) : [];

        // Every term must appear somewhere in the post
        return terms.every(term => {
          const inTitle = titleLower.includes(term);
          const inContent = contentLower.includes(term);
          const inTags = tagsLower.some(tag => tag.includes(term));
          return inTitle || inContent || inTags;
        });
      });

      // Add relevance scoring
      results.forEach(post => {
        let score = 0;
        const titleLower = post.title.toLowerCase();
        const contentLower = post.content.toLowerCase();
        const tagsLower = post.tags ? post.tags.map(t => t.toLowerCase()) : [];

        terms.forEach(term => {
          // Title matches are worth more
          if (titleLower.includes(term)) {
            score += 10;
          }

          // Tag matches are worth more
          if (tagsLower.some(tag => tag.includes(term))) {
            score += 5;
          }

          // Count content matches
          const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const contentMatches = (contentLower.match(new RegExp(escapedTerm, 'g')) || []).length;
          score += contentMatches;
        });

        post.relevanceScore = score;
      });
    }

    // Sort results
    this.sortResults(results);

    this.filteredPosts = results;
    this.displayResults(results, terms);
  }
  
  sortResults(results) {
    const sortBy = this.sortFilter.value;
    
    results.sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);
        case 'date':
          return new Date(b.date) - new Date(a.date);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }
  
  displayResults(results, terms) {
    if (results.length === 0) {
      this.searchResults.style.display = 'none';
      this.noResults.style.display = 'block';
      this.searchResultsCount.textContent = '';
      return;
    }

    this.searchResults.style.display = 'block';
    this.noResults.style.display = 'none';

    // Update results count
    const countText = results.length === 1 ? '1 post found' : results.length + ' posts found';
    this.searchResultsCount.textContent = countText;

    // Generate HTML for results
    const html = results.map(post => this.generateResultHTML(post, terms)).join('');
    this.searchResults.innerHTML = html;
  }

  generateResultHTML(post, terms) {
    const highlightedTitle = this.highlightText(post.title, terms);
    const highlightedExcerpt = this.highlightText(post.excerpt, terms);

    const tagsHTML = post.tags ? post.tags.map(tag => {
      const isHighlighted = terms && terms.length > 0 &&
        terms.some(term => tag.toLowerCase().includes(term));
      return '<span class="tag' + (isHighlighted ? ' highlight' : '') + '">' + tag + '</span>';
    }).join('') : '';

    return '<div class="search-result"><div class="result-title"><a href="' + post.url + '">' + highlightedTitle + '</a></div><div class="result-meta">' + post.date + '</div><div class="result-excerpt">' + highlightedExcerpt + '</div><div class="result-tags">' + tagsHTML + '</div></div>';
  }

  highlightText(text, terms) {
    if (!terms || terms.length === 0) return text;

    let result = text;
    terms.forEach(term => {
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp('(' + escapedTerm + ')', 'gi');
      result = result.replace(regex, '<span class="highlight">$1</span>');
    });
    return result;
  }
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  new BlogSearch();
});