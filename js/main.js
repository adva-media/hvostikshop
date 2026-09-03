(function () {
  var STORAGE = 'hvostik_cart';

  function plural(n, one, few, many) {
    var n10 = n % 10;
    var n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return one;
    if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
    return many;
  }

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveCart(items) {
    localStorage.setItem(STORAGE, JSON.stringify(items));
    updateCartWidgets();
  }

  function cartTotals(items) {
    var count = 0;
    var sum = 0;
    items.forEach(function (it) {
      count += it.qty;
      sum += it.qty * it.price;
    });
    return { count: count, sum: sum };
  }

  function formatMoney(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
  }

  function updateCartWidgets() {
    var t = cartTotals(loadCart());
    var label =
      t.count +
      ' ' +
      plural(t.count, 'товар', 'товара', 'товаров') +
      ' — ' +
      formatMoney(t.sum);
    var nodes = document.querySelectorAll('.js-cart-label');
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = label;
  }

  function addToCart(id, name, price, img) {
    var items = loadCart();
    var found = null;
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        found = items[i];
        break;
      }
    }
    if (found) found.qty += 1;
    else
      items.push({
        id: id,
        name: name,
        price: Number(price),
        img: img || '',
        qty: 1
      });
    saveCart(items);
    toast('Добавлено в корзину');
  }

  function toast(text) {
    var el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.className = 'toast is-show';
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.className = 'toast';
    }, 1800);
  }

  function bindAddButtons() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.js-add-cart') : null;
      if (!btn) {
        var t = e.target;
        while (t && t !== document) {
          if (t.className && String(t.className).indexOf('js-add-cart') !== -1) {
            btn = t;
            break;
          }
          t = t.parentNode;
        }
      }
      if (!btn) return;
      e.preventDefault();
      addToCart(btn.getAttribute('data-id'), btn.getAttribute('data-name'), btn.getAttribute('data-price'), btn.getAttribute('data-img'));
    });
  }

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

  function bindForms() {
    var forms = document.querySelectorAll('.js-fake-form');
    for (var i = 0; i < forms.length; i++) {
      forms[i].onsubmit = function (e) {
        e.preventDefault();
        var ok = this.querySelector('.form-ok');
        if (ok) ok.className = 'form-ok is-show';
        this.reset();
        toast('Спасибо! Мы получили ваше сообщение.');
      };
    }
  }

  function renderCartPage() {
    var box = document.getElementById('cart-root');
    if (!box) return;
    var items = loadCart();
    if (!items.length) {
      box.innerHTML =
        '<div class="cart-empty"><p>В корзине пока пусто.</p><p><a class="btn" href="catalog.html">Перейти в каталог</a></p></div>';
      return;
    }
    var rows = '';
    items.forEach(function (it, idx) {
      rows +=
        '<tr>' +
        '<td>' +
        (it.img
          ? '<img src="' + it.img + '" alt="">'
          : '') +
        '</td>' +
        '<td>' +
        it.name +
        '</td>' +
        '<td>' +
        formatMoney(it.price) +
        '</td>' +
        '<td><input class="qty js-qty" data-i="' +
        idx +
        '" type="number" min="1" value="' +
        it.qty +
        '"></td>' +
        '<td>' +
        formatMoney(it.price * it.qty) +
        '</td>' +
        '<td><button type="button" class="link-btn js-del" data-i="' +
        idx +
        '">убрать</button></td>' +
        '</tr>';
    });
    var t = cartTotals(items);
    box.innerHTML =
      '<table class="cart-table"><thead><tr><th></th><th>Товар</th><th>Цена</th><th>Кол-во</th><th>Сумма</th><th></th></tr></thead><tbody>' +
      rows +
      '</tbody></table>' +
      '<div class="cart-total">Итого: ' +
      formatMoney(t.sum) +
      '</div>' +
      '<p><a class="btn" href="#checkout">Оформить заказ</a></p>';

    var qty = box.querySelectorAll('.js-qty');
    for (var q = 0; q < qty.length; q++) {
      qty[q].onchange = function () {
        var items2 = loadCart();
        var i = Number(this.getAttribute('data-i'));
        var v = parseInt(this.value, 10);
        if (isNaN(v) || v < 1) v = 1;
        items2[i].qty = v;
        saveCart(items2);
        renderCartPage();
      };
    }
    var dels = box.querySelectorAll('.js-del');
    for (var d = 0; d < dels.length; d++) {
      dels[d].onclick = function () {
        var items2 = loadCart();
        items2.splice(Number(this.getAttribute('data-i')), 1);
        saveCart(items2);
        renderCartPage();
      };
    }
  }

  function bindCheckout() {
    var form = document.getElementById('checkout-form');
    if (!form) return;
    form.onsubmit = function (e) {
      e.preventDefault();
      if (!loadCart().length) {
        toast('Корзина пуста');
        return;
      }
      localStorage.removeItem(STORAGE);
      updateCartWidgets();
      renderCartPage();
      var done = document.getElementById('checkout-done');
      if (done) done.className = 'form-ok is-show';
      form.style.display = 'none';
      toast('Заказ принят. Спасибо!');
    };
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
    updateCartWidgets();
    bindAddButtons();
    bindNav();
    bindTabs();
    bindForms();
    renderCartPage();
    bindCheckout();
    highlightSearch();
  });
})();
