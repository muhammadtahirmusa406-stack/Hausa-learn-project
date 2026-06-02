import { useState } from "react";
import { useGetVocabulary } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Volume2, Search, BookA } from "lucide-react";

export default function Vocabulary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  
  const { data: vocab, isLoading } = useGetVocabulary();

  const categories = ["all", ...Array.from(new Set(vocab?.map(v => v.category) || []))];

  const filteredVocab = vocab?.filter(v => {
    const matchesSearch = v.hausa.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.english.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "all" || v.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Vocabulary</h1>
          <p className="text-muted-foreground mt-1">Browse and search Hausa words.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Hausa or English..."
            className="pl-10 h-12 text-lg rounded-2xl border-2 border-border shadow-sm"
          />
        </div>
        <div className="flex overflow-x-auto pb-2 -mb-2 gap-2 hide-scrollbar">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              className={`rounded-xl whitespace-nowrap border-2 ${activeCategory === cat ? "border-primary" : "border-border"}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredVocab?.map((word) => (
            <div key={word.id} className="bg-card border-2 border-border rounded-2xl p-5 shadow-sm hover:border-primary/50 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold font-display text-primary">{word.hausa}</h3>
                  <p className="text-muted-foreground text-sm font-mono mt-1">{word.pronunciation}</p>
                </div>
                <Button size="icon" variant="ghost" className="rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10">
                  <Volume2 className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="mb-4">
                <span className="text-lg font-medium text-foreground">{word.english}</span>
                <span className="ml-3 text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted px-2 py-1 rounded-md">
                  {word.category}
                </span>
              </div>

              {word.example && (
                <div className="bg-muted/50 p-3 rounded-xl border border-border/50 text-sm space-y-1">
                  <p className="font-medium text-foreground">{word.example}</p>
                  <p className="text-muted-foreground">{word.exampleTranslation}</p>
                </div>
              )}
            </div>
          ))}

          {filteredVocab?.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center text-center text-muted-foreground">
              <BookA className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">No words found</p>
              <p>Try adjusting your search or category filter.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
