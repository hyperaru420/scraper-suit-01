import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db";
import { eq, ilike, gte, lte, sql, count, avg, desc, asc, and } from "drizzle-orm";
import { ListProductsQueryParams, ExportProductsCsvQueryParams } from "@workspace/api-zod";

const router = Router();

// GET /products
router.get("/products", async (req, res) => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const {
    page = 1,
    limit = 50,
    category,
    minRating,
    maxPrice,
    sort = "title_asc",
    search,
  } = parsed.data;

  const offset = (page - 1) * limit;
  const where = buildWhere({ category, minRating, maxPrice, search });

  const orderBy = buildOrder(sort);

  const [products, totalRows] = await Promise.all([
    db.query.productsTable.findMany({
      where,
      orderBy,
      limit,
      offset,
    }),
    db.select({ c: count() }).from(productsTable).where(where),
  ]);

  const total = Number(totalRows[0]?.c ?? 0);

  res.json({
    products: products.map(formatProduct),
    total,
    page,
    limit,
  });
});

// DELETE /products
router.delete("/products", async (_req, res) => {
  const deleted = await db.delete(productsTable).returning({ id: productsTable.id });
  res.json({ deleted: deleted.length });
});

// GET /products/stats — must be before /products/:id patterns
router.get("/products/stats", async (_req, res) => {
  const [stats] = await db
    .select({
      total: count(),
      avgPrice: avg(productsTable.price),
      avgRating: avg(productsTable.rating),
      lastScraped: sql<string>`MAX(${productsTable.scrapedAt})`,
    })
    .from(productsTable);

  const categories = await db
    .selectDistinct({ category: productsTable.category })
    .from(productsTable);

  const ratingRows = await db
    .select({
      rating: productsTable.rating,
      cnt: count(),
    })
    .from(productsTable)
    .groupBy(productsTable.rating)
    .orderBy(productsTable.rating);

  res.json({
    totalProducts: Number(stats?.total ?? 0),
    avgPrice: stats?.avgPrice ? parseFloat(String(stats.avgPrice)) : 0,
    avgRating: stats?.avgRating ? parseFloat(String(stats.avgRating)) : 0,
    totalCategories: categories.length,
    byRating: ratingRows.map((r) => ({ rating: r.rating, count: Number(r.cnt) })),
    lastScrapedAt: stats?.lastScraped ? new Date(stats.lastScraped).toISOString() : null,
  });
});

// GET /products/categories
router.get("/products/categories", async (_req, res) => {
  const rows = await db
    .select({ category: productsTable.category, cnt: count() })
    .from(productsTable)
    .groupBy(productsTable.category)
    .orderBy(desc(count()));

  res.json(rows.map((r) => ({ category: r.category, count: Number(r.cnt) })));
});

// GET /products/export
router.get("/products/export", async (req, res) => {
  const parsed = ExportProductsCsvQueryParams.safeParse(req.query);
  const { category, minRating } = parsed.success ? parsed.data : {};

  const where = buildWhere({ category, minRating, maxPrice: undefined, search: undefined });

  const products = await db
    .select()
    .from(productsTable)
    .where(where)
    .orderBy(asc(productsTable.title));

  const rows: (string | number)[][] = [
    ["Title", "Price (GBP)", "Rating", "Availability", "Category", "URL", "Scraped At"],
    ...products.map((p) => [
      `"${p.title.replace(/"/g, '""')}"`,
      p.price,
      p.rating,
      `"${p.availability.replace(/"/g, '""')}"`,
      `"${p.category.replace(/"/g, '""')}"`,
      p.url,
      p.scrapedAt?.toISOString() ?? "",
    ]),
  ];

  const csv = rows.map((r) => r.join(",")).join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=products.csv");
  res.send(csv);
});

// ---- Helpers ----

function buildWhere(opts: {
  category?: string | null;
  minRating?: number | null;
  maxPrice?: number | null;
  search?: string | null;
}) {
  const conditions = [];
  if (opts.category) conditions.push(eq(productsTable.category, opts.category));
  if (opts.minRating) conditions.push(gte(productsTable.rating, opts.minRating));
  if (opts.maxPrice)
    conditions.push(lte(sql`${productsTable.price}::numeric`, opts.maxPrice));
  if (opts.search) conditions.push(ilike(productsTable.title, `%${opts.search}%`));

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

function buildOrder(sort: string) {
  switch (sort) {
    case "price_asc":
      return [asc(sql`${productsTable.price}::numeric`)];
    case "price_desc":
      return [desc(sql`${productsTable.price}::numeric`)];
    case "rating_desc":
      return [desc(productsTable.rating)];
    default:
      return [asc(productsTable.title)];
  }
}

function formatProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id,
    title: p.title,
    price: parseFloat(String(p.price)),
    rating: p.rating,
    availability: p.availability,
    category: p.category,
    url: p.url,
    scrapedAt: p.scrapedAt?.toISOString() ?? new Date().toISOString(),
    jobId: p.jobId ?? null,
  };
}

export default router;
