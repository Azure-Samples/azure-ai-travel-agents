/**
 * Light/Dark theme toggle functionality
 * Manages theme switching and persistence using localStorage
 */

(function() {
  'use strict';

  // Initialize theme on page load
  function initTheme() {
    // Check for saved theme preference or default to 'dark'
    // This preference persists across all adventure themes
    const savedTheme = localStorage.getItem('theme-mode') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateToggleButton(savedTheme);
  }

  // Toggle between light and dark themes
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Update DOM
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Save preference
    localStorage.setItem('theme-mode', newTheme);
    
    // Update button appearance
    updateToggleButton(newTheme);
  }

  // Update toggle button appearance based on current theme
  function updateToggleButton(theme) {
    const toggleBtn = document.querySelector('.theme-toggle-btn');
    if (!toggleBtn) return;
    
    const isDark = theme === 'dark';
    toggleBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    toggleBtn.classList.toggle('dark-mode', isDark);
  }

  // Set up event listeners when DOM is ready
  function setupToggle() {
    const toggleBtn = document.querySelector('.theme-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleTheme);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initTheme();
      setupToggle();
    });
  } else {
    // DOM already loaded
    initTheme();
    setupToggle();
  }
})();