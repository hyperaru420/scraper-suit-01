import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-primary/20 bg-card">
        <CardContent className="pt-6 pb-6 flex flex-col items-center text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-mono font-bold tracking-tight">404</h1>
            <p className="text-sm font-mono text-muted-foreground">
              Route not found in system architecture.
            </p>
          </div>

          <Button asChild variant="outline" className="mt-4 font-mono">
            <Link href="/">
              Return to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
