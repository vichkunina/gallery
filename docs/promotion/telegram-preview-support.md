# Не формируются Telegram-превью через Yandex Cloud CDN

Прошу проверить доступ серверов Telegram, формирующих превью, к CDN-ресурсу.

- Домен: vichkunina.art, дополнительный домен www.vichkunina.art.
- CDN-ресурс: bc8rzhym3xo5zktvheag.
- Каталог: b1gre1mo6s8ekc4bkqru.
- Провайдер: ourcdn.
- Выданный CNAME: f9b7003e54f211e9.topology.gslb.yccdn.ru.
- Источник: galleryvic.website.yandexcloud.net, HTTP.
- Время воспроизведения: 14 сентября 2026, примерно 20:38–20:49 МСК.

## Воспроизведение

В одном и том же чате Telegram:

1. https://storage.yandexcloud.net/galleryvic/share-check/cillian-v1.html — карточка с фотографией появляется.
2. https://vichkunina.art/share-check/cillian-v1.html — карточка не появляется.
3. https://www.vichkunina.art/share-check/cillian-v1.html — карточка не появляется.
4. https://github.com/vichkunina/gallery — карточка появляется.

Результаты подтверждены пользователем. Первые три адреса отдают один и тот же статичный HTML без JavaScript с корректным Content-Type text/html; charset=utf-8. Изображение в документе и og:image загружается напрямую из Object Storage: https://storage.yandexcloud.net/galleryvic/images/gallery/thumbs/48-img_5151.jpg (JPEG 960×960, 390653 байта).

Проблема затрагивает также старые ссылки на картины. @WebpageBot сообщает «Link previews was updated successfully. Check them out!», но превью не появляется.

## Уже проверено

- Локальные GET-запросы с User-Agent TelegramBot (like TwitterBot) возвращают HTTP 200 для страниц и картинок, загрузка занимает менее секунды. Это не проверяет сеть серверов Telegram.
- robots.txt разрешает все пути.
- Google Public DNS: домен и CNAME ресурса разрешаются в 188.72.103.4; AAAA отсутствует.
- Сертификат CDN в состоянии READY, профиль TLS PROFILE_COMPATIBLE.
- В ответе API настроек CDN не обнаружены настроенные IP-ограничения.
- Фотография и минимальная HTML-страница корректно обрабатываются Telegram при использовании прямого адреса Object Storage.

Прошу проверить запросы инфраструктуры Telegram к ресурсу, TLS, выбор CDN-узла/DNS и возможные ограничения на стороне провайдера. По имеющимся данным нельзя достоверно приписать блокировку Telegram или Yandex Cloud CDN.
