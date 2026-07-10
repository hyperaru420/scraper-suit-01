import { Router } from "express";
import { db } from "@workspace/db";
import { scrapeJobsTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { scrapeAllPages } from "../lib/scraper";
import { StartScrapeJobBody, GetScrapeJobParams } from "@workspace/api-zod";

const router = Router();

// POST /scrape — start a scrape job
router.post("/scrape", async (req, res) => {
  const body = StartScrapeJobBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid input", details: body.error.issues });
    return;
  }

  const { pages, category } = body.data;

  // Create job record
  const [job] = await db
    .insert(scrapeJobsTable)
    .values({
      status: "pending",
      pagesRequested: pages,
      startedAt: new Date(),
    })
    .returning();

  // Kick off scraping asynchronously (fire and forget)
  (async () => {
    try {
      await db
        .update(scrapeJobsTable)
        .set({ status: "running" })
        .where(eq(scrapeJobsTable.id, job.id));

      let pagesScraped = 0;
      let total = 0;

      await scrapeAllPages(
        pages,
        category ?? undefined,
        async (_pageNum, products) => {
          if (products.length === 0) return;
          await db.insert(productsTable).values(
            products.map((p) => ({
              title: p.title,
              price: String(p.price.toFixed(2)),
              rating: p.rating,
              availability: p.availability,
              category: p.category,
              url: p.url,
              jobId: job.id,
            })),
          );
          pagesScraped++;
          total += products.length;
          await db
            .update(scrapeJobsTable)
            .set({ pagesScraped, productsFound: total })
            .where(eq(scrapeJobsTable.id, job.id));
        },
      );

      await db
        .update(scrapeJobsTable)
        .set({
          status: "completed",
          pagesScraped,
          productsFound: total,
          completedAt: new Date(),
        })
        .where(eq(scrapeJobsTable.id, job.id));
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      await db
        .update(scrapeJobsTable)
        .set({
          status: "failed",
          completedAt: new Date(),
          error: errMsg,
        })
        .where(eq(scrapeJobsTable.id, job.id));
    }
  })();

  res.status(201).json(formatJob(job));
});

// GET /scrape/jobs
router.get("/scrape/jobs", async (_req, res) => {
  const jobs = await db
    .select()
    .from(scrapeJobsTable)
    .orderBy(scrapeJobsTable.startedAt)
    .limit(50);
  res.json(jobs.map(formatJob));
});

// GET /scrape/jobs/:jobId
router.get("/scrape/jobs/:jobId", async (req, res) => {
  const params = GetScrapeJobParams.safeParse({ jobId: Number(req.params.jobId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid job ID" });
    return;
  }

  const [job] = await db
    .select()
    .from(scrapeJobsTable)
    .where(eq(scrapeJobsTable.id, params.data.jobId))
    .limit(1);

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json(formatJob(job));
});

function formatJob(job: typeof scrapeJobsTable.$inferSelect) {
  return {
    id: job.id,
    status: job.status,
    pagesRequested: job.pagesRequested,
    pagesScraped: job.pagesScraped,
    productsFound: job.productsFound,
    startedAt: job.startedAt?.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
    error: job.error ?? null,
  };
}

export default router;
