-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: 15.04.2025 klo 09:19
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
  `mealid` int(11) NOT NULL,
  `rating` int(11) DEFAULT NULL CHECK (`rating` between 1 and 5),
  `comment` text DEFAULT NULL,
  `created` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Vedos taulusta `reviews`
--

INSERT INTO `reviews` (`id`, `user_id`, `mealid`, `rating`, `comment`, `created`) VALUES
(1, 1, 0, 5, 'maukasta', '2025-04-08 07:39:35'),
(2, 1, 0, 4, 'erittäin hyväää', '2025-04-08 07:42:41'),
(3, 1, 0, 1, 'dawdawd', '2025-04-08 08:35:18'),
(4, 1, 0, 3, 'ihan ok', '2025-04-08 08:39:09'),
(5, 1, 0, 1, 'taaas yksi testi', '2025-04-08 08:41:49'),
(6, 1, 0, 1, 'ihan kauheata', '2025-04-08 08:43:10'),
(7, 1, 52937, 4, 'aika hyvvee', '2025-04-08 09:49:06'),
(8, 1, 53050, 4, 'reqyrwiyrdlu', '2025-04-15 06:25:50'),
(9, 1, 53050, 4, 'reqyrwiyrdlu', '2025-04-15 06:26:57');

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
(2, 'oikeatesti2', 'oikeatesti2@gmail.com', '2025-03-31 09:39:37', '$2b$10$P45pnbelh1J1ObGxMeP1s..vG7sxWwjQt/ebcLMMF1wZh6Av7hBJG');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
