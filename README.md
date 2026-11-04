# Website

Статический сайт с формой записи и отправкой заявок в Telegram через PHP.

## Настройка

1. Скопируйте `telegram-config.example.php` в `telegram-config.local.php`.
2. Укажите токен бота в `telegram-config.local.php` и нужный `$chatId` в `send-telegram.php`.
3. Разместите проект на сервере с PHP и расширением cURL.

Локальный файл с токеном исключён из Git. При размещении сайта его нужно перенести отдельно.
