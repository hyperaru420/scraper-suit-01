import { pgTable, serial, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scrapeJobsTable = pgTable("scrape_jobs", {
  id: serial("id").primaryKey(),
  status: text("status").notNull().default("pending"),
  pagesRequested: integer("pages_requested").notNull(),
  pagesScraped: integer("pages_scraped").notNull().default(0),
  productsFound: integer("products_found").notNull().default(0),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  error: text("error"),
});

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  rating: integer("rating").notNull(),
  availability: text("availability").notNull(),
  category: text("category").notNull(),
  url: text("url").notNull(),
  scrapedAt: timestamp("scraped_at").notNull().defaultNow(),
  jobId: integer("job_id").references(() => scrapeJobsTable.id),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
export type ScrapeJob = typeof scrapeJobsTable.$inferSelect;
export type InsertScrapeJob = typeof scrapeJobsTable.$inferInsert;
