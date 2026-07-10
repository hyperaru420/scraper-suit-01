import { ScrapeControlPanel } from "@/components/ScrapeControlPanel";
import { ActiveJobTracker } from "@/components/ActiveJobTracker";
import { StatsBar } from "@/components/StatsBar";
import { ProductsTable } from "@/components/ProductsTable";
import { JobHistory } from "@/components/JobHistory";
import { RatingDistribution } from "@/components/RatingDistribution";
import { useListScrapeJobs } from "@workspace/api-client-react";
import { TerminalSquare } from "lucide-react";

export default function Dashboard() {
  const { data: jobs } = useListScrapeJobs();
  
  // Find the most recent job that is running or pending
  const activeJob = jobs?.find(j => j.status === 'running' || j.status === 'pending');

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 selection:bg-primary/30 selection:text-primary">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center border border-primary/50 shadow-[0_0_10px_rgba(0,245,212,0.2)]">
              <TerminalSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-mono font-bold text-lg leading-tight tracking-tight text-foreground">
                DATA_EXTRACTOR
              </h1>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest leading-none">
                books.toscrape.com targeting system
              </p>
            </div>
          </div>
          
          <div className="text-xs font-mono text-primary animate-pulse flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary inline-block shadow-[0_0_5px_rgba(0,245,212,0.8)]"></span>
            SYSTEM ONLINE
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Scrape controls and active job */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <ScrapeControlPanel />
            {activeJob && <ActiveJobTracker jobId={activeJob.id} />}
          </div>
          <div className="lg:col-span-1">
            <JobHistory />
          </div>
        </section>

        {/* Global stats */}
        <section>
          <StatsBar />
        </section>

        {/* Data viz and table */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <RatingDistribution />
          </div>
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-lg font-mono font-bold tracking-wider text-foreground">Extracted Dataset</h2>
              <div className="h-px bg-border flex-1 ml-4"></div>
            </div>
            <ProductsTable />
          </div>
        </section>
      </main>
    </div>
  );
}
