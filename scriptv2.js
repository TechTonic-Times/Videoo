// ====== UNIQUE PAGE IDENTIFIER FOR LOCALSTORAGE ======
const getPageId = () => {
  const path = window.location.pathname;
  const page = path.split("/").pop().replace(".html", "") || "home";
  return page.replace(/[^a-z0-9]/gi, '_');
};
const PAGE_ID = getPageId();

// ====== CACHED DATA FETCHER (Prevents multiple JSON requests) ======
let articleDataCache = null;
let articleFetchPromise = null;

async function getArticleData() {
  if (articleDataCache) return articleDataCache;
  
  if (!articleFetchPromise) {
    articleFetchPromise = fetch('article-data.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        articleDataCache = data;
        return data;
      })
      .catch(err => {
        console.error('❌ Failed to fetch article-data.json:', err);
        articleFetchPromise = null; // Reset to allow retry if needed
        return null;
      });
  }
  return articleFetchPromise;
}

// ---------- THEME WITH ANIMATION ----------
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const savedTheme = localStorage.getItem('theme');
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const isDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);

function applyTheme(dark) {
  if (dark) body.classList.add('dark-mode');
  else body.classList.remove('dark-mode');
  localStorage.setItem('theme', dark ? 'dark' : 'light');
}

applyTheme(isDark);

