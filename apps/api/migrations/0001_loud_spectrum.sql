DROP INDEX `invitations_token_idx`;--> statement-breakpoint
CREATE INDEX `invitations_token_idx` ON `invitations` (`token`);