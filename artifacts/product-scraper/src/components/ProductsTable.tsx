import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListProducts, ListProductsSort, useClearProducts, useListCategories } from "@workspace/api-client-react";
import { formatPrice } from "@/lib/utils";
import { Search, Star, ExternalLink, Download, Trash2, ArrowUpDown, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

export function ProductsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<ListProductsSort>(ListProductsSort.title_asc);
  const [minRating, setMinRating] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<string>("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories } = useListCategories();

  const { data: productData, isLoading } = useListProducts({
    page,
    limit: 50,
    search: search || undefined,
    category: category === "all" ? undefined : category,
    sort,
    minRating: minRating === "all" ? undefined : parseInt(minRating, 10),
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined
  });

  const clearProducts = useClearProducts();

  const handleClear = () => {
    if (confirm("Are you sure you want to delete all scraped data? This cannot be undone.")) {
      clearProducts.mutate(undefined, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/products'] });
          queryClient.invalidateQueries({ queryKey: ['/api/products/stats'] });
          queryClient.invalidateQueries({ queryKey: ['/api/products/categories'] });
          toast({
            title: "Data Purged",
            description: "All products have been deleted from the database.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.append("category", category);
      if (minRating !== "all") params.append("minRating", minRating);
      
      const res = await fetch(`/api/products/export?${params.toString()}`);
      if (!res.ok) throw new Error("Export failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      toast({
        title: "Export Failed",
        description: "Could not generate CSV file.",
        variant: "destructive",
      });
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`h-3 w-3 ${star <= rating ? "fill-accent text-accent" : "text-muted-foreground opacity-30"}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-wrap gap-2 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search titles..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 font-mono"
            />
          </div>
          
          <Select value={sort} onValueChange={(v) => setSort(v as ListProductsSort)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ListProductsSort.title_asc}>Title (A-Z)</SelectItem>
              <SelectItem value={ListProductsSort.price_asc}>Price (Low to High)</SelectItem>
              <SelectItem value={ListProductsSort.price_desc}>Price (High to Low)</SelectItem>
              <SelectItem value={ListProductsSort.rating_desc}>Rating (High to Low)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((c) => (
                <SelectItem key={c.category} value={c.category}>
                  {c.category.replace(/-/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={minRating} onValueChange={(v) => { setMinRating(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Min Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Rating</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4+ Stars</SelectItem>
              <SelectItem value="3">3+ Stars</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative w-full sm:w-[140px]">
            <Input 
              type="number"
              placeholder="Max Price £" 
              value={maxPrice}
              onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
              className="font-mono pr-8"
              min="0"
              step="0.01"
            />
            {maxPrice && (
              <button 
                onClick={() => { setMaxPrice(""); setPage(1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="font-mono text-xs">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="destructive" size="sm" onClick={handleClear} className="font-mono text-xs">
            <Trash2 className="h-4 w-4 mr-2" />
            Purge Data
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/40">
            <TableRow>
              <TableHead className="w-[400px]">Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex justify-center items-center h-full text-muted-foreground font-mono">
                    <span className="animate-pulse">Loading dataset...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : !productData?.products.length ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex justify-center items-center h-full text-muted-foreground font-mono">
                    No records found matching criteria.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              productData.products.map((product, i) => (
                <TableRow key={product.id} className="group hover:bg-secondary/20 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}>
                  <TableCell className="font-medium text-foreground">
                    <div className="truncate max-w-[350px]" title={product.title}>
                      {product.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-[10px] rounded-sm">
                      {product.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-primary font-bold">
                    {formatPrice(product.price)}
                  </TableCell>
                  <TableCell>
                    {renderStars(product.rating)}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-mono px-2 py-1 rounded-sm ${
                      product.availability.includes('In stock') 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {product.availability}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <a href={product.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {productData && productData.total > 0 && (
        <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
          <div>
            Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, productData.total)} of {productData.total} records
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 text-xs"
            >
              Prev
            </Button>
            <span className="px-2">Page {page} of {Math.ceil(productData.total / 50)}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(productData.total / 50)}
              className="h-8 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
