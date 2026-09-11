# Деплой хвостикшоп.рф (Beget / Hostinger)

Готовый архив: `hvostikshop-deploy.zip` в корне проекта.

Сайт **презентационный**: каталог и контакты без корзины и без форм заказа. Связь — телефон и e-mail.

## 1. Загрузка файлов

1. Войдите в панель хостинга → **File Manager** (или FTP).
2. Откройте папку сайта: обычно `public_html`.
3. Удалите старые `cart.html` и `order.php`, если они ещё на сервере.
4. Загрузите и распакуйте `hvostikshop-deploy.zip` **внутрь** `public_html`, так чтобы получилось:
   - `public_html/index.html`
   - `public_html/contacts.html`
   - `public_html/css/…`
   - `public_html/js/…`
   - `public_html/images/…`
5. Права: файлы `644`, папки `755`.

### FTP

- Host / user / password — из панели хостинга
- Port: `21` (FTP) или `22` (SFTP)
- Remote path: `public_html`

## 2. DNS (если домен на Beget, сайт на другом хосте)

1. Скопируйте **Server IP** хостинга сайта.
2. В DNS домена:
   - **A** `@` → IP хостинга
   - **A** `www` → тот же IP (или CNAME `www` → `@`)
3. Уберите старые A/AAAA, которые указывают не туда.
4. Подождите TTL (часто 15 мин – 2 часа).

## 3. Проверка после деплоя

1. Главная и каталог открываются, цены видны, кнопок «В корзину» нет.
2. В шапке и подвале — телефон `+7 968 545 99 82` и почта `hvostik.shop@mail.ru`.
3. `/contacts.html` — таблица контактов без формы.
4. `/cart.html` и `/order.php` отдают 404 (файлы удалены).

## 4. Что не класть на хостинг

- `.git/`
- `build_html.py`, `images/gen_bags.py`
- корневые исходные PNG/JPEG (русские имена, ChatGPT, IMG_*)
- `images/_qa/`, `assets_sheet.png`
- сам zip после распаковки (по желанию)
