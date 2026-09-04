<?php
/**
 * Хвостик Shop — приём заказа и письмо на почту магазина.
 * Hostinger shared hosting: PHP mail() без внешних зависимостей.
 *
 * Ожидает POST JSON:
 * {
 *   "order": "ХВ-123456",
 *   "name": "...",
 *   "phone": "...",
 *   "email": "...",
 *   "city": "...",
 *   "ship": "...",
 *   "comment": "...",
 *   "items": [{ "name": "...", "qty": 1, "price": 100 }],
 *   "total": 100
 * }
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Allow: POST, OPTIONS');
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('ok' => false, 'error' => 'method_not_allowed'));
    exit;
}

$SHOP_TO = 'hvostik.shop@mail.ru';
$SHOP_FROM = 'noreply@' . (isset($_SERVER['HTTP_HOST']) ? preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST']) : 'hvostikshop.local');
// Prefer a stable From on shared hosting if domain mail is configured:
if (strpos($SHOP_FROM, 'noreply@') === 0 && $SHOP_FROM !== 'noreply@hvostikshop.local') {
    // keep host-based From
} else {
    $SHOP_FROM = 'hvostik.shop@mail.ru';
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data) || empty($data)) {
    // Fallback: classic form fields
    $data = $_POST;
    if (isset($data['items']) && is_string($data['items'])) {
        $decoded = json_decode($data['items'], true);
        if (is_array($decoded)) {
            $data['items'] = $decoded;
        }
    }
}

function hv_trim($v) {
    return trim(isset($v) ? (string)$v : '');
}

function hv_safe($v) {
    return str_replace(array("\r", "\n", "\0"), ' ', hv_trim($v));
}

$order = hv_safe(isset($data['order']) ? $data['order'] : '');
$name = hv_safe(isset($data['name']) ? $data['name'] : '');
$phone = hv_safe(isset($data['phone']) ? $data['phone'] : '');
$email = hv_safe(isset($data['email']) ? $data['email'] : '');
$city = hv_safe(isset($data['city']) ? $data['city'] : '');
$ship = hv_safe(isset($data['ship']) ? $data['ship'] : '');
$comment = hv_trim(isset($data['comment']) ? $data['comment'] : '');
$items = (isset($data['items']) && is_array($data['items'])) ? $data['items'] : array();
$total = isset($data['total']) ? (int)$data['total'] : 0;

if ($order === '' || !preg_match('/^ХВ-\d{6}$/u', $order)) {
    // Also accept ASCII fallback XV-###### if client can't send Cyrillic
    if (!preg_match('/^(ХВ|XV)-\d{6}$/u', $order)) {
        http_response_code(400);
        echo json_encode(array('ok' => false, 'error' => 'bad_order'));
        exit;
    }
}

if ($name === '') {
    http_response_code(400);
    echo json_encode(array('ok' => false, 'error' => 'name_required'));
    exit;
}

if ($phone === '' && $email === '') {
    http_response_code(400);
    echo json_encode(array('ok' => false, 'error' => 'contact_required'));
    exit;
}

if (empty($items)) {
    http_response_code(400);
    echo json_encode(array('ok' => false, 'error' => 'empty_cart'));
    exit;
}

$lines = array();
$calc = 0;
foreach ($items as $it) {
    $iname = hv_safe(isset($it['name']) ? $it['name'] : 'Товар');
    $qty = isset($it['qty']) ? (int)$it['qty'] : 0;
    $price = isset($it['price']) ? (int)$it['price'] : 0;
    if ($qty < 1) {
        $qty = 1;
    }
    $sum = $qty * $price;
    $calc += $sum;
    $lines[] = sprintf('- %s × %d = %d ₽ (цена %d ₽)', $iname, $qty, $sum, $price);
}

if ($total <= 0) {
    $total = $calc;
}

$when = date('d.m.Y H:i');
$ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '';

$body = "Новый заказ с сайта хвостикшоп.рф\n";
$body .= "================================\n";
$body .= "Номер заказа: {$order}\n";
$body .= "Дата: {$when}\n";
$body .= "\n";
$body .= "Покупатель\n";
$body .= "----------\n";
$body .= "Имя: {$name}\n";
$body .= "Телефон: " . ($phone !== '' ? $phone : '—') . "\n";
$body .= "E-mail: " . ($email !== '' ? $email : '—') . "\n";
$body .= "Город: " . ($city !== '' ? $city : '—') . "\n";
$body .= "Доставка: " . ($ship !== '' ? $ship : '—') . "\n";
$body .= "\n";
$body .= "Состав заказа\n";
$body .= "-------------\n";
$body .= implode("\n", $lines) . "\n";
$body .= "\n";
$body .= "Итого: {$total} ₽\n";
$body .= "\n";
$body .= "Сообщение покупателя\n";
$body .= "--------------------\n";
$body .= ($comment !== '' ? $comment : '—') . "\n";
$body .= "\n";
$body .= "IP: {$ip}\n";
$body .= "Оплаты на сайте нет — свяжитесь с покупателем и назовите номер {$order}.\n";

$subject = 'Заказ ' . $order . ' — хвостикшоп.рф';

$headers = array();
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'Content-Transfer-Encoding: 8bit';
$headers[] = 'From: Хвостик Shop <' . $SHOP_FROM . '>';
$headers[] = 'X-Mailer: PHP/' . phpversion();
if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $headers[] = 'Reply-To: ' . $email;
}

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$ok = @mail($SHOP_TO, $encodedSubject, $body, implode("\r\n", $headers));

if (!$ok) {
    // Log locally for Hostinger troubleshooting (file stays private under site root)
    $logLine = date('c') . " FAIL order={$order} to={$SHOP_TO}\n";
    @file_put_contents(__DIR__ . '/order-mail.log', $logLine, FILE_APPEND);
    http_response_code(502);
    echo json_encode(array(
        'ok' => false,
        'error' => 'mail_failed',
        'order' => $order,
        'hint' => 'Проверьте PHP mail() на Hostinger или настройте почтовый ящик домена.'
    ));
    exit;
}

echo json_encode(array(
    'ok' => true,
    'order' => $order,
    'mailed' => true
));
