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
    const query = this.searchInput.value.toLowerCase().trim();
    const selectedTag = this.tagFilter.value;
    
    let results = this.posts;
    
    // Filter by tag
    if (selectedTag) {
      results = results.filter(post => 
        post.tags && post.tags.includes(selectedTag)
      );
    }
    
    // Filter by search query
    if (query) {
      results = results.filter(post => {
        const titleMatch = post.title.toLowerCase().includes(query);
        const contentMatch = post.content.toLowerCase().includes(query);
        const tagMatch = post.tags && post.tags.some(tag => 
          tag.toLowerCase().includes(query)
        );
        return titleMatch || contentMatch || tagMatch;
      });
      
      // Add relevance scoring
      results.forEach(post => {
        let score = 0;
        
        // Title matches are worth more
        if (post.title.toLowerCase().includes(query)) {
          score += 10;
        }
        
        // Tag matches are worth more
        if (post.tags && post.tags.some(tag => 
          tag.toLowerCase().includes(query)
        )) {
          score += 5;
        }
        
        // Content matches
        const contentMatches = (post.content.toLowerCase().match(new RegExp(query, 'g')) || []).length;
        score += contentMatches;
        
        post.relevanceScore = score;
      });
    }
    
    // Sort results
    this.sortResults(results);
    
    this.filteredPosts = results;
    this.displayResults(results, query);
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
  
  displayResults(results, query) {
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
    const html = results.map(post => this.generateResultHTML(post, query)).join('');
    this.searchResults.innerHTML = html;
  }
  
  generateResultHTML(post, query) {
    const highlightedTitle = this.highlightText(post.title, query);
    const highlightedExcerpt = this.highlightText(post.excerpt, query);
    
    const tagsHTML = post.tags ? post.tags.map(tag => {
      const isHighlighted = query && tag.toLowerCase().includes(query.toLowerCase());
      return '<span class="tag' + (isHighlighted ? ' highlight' : '') + '">' + tag + '</span>';
    }).join('') : '';
    
    return '<div class="search-result"><div class="result-title"><a href="' + post.url + '">' + highlightedTitle + '</a></div><div class="result-meta">' + post.date + '</div><div class="result-excerpt">' + highlightedExcerpt + '</div><div class="result-tags">' + tagsHTML + '</div></div>';
  }
  
  highlightText(text, query) {
    if (!query) return text;
    
    const regex = new RegExp('(' + query + ')', 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
  }
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  new BlogSearch();
});