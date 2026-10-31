CREATE TABLE `genres` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color_light` text NOT NULL,
	`color_dark` text NOT NULL,
	`palette_index` integer,
	`is_default` integer DEFAULT false NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `genres_name_unique` ON `genres` (`name`);--> statement-breakpoint
CREATE INDEX `genres_sort_order_idx` ON `genres` (`sort_order`);--> statement-breakpoint
INSERT INTO `genres` (`id`, `name`, `color_light`, `color_dark`, `palette_index`, `is_default`, `sort_order`, `created_at`, `updated_at`) VALUES
	('fantasy', 'Fantasia', '#7B69EE', '#B3A7FF', 0, 1, 0, 1735689600000, 1735689600000),
	('romance', 'Romance', '#FF6B5B', '#FF9A8F', 1, 1, 1, 1735689600000, 1735689600000),
	('nonfiction', 'Não-ficção', '#34C6B8', '#6FE3D6', 2, 1, 2, 1735689600000, 1735689600000),
	('classic', 'Clássico', '#2A2340', '#8B84A8', 3, 1, 3, 1735689600000, 1735689600000),
	('children', 'Infantojuvenil', '#FFC145', '#FFD980', 4, 1, 4, 1735689600000, 1735689600000),
	('horror', 'Terror', '#FF8FA3', '#FFB3C1', 5, 1, 5, 1735689600000, 1735689600000);