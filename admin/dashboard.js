/* ═══════════════════════════════════════════════════════════════
   INNOVO CMS — dashboard.js
   Handles the admin dashboard: article list, article form,
   stats panel, featured article, toasts, and modals.

   Depends on: cms-users.js  (must load first in dashboard.html)
   Storage keys used:
     innovo_articles  — array of article objects (localStorage)
     innovo_featured  — id of the hero/featured article (localStorage)
     innovo_user      — active session object (sessionStorage)
   ═══════════════════════════════════════════════════════════════ */


/* ════════════════════════════════════════════════════════════════
   STORAGE — Articles
   ════════════════════════════════════════════════════════════════ */

function getArticles() {
  try { return JSON.parse(localStorage.getItem('innovo_articles')) || []; }
  catch (e) { return []; }
}

function saveArticles(articles) {
  localStorage.setItem('innovo_articles', JSON.stringify(articles));
}


/* ════════════════════════════════════════════════════════════════
   STORAGE — Featured article
   ════════════════════════════════════════════════════════════════ */

function getFeaturedId() {
  return localStorage.getItem('innovo_featured') || null;
}

/**
 * Toggle an article as the hero/featured article.
 * If the same article is already featured, unfeature it.
 */
function setFeatured(articleId) {
  var currentFeaturedId = getFeaturedId();

  if (currentFeaturedId === articleId) {
    localStorage.removeItem('innovo_featured');
    showToast('Hero article removed.', 'ok');
  } else {
    localStorage.setItem('innovo_featured', articleId);
    showToast('Hero article set!', 'ok');
  }

  renderArticleList();
}

function clearFeatured() {
  localStorage.removeItem('innovo_featured');
  showToast('Hero article cleared.', 'ok');
  renderArticleList();
}


/* ════════════════════════════════════════════════════════════════
   AUTH — Guard + UI population
   ════════════════════════════════════════════════════════════════ */

var currentUser = cms_getSession();

/* Redirect to login if no active session */
if (!currentUser) {
  window.location.href = 'index.html';
}

/* Populate topbar and sidebar with the logged-in user's name */
document.getElementById('tbUser').textContent       = currentUser ? currentUser.name : '';
var avatarEl   = document.getElementById('sbAv');
var usernameEl = document.getElementById('sbUserName');
if (avatarEl)   avatarEl.textContent   = currentUser ? currentUser.name.charAt(0).toUpperCase() : '';
if (usernameEl) usernameEl.textContent = currentUser ? currentUser.name : '';

function doLogout() {
  cms_clearSession();
  window.location.href = 'index.html';
}


/* ════════════════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
   ════════════════════════════════════════════════════════════════ */

/**
 * Show a brief notification in the top-right corner.
 * @param {string} message  — Text to display.
 * @param {string} type     — 'ok' (aqua dot) or 'err' (red dot).
 */
function showToast(message, type) {
  var container = document.getElementById('toastWrap');
  var toast     = document.createElement('div');

  toast.className = 'toast ' + (type || 'ok');
  toast.innerHTML =
    '<div class="toast-dot"></div>' +
    '<span class="toast-txt">' + message + '</span>';

  container.appendChild(toast);

  /* Double rAF ensures the CSS transition fires after insertion */
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      toast.classList.add('show');
    });
  });

  /* Auto-dismiss after 3.2 s, then remove from DOM */
  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() { toast.remove(); }, 400);
  }, 3200);
}


/* ════════════════════════════════════════════════════════════════
   NAVIGATION — Views + Sidebar
   ════════════════════════════════════════════════════════════════ */

function toggleSidebar() {
  document.body.classList.toggle('sb-off');
}

/**
 * Switch the visible content pane.
 * @param {string} viewName — 'articles' or 'new'
 */
