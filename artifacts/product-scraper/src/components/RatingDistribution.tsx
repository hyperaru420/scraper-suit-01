import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useGetProductStats } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BarChart as BarChartIcon } from "lucide-react";

export function RatingDistribution() {
  const { data: stats } = useGetProductStats();

  if (!stats || !stats.byRating.length) return null;

  // Format data for recharts
  const data = stats.byRating.map(item => ({
    name: `${item.rating} Star`,
    count: item.count,
    rating: item.rating
  })).sort((a, b) => a.rating - b.rating); // Sort 1 to 5

  return (
    <Card className="border-border/50 bg-secondary/5">
      <CardHeader className="bg-transparent border-b border-border/50 pb-4">
        <CardTitle className="text-sm flex items-center gap-2 text-foreground">
          <BarChartIcon className="h-4 w-4 text-muted-foreground" />
          Rating Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)" }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)" }}
            />
            <Tooltip 
              cursor={{ fill: "hsl(var(--secondary))", opacity: 0.4 }}
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: "4px",
                fontFamily: "var(--font-mono)",
                fontSize: "12px"
              }}
              itemStyle={{ color: "hsl(var(--accent))", fontWeight: "bold" }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.rating >= 4 ? "hsl(var(--accent))" : entry.rating === 3 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
