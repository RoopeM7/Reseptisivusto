-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: 22.04.2025 klo 08:53
-- Palvelimen versio: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `reseptisivusto`
--

-- --------------------------------------------------------

--
-- Rakenne taululle `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `recipe_id` int(11) NOT NULL,
  `rating` int(11) DEFAULT NULL CHECK (`rating` between 1 and 5),
  `comment` text DEFAULT NULL,
  `created` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Vedos taulusta `reviews`
--

INSERT INTO `reviews` (`id`, `user_id`, `recipe_id`, `rating`, `comment`, `created`) VALUES
(1, 4, 53050, 5, 'testitesti', '2025-04-15 09:07:30'),
(2, 4, 53050, 4, 'hyvää', '2025-04-15 09:10:28'),
(3, 4, 52773, 2, 'voisi olla suolaisempaa', '2025-04-15 09:19:30'),
(4, 4, 52940, 1, '', '2025-04-16 06:32:22'),
(5, 4, 53085, 3, 'CHICKEN JOCKEY', '2025-04-16 06:38:10'),
(6, 4, 52974, 4, 'hyvä resepti', '2025-04-16 07:08:17'),
(7, 4, 52934, 5, 'ihan mahtavaa!', '2025-04-22 06:35:17');

-- --------------------------------------------------------

--
-- Rakenne taululle `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `created` timestamp NOT NULL DEFAULT current_timestamp(),
  `password_hash` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Vedos taulusta `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `created`, `password_hash`) VALUES
(1, 'testi2', 'testi2@gmail.com', '2025-03-31 09:30:20', '$2b$10$J/o4uA5MGT.D8ji6/t74P.tSUb9ReQUcCNofVIKTWneg1Z0hLi.OS'),
(2, 'oikeatesti2', 'oikeatesti2@gmail.com', '2025-03-31 09:39:37', '$2b$10$P45pnbelh1J1ObGxMeP1s..vG7sxWwjQt/ebcLMMF1wZh6Av7hBJG'),
(3, 'testi3', 'testi3@gmail.com', '2025-04-02 06:55:36', '$2b$10$Wg3pJK.SOmgjYlw2Lk5YxefzdNJ130eqaZthrUr1JqYTqWh38waVS'),
(4, 'testi4', 'testi4@gmail.com', '2025-04-02 07:06:38', '$2b$10$9xVkOvn.id.V3PYKe8PtiOmaJHMuYiaNUwkSbn1l0EmMYC0gdGlBC'),
(5, 'E', 'esim@esim.com', '2025-04-16 07:12:57', '$2b$10$Wv/2gmLOPCooQ9FNq3s/6uaED19ftoDWiO/uKieKNeXwbHEmyPuAy');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Rajoitteet vedostauluille
--

--
-- Rajoitteet taululle `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
