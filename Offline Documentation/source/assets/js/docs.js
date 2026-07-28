/* =========================================================
   6amStudio Documentation — docs.js
   Theme toggle · mobile menus · TOC scroll-spy · sidebar
   search · copy buttons · scroll progress · back to top
   ========================================================= */

(function () {
  'use strict';

  /* ---- Theme toggle (dark-first, matching the product) ---- */
  var THEME_KEY = '6amstudio-docs-theme';

  function getTheme() {
    return localStorage.getItem(THEME_KEY) || 'dark';
  }

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(THEME_KEY, t);
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.title = t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
      btn.textContent = t === 'dark' ? '☀️' : '🌙';
    });
  }

  function toggleTheme() {
    applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
  }

  /* Apply before DOM ready to avoid a flash of wrong theme */
  document.documentElement.setAttribute('data-theme', getTheme());

  /* ---- Clipboard fallback for file:// protocol ---- */
  function fallbackCopy(text, btn) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
    flashCopied(btn);
  }

  function flashCopied(btn) {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(function () {
      btn.textContent = 'Copy';
      btn.classList.remove('copied');
    }, 2000);
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(getTheme());

    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.addEventListener('click', toggleTheme);
    });

    /* ---- Mobile menu toggle ---- */
    var overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    document.body.appendChild(overlay);

    function closeMobileMenus() {
      var sidebar = document.querySelector('.sidebar');
      var nav = document.querySelector('.navbar nav');
      if (sidebar) sidebar.classList.remove('open');
      if (nav) nav.classList.remove('open');
      overlay.classList.remove('active');
    }

    overlay.addEventListener('click', closeMobileMenus);

    document.querySelectorAll('.menu-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sidebar = document.querySelector('.sidebar');
        var nav = document.querySelector('.navbar nav');
        var isOpen;
        if (sidebar) {
          isOpen = sidebar.classList.toggle('open');
          if (nav) nav.classList.remove('open');
          overlay.classList.toggle('active', isOpen);
        } else if (nav) {
          isOpen = nav.classList.toggle('open');
          overlay.classList.toggle('active', isOpen);
        }
      });
    });

    /* ---- Active nav link ---- */
    var currentPath = window.location.pathname.split('/').pop();
    document.querySelectorAll('.navbar nav a').forEach(function (a) {
      var href = a.getAttribute('href').split('/').pop();
      if (href === currentPath || (currentPath === '' && href === 'index.html')) {
        a.classList.add('active');
      }
    });

    /* ---- TOC scroll-spy ---- */
    var tocLinks = document.querySelectorAll('.toc a[href^="#"]');
    if (tocLinks.length) {
      var sections = Array.prototype.map.call(tocLinks, function (a) {
        return document.getElementById(a.getAttribute('href').slice(1));
      }).filter(Boolean);

      var updateActiveToc = function () {
        var scrollY = window.scrollY + 90;
        var active = null;
        for (var i = 0; i < sections.length; i++) {
          if (sections[i].offsetTop <= scrollY) active = sections[i];
        }
        tocLinks.forEach(function (a) { a.classList.remove('active'); });
        if (active) {
          var link = document.querySelector('.toc a[href="#' + active.id + '"]');
          if (link) {
            link.classList.add('active');
            var sidebar = document.querySelector('.sidebar');
            if (sidebar) {
              var linkTop = link.offsetTop;
              var sidebarH = sidebar.clientHeight;
              var sidebarScroll = sidebar.scrollTop;
              if (linkTop < sidebarScroll + 70 || linkTop > sidebarScroll + sidebarH - 70) {
                sidebar.scrollTo({ top: linkTop - sidebarH / 2, behavior: 'smooth' });
              }
            }
          }
        }
      };

      window.addEventListener('scroll', updateActiveToc, { passive: true });
      updateActiveToc();
    }

    /* ---- Sidebar search ( / or Ctrl+K to focus ) ---- */
    var searchInput = document.getElementById('search');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var q = this.value.trim().toLowerCase();
        tocLinks.forEach(function (a) {
          var text = a.textContent.toLowerCase();
          a.parentElement.classList.toggle('search-hidden', q.length > 0 && text.indexOf(q) === -1);
        });
      });

      document.addEventListener('keydown', function (e) {
        if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) && document.activeElement !== searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
        if (e.key === 'Escape' && document.activeElement === searchInput) {
          searchInput.value = '';
          searchInput.dispatchEvent(new Event('input'));
          searchInput.blur();
        }
      });
    }

    /* ---- Copy buttons on code blocks ---- */
    document.querySelectorAll('pre.code').forEach(function (pre) {
      var btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.textContent = 'Copy';
      btn.addEventListener('click', function () {
        var text = pre.textContent.replace(/Copy(!|ied!)?$/, '').trim();
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
              flashCopied(btn);
            }).catch(function () { fallbackCopy(text, btn); });
          } else {
            fallbackCopy(text, btn);
          }
        } catch (e) { fallbackCopy(text, btn); }
      });
      pre.appendChild(btn);
    });

    /* ---- Smooth scroll for anchors ---- */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
          try { history.pushState(null, null, this.getAttribute('href')); } catch (err) { /* file:// */ }
        }
      });
    });

    /* ---- Scroll progress ---- */
    var progressWrap = document.querySelector('.scroll-progress');
    if (progressWrap) {
      var progressBar = progressWrap.querySelector('.scroll-progress-bar');
      window.addEventListener('scroll', function () {
        var docHeight = document.documentElement.scrollHeight - window.innerHeight;
        progressBar.style.width = (docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0) + '%';
      }, { passive: true });
    }

    /* ---- Back to top ---- */
    var btt = document.querySelector('.back-to-top');
    if (btt) {
      window.addEventListener('scroll', function () {
        btt.classList.toggle('visible', window.scrollY > 400);
      }, { passive: true });
      btt.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    /* ---- Close sidebar when a TOC link is tapped (mobile) ---- */
    document.querySelectorAll('.toc a').forEach(function (a) {
      a.addEventListener('click', closeMobileMenus);
    });
  });
})();
