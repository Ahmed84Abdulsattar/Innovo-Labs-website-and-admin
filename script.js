/* ═══════════════════════════════════════════════════════════════
   INNOVO — script.js
   Main site: loads articles from CMS, handles the article grid,
   article modal, nav scroll behaviour, and reveal animations.
   ═══════════════════════════════════════════════════════════════ */


/* ════════════════════════════════════════════════════════════════
   NAV — Scroll progress bar + state transitions
   ════════════════════════════════════════════════════════════════ */

window.addEventListener('scroll', function() {
  var scrolled  = window.scrollY;
  var maxScroll = document.body.scrollHeight - window.innerHeight;

  /* Reading progress bar */
  var pct = maxScroll > 0 ? (scrolled / maxScroll) * 100 : 0;
  document.getElementById('bar').style.width = pct + '%';

  /* Nav: floating pill → full-width solid bar */
  document.getElementById('nav').classList.toggle('solid', scrolled > 80);

  /* Nav links: highlight Home vs Articles based on scroll position */
  var pastHero = scrolled >= 200;
  document.getElementById('nav-home').classList.toggle('active-nav',  !pastHero);
  document.getElementById('nav-articles').classList.toggle('active-nav', pastHero);

}, { passive: true });

/* Highlight Home link on initial load */
document.getElementById('nav-home').classList.add('active-nav');


/* ════════════════════════════════════════════════════════════════
   REVEAL — Animate elements into view on scroll
   ════════════════════════════════════════════════════════════════ */

document.querySelectorAll('.rev').forEach(function(el) {
  new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting) el.classList.add('in');
  }, { threshold: 0.08 }).observe(el);
});


/* ════════════════════════════════════════════════════════════════
   CMS — Read articles and featured state from localStorage
   ════════════════════════════════════════════════════════════════ */

function getCMSArticles() {
  try { return JSON.parse(localStorage.getItem('innovo_articles')) || []; }
  catch (e) { return []; }
}

function getFeaturedId() {
  return localStorage.getItem('innovo_featured') || null;
}


/* ════════════════════════════════════════════════════════════════
   ARTICLE GRID — Layout pattern
   ════════════════════════════════════════════════════════════════

   The grid uses a repeating 6-card layout row. Each class maps
   to a CSS grid-column span defined in style.css:

     hero  — full width (first card in a row, large feature)
     third — spans 2 cols  |  third — spans 1 col  |  third — spans 1 col
     one   — spans 2 cols
     two   — spans 1 col

   The pattern repeats via modulo, so any number of articles
   will always produce a complete, balanced layout.

   If you change this, update the matching CSS rules in style.css.
   ════════════════════════════════════════════════════════════════ */

var GRID_LAYOUT = ['hero', 'third', 'third', 'third', 'one', 'two'];


/* ════════════════════════════════════════════════════════════════
   ARTICLE GRID — Render
   ════════════════════════════════════════════════════════════════ */

/* Holds the ordered list of articles currently displayed,
   so openModal can find the right article by display index. */
var _renderedArticles = [];