async function toggleTheme() {
  if (!document.startViewTransition) {
    body.classList.toggle('dark-mode');
    localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
    return;
  }
  await document.startViewTransition(() => {
    body.classList.toggle('dark-mode');
    localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
  }).ready;

  const { top, left, width, height } = themeToggle.getBoundingClientRect();
  const x = left + width / 2;
  const y = top + height / 2;
  const maxRadius = Math.hypot(
    Math.max(left, innerWidth - left),
    Math.max(top, innerHeight - top)
  );

  document.documentElement.animate({
    clipPath: [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${maxRadius}px at ${x}px ${y}px)`
    ]
  }, {
    duration: 1000,
    easing: 'ease-in-out',
    pseudoElement: '::view-transition-new(root)'
  });
}

if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

// ---------- SCROLL & UI UPDATES ----------
const backToTopBtn = document.getElementById('backToTop');
const scrollIndicator = document.querySelector('.scroll-indicator');
const progressEl = document.getElementById('scrollProgress');
let scrollTimeout;
let isScrolling = false;

function toggleBackToTop() {
  if (!backToTopBtn) return;
  if (window.scrollY > 300) {
    backToTopBtn.classList.add('visible');
  } else {
    backToTopBtn.classList.remove('visible');
  }
}

function updateScrollIndicator() {
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;
  if (progressEl) progressEl.style.width = scrolled + '%';

  if (scrollIndicator) {
    scrollIndicator.classList.add('visible');
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      scrollIndicator.classList.remove('visible');
    }, 300);
  }
}

function updateThemeTogglePosition() {
  const themeToggleEl = document.getElementById('themeToggle');
  const menuToggleEl = document.getElementById('menuToggle');
  if (window.scrollY > 35) {
    if (themeToggleEl) themeToggleEl.classList.add('scrolled');
    if (menuToggleEl) menuToggleEl.classList.add('scrolled');
  } else {
    if (themeToggleEl) themeToggleEl.classList.remove('scrolled');
    if (menuToggleEl) menuToggleEl.classList.remove('scrolled');
  }
}

window.addEventListener('scroll', () => {
  if (!isScrolling) {
    window.requestAnimationFrame(() => {
      updateScrollIndicator();
      updateThemeTogglePosition();
      toggleBackToTop();
      checkVisibility(); // Section reveal
      isScrolling = false;
    });
    isScrolling = true;
  }
}, { passive: true }); // Passive listener for better scroll performance

if (backToTopBtn) {
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Initial checks
window.addEventListener('load', () => {
  updateScrollIndicator();
  if (scrollIndicator) {
    scrollIndicator.classList.add('visible');
    setTimeout(() => {
      scrollIndicator.classList.remove('visible');
    }, 1000);
  }
  checkVisibility();
});

// ---------- SECTION REVEAL ON SCROLL ----------
function checkVisibility() {
  const sections = document.querySelectorAll('.fade-up-section');
  const windowHeight = window.innerHeight;
  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    const isVisible = rect.top < windowHeight - 100 && rect.bottom > 50;
    if (isVisible) {
      section.classList.add('visible');
    }
  });
}

// ---------- MENU FUNCTIONALITY ----------
const menuToggle = document.getElementById('menuToggle');
const menuCard = document.getElementById('menuCard');
const menuClose = document.getElementById('menuClose');
const backdrop = document.getElementById('backdrop');
const dropdownToggle = document.querySelector('.dropdown-toggle');
const dropdownParent = document.querySelector('.dropdown-parent');

function openMenu() {
  if(menuCard) menuCard.classList.add('open');
  if(backdrop) backdrop.classList.add('visible');
  document.body.style.overflow = 'hidden';
  if(menuToggle) {
    menuToggle.style.opacity = '0';
    menuToggle.style.visibility = 'hidden';
    menuToggle.style.transform = 'scale(0.8)';
  }
}

function closeMenu() {
  if(menuCard) menuCard.classList.remove('open');
  if(backdrop) backdrop.classList.remove('visible');
  document.body.style.overflow = '';
  if(menuToggle) {
    menuToggle.style.opacity = '1';
    menuToggle.style.visibility = 'visible';
    menuToggle.style.transform = 'scale(1)';
  }
  if (dropdownParent) {
    dropdownParent.classList.remove('active');
  }
}

if (menuToggle) {
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (menuCard.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });
}

if (menuClose) {
  menuClose.addEventListener('click', closeMenu);
}

if (backdrop) {
  backdrop.addEventListener('click', closeMenu);
}

document.querySelectorAll('.menu-link:not(.dropdown-toggle)').forEach(link => {
  link.addEventListener('click', closeMenu);
});

if (dropdownToggle) {
  dropdownToggle.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    if(dropdownParent) dropdownParent.classList.toggle('active');
    return false;
  });
}

document.querySelectorAll('.dropdown-item').forEach(item => {
  item.addEventListener('click', function(e) {
    e.stopPropagation();
    if (dropdownParent) {
      dropdownParent.classList.remove('active');
    }
  });
});

document.addEventListener('click', function(e) {
  if (dropdownParent && !dropdownParent.contains(e.target) && dropdownParent.classList.contains('active')) {
    dropdownParent.classList.remove('active');
  }
  if (menuCard && menuToggle && !menuCard.contains(e.target) &&
    !menuToggle.contains(e.target) &&
    e.target !== menuToggle &&
    menuCard.classList.contains('open')) {
    closeMenu();
  }
});

// ---------- NEWSLETTER MODAL ----------
const newsletterForm = document.getElementById('newsletterForm');
const newsletterModal = document.getElementById('newsletterModal');
const newsletterModalClose = document.getElementById('newsletterModalClose');

if (newsletterForm) {
  newsletterForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (newsletterModal) {
      newsletterModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    this.reset();
    return false;
  });
}

if (newsletterModalClose) {
  newsletterModalClose.addEventListener('click', function() {
    newsletterModal.classList.remove('active');
    document.body.style.overflow = '';
  });
}

if (newsletterModal) {
  newsletterModal.addEventListener('click', function(e) {
    if (e.target === newsletterModal) {
      newsletterModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

// ---------- TOOLBAR ----------
const toolbar = document.getElementById('toolbar');
let currentActiveIcon = null;
let selectedReactionEmoji = localStorage.getItem(`selectedReaction_${PAGE_ID}`) || '❤️';
let currentFontSize = 16;

function updateReactionIcon(emoji) {
  const likeSpan = document.getElementById('likeEmoji');
  if (likeSpan) {
    if (emoji === '👍') likeSpan.innerHTML = '<i class="fa-regular fa-thumbs-up"></i>';
    else if (emoji === '❤️') likeSpan.innerHTML = '<i class="fas fa-heart"></i>';
    else if (emoji === '😮') likeSpan.innerHTML = '<i class="fa-regular fa-face-surprise"></i>';
    else if (emoji === '😢') likeSpan.innerHTML = '<i class="fa-regular fa-face-sad-tear"></i>';
    else if (emoji === '😠') likeSpan.innerHTML = '<i class="fa-regular fa-face-angry"></i>';
  }
  localStorage.setItem(`selectedReaction_${PAGE_ID}`, emoji);
}

updateReactionIcon(selectedReactionEmoji);

function setTextSize(px) {
  const content = document.getElementById('articleContent');
  if (content) {
    content.style.fontSize = px + 'px';
  }
  document.querySelectorAll('.article-single-content p').forEach(p => p.style.fontSize = px + 'px');
  const label = document.getElementById('pxValue');
  if (label) label.innerText = px + 'px';
}

function getSettingsPanel(iconType) {
  const panel = document.createElement('div');
  panel.className = 'settings-panel';
  if (iconType === 'text') {
    panel.innerHTML = `<div class="settings-item"><i class="fas fa-text-height"></i><span>Size:</span><div class="text-size-slider"><input type="range" id="textSizeSlider" min="12" max="24" value="16" step="1"><span id="pxValue">16px</span></div></div>`;
  } else if (iconType === 'like') {
    panel.innerHTML = `<div class="settings-item"><span>React:</span><div class="reaction-grid"><button class="reaction-icon" data-emoji="👍"><i class="fa-regular fa-thumbs-up fa-2x"></i></button><button class="reaction-icon" data-emoji="❤️"><i class="fas fa-heart fa-2x"></i></button><button class="reaction-icon" data-emoji="😮"><i class="fa-regular fa-face-surprise fa-2x"></i></button><button class="reaction-icon" data-emoji="😢"><i class="fa-regular fa-face-sad-tear fa-2x"></i></button><button class="reaction-icon" data-emoji="😠"><i class="fa-regular fa-face-angry fa-2x"></i></button></div></div>`;
  } else if (iconType === 'share') {
    panel.innerHTML = `<div class="share-grid"><button class="social-icon" data-platform="facebook"><i class="fab fa-facebook-f"></i></button><button class="social-icon" data-platform="x"><svg class="x-logo-svg" viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg></button><button class="social-icon" data-platform="telegram"><i class="fab fa-telegram-plane"></i></button><button class="social-icon" data-platform="reddit"><i class="fab fa-reddit-alien"></i></button><button class="social-icon" data-platform="email"><i class="fas fa-envelope"></i></button><button class="copy-btn" id="copyLinkBtn"><i class="fas fa-copy"></i></button></div>`;
  }
  return panel;
}

function expandToolbar(iconType) {
  currentActiveIcon = iconType;
  document.querySelectorAll('.toolbar-icon').forEach(icon => icon.classList.add('hidden-icon'));
  toolbar.classList.remove('toolbar-collapsed');
  toolbar.classList.add('toolbar-expanded');
  toolbar.innerHTML = '';
  
  const settingsPanel = getSettingsPanel(iconType);
  const crossBtn = document.createElement('button');
  crossBtn.className = 'cross-button';
  crossBtn.innerHTML = '<i class="fas fa-times"></i>';
  crossBtn.addEventListener('click', () => {
    collapseToolbar();
  });

  toolbar.appendChild(settingsPanel);
  toolbar.appendChild(crossBtn);
  attachSettingsFunctionality(iconType);
}

function collapseToolbar() {
  currentActiveIcon = null;
  toolbar.classList.remove('toolbar-expanded');
  toolbar.classList.add('toolbar-collapsed');
  // Restore default icons
  toolbar.innerHTML = `<div id="iconGroup" class="toolbar-icons"><button id="iconTextSize" class="toolbar-icon" title="Text size"><i class="fas fa-text-height"></i></button><button id="iconLike" class="toolbar-icon" title="React"><span id="likeEmoji">${document.getElementById('likeEmoji')?.innerHTML || '<i class="fas fa-heart"></i>'}</span></button><button id="iconShare" class="toolbar-icon" title="Share"><i class="fa-solid fa-share"></i></button></div>`;
  attachIconListeners();
  updateReactionIcon(selectedReactionEmoji);
}

function attachSettingsFunctionality(iconType) {
  if (iconType === 'text') {
    const slider = document.getElementById('textSizeSlider');
    if (slider) {
      slider.value = currentFontSize;
      setTextSize(currentFontSize);
      slider.addEventListener('input', e => {
        currentFontSize = e.target.value;
        setTextSize(currentFontSize);
      });
    }
  } else if (iconType === 'like') {
    document.querySelectorAll('.reaction-icon').forEach(btn => {
      btn.addEventListener('click', e => {
        selectedReactionEmoji = e.currentTarget.dataset.emoji;
        updateReactionIcon(selectedReactionEmoji);
        setTimeout(collapseToolbar, 150);
      });
    });
  } else if (iconType === 'share') {
    document.querySelectorAll('.social-icon').forEach(btn =>
      btn.addEventListener('click', e => {
        shareAction(e.currentTarget.dataset.platform);
      })
    );
    document.getElementById('copyLinkBtn')?.addEventListener('click', copyLink);
  }
}

function attachIconListeners() {
  document.getElementById('iconTextSize')?.addEventListener('click', () => expandToolbar('text'));
  document.getElementById('iconLike')?.addEventListener('click', () => expandToolbar('like'));
  document.getElementById('iconShare')?.addEventListener('click', () => expandToolbar('share'));
}

attachIconListeners();

function shareAction(platform) {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(getPageTitle());
  let shareUrl = '';
  if (platform === 'facebook') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  else if (platform === 'instagram') { window.open('https://www.instagram.com/', '_blank'); return; }
  else if (platform === 'x') shareUrl = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
  else if (platform === 'linkedin') shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
  else if (platform === 'reddit') shareUrl = `https://www.reddit.com/submit?url=${url}&title=${title}`;
  else if (platform === 'whatsapp') shareUrl = `https://wa.me/?text=${title}%20${url}`;
  else if (platform === 'telegram') shareUrl = `https://t.me/share/url?url=${url}&text=${title}`;
  else if (platform === 'pinterest') shareUrl = `https://pinterest.com/pin/create/button/?url=${url}&description=${title}`;
  else if (platform === 'email') shareUrl = `mailto:?subject=${title}&body=${url}`;
  else if (platform === 'hackernews') shareUrl = `https://news.ycombinator.com/submitlink?u=${url}&t=${title}`;

  if (shareUrl) window.open(shareUrl, '_blank');
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href);
  const copyBtn1 = document.getElementById('copyLinkBtn');
  const copyBtn2 = document.getElementById('copyLinkBtn2');
  if (copyBtn1) {
    copyBtn1.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => { copyBtn1.innerHTML = '<i class="fas fa-copy"></i>'; }, 2000);
  }
  if (copyBtn2) {
    copyBtn2.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => { copyBtn2.innerHTML = '<i class="fas fa-copy"></i>'; }, 2000);
  }
}