function goView(viewName) {
  /* Hide all views, show the requested one */
  document.querySelectorAll('.view').forEach(function(el) {
    el.classList.remove('on');
  });
  document.getElementById('view-' + viewName).classList.add('on');

  /* Update sidebar active link */
  document.querySelectorAll('.slnk').forEach(function(el) {
    el.classList.remove('on');
  });
  var sidebarLink = document.getElementById('sb-' + viewName);
  if (sidebarLink) sidebarLink.classList.add('on');

  /* Update topbar breadcrumb */
  var crumbLabels = { articles: 'Articles', new: 'New Article' };
  document.getElementById('tbCrumb').textContent = crumbLabels[viewName] || viewName;

  /* Show/hide the sticky publish bar */
  var stickyBar = document.getElementById('stickyBar');
  if (viewName === 'articles') {
    renderArticleList();
    stickyBar.style.display = 'none';
  } else {
    stickyBar.style.display = 'flex';
  }

  /* Reset form title when navigating to New Article */
  if (viewName === 'new') {
    document.getElementById('formTtl').textContent = 'New Article';
    document.getElementById('subBtn').innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
        '<polyline points="20 6 9 17 4 12"/>' +
      '</svg>Publish Article';
  }

  document.getElementById('mainContent').scrollTo(0, 0);
}


/* ════════════════════════════════════════════════════════════════
   STATS PANEL
   ════════════════════════════════════════════════════════════════ */

/**
 * Recalculate and display the four stat cards and featured strip.
 * @param {Array} articles — The full unfiltered articles array.
 */
function renderStats(articles) {
  var totalCount    = articles.length;
  var videoCount    = articles.filter(function(a) {
    return a.videoType && a.videoType !== 'none';
  }).length;

  var featuredId    = getFeaturedId();
  var featuredArt   = featuredId
    ? articles.find(function(a) { return a.id === featuredId; })
    : null;

  /* "Last Published" shows the year of the most recently added article */
  var latestArticle = articles.length > 0 ? articles[articles.length - 1] : null;
  var lastYear      = latestArticle
    ? (latestArticle.date.split(' ')[1] || latestArticle.date)
    : '—';

  document.getElementById('statTotal').textContent = totalCount;
  document.getElementById('statVideo').textContent = videoCount;
  document.getElementById('statFeat').textContent  = featuredArt ? '1' : '—';
  document.getElementById('statLast').textContent  = lastYear;

  /* Featured strip — shown below stats when a hero article is set */
  var strip = document.getElementById('featuredStrip');
  if (featuredArt) {
    document.getElementById('featuredTitle').textContent = featuredArt.title;
    strip.style.display = 'flex';
  } else {
    strip.style.display = 'none';
  }
}


/* ════════════════════════════════════════════════════════════════
   ARTICLE LIST (card grid)
   ════════════════════════════════════════════════════════════════ */

