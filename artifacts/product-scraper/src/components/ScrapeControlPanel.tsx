import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useListCategories,
  useStartScrapeJob,
  getListScrapeJobsQueryKey,
} from "@workspace/api-client-react";
import { Terminal, Play, Loader2 } from "lucide-react";

export function ScrapeControlPanel() {
  const [pages, setPages] = useState<string>("5");
  const [category, setCategory] = useState<string>("all");

  const queryClient = useQueryClient();
  const { data: categories } = useListCategories();
  const startJob = useStartScrapeJob({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListScrapeJobsQueryKey() });
      },
    },
  });

  const handleStart = () => {
    const numPages = parseInt(pages, 10);
    if (isNaN(numPages) || numPages < 1 || numPages > 50) return;

    startJob.mutate({
      data: {
        pages: numPages,
        category: category === "all" ? undefined : category,
      }
    });
  };

  const estimatedBooks = parseInt(pages, 10) * 20;

  return (
    <div className="rounded-lg border border-primary/30 bg-card p-6 shadow-[0_0_20px_rgba(0,245,212,0.05)]">
      <div className="flex items-center gap-2 mb-6">
        <Terminal className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-mono font-bold tracking-wider text-primary">Scrape Parameters</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        <div className="space-y-2">
          <Label htmlFor="pages" className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            Pages to Traverse
          </Label>
          <div className="relative">
            <Input
              id="pages"
              type="number"
              min="1"
              max="50"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              className="pl-4 pr-12 font-mono text-lg"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">
              / 50
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            Category Filter
          </Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((c) => (
                <SelectItem key={c.category} value={c.category}>
                  {c.category.replace(/-/g, " ")} ({c.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleStart} 
          disabled={startJob.isPending || isNaN(parseInt(pages, 10))}
          className="w-full h-10 group"
        >
          {startJob.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
          )}
          {startJob.isPending ? "Initializing..." : "Execute Job"}
        </Button>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs font-mono border-t border-border pt-4">
        <span className="text-muted-foreground">Target: books.toscrape.com</span>
        <span className="text-accent flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
          Est. Yield: ~{isNaN(estimatedBooks) ? 0 : estimatedBooks} records
        </span>
      </div>
    </div>
  );
}
