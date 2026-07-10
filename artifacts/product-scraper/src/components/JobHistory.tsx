import { useListScrapeJobs } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { History, CheckCircle2, XCircle, Clock, Activity } from "lucide-react";

export function JobHistory() {
  const { data: jobs } = useListScrapeJobs();

  if (!jobs?.length) return null;

  return (
    <Card className="border-border/50 bg-secondary/5 h-full">
      <CardHeader className="bg-transparent border-b border-border/50 pb-4">
        <CardTitle className="text-sm flex items-center gap-2 text-foreground">
          <History className="h-4 w-4 text-muted-foreground" />
          Recent Executions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {jobs.slice(0, 5).map((job) => (
            <div key={job.id} className="p-4 flex flex-col gap-2 hover:bg-secondary/10 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {job.status === 'running' && <Activity className="h-4 w-4 text-primary animate-pulse" />}
                  {job.status === 'pending' && <Clock className="h-4 w-4 text-muted-foreground" />}
                  {job.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  {job.status === 'failed' && <XCircle className="h-4 w-4 text-destructive" />}
                  <span className="font-mono text-sm font-bold">Job #{job.id}</span>
                </div>
                <Badge variant={
                  job.status === 'completed' ? 'success' : 
                  job.status === 'failed' ? 'destructive' : 'secondary'
                } className="text-[10px] h-5">
                  {job.status}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center text-xs font-mono text-muted-foreground">
                <span>{formatDate(job.startedAt)}</span>
                <span className="text-foreground">
                  {job.productsFound || 0} records
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