function renderArticleList() {
  /* Show newest first */
  var articles  = getArticles().slice().reverse();
  var grid      = document.getElementById('artGrid');
  var emptyPane = document.getElementById('artsEmpty');
  var metaLabel = document.getElementById('artsMeta');
  var countBadge= document.getElementById('sbCnt');

  grid.innerHTML = '';

  /* Update sidebar count badge and subtitle */
  if (countBadge) countBadge.textContent = articles.length;
  if (metaLabel)  metaLabel.textContent  =
    articles.length + ' article' + (articles.length !== 1 ? 's' : '') + ' published';

  /* Refresh stats panel (uses the raw unsorted array) */
  renderStats(getArticles());

  if (articles.length === 0) {
    emptyPane.style.display = 'flex';
    return;
  }
  emptyPane.style.display = 'none';

  articles.forEach(function(article) {
    var card       = document.createElement('div');
    card.className = 'ac';

    var isFeatured = getFeaturedId() === article.id;

    /* Thumbnail or placeholder */
    var coverHtml = article.thumbnail
      ? '<img src="' + article.thumbnail + '" alt="">'
      : '<div class="ac-ph">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">' +
            '<rect x="3" y="3" width="18" height="15" rx="2"/>' +
            '<path d="M3 15l4-4 4 4 4-5 4 5"/>' +
          '</svg>' +
        '</div>';

    /* Video badge */
    var videoBadge = (article.videoType && article.videoType !== 'none')
      ? '<div class="ac-vbadge">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<polygon points="23 7 16 12 23 17 23 7"/>' +
            '<rect x="1" y="5" width="15" height="14" rx="2"/>' +
          '</svg>Video' +
        '</div>'
      : '';

    /* Featured/Hero badge overlay on the image */
    var heroBadge = isFeatured
      ? '<div class="ac-feat-badge">' +
          '<svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10">' +
            '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>' +
          '</svg>Hero' +
        '</div>'
      : '';

    /* "Set as Hero" / "Hero" toggle button */
    var heroStarSvg =
      '<svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11">' +
        '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>' +
      '</svg>';

    var heroButtonLabel = isFeatured
      ? heroStarSvg + ' Hero'
      : '&#9733; Set as Hero';

    var heroButton =
      '<button class="btn-feat' + (isFeatured ? ' is-feat' : '') + '" ' +
        'onclick="setFeatured(\'' + article.id + '\')">' +
        heroButtonLabel +
      '</button>';

    /* Escape title for use inside onclick attribute */
    var safeTitle = escapeHtml(article.title).replace(/'/g, "\\'");

    card.innerHTML =
      '<div class="ac-cov">' + coverHtml + heroBadge + videoBadge + '</div>' +
      '<div class="ac-bd">' +
        '<div class="ac-mt">' +
          '<span class="ac-dt">' + escapeHtml(article.date) + '</span>' +
          '<div class="ac-sep"></div>' +
          '<span class="ac-rt">' + escapeHtml(article.readTime) + ' min</span>' +
        '</div>' +
        '<div class="ac-ttl">' + escapeHtml(article.title) + '</div>' +
        '<div class="ac-desc">' + escapeHtml(article.desc)  + '</div>' +
        '<div class="ac-ft">' +
          heroButton +
          '<button class="btn btn-ol btn-xs" onclick="editArticle(\'' + article.id + '\')">Edit</button>' +
          '<button class="btn btn-rm btn-xs" onclick="confirmDelete(\'' + article.id + '\',\'' + safeTitle + '\')">Delete</button>' +
        '</div>' +
      '</div>';

    grid.appendChild(card);
  });
}


/* ════════════════════════════════════════════════════════════════
   VIDEO TYPE TABS (None / Upload / YouTube)
   ════════════════════════════════════════════════════════════════ */

function setVideoType(type) {
  ['none', 'upload', 'youtube'].forEach(function(tabName) {
    document.getElementById('vtab-' + tabName).classList.toggle('on', tabName === type);
    document.getElementById('vp-'   + tabName).classList.toggle('on', tabName === type);
  });
}


/* ════════════════════════════════════════════════════════════════
   THUMBNAIL UPLOAD
   ════════════════════════════════════════════════════════════════ */

function onThumbnailSelected(input) {
  var file = input.files[0];
  if (!file) return;

  var reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('fThData').value          = e.target.result;
    document.getElementById('tPrev').src              = e.target.result;
    document.getElementById('tPrevWrap').style.display = 'block';
    document.getElementById('tZone').style.display     = 'none';
    input.value = ''; /* Allow re-selecting the same file */
  };
  reader.readAsDataURL(file);
}

function removeThumbnail() {
  document.getElementById('fThData').value           = '';
  document.getElementById('tPrev').src               = '';
  document.getElementById('tPrevWrap').style.display = 'none';
  document.getElementById('tZone').style.display     = 'flex';
  document.getElementById('fThumb').value            = '';
}


/* ════════════════════════════════════════════════════════════════
   VIDEO UPLOAD
   ════════════════════════════════════════════════════════════════ */