// ---------- POST-ARTICLE FUNCTIONALITY ----------
document.querySelectorAll('.share-section .share-icon-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const platform = e.currentTarget.dataset.platform;
    if (platform) shareAction(platform);
  });
});

document.getElementById('copyLinkBtn2')?.addEventListener('click', copyLink);

// FAQ Accordion
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
  const question = item.querySelector('.faq-question');
  question.addEventListener('click', () => {
    const isActive = question.classList.contains('active');
    faqItems.forEach(i => {
      i.querySelector('.faq-question').classList.remove('active');
      i.querySelector('.faq-answer').classList.remove('show');
    });
    if (!isActive) {
      question.classList.add('active');
      item.querySelector('.faq-answer').classList.add('show');
    }
  });
});

// ====== LAZY LOADING FOR IMAGES (Optimized) ======
function fixImageBlurriness() {
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    // Only process if not already loaded
    if (img.classList.contains('loaded')) return;

    const markAsLoaded = () => {
      img.classList.add('loaded');
    };

    if (img.complete && img.naturalHeight !== 0) {
      markAsLoaded();
    } else {
      img.addEventListener('load', markAsLoaded, { once: true });
      img.addEventListener('error', markAsLoaded, { once: true });
    }
  });
}

// Run initially
fixImageBlurriness();
// Run after DOM content is ready
document.addEventListener('DOMContentLoaded', fixImageBlurriness);


