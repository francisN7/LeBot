CREATE TABLE `queue_items` (
	`book_id` text PRIMARY KEY NOT NULL,
	`position` integer NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `queue_items_position_idx` ON `queue_items` (`position`);