function onVideoSelected(input) {
  var file = input.files[0];
  if (!file) return;

  document.getElementById('vZone').style.display = 'none';
  document.getElementById('vProg').style.display = 'block';

  var reader = new FileReader();

  reader.onprogress = function(e) {
    if (e.lengthComputable) {
      var pct = Math.round(e.loaded / e.total * 100);
      document.getElementById('pFill').style.width = pct + '%';
      document.getElementById('pTxt').textContent  = 'Loading... ' + pct + '%';
    }
  };

  reader.onload = function(e) {
    document.getElementById('fVidData').value      = e.target.result;
    var videoEl                                    = document.getElementById('vPrev');
    videoEl.src                                    = e.target.result;
    videoEl.style.display                          = 'block';
    document.getElementById('vProg').style.display = 'none';
  };

  reader.readAsDataURL(file);
}


/* ════════════════════════════════════════════════════════════════
   RICH TEXT EDITOR — Commands
   ════════════════════════════════════════════════════════════════ */

function editorCmd(command) {
  document.getElementById('fBody').focus();
  document.execCommand(command, false, null);
}

function editorBlock(tag) {
  if (!tag) return;
  document.getElementById('fBody').focus();
  document.execCommand('formatBlock', false, tag);
}

function editorFontSize(size) {
  if (!size) return;
  document.getElementById('fBody').focus();
  document.execCommand('fontSize', false, size);
}

function editorClearFormat() {
  var editor    = document.getElementById('fBody');
  var selection = window.getSelection();

  editor.focus();

  /* If nothing selected, select all content */
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    var range = document.createRange();
    range.selectNodeContents(editor);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  document.execCommand('removeFormat', false, null);
  document.execCommand('unlink', false, null);
}

function editorInsertLink() {
  var url = prompt('Enter URL:', 'https://');
  if (url && url !== 'https://') {
    document.getElementById('fBody').focus();
    document.execCommand('createLink', false, url);
  }
}

/**
 * Toggle a formatting command and keep the toolbar button in sync.
 * @param {string} command  — execCommand name, e.g. 'bold'
 * @param {string} buttonId — ID of the toolbar button to highlight
 */
function editorToggle(command, buttonId) {
  document.getElementById('fBody').focus();
  document.execCommand(command, false, null);

  var isActive = document.queryCommandState(command);
  var button   = document.getElementById(buttonId);
  if (button) button.classList.toggle('ed-on', isActive);
}

/* Keep toolbar buttons in sync with cursor position */
document.addEventListener('selectionchange', function() {
  var editor    = document.getElementById('fBody');
  var selection = window.getSelection();
  var commands  = ['bold', 'italic', 'underline', 'strikeThrough'];
  var buttonIds = ['btnBold', 'btnItalic', 'btnUnderline', 'btnStrike'];

  /* Only query format state when cursor is actually inside the editor */
  var inside = editor &&
               selection &&
               selection.rangeCount > 0 &&
               editor.contains(selection.getRangeAt(0).commonAncestorContainer);

  commands.forEach(function(cmd, index) {
    var button = document.getElementById(buttonIds[index]);
    if (!button) return;
    if (inside) {
      try { button.classList.toggle('ed-on', document.queryCommandState(cmd)); }
      catch (e) {}
    } else {
      button.classList.remove('ed-on');
    }
  });
});


/* ── Word count ── */
function updateWordCount() {
  var editor = document.getElementById('fBody');
  var counter = document.getElementById('edWordCount');
  if (!editor || !counter) return;
  var text = editor.innerText.trim();
  var words = text ? text.split(/\s+/).filter(function(w){ return w.length > 0; }).length : 0;
  counter.textContent = words + (words === 1 ? ' word' : ' words');
}
document.getElementById('fBody').addEventListener('input', updateWordCount);


/* ════════════════════════════════════════════════════════════════
   RICH TEXT EDITOR — Image insertion
   ════════════════════════════════════════════════════════════════ */

