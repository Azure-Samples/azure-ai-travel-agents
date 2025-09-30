/**
 * Quest Navigator - Interactive navigation system for repo adventures
 * Provides themed quest map and navigation controls
 */

(function() {
  'use strict';

  // Configuration
  const THEMES = {
    space: {
      mapTitle: 'Star Map',
      homeText: 'Return to Command Deck',
      questPrefix: 'Quest',
      bgClass: 'space-map'
    },
    mythical: {
      mapTitle: 'Quest Map',
      homeText: 'Return to Castle',
      questPrefix: 'Quest',
      bgClass: 'mythical-map'
    },
    ancient: {
      mapTitle: 'Ancient Map',
      homeText: 'Return to Temple',
      questPrefix: 'Quest',
      bgClass: 'ancient-map'
    },
    developer: {
      mapTitle: 'Navigation',
      homeText: 'Return to Index',
      questPrefix: 'Quest',
      bgClass: 'developer-map'
    }
  };

  class QuestNavigator {
    constructor() {
      this.currentTheme = this.detectTheme();
      this.currentQuest = this.detectCurrentQuest();
      this.totalQuests = this.detectTotalQuests();
      this.isMultiTheme = this.detectMultiTheme();
      this.loadStoredQuestTitles();
      this.init();
    }

    detectTheme() {
      // Detect theme from URL or body class
      const pathSegments = window.location.pathname.split('/');
      const themeFromPath = pathSegments[pathSegments.length - 2];
      
      if (THEMES[themeFromPath]) {
        return themeFromPath;
      }
      
      // Fallback: check body class
      for (const theme in THEMES) {
        if (document.body.classList.contains(`theme-${theme}`)) {
          return theme;
        }
      }
      
      // Default fallback
      return 'space';
    }

    detectCurrentQuest() {
      const match = window.location.pathname.match(/quest-(\d+)\.html/);
      return match ? parseInt(match[1], 10) : null;
    }

    detectTotalQuests() {
      // First, try to get the total quest count from localStorage
      const storedTotal = this.getStoredTotalQuests();
      if (storedTotal && storedTotal > 0) {
        // If we have a valid stored total and we're not on the index page where we could get fresher data
        const isIndexPage = window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html');
        if (!isIndexPage) {
          return storedTotal;
        }
      }
      
      // Try to detect from existing quest links
      const questLinks = document.querySelectorAll('a[href*="quest-"]');
      let maxQuest = 0; // Start with 0, only count actual quests
      
      // Initialize questTitles if not already done
      this.questTitles = this.questTitles || {};
      
      // Store quest titles while we're detecting
      questLinks.forEach(link => {
        const match = link.href.match(/quest-(\d+)\.html/);
        if (match) {
          const questNum = parseInt(match[1], 10);
          maxQuest = Math.max(maxQuest, questNum);
          
          // Store the quest title for later use
          const titleElement = link.querySelector('h3');
          if (titleElement) {
            this.questTitles[questNum] = titleElement.textContent;
          }
        }
      });
      
      // If we're on a quest page, also store the current page title and ensure we count at least this quest
      if (this.currentQuest) {
        maxQuest = Math.max(maxQuest, this.currentQuest);
        const pageTitle = document.querySelector('h1')?.textContent;
        if (pageTitle && !this.questTitles[this.currentQuest]) {
          this.questTitles[this.currentQuest] = pageTitle;
        }
      }
      
      // Default to 5 quests only if no quest links were found (fallback)
      if (maxQuest === 0) {
        maxQuest = 5;
      }
      
      // Save the total quest count for future page loads
      this.saveStoredTotalQuests(maxQuest);
      
      // Save titles to localStorage for persistence across pages
      this.saveQuestTitles();
      
      return maxQuest;
    }
    
    loadStoredQuestTitles() {
      try {
        const stored = localStorage.getItem('questTitles');
        if (stored) {
          const parsed = JSON.parse(stored);
          // Only load if the parsed data is an object with valid entries
          if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
            this.questTitles = parsed;
            return;
          }
        }
      } catch (error) {
        // Ignore localStorage errors and continue with empty object
      }
      
      // Initialize empty questTitles if no valid stored data
      this.questTitles = {};
    }
    
    saveQuestTitles() {
      if (this.questTitles && Object.keys(this.questTitles).length > 0) {
        try {
          localStorage.setItem('questTitles', JSON.stringify(this.questTitles));
        } catch (error) {
          // Ignore localStorage errors
        }
      }
    }
    
    getStoredTotalQuests() {
      try {
        const stored = localStorage.getItem('totalQuests');
        if (stored) {
          const total = parseInt(stored, 10);
          if (!isNaN(total) && total > 0) {
            return total;
          }
        }
      } catch (error) {
        // Ignore localStorage errors
      }
      return null;
    }
    
    saveStoredTotalQuests(total) {
      try {
        localStorage.setItem('totalQuests', total.toString());
      } catch (error) {
        // Ignore localStorage errors
      }
    }

    detectMultiTheme() {
      // Check if we're in a subdirectory (multi-theme setup)
      const pathSegments = window.location.pathname.split('/').filter(s => s);
      // If we're in a theme subdirectory (e.g., /space/, /mythical/), it's multi-theme
      const inThemeSubdirectory = pathSegments.length > 1 && THEMES[pathSegments[pathSegments.length - 2]];
      
      // Additional check: if the "Change Adventure Theme" link would go to a valid parent directory
      // This handles cases where we might be nested deeper but still in a multi-theme setup
      if (inThemeSubdirectory) {
        return true;
      }
      
      // Fallback: check if we can determine from the URL structure
      return pathSegments.length > 1 && pathSegments[0] !== 'index.html';
    }

    init() {
      this.createNavigationOverlay();
      this.enhanceQuestNavigation();
      this.attachEventListeners();
      this.addKeyboardShortcuts();
      this.addNavbarQuestLink();
    }

    createFloatingButton() {
      const button = document.createElement('button');
      button.id = 'quest-navigator-btn';
      button.className = `quest-nav-floating ${THEMES[this.currentTheme].bgClass}`;
      button.setAttribute('aria-label', 'Open quest navigator');
      button.innerHTML = `
        <span class="nav-icon">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="24" height="24" class="compass-icon">
            <g class="compass-spikes">
              <path d="M100 5 L105 25 L100 20 L95 25 Z" fill="currentColor"/>
              <path d="M195 100 L175 95 L180 100 L175 105 Z" fill="currentColor"/>
              <path d="M100 195 L95 175 L100 180 L105 175 Z" fill="currentColor"/>
              <path d="M5 100 L25 105 L20 100 L25 95 Z" fill="currentColor"/>
              <path d="M164 36 L159 51 L155 46 L150 52 Z" fill="currentColor"/>
              <path d="M164 164 L150 148 L155 154 L159 149 Z" fill="currentColor"/>
              <path d="M36 164 L51 159 L46 155 L52 150 Z" fill="currentColor"/>
              <path d="M36 36 L52 50 L46 45 L51 41 Z" fill="currentColor"/>
            </g>
            <circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" stroke-width="3"/>
            <circle cx="100" cy="100" r="75" fill="none" stroke="currentColor" stroke-width="6"/>
            <g class="compass-segments">
              <path d="M100 25 A75 75 0 0 1 153 47 L145 55 A65 65 0 0 0 100 35 Z" fill="currentColor" opacity="0.8"/>
              <path d="M153 153 A75 75 0 0 1 100 175 L100 165 A65 65 0 0 0 145 145 Z" fill="currentColor" opacity="0.8"/>
              <path d="M47 153 A75 75 0 0 1 25 100 L35 100 A65 65 0 0 0 55 145 Z" fill="currentColor" opacity="0.8"/>
              <path d="M25 100 A75 75 0 0 1 47 47 L55 55 A65 65 0 0 0 35 100 Z" fill="currentColor" opacity="0.8"/>
            </g>
            <circle cx="100" cy="100" r="65" fill="none" stroke="currentColor" stroke-width="2"/>
            <circle cx="100" cy="100" r="55" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="3,3"/>
            <g class="compass-rose">
              <path d="M100 45 L110 95 L100 85 L90 95 Z" fill="currentColor"/>
              <path d="M100 155 L90 105 L100 115 L110 105 Z" fill="currentColor" opacity="0.7"/>
              <path d="M155 100 L105 90 L115 100 L105 110 Z" fill="currentColor" opacity="0.7"/>
              <path d="M45 100 L95 110 L85 100 L95 90 Z" fill="currentColor" opacity="0.7"/>
              <path d="M135 65 L100 90 L110 80 L105 85 Z" fill="currentColor" opacity="0.5"/>
              <path d="M135 135 L105 115 L110 120 L100 110 Z" fill="currentColor" opacity="0.5"/>
              <path d="M65 135 L95 115 L90 120 L100 110 Z" fill="currentColor" opacity="0.5"/>
              <path d="M65 65 L100 90 L90 80 L95 85 Z" fill="currentColor" opacity="0.5"/>
            </g>
            <circle cx="100" cy="100" r="8" fill="currentColor"/>
            <circle cx="100" cy="100" r="4" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"/>
          </svg>
        </span>
        <span class="nav-label">Map</span>
      `;
      document.body.appendChild(button);
    }

    createNavigationOverlay() {
      const overlay = document.createElement('div');
      overlay.id = 'quest-navigator-overlay';
      overlay.className = 'quest-nav-overlay';
      overlay.innerHTML = `
        <div class="quest-nav-container ${THEMES[this.currentTheme].bgClass}">
          <button class="quest-nav-close" aria-label="Close navigator">&times;</button>
          <h2 class="quest-nav-title">${THEMES[this.currentTheme].mapTitle}</h2>
          
          ${this.isMultiTheme ? `
            <div class="quest-nav-realms">
              <a href="../" class="realm-selector">← Change Adventure Theme</a>
            </div>
          ` : ''}
          
          <div class="quest-nav-home">
            <a href="index.html" class="home-link">
              <span class="home-icon">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>
                </svg>
              </span>
              ${THEMES[this.currentTheme].homeText}
            </a>
          </div>
          
          <div class="quest-nav-grid">
            ${this.generateQuestGrid()}
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    generateQuestGrid() {
      let gridHTML = '';
      
      for (let i = 1; i <= this.totalQuests; i++) {
        const questTitle = this.getQuestTitle(i);
        
        gridHTML += `
          <a href="quest-${i}.html" class="quest-nav-item" data-quest="${i}">
            <div class="quest-number">${THEMES[this.currentTheme].questPrefix} ${i}</div>
            <div class="quest-title">${questTitle}</div>
          </a>
        `;
      }
      
      return gridHTML;
    }


    getQuestTitle(questNum) {
      // First, try to use stored quest titles
      if (this.questTitles && this.questTitles[questNum]) {
        const title = this.questTitles[questNum];
        // Clean up common quest number prefixes
        const cleanTitle = title.replace(/^Quest \d+:\s*/, '');
        return cleanTitle || title; // Return original if cleaning resulted in empty string
      }
      
      // If we're currently on this quest, get title from page header and store it
      if (questNum === this.currentQuest) {
        const pageTitle = document.querySelector('h1')?.textContent;
        if (pageTitle) {
          // Store this title for future use
          this.questTitles = this.questTitles || {};
          this.questTitles[questNum] = pageTitle;
          this.saveQuestTitles();
          
          const cleanTitle = pageTitle.replace(/^Quest \d+:\s*/, '');
          return cleanTitle || pageTitle;
        }
      }
      
      // Try to get from quest links on current page
      const questLink = document.querySelector(`a[href="quest-${questNum}.html"]`);
      if (questLink) {
        const titleElement = questLink.querySelector('h3');
        if (titleElement) {
          const title = titleElement.textContent;
          // Store this title for future use
          this.questTitles = this.questTitles || {};
          this.questTitles[questNum] = title;
          this.saveQuestTitles();
          
          const cleanTitle = title.replace(/^Quest \d+:\s*/, '');
          return cleanTitle || title;
        }
      }
      
      // Final fallback - just use the quest number
      return `${THEMES[this.currentTheme].questPrefix} ${questNum}`;
    }


    enhanceQuestNavigation() {
      const navContainer = document.querySelector('.quest-navigation-bottom');
      if (!navContainer) return;

      // Only add previous button if it doesn't already exist
      if (this.currentQuest && this.currentQuest > 1) {
        const existingPrevButton = navContainer.querySelector('.prev-quest-btn');
        if (!existingPrevButton) {
          const prevButton = document.createElement('a');
          prevButton.href = `quest-${this.currentQuest - 1}.html`;
          prevButton.className = 'prev-quest-btn';
          prevButton.innerHTML = `← Previous: Quest ${this.currentQuest - 1}`;
          navContainer.insertBefore(prevButton, navContainer.firstChild);
        }
      }

      // Add home button if on last quest
      if (this.currentQuest === this.totalQuests) {
        const navContainer = document.querySelector('.quest-navigation-bottom');
        if (navContainer) {
          const nextButton = navContainer.querySelector('.next-quest-btn');
          if (nextButton) {
            nextButton.innerHTML = `Complete Adventure →`;
            nextButton.href = 'summary.html';
            nextButton.classList.add('complete-btn');
          }
        }
      }
    }

    attachEventListeners() {
      const overlay = document.getElementById('quest-navigator-overlay');
      const closeBtn = overlay.querySelector('.quest-nav-close');

      closeBtn.addEventListener('click', () => this.closeNavigator());
      
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeNavigator();
        }
      });
    }

    addKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
        // M key opens map
        if (e.key === 'm' || e.key === 'M') {
          if (!this.isInputFocused()) {
            this.toggleNavigator();
          }
        }
        
        // Escape closes navigator
        if (e.key === 'Escape') {
          this.closeNavigator();
        }
        
        // Arrow keys for quest navigation (when navigator is closed)
        if (!this.isNavigatorOpen() && this.currentQuest) {
          if (e.key === 'ArrowLeft' && this.currentQuest > 1) {
            window.location.href = `quest-${this.currentQuest - 1}.html`;
          }
          if (e.key === 'ArrowRight' && this.currentQuest < this.totalQuests) {
            window.location.href = `quest-${this.currentQuest + 1}.html`;
          }
        }
      });
    }

    isInputFocused() {
      const activeElement = document.activeElement;
      return activeElement.tagName === 'INPUT' || 
             activeElement.tagName === 'TEXTAREA' || 
             activeElement.isContentEditable;
    }

    isNavigatorOpen() {
      return document.getElementById('quest-navigator-overlay').classList.contains('active');
    }

    openNavigator() {
      const overlay = document.getElementById('quest-navigator-overlay');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    closeNavigator() {
      const overlay = document.getElementById('quest-navigator-overlay');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    toggleNavigator() {
      if (this.isNavigatorOpen()) {
        this.closeNavigator();
      } else {
        this.openNavigator();
      }
    }

    addNavbarQuestLink() {
      // Add click handler for the "Quests" link in the navbar
      const questLink = document.querySelector('.quest-map-trigger');
      if (questLink) {
        questLink.addEventListener('click', (e) => {
          e.preventDefault();
          this.openNavigator();
        });
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new QuestNavigator());
  } else {
    new QuestNavigator();
  }
})();