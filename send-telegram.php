<?php
header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/telegram-config.local.php';
$chatId = '5845669670';

$name = trim($_POST['name'] ?? '');
$phone = trim($_POST['phone'] ?? '');
if ($name === '' || $phone === '') {
    http_response_code(400);
    echo json_encode([
        'ok' => false,
        'description' => 'Заполните все поля.'
    ]);
    exit;
}
$message = "Новая заявка на запись!\n\n";
$message .= "Имя: " . $name . "\n";
$message .= "Телефон: " . $phone;
$url = "https://api.telegram.org/bot{$token}/sendMessage";
$data = [
    'chat_id' => $chatId,
    'text' => $message
];
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
if ($response === false) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'description' => 'Ошибка соединения с Telegram.'
    ]);
    curl_close($ch);
    exit;
}
curl_close($ch);
echo $response;
