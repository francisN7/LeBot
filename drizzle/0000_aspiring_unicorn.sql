CREATE TABLE `books` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`genre` text NOT NULL,
	`status` text NOT NULL,
	`pages` integer NOT NULL,
	`pages_read` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "books_pages_positive" CHECK("books"."pages" > 0),
	CONSTRAINT "books_pages_read_range" CHECK("books"."pages_read" >= 0 AND "books"."pages_read" <= "books"."pages")
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