function renderArticles() {
  var allArticles = getCMSArticles().slice().reverse(); /* newest first */
  var featuredId  = getFeaturedId();
  var orderedArticles;

  if (featuredId) {
    /* Move the featured article to position 0 (hero slot) */
    var featuredArt  = allArticles.find(function(a) { return a.id === featuredId; });
    var remainingArts= allArticles.filter(function(a) { return a.id !== featuredId; });
    orderedArticles  = featuredArt ? [featuredArt].concat(remainingArts) : allArticles;
  } else {
    orderedArticles = allArticles;
  }

  /* Keep a reference so the modal can look up articles by display index */
  _renderedArticles = orderedArticles;

  var grid     = document.getElementById('cmsGrid');
  var emptyMsg = document.getElementById('cmsEmpty');
  if (!grid) return;

  grid.innerHTML = '';

  if (orderedArticles.length === 0) {
    if (emptyMsg) emptyMsg.style.display = 'block';
    return;
  }
  if (emptyMsg) emptyMsg.style.display = 'none';

  orderedArticles.forEach(function(article, index) {
    var layoutClass = GRID_LAYOUT[index % GRID_LAYOUT.length];
    var card        = document.createElement('div');
    card.className  = 'a-card ' + layoutClass;

    /* Capture index in closure for the click handler */
    card.onclick = (function(i) {
      return function() { openModal(i); };
    })(index);

    var thumbHtml = article.thumbnail
      ? '<img class="a-img" src="' + article.thumbnail + '" alt="">'
      : '<div class="a-img" style="background:#1a2f32;"></div>';

    card.innerHTML =
      thumbHtml +
      '<div class="a-ov">' +
        '<div class="a-dt">' + article.date + ' &middot; ' + article.readTime + ' min read</div>' +
        '<h3 class="a-ttl">' + article.title + '</h3>' +
        '<p class="a-ex">'  + article.desc  + '</p>' +
        '<span class="a-rd">Read article ' +
          '<svg viewBox="0 0 24 24">' +
            '<path d="M5 12h14M12 5l7 7-7 7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
          '</svg>' +
        '</span>' +
      '</div>' +
      '<div class="a-arr">' +
        '<svg viewBox="0 0 24 24">' +
          '<path d="M7 17L17 7M17 7H7M17 7v10" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>' +
      '</div>';

    grid.appendChild(card);
  });
}


/* ════════════════════════════════════════════════════════════════
   ARTICLE MODAL — Open / Close
   ════════════════════════════════════════════════════════════════ */

/**
 * Open the article modal.
 * @param {number}  displayIndex — index into _renderedArticles
 * @param {boolean} pushState    — whether to push a history entry (default true)
 */
function openModal(displayIndex, pushState) {
  if (pushState === undefined) pushState = true;

  var article = _renderedArticles[displayIndex];
  if (!article) return;

  /* Build video embed HTML if the article has one */
  var videoHtml = '';
  if (article.videoType === 'youtube' && article.videoSrc) {
    videoHtml =
      '<h3>Watch</h3>' +
      '<div class="m-vid">' +
        '<iframe src="' + article.videoSrc + '" allowfullscreen></iframe>' +
      '</div>';
  } else if (article.videoType === 'upload' && article.videoSrc) {
    videoHtml =
      '<h3>Watch</h3>' +
      '<div class="m-vid">' +
        '<video controls playsinline style="width:100%;border-radius:4px">' +
          '<source src="' + article.videoSrc + '">' +
        '</video>' +
      '</div>';
  }

  document.getElementById('mBody').innerHTML =
    '<div class="m-tag">'  + article.date  + '</div>' +
    '<h1 class="m-ttl">'  + article.title + '</h1>' +
    '<div class="m-meta">' +
      '<span>' + article.date + '</span>' +
      '<span>' + article.readTime + ' min read</span>' +
    '</div>' +
    (article.thumbnail ? '<img class="m-hero" src="' + article.thumbnail + '" alt="">' : '') +
    '<div class="m-text">' + article.body + videoHtml + '</div>';

  var modal = document.getElementById('modal');
  modal.classList.add('open');
  modal.scrollTop = 0;
  document.body.style.overflow = 'hidden';

  if (pushState) {
    history.pushState({ modalOpen: true, articleIndex: displayIndex }, '');
  }
}

/**
 * Close the article modal.
 * @param {boolean} pushState — whether to push a history entry (default true)
 */
function closeModal(pushState) {
  if (pushState === undefined) pushState = true;

  document.getElementById('modal').classList.remove('open');
  document.body.style.overflow = '';

  if (pushState) {
    history.pushState({ modalOpen: false }, '');
  }
}

/* Close on backdrop click */
document.getElementById('modal').addEventListener('click', function(e) {
  if (e.target === e.currentTarget) closeModal();
});

/* Close on Escape key */
document.addEventListener('keydown', function(e) {
  var modal = document.getElementById('modal');
  if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
});

/* Re-open / close on browser back/forward */
window.addEventListener('popstate', function(e) {
  if (e.state && e.state.modalOpen) {
    openModal(e.state.articleIndex, false);
  } else {
    if (document.getElementById('modal').classList.contains('open')) {
      closeModal(false);
    }
  }
});


/* ════════════════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════════════════ */
renderArticles();
