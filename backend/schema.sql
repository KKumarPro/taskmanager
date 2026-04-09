-- Run this once to set up the database
CREATE DATABASE IF NOT EXISTS taskmanager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE taskmanager;

CREATE TABLE IF NOT EXISTS tasks (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    title     VARCHAR(255)  NOT NULL,
    completed TINYINT(1)    NOT NULL DEFAULT 0,
    createdAt DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);