// ====== DYNAMIC LINK - FROM RELATED ARTICLES SECTION ======
function renderDynamicLink() {
  const container = document.getElementById('dynamic-link-container');
  const relatedContainer = document.getElementById('relatedArticlesContainer');
  if (!container || !relatedContainer) return;

  const articleCards = relatedContainer.querySelectorAll('.related-article-card');
  if (articleCards.length === 0) return;

  const articles = [];
  articleCards.forEach(card => {
    const titleEl = card.querySelector('.related-article-title');
    const linkEl = card.querySelector('.related-read-btn');
    if (titleEl && linkEl) {
      articles.push({
        title: titleEl.textContent.trim(),
        url: linkEl.href
      });
    }
  });

  if (articles.length === 0) return;

  const randomIndex = Math.floor(Math.random() * articles.length);
  const selectedArticle = articles[randomIndex];

  container.innerHTML = `
    <div class="dynamic-link-box">
      <a href="${selectedArticle.url}" class="dynamic-link-text">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <span class="link-text-span">${selectedArticle.title}</span>
      </a>
    </div>`;
}

// ====== AUTO-SYNC TITLE FROM H1 ======
function getPageTitle() {
  const h1 = document.getElementById('articleMainTitle');
  return h1 ? h1.textContent.trim() : document.title;
}

