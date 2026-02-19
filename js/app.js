/**
 * App Module
 * 
 * Core application logic — data loading, routing, and page initialization.
 */

const App = (() => {

  let categoriesData = null;
  let supplementsData = null;

  // ──────────────────────────────
  // DATA LOADING
  // ──────────────────────────────

  async function loadJSON(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
    return response.json();
  }

  async function loadData() {
    const [catResult, suppResult] = await Promise.all([
      loadJSON('data/categories.json'),
      loadJSON('data/supplements.json')
    ]);
    categoriesData = catResult.categories;
    supplementsData = suppResult.supplements;
    return { categories: categoriesData, supplements: supplementsData };
  }

  // ──────────────────────────────
  // ROUTING
  // ──────────────────────────────

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function setQueryParam(name, value) {
    const params = new URLSearchParams(window.location.search);
    params.set(name, value);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }

  // ──────────────────────────────
  // PAGE INITIALIZERS
  // ──────────────────────────────

  async function initHomePage() {
    const { categories, supplements } = await loadData();
    const container = document.getElementById('app');
    container.innerHTML = Render.homePage(categories, supplements);
    initSearch(supplements, categories);
  }

  async function initCategoryPage() {
    const { categories, supplements } = await loadData();
    const categoryId = getQueryParam('id');
    const category = categories.find(c => c.id === categoryId);

    if (!category) {
      document.getElementById('app').innerHTML = `
        <div class="container" style="padding: 4rem 0; text-align: center;">
          <h1>Category Not Found</h1>
          <p>The category "${categoryId}" does not exist.</p>
          <a href="index.html" class="btn">← Back to Home</a>
        </div>
      `;
      return;
    }

    const sortMode = getQueryParam('sort') || 'evidence';
    const container = document.getElementById('app');
    container.innerHTML = Render.categoryPage(category, supplements, categories, sortMode);

    // Sort controls
    document.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const newSort = btn.dataset.sort;
        setQueryParam('sort', newSort);
        container.innerHTML = Render.categoryPage(category, supplements, categories, newSort);
        // Re-attach sort listeners
        attachSortListeners(category, supplements, categories, container);
      });
    });
  }

  function attachSortListeners(category, supplements, categories, container) {
    document.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const newSort = btn.dataset.sort;
        setQueryParam('sort', newSort);
        container.innerHTML = Render.categoryPage(category, supplements, categories, newSort);
        attachSortListeners(category, supplements, categories, container);
      });
    });
  }

  async function initSupplementPage() {
    const { categories, supplements } = await loadData();
    const supplementId = getQueryParam('id');
    const supplement = supplements.find(s => s.id === supplementId);

    if (!supplement) {
      document.getElementById('app').innerHTML = `
        <div class="container" style="padding: 4rem 0; text-align: center;">
          <h1>Supplement Not Found</h1>
          <p>The supplement "${supplementId}" does not exist.</p>
          <a href="index.html" class="btn">← Back to Home</a>
        </div>
      `;
      return;
    }

    const container = document.getElementById('app');
    container.innerHTML = Render.supplementPage(supplement, categories);

    // Smooth scroll for sidebar links
    document.querySelectorAll('.sidebar-nav__link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').slice(1);
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Highlight active sidebar section on scroll
    initScrollSpy();
  }

  // ──────────────────────────────
  // SEARCH
  // ──────────────────────────────

  function initSearch(supplements, categories) {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    if (!searchInput || !searchResults) return;

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      if (query.length < 2) {
        searchResults.innerHTML = '';
        searchResults.classList.remove('active');
        return;
      }

      const matches = supplements.filter(s => {
        const searchText = [
          s.name,
          ...s.aliases,
          s.tagline,
          ...s.categories
        ].join(' ').toLowerCase();
        return searchText.includes(query);
      });

      if (matches.length === 0) {
        searchResults.innerHTML = '<div class="search-result search-result--empty">No supplements found</div>';
        searchResults.classList.add('active');
        return;
      }

      searchResults.innerHTML = matches.slice(0, 8).map(s => {
        const assessment = EvidenceScoring.assess(s.evidence);
        return `
          <a href="supplement.html?id=${s.id}" class="search-result">
            <span class="search-result__badge" style="color: ${assessment.color}">${assessment.tier}</span>
            <div class="search-result__info">
              <span class="search-result__name">${s.name}</span>
              <span class="search-result__cats">${s.categories.map(cid => {
                const cat = categories.find(c => c.id === cid);
                return cat ? cat.name : cid;
              }).join(', ')}</span>
            </div>
          </a>
        `;
      }).join('');
      searchResults.classList.add('active');
    });

    // Close search on outside click
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.innerHTML = '';
        searchResults.classList.remove('active');
      }
    });

    // Close on Escape
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        searchResults.innerHTML = '';
        searchResults.classList.remove('active');
      }
    });
  }

  // ──────────────────────────────
  // SCROLL SPY (Supplement page sidebar)
  // ──────────────────────────────

  function initScrollSpy() {
    const sections = document.querySelectorAll('.content-section');
    const navLinks = document.querySelectorAll('.sidebar-nav__link');
    if (sections.length === 0 || navLinks.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => link.classList.remove('active'));
          const activeLink = document.querySelector(`.sidebar-nav__link[href="#${entry.target.id}"]`);
          if (activeLink) activeLink.classList.add('active');
        }
      });
    }, {
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    });

    sections.forEach(section => observer.observe(section));
  }

  // ──────────────────────────────
  // THEME TOGGLE
  // ──────────────────────────────

  function initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    // Load saved preference
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(toggle, savedTheme);

    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      updateThemeIcon(toggle, next);
    });
  }

  function updateThemeIcon(toggle, theme) {
    toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    toggle.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  }

  // ──────────────────────────────
  // PUBLIC API
  // ──────────────────────────────

  return {
    initHomePage,
    initCategoryPage,
    initSupplementPage,
    initThemeToggle,
    loadData
  };

})();
