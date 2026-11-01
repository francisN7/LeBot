CREATE TABLE `review_fields` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `review_fields_name_unique` ON `review_fields` (`name`);--> statement-breakpoint
CREATE INDEX `review_fields_sort_order_idx` ON `review_fields` (`sort_order`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`book_id` text PRIMARY KEY NOT NULL,
	`rating` integer NOT NULL,
	`text` text,
	`quote` text,
	`extras` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "reviews_rating_range" CHECK("reviews"."rating" >= 1 AND "reviews"."rating" <= 5)
);
