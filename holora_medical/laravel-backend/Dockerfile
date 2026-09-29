FROM composer:2 AS dependencies

WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-scripts --prefer-dist --optimize-autoloader

FROM php:8.4-cli-alpine

RUN docker-php-ext-install pdo_mysql

WORKDIR /var/www/html
COPY --from=dependencies /app/vendor ./vendor
COPY . .
RUN mkdir -p public/uploads storage/framework/cache storage/framework/sessions storage/framework/views storage/logs \
    && chown -R www-data:www-data storage bootstrap/cache public/uploads

EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
