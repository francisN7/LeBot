CREATE TABLE `reading_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`pages` integer NOT NULL,
	`read_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "reading_sessions_pages_positive" CHECK("reading_sessions"."pages" > 0)
);
--> statement-breakpoint
CREATE INDEX `reading_sessions_book_idx` ON `reading_sessions` (`book_id`);