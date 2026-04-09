FROM php:8.2-apache
# Install the MySQL extension for PHP
RUN docker-php-ext-install mysqli
# Enable Apache URL rewriting
RUN a2enmod rewrite