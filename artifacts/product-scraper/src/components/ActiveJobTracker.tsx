import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useGetScrapeJob, getGetScrapeJobQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, CheckCircle2, XCircle, Clock, Database } from "lucide-react";
import { formatDate } from "@/lib/utils";

export function ActiveJobTracker({ jobId }: { jobId: number }) {
  const queryClient = useQueryClient();
  
  // Poll every 2 seconds if job is running or pending
  const { data: job } = useGetScrapeJob(jobId, {
    query: {
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        return (status === 'pending' || status === 'running') ? 2000 : false;
      },
      queryKey: getGetScrapeJobQueryKey(jobId),
      enabled: !!jobId,
    }
  });

  // When job completes, invalidate products and stats
  useEffect(() => {
    if (job?.status === 'completed') {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scrape/jobs'] });
    }
  }, [job?.status, queryClient]);

  if (!job) return null;

  const isTerminal = job.status === 'completed' || job.status === 'failed';
  const progress = job.pagesRequested > 0 
    ? ((job.pagesScraped || 0) / job.pagesRequested) * 100 
    : 0;

  return (
    <Card className={`border-l-4 transition-colors ${
      job.status === 'failed' ? 'border-l-destructive' : 
      job.status === 'completed' ? 'border-l-emerald-500' : 
      'border-l-primary'
    }`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {job.status === 'running' && <Activity className="h-5 w-5 text-primary animate-pulse" />}
            {job.status === 'pending' && <Clock className="h-5 w-5 text-muted-foreground" />}
            {job.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
            {job.status === 'failed' && <XCircle className="h-5 w-5 text-destructive" />}
            
            <div>
              <h3 className="font-mono font-bold text-foreground">Job #{job.id}</h3>
              <p className="text-xs font-mono text-muted-foreground">Started: {formatDate(job.startedAt)}</p>
            </div>
          </div>
          
          <Badge variant={
            job.status === 'completed' ? 'success' : 
            job.status === 'failed' ? 'destructive' : 
            job.status === 'running' ? 'default' : 'secondary'
          }>
            {job.status}
          </Badge>
        </div>

        <div className="space-y-4">
          {!isTerminal && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-muted-foreground">
                <span>Scraping pages...</span>
                <span>{job.pagesScraped || 0} / {job.pagesRequested}</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
            <div className="flex flex-col">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Yield</span>
              <span className="font-mono font-bold text-lg flex items-center gap-2">
                <Database className="h-4 w-4 text-accent" />
                {job.productsFound || 0}
              </span>
            </div>
            
            {job.completedAt && (
              <div className="flex flex-col">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Duration</span>
                <span className="font-mono text-sm mt-1">
                  {((new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 1000).toFixed(1)}s
                </span>
              </div>
            )}
          </div>

          {job.error && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm font-mono rounded-md border border-destructive/20">
              {job.error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