function editorInsertImage() {
  /* Save the cursor position before the file dialog opens (it would be lost) */
  var selection        = window.getSelection();
  window._savedRange   = (selection && selection.rangeCount > 0)
    ? selection.getRangeAt(0).cloneRange()
    : null;

  document.getElementById('edImgInput').click();
}

function editorImageLoaded(input) {
  var file = input.files[0];
  if (!file) return;

  var reader = new FileReader();
  reader.onload = function(e) {
    var editor    = document.getElementById('fBody');
    var selection = window.getSelection();

    editor.focus();

    /* Restore cursor position */
    if (window._savedRange) {
      selection.removeAllRanges();
      selection.addRange(window._savedRange);
    }

    /* Build image element — clicking cycles through three widths */
    var img        = document.createElement('img');
    img.src        = e.target.result;
    img.style.cssText =
      'max-width:100%;height:auto;border-radius:6px;margin:12px 0;display:block;cursor:pointer';
    img.title      = 'Click to resize: small → medium → full';
    img.onclick    = function() {
      var sizes    = ['33%', '66%', '100%'];
      var current  = this.style.width || '100%';
      var nextIdx  = (sizes.indexOf(current) + 1) % sizes.length;
      this.style.width = sizes[nextIdx];
    };

    /* Insert at cursor, or append at end if no selection */
    if (selection && selection.rangeCount > 0) {
      var range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(img);
      range.setStartAfter(img);
      range.setEndAfter(img);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      editor.appendChild(img);
    }

    input.value = ''; /* Allow re-selecting the same image */
  };

  reader.readAsDataURL(file);
}


/* ════════════════════════════════════════════════════════════════
   ARTICLE FORM — Save / Publish
   ════════════════════════════════════════════════════════════════ */

