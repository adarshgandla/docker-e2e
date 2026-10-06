-- ==============================================================================
-- 🐬 HOST MYSQL CONFIGURATION SCRIPT FOR DOCKER CONTAINERS
-- ==============================================================================
-- Run this script in your host MySQL client (MySQL Workbench, DBeaver, or terminal)
-- to allow Docker containers to connect with user 'root' and password 'root'.
-- ==============================================================================

-- 1. Create target database
CREATE DATABASE IF NOT EXISTS `taskflow` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Allow 'root' user to connect from any remote host (Docker network bridge)
-- Note: 'root'@'localhost' only allows local connections. Docker containers connect
-- via the bridge IP (e.g. 172.17.0.1 or 192.168.65.1), which requires 'root'@'%'.
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'root';
ALTER USER 'root'@'%' IDENTIFIED WITH caching_sha2_password BY 'root';

-- 3. Grant full privileges on the taskflow database
GRANT ALL PRIVILEGES ON `taskflow`.* TO 'root'@'%';
FLUSH PRIVILEGES;

-- 4. Create tasks table
USE `taskflow`;

CREATE TABLE IF NOT EXISTS `tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `done` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Seed initial data
INSERT INTO `tasks` (`title`, `done`) VALUES
('Connect container to host MySQL database', 1),
('Configure host.docker.internal DNS resolver', 1),
('Grant root@% remote permissions in MySQL', 1);

SELECT * FROM `tasks`;
