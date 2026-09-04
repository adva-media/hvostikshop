# Деплой хвостикшоп.рф (Hostinger + Beget)

Готовый архив: `hvostikshop-deploy.zip` в корне проекта.

Оплаты на сайте нет. Заказы уходят письмом через `order.php` на `hvostik.shop@mail.ru`.

## 1. Hostinger — загрузка файлов

1. Войдите в **hPanel** → **Websites** → ваш сайт → **File Manager** (или FTP).
2. Откройте папку сайта: обычно `public_html` (для основного домена).
3. Удалите дефолтный `index.html` Hostinger, если он мешает.
4. Загрузите и распакуйте `hvostikshop-deploy.zip` **внутрь** `public_html`, так чтобы получилось:
   - `public_html/index.html`
   - `public_html/cart.html`
   - `public_html/order.php`
   - `public_html/css/…`
   - `public_html/js/…`
   - `public_html/images/…`
5. Права: файлы `644`, папки `755` (стандарт Hostinger).
6. Проверьте PHP: hPanel → **Advanced** → **PHP Configuration** (PHP 8.x подойдёт).

### FTP (если удобнее)

- Host: из hPanel → **Files** → **FTP Accounts** (часто `ftp.ваш-домен` или IP сервера)
- User / password: из FTP Accounts
- Port: `21` (FTP) или `22` (SFTP, если включён)
- Remote path: `public_html`

## 2. Почта заказов (`order.php`)

- Endpoint: `POST /order.php` (JSON).
- Письма идут на **hvostik.shop@mail.ru**.
- Если письма не приходят:
  1. Создайте почтовый ящик домена в Hostinger (**Emails**) или используйте уже существующий `hvostik.shop@mail.ru`.
  2. В hPanel проверьте, что PHP `mail()` не отключён.
  3. Посмотрите лог `order-mail.log` в `public_html` (создаётся при сбое `mail()`).
  4. Добавьте SPF/DKIM для домена в DNS (рекомендует Hostinger для доставки).

## 3. Beget — DNS на Hostinger

Домен куплен на Beget, сайт хостится на Hostinger.

1. В Hostinger hPanel откройте сайт → скопируйте **Server IP** (IPv4).
2. В панели Beget → **DNS / Домены** → ваш домен (например `хвостикшоп.рф` / punycode).
3. Записи:
   - **A** `@` → IP Hostinger
   - **A** `www` → тот же IP (или CNAME `www` → `@`)
4. Уберите старые A/AAAA, которые указывают не на Hostinger.
5. NS можно оставить Beget (меняете только A-записи) **или** делегировать NS на Hostinger — достаточно одного варианта.
6. Подождите TTL (часто 15 мин – 2 часа, иногда до 24 ч).

Проверка:

```bash
dig +short A хвостикшоп.рф
# или
dig +short A xn--...punycode...
```

Должен вернуться IP Hostinger.

## 4. Проверка после деплоя

1. Откройте главную → «В корзину» на любом товаре.
2. Откройте `/cart.html` — позиции, смена количества, «убрать».
3. Оформите заказ (имя + телефон или e-mail).
4. Должен появиться номер вида `ХВ-123456` и текст позвонить / написать с этим номером.
5. Проверьте входящие на `hvostik.shop@mail.ru` (и «Спам»).

## 5. Что не класть на хостинг

- `.git/`
- `build_html.py`, `images/gen_bags.py`
- корневые исходные PNG/JPEG (русские имена, ChatGPT, IMG_*)
- `images/_qa/`, `assets_sheet.png`
- сам zip после распаковки (по желанию)