document.getElementById('artForm').addEventListener('submit', function(e) {
  e.preventDefault();

  /* Collect field values */
  var editingId   = document.getElementById('editId').value;
  var title       = document.getElementById('fTitle').value.trim();
  var description = document.getElementById('fDesc').value.trim();
  var bodyHtml    = document.getElementById('fBody').innerHTML.trim();
  var bodyText    = document.getElementById('fBody').innerText.trim();
  var thumbnail   = document.getElementById('fThData').value;
  var readTime    = document.getElementById('fRT').value;
  var dateInput   = document.getElementById('fDate').value;
  var formMsg     = document.getElementById('fMsg');

  /* Determine selected video type */
  var videoType = 'none';
  ['none', 'upload', 'youtube'].forEach(function(type) {
    if (document.getElementById('vtab-' + type).classList.contains('on')) {
      videoType = type;
    }
  });

  var videoSrc = '';
  if (videoType === 'upload')  videoSrc = document.getElementById('fVidData').value;
  if (videoType === 'youtube') videoSrc = buildYouTubeEmbedUrl(document.getElementById('fYT').value.trim());

  /* Validation */
  if (!title)     { showFormMessage(formMsg, 'err', 'Please enter a title.'); return; }
  if (!description){ showFormMessage(formMsg, 'err', 'Please enter a description.'); return; }
  if (!bodyText)  { showFormMessage(formMsg, 'err', 'Please write the article body.'); return; }
  if (!thumbnail) { showFormMessage(formMsg, 'err', 'Please upload a thumbnail.'); return; }
  if (!readTime)  { showFormMessage(formMsg, 'err', 'Please enter the read time.'); return; }

  var displayDate = dateInput
    ? formatDisplayDate(dateInput)
    : formatDisplayDate(new Date().toISOString().split('T')[0]);

  var articles = getArticles();

  if (editingId) {
    /* Update existing article */
    var index = articles.findIndex(function(a) { return a.id === editingId; });
    if (index !== -1) {
      articles[index] = Object.assign(articles[index], {
        title:     title,
        desc:      description,
        body:      bodyHtml,
        thumbnail: thumbnail,
        readTime:  readTime,
        date:      displayDate,
        videoType: videoType,
        videoSrc:  videoSrc,
        updatedAt: Date.now()
      });
    }
    showToast('Article updated successfully.', 'ok');
  } else {
    /* Create new article */
    articles.push({
      id:        'art_' + Date.now(),
      title:     title,
      desc:      description,
      body:      bodyHtml,
      thumbnail: thumbnail,
      readTime:  readTime,
      date:      displayDate,
      videoType: videoType,
      videoSrc:  videoSrc,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    showToast('Article published!', 'ok');
  }

  saveArticles(articles);
  clearForm();
  setTimeout(function() { goView('articles'); }, 900);
});


/* ════════════════════════════════════════════════════════════════
   ARTICLE FORM — Edit (populate form from existing article)
   ════════════════════════════════════════════════════════════════ */

function editArticle(articleId) {
  var article = getArticles().find(function(a) { return a.id === articleId; });
  if (!article) return;

  goView('new');
  document.getElementById('formTtl').textContent   = 'Edit Article';
  document.getElementById('subBtn').innerHTML      =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
      '<polyline points="20 6 9 17 4 12"/>' +
    '</svg>Save Changes';

  /* Populate fields */
  document.getElementById('editId').value          = article.id;
  document.getElementById('fTitle').value          = article.title;
  document.getElementById('fDesc').value           = article.desc;
  document.getElementById('fBody').innerHTML       = article.body;
  document.getElementById('fThData').value         = article.thumbnail || '';
  document.getElementById('fRT').value             = article.readTime;

  /* Restore thumbnail preview */
  if (article.thumbnail) {
    document.getElementById('tPrev').src              = article.thumbnail;
    document.getElementById('tPrevWrap').style.display = 'block';
    document.getElementById('tZone').style.display     = 'none';
  }

  /* Restore video */
  setVideoType(article.videoType || 'none');

  if (article.videoType === 'upload' && article.videoSrc) {
    document.getElementById('fVidData').value      = article.videoSrc;
    var videoEl                                    = document.getElementById('vPrev');
    videoEl.src                                    = article.videoSrc;
    videoEl.style.display                          = 'block';
    document.getElementById('vZone').style.display = 'none';
  }

  if (article.videoType === 'youtube' && article.videoSrc) {
    document.getElementById('fYT').value = article.videoSrc;
  }
}


/* ════════════════════════════════════════════════════════════════
   ARTICLE FORM — Clear / Reset
   ════════════════════════════════════════════════════════════════ */

function clearForm() {
  document.getElementById('artForm').reset();
  document.getElementById('editId').value            = '';
  document.getElementById('fBody').innerHTML         = '';
  document.getElementById('fThData').value           = '';
  document.getElementById('fVidData').value          = '';

  /* Reset thumbnail preview */
  document.getElementById('tPrev').src               = '';
  document.getElementById('tPrevWrap').style.display = 'none';
  document.getElementById('tZone').style.display     = 'flex';

  /* Reset video preview */
  var videoEl                                        = document.getElementById('vPrev');
  videoEl.src                                        = '';
  videoEl.style.display                              = 'none';
  document.getElementById('vZone').style.display     = 'flex';

  setVideoType('none');

  var formMsg         = document.getElementById('fMsg');
  formMsg.textContent = '';
  formMsg.className   = 'fmsg';
}


/* ════════════════════════════════════════════════════════════════
   DELETE — Confirmation modal
   ════════════════════════════════════════════════════════════════ */

var pendingDeleteId = null;

function confirmDelete(articleId, articleTitle) {
  pendingDeleteId = articleId;
  document.getElementById('dTitle').textContent = articleTitle;
  document.getElementById('dModal').classList.add('on');
}

function closeDeleteModal() {
  pendingDeleteId = null;
  document.getElementById('dModal').classList.remove('on');
}

document.getElementById('dConfBtn').addEventListener('click', function() {
  if (!pendingDeleteId) return;

  /* Find title for the toast before deleting */
  var articles     = getArticles();
  var deletedArt   = articles.find(function(a) { return a.id === pendingDeleteId; });
  var deletedTitle = deletedArt ? deletedArt.title : 'Article';

  /* Remove the article */
  saveArticles(articles.filter(function(a) { return a.id !== pendingDeleteId; }));

  /* If the deleted article was the featured one, clear that too */
  if (getFeaturedId() === pendingDeleteId) {
    localStorage.removeItem('innovo_featured');
  }

  closeDeleteModal();
  renderArticleList();
  showToast('"' + deletedTitle + '" deleted.', 'ok');
});


/* ════════════════════════════════════════════════════════════════
   CHANGE PASSWORD — Modal
   ════════════════════════════════════════════════════════════════ */

function openChangePasswordModal() {
  document.getElementById('cpUsername').textContent = currentUser ? currentUser.name : '';
  document.getElementById('cpCurrent').value        = '';
  document.getElementById('cpNew').value            = '';
  document.getElementById('cpConfirm').value        = '';
  document.getElementById('cpMsg').textContent      = '';
  document.getElementById('cpMsg').className        = 'cp-msg';
  document.getElementById('cpModal').classList.add('on');
}

function closeChangePasswordModal() {
  document.getElementById('cpModal').classList.remove('on');
}

function doChangePassword() {
  var currentPass = document.getElementById('cpCurrent').value;
  var newPass     = document.getElementById('cpNew').value;
  var confirmPass = document.getElementById('cpConfirm').value;
  var msgEl       = document.getElementById('cpMsg');

  var userRecord  = INNOVO_USERS.find(function(u) {
    return u.username === currentUser.username;
  });

  if (!userRecord) {
    msgEl.textContent = 'User not found.';
    msgEl.className   = 'cp-msg err';
    return;
  }
  if (currentPass !== userRecord.password) {
    msgEl.textContent = 'Current password is incorrect.';
    msgEl.className   = 'cp-msg err';
    return;
  }
  if (newPass.length < 6) {
    msgEl.textContent = 'New password must be at least 6 characters.';
    msgEl.className   = 'cp-msg err';
    return;
  }
  if (newPass !== confirmPass) {
    msgEl.textContent = 'Passwords do not match.';
    msgEl.className   = 'cp-msg err';
    return;
  }

  userRecord.password = newPass;
  cms_savePasswordOverride(userRecord.username, newPass);

  msgEl.textContent = '✓ Password updated!';
  msgEl.className   = 'cp-msg ok';
  setTimeout(function() {
    closeChangePasswordModal();
    showToast('Password changed successfully.', 'ok');
  }, 1500);
}


/* ════════════════════════════════════════════════════════════════
   UTILITIES
   ════════════════════════════════════════════════════════════════ */

/**
 * Escape a string for safe insertion into HTML.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Show a message inside the sticky publish bar.
 * Auto-clears after 4 seconds.
 */
function showFormMessage(element, type, text) {
  element.textContent = text;
  element.className   = 'fmsg ' + type;
  setTimeout(function() {
    element.textContent = '';
    element.className   = 'fmsg';
  }, 4000);
}

/**
 * Format an ISO date string (YYYY-MM-DD) as "Month YYYY".
 * Example: '2026-04-01' → 'April 2026'
 */
function formatDisplayDate(isoDate) {
  var months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  var d = new Date(isoDate + 'T00:00:00');
  return months[d.getMonth()] + ' ' + d.getFullYear();
}

/**
 * Convert any YouTube URL format to an embed URL.
 * Handles: youtu.be/xxx, watch?v=xxx, already-embed URLs.
 */
function buildYouTubeEmbedUrl(url) {
  if (!url) return '';
  if (url.indexOf('embed') !== -1) return url;
  var match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return match ? 'https://www.youtube.com/embed/' + match[1] : url;
}


/* ════════════════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════════════════ */
renderArticleList();
