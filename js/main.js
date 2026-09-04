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

  function generateOrderNumber() {
    var n = Math.floor(100000 + Math.random() * 900000);
    return 'ХВ-' + String(n);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showCheckoutSuccess(order, mailed) {
    var form = document.getElementById('checkout-form');
    var done = document.getElementById('checkout-done');
    var block = document.getElementById('checkout-block');
    if (form) form.style.display = 'none';
    if (block) {
      var muted = block.querySelector('p.muted');
      if (muted) muted.style.display = 'none';
      var h2 = block.querySelector('h2');
      if (h2) h2.textContent = 'Заказ принят';
    }
    if (done) {
      var mailNote = mailed
        ? '<p class="checkout-mail-note">Заявка отправлена в магазин. Мы ответим в рабочие часы (с 9:00 до 18:00 МСК).</p>'
        : '<p class="checkout-mail-note">Заявка сохранена. Если письмо не ушло автоматически — просто напишите нам на почту с этим номером заказа.</p>';
      done.innerHTML =
        '<p><strong>Спасибо! Ваш номер заказа:</strong></p>' +
        '<div class="order-no">' +
        escapeHtml(order) +
        '</div>' +
        '<p>Оплаты на сайте нет. Чтобы завершить заказ, позвоните по телефону ' +
        '<a href="tel:+79685459982">+7 968 545 99 82</a> ' +
        'или напишите на ' +
        '<a href="mailto:hvostik.shop@mail.ru?subject=' +
        encodeURIComponent('Заказ ' + order) +
        '">hvostik.shop@mail.ru</a> ' +
        'и укажите номер заказа <strong>' +
        escapeHtml(order) +
        '</strong>.</p>' +
        mailNote;
      done.hidden = false;
      done.removeAttribute('hidden');
    }
  }

  function setCheckoutBusy(busy) {
    var btn = document.getElementById('checkout-submit');
    if (!btn) return;
    btn.disabled = !!busy;
    btn.textContent = busy ? 'Отправляем…' : 'Отправить заказ';
  }

  function postOrder(payload, onDone) {
    var finished = false;
    function finish(result) {
      if (finished) return;
      finished = true;
      onDone(result);
    }

    try {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', 'order.php', true);
      xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.timeout = 12000;
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        var data = null;
        try {
          data = JSON.parse(xhr.responseText || '{}');
        } catch (err) {
          data = null;
        }
        if (xhr.status >= 200 && xhr.status < 300 && data && data.ok) {
          finish({ ok: true, mailed: !!data.mailed, order: data.order || payload.order });
          return;
        }
        // Local file://, python -m http.server, or static host without PHP
        if (
          xhr.status === 0 ||
          xhr.status === 404 ||
          xhr.status === 405 ||
          xhr.status === 501 ||
          !data ||
          typeof data.ok === 'undefined'
        ) {
          if (typeof console !== 'undefined' && console.log) {
            console.log('[hvostik] order.php unavailable — local fallback', payload);
          }
          finish({ ok: true, mailed: false, local: true, order: payload.order });
          return;
        }
        finish({
          ok: false,
          mailed: false,
          order: payload.order,
          error: (data && data.error) || 'server_error'
        });
      };
      xhr.ontimeout = function () {
        finish({ ok: true, mailed: false, local: true, order: payload.order });
      };
      xhr.onerror = function () {
        if (typeof console !== 'undefined' && console.log) {
          console.log('[hvostik] order.php network error — local fallback', payload);
        }
        finish({ ok: true, mailed: false, local: true, order: payload.order });
      };
      xhr.send(JSON.stringify(payload));
    } catch (e) {
      if (typeof console !== 'undefined' && console.log) {
        console.log('[hvostik] order post failed — local fallback', payload, e);
      }
      finish({ ok: true, mailed: false, local: true, order: payload.order });
    }
  }

  function renderCartPage() {
    var box = document.getElementById('cart-root');
    if (!box) return;
    var checkoutBlock = document.getElementById('checkout-block');
    var form = document.getElementById('checkout-form');
    var done = document.getElementById('checkout-done');
    var orderDone = done && !done.hidden && done.innerHTML;
    var items = loadCart();

    if (!items.length) {
      box.innerHTML =
        '<div class="cart-empty"><p>В корзине пока пусто.</p><p><a class="btn" href="catalog.html">Перейти в каталог</a></p></div>';
      if (checkoutBlock && !orderDone) {
        checkoutBlock.style.display = 'none';
      }
      return;
    }

    if (checkoutBlock && !orderDone) checkoutBlock.style.display = '';
    if (form && !orderDone) form.style.display = '';

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
        escapeHtml(it.name) +
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
    var hint = document.getElementById('contact-hint');

    form.onsubmit = function (e) {
      e.preventDefault();
      var items = loadCart();
      if (!items.length) {
        toast('Корзина пуста');
        return;
      }

      var name = (form.elements.namedItem('name') && form.elements.namedItem('name').value || '').trim();
      var phone = (form.elements.namedItem('phone') && form.elements.namedItem('phone').value || '').trim();
      var email = (form.elements.namedItem('email') && form.elements.namedItem('email').value || '').trim();
      var city = (form.elements.namedItem('city') && form.elements.namedItem('city').value || '').trim();
      var shipEl = form.elements.namedItem('ship');
      var ship = (shipEl && shipEl.value || '').trim();
      var comment = (form.elements.namedItem('comment') && form.elements.namedItem('comment').value || '').trim();

      if (!name) {
        toast('Укажите имя');
        var nameEl = form.elements.namedItem('name');
        if (nameEl && nameEl.focus) nameEl.focus();
        return;
      }
      if (!phone && !email) {
        if (hint) {
          hint.className = 'form-hint is-error';
          hint.textContent = 'Укажите телефон или e-mail (хотя бы одно).';
        }
        toast('Нужен телефон или e-mail');
        var phoneEl = form.elements.namedItem('phone');
        if (phoneEl && phoneEl.focus) phoneEl.focus();
        return;
      }
      if (hint) {
        hint.className = 'form-hint';
        hint.textContent = 'Укажите телефон или e-mail (хотя бы одно).';
      }

      var totals = cartTotals(items);
      var order = generateOrderNumber();
      var payload = {
        order: order,
        name: name,
        phone: phone,
        email: email,
        city: city,
        ship: ship,
        comment: comment,
        items: items.map(function (it) {
          return {
            id: it.id,
            name: it.name,
            qty: it.qty,
            price: it.price
          };
        }),
        total: totals.sum
      };

      setCheckoutBusy(true);
      postOrder(payload, function (result) {
        setCheckoutBusy(false);
        if (!result.ok && result.error === 'mail_failed') {
          // Still show success with order number — shop can be contacted manually
          localStorage.removeItem(STORAGE);
          updateCartWidgets();
          renderCartPage();
          showCheckoutSuccess(order, false);
          toast('Заказ принят. Напишите нам с номером ' + order);
          return;
        }
        if (!result.ok) {
          toast('Не удалось отправить. Позвоните +7 968 545 99 82');
          return;
        }
        localStorage.removeItem(STORAGE);
        updateCartWidgets();
        renderCartPage();
        showCheckoutSuccess(order, !!result.mailed);
        toast('Заказ ' + order + ' принят');
      });
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