function syncArticleData() {
  const title = getPageTitle();
  const breadcrumb = document.querySelector('.breadcrumb li[aria-current="page"]');
  if (breadcrumb) breadcrumb.textContent = title;

  const img = document.querySelector('.image-container img');
  if (img) img.alt = title;
  document.title = title;
}

// ---------- PUBLISH TIME FORMATTING ----------
const publishTimeEl = document.getElementById("publish-time");
if (publishTimeEl) {
  const utcTime = publishTimeEl.getAttribute("data-utc");
  if (utcTime) {
    const date = new Date(utcTime);
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    };
    publishTimeEl.textContent = date.toLocaleString(undefined, options);
  }
}

// ====== OPTIMIZED ARTICLE LOADERS (Using Cached Fetch & Idle Callback) ======

async function loadRelatedArticles() {
  const container = document.getElementById('relatedArticlesContainer');
  if (!container) return;

  container.innerHTML = `<div class="text-center py-6 text-gray-500"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;

  try {
    const allArticles = await getArticleData();
    if (!allArticles) throw new Error('No data');

    const currentUrl = window.location.href;
    const otherArticles = allArticles
      .filter(article => !currentUrl.endsWith(article.url.split('/').pop()))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const top5 = otherArticles.slice(0, 5);
    container.innerHTML = '';

    if (top5.length === 0) {
      container.innerHTML = '<p class="text-center text-gray-500">No stories found.</p>';
      return;
    }

    const fragment = document.createDocumentFragment();
    top5.forEach(article => {
      const dateObj = new Date(article.timestamp);
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });

      const div = document.createElement('div');
      div.className = 'related-article-card';
      div.innerHTML = `
        <img src="${article.image}" alt="${article.title}" class="related-article-image" loading="lazy" onerror="this.src='https://via.placeholder.com/120x120?text=News'">
        <div class="related-article-content">
          <div class="related-article-title">${article.title}</div>
          <div class="related-article-description">${article.excerpt || ''}</div>
          <div class="related-article-footer">
            <span class="related-timestamp"><i class="fa-regular fa-calendar"></i> ${formattedDate}</span>
            <a href="${article.url}" class="related-read-btn" target="_blank">Read Now</a>
          </div>
        </div>`;
      fragment.appendChild(div);
    });
    container.appendChild(fragment);
    
    // Re-apply lazy load blur to new images
    setTimeout(fixImageBlurriness, 100);

  } catch (error) {
    console.error('Error loading related articles:', error);
    container.innerHTML = '<p class="text-center text-red-500">Failed to load.</p>';
  }
}

async function loadLatestArticles() {
  const container = document.getElementById('latestArticlesContainer');
  if (!container) return;

  container.innerHTML = `<div class="text-center py-6 text-gray-500"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;

  try {
    const allArticles = await getArticleData();
    if (!allArticles) throw new Error('No data');

    const currentFile = window.location.pathname.split('/').pop();
    const otherArticles = allArticles
      .filter(article => {
        const articleFile = article.url.replace(/^https?:\/\/[^\/]+/, '').split('/').pop();
        return articleFile !== currentFile;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const latest5 = otherArticles.slice(0, 5);
    container.innerHTML = '';

    if (latest5.length === 0) {
      container.innerHTML = '<p class="text-center text-gray-500">No articles found.</p>';
      return;
    }

    const fragment = document.createDocumentFragment();
    latest5.forEach((article, index) => {
      const dateObj = new Date(article.timestamp);
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });

      const div = document.createElement('div');
      div.className = 'latest-article-card';
      div.style.animationDelay = `${index * 0.1}s`;
      div.innerHTML = `
        <img src="${article.image}" alt="${article.title}" class="latest-article-image" loading="lazy" onerror="this.src='https://via.placeholder.com/120x120?text=News'">
        <div class="latest-article-content">
          <div class="latest-article-title">${article.title}</div>
          <div class="latest-article-description">${article.excerpt || article.description || ''}</div>
          <div class="latest-article-footer">
            <span class="latest-timestamp"><i class="fa-regular fa-calendar"></i> ${formattedDate}</span>
            <a href="${article.url}" class="latest-read-btn" target="_blank">Read Now</a>
          </div>
        </div>`;
      fragment.appendChild(div);
    });
    container.appendChild(fragment);
    
    setTimeout(fixImageBlurriness, 100);

  } catch (error) {
    console.error('Error loading latest articles:', error);
    container.innerHTML = '<p class="text-center text-red-500">Failed to load.</p>';
  }
}

