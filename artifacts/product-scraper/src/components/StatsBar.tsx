import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { Database, TrendingUp, Layers, Star } from "lucide-react";
import { useGetProductStats } from "@workspace/api-client-react";

export function StatsBar() {
  const { data: stats } = useGetProductStats();

  if (!stats) return null;

  const cards = [
    {
      title: "Total Records",
      value: stats.totalProducts.toLocaleString(),
      icon: Database,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Average Price",
      value: formatPrice(stats.avgPrice),
      icon: TrendingUp,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      title: "Average Rating",
      value: stats.avgRating.toFixed(1),
      icon: Star,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      title: "Categories",
      value: stats.totalCategories.toLocaleString(),
      icon: Layers,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <Card key={i} className="border-border/50 bg-secondary/10 hover:bg-secondary/20 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
                  {card.title}
                </p>
                <p className="text-2xl font-mono font-bold tracking-tight">
                  {card.value}
                </p>
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
