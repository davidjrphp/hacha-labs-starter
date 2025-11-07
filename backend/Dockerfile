FROM php:8.3-fpm

RUN apt-get update && apt-get install -y \
    libpng-dev libonig-dev libxml2-dev unzip git cron \
 && docker-php-ext-install pdo pdo_mysql gd

WORKDIR /var/www
COPY . /var/www

# Cron for reminders
RUN echo '0 * * * * php /var/www/public/index.php schedule:run >> /var/log/cron.log 2>&1' > /etc/cron.d/app \ 
 && crontab /etc/cron.d/app
CMD service cron start && php-fpm