async function loadLatestDynamicLink() {
  const container = document.getElementById('latest-dynamic-link-container');
  if (!container) return;

  try {
    const allArticles = await getArticleData();
    if (!allArticles) return;

    const currentFile = window.location.pathname.split('/').pop();
    const filtered = allArticles
      .filter(article => {
        const articleFile = article.url.replace(/^https?:\/\/[^\/]+/, '').split('/').pop();
        return articleFile !== currentFile;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const latest5 = filtered.slice(0, 5);
    if (latest5.length === 0) return;

    const picked = latest5[Math.floor(Math.random() * latest5.length)];

    container.innerHTML = `
      <div class="latest-dynamic-link-box">
        <a href="${picked.url}" class="latest-dynamic-link-text">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span class="latest-link-text-span">${picked.title}</span>
        </a>
      </div>`;

  } catch (error) {
    console.error('Error loading latest dynamic link:', error);
    container.innerHTML = '';
  }
}

// ====== DEFERRED INITIALIZATION (Critical for Speed Index) ======
function deferNonCriticalContent() {
  if (document.getElementById('relatedArticlesContainer')) loadRelatedArticles();
  if (document.getElementById('latestArticlesContainer')) loadLatestArticles();
  if (document.getElementById('latest-dynamic-link-container')) loadLatestDynamicLink();
  
  // Render dynamic link from related articles if container exists
  if (document.getElementById('dynamic-link-container')) {
     // Wait slightly for related articles to render first if they are on same page
     setTimeout(renderDynamicLink, 500);
  }
}

// Use requestIdleCallback to defer until main thread is free
if ('requestIdleCallback' in window) {
  requestIdleCallback(deferNonCriticalContent, { timeout: 2000 });
} else {
  setTimeout(deferNonCriticalContent, 2000);
}

// Sync title immediately as it's lightweight
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', syncArticleData);
} else {
  syncArticleData();
}

// ====== SMOOTH SCROLL TO AUTHOR SECTION ======
function scrollToAuthorSection() {
  const authorSection = document.getElementById('authorSection');
  if (authorSection) {
    const sectionPosition = authorSection.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = sectionPosition - (window.innerHeight / 2) + (authorSection.offsetHeight / 2);
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
    setTimeout(() => {
      authorSection.style.transition = 'all 0.5s ease';
      authorSection.style.boxShadow = '0 0 0 3px rgba(14, 123, 127, 0.3)';
      setTimeout(() => {
        authorSection.style.boxShadow = '';
      }, 2000);
    }, 500);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const authorLinks = document.querySelectorAll('.author-link, .article-author span');
  authorLinks.forEach(link => {
    if (link.textContent.includes('Mir Mushfikur Rahman') || link.classList.contains('author-link')) {
      link.style.cursor = 'pointer';
      link.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToAuthorSection();
      });
    }
  });
  const authorNameInBio = document.querySelector('.author-name');
  if (authorNameInBio) {
    authorNameInBio.addEventListener('click', () => {
      scrollToAuthorSection();
    });
  }
});
