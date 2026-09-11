(function () {
  function bindNav() {
    var btn = document.getElementById('nav-toggle');
    var nav = document.getElementById('site-nav');
    if (!btn || !nav) return;
    btn.onclick = function () {
      var open = nav.className.indexOf('is-open') !== -1;
      nav.className = open ? '' : 'is-open';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
    };
  }

  function bindTabs() {
    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].onclick = function () {
        var id = this.getAttribute('data-tab');
        var allT = this.parentNode.querySelectorAll('.tab');
        for (var j = 0; j < allT.length; j++) allT[j].className = 'tab';
        this.className = 'tab is-on';
        var panels = document.querySelectorAll('.tab-panel');
        for (var k = 0; k < panels.length; k++) {
          panels[k].className =
            panels[k].id === id ? 'tab-panel is-on' : 'tab-panel';
        }
      };
    }
  }

  function highlightSearch() {
    var params = {};
    location.search
      .replace(/^\?/, '')
      .split('&')
      .forEach(function (p) {
        if (!p) return;
        var kv = p.split('=');
        params[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' '));
      });
    if (!params.q) return;
    var q = params.q.toLowerCase();
    var cards = document.querySelectorAll('.js-searchable');
    var n = 0;
    for (var i = 0; i < cards.length; i++) {
      var text = (cards[i].getAttribute('data-search') || cards[i].innerText).toLowerCase();
      if (text.indexOf(q) === -1) cards[i].style.display = 'none';
      else n++;
    }
    var info = document.getElementById('search-info');
    if (info) {
      info.style.display = 'block';
      info.textContent = n
        ? 'Найдено по запросу «' + params.q + '»: ' + n
        : 'По запросу «' + params.q + '» ничего не нашлось. Попробуйте «Мурчик» или «Дружок».';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindNav();
    bindTabs();
    highlightSearch();
  });
})();
