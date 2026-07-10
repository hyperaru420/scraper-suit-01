import * as cheerio from "cheerio";

const BASE_URL = "https://books.toscrape.com";

const WORD_TO_NUM: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
};

export interface ScrapedProduct {
  title: string;
  price: number;
  rating: number;
  availability: string;
  category: string;
  url: string;
}

function parseRating(className: string): number {
  const classes = className.toLowerCase().split(" ");
  for (const cls of classes) {
    if (WORD_TO_NUM[cls] !== undefined) return WORD_TO_NUM[cls];
  }
  return 1;
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; ProductScraper/1.0; +https://books.toscrape.com)",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

function parseCatalogueHtml(html: string, categoryFilter?: string): ScrapedProduct[] {
  const $ = cheerio.load(html);
  const products: ScrapedProduct[] = [];

  // Category from breadcrumb (available on category pages)
  const breadcrumbCategory = $("ul.breadcrumb li:nth-child(3) a").text().trim();

  $("article.product_pod").each((_, el) => {
    const titleEl = $(el).find("h3 a");
    const title = titleEl.attr("title") || titleEl.text().trim();
    const relativeUrl = titleEl.attr("href") || "";
    const priceText = $(el).find("p.price_color").text().trim();
    const price = parseFloat(priceText.replace(/[^0-9.]/g, "")) || 0;
    const ratingClass = $(el).find("p.star-rating").attr("class") || "";
    const rating = parseRating(ratingClass);
    const availabilityText = $(el).find("p.availability").text().trim();
    const availability = availabilityText || "Unknown";

    // Resolve absolute URL
    const bookHref = relativeUrl.replace(/^(\.\.\/)+/, "");
    const bookUrl = `${BASE_URL}/catalogue/${bookHref}`;

    const cat = breadcrumbCategory || "General";

    if (title && price > 0) {
      // If filtering by category, skip non-matching items
      if (categoryFilter && cat.toLowerCase() !== categoryFilter.toLowerCase()) return;
      products.push({ title, price, rating, availability, category: cat, url: bookUrl });
    }
  });

  return products;
}

async function scrapePageUrl(url: string, categoryFilter?: string): Promise<{ products: ScrapedProduct[]; hasNext: boolean }> {
  let html: string;
  try {
    html = await fetchPage(url);
  } catch {
    return { products: [], hasNext: false };
  }
  const $ = cheerio.load(html);
  const hasNext = $("li.next").length > 0;
  const products = parseCatalogueHtml(html, categoryFilter);
  return { products, hasNext };
}

export async function scrapeAllPages(
  pages: number,
  category?: string,
  onPageDone?: (pageNum: number, products: ScrapedProduct[]) => Promise<void>,
): Promise<{ pagesScraped: number; total: number }> {
  let pagesScraped = 0;
  let total = 0;

  // When scraping all books (no category filter) use the standard paginated catalogue
  // When a category filter is requested, still scrape the general catalogue pages but
  // filter matching products — this avoids needing to map display names → URL slugs
  for (let page = 1; page <= pages; page++) {
    const url = `${BASE_URL}/catalogue/page-${page}.html`;
    const { products, hasNext } = await scrapePageUrl(url, category ?? undefined);

    pagesScraped++;
    total += products.length;

    if (onPageDone) {
      await onPageDone(page, products);
    }

    if (!hasNext) break; // No more pages on the site
  }

  return { pagesScraped, total };
}
