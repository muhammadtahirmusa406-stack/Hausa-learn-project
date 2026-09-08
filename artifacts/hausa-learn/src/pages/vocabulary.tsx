import { useState } from "react";
import { useGetVocabulary } from "@workspace/api-client-react";
import { Volume2, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { speakHausa } from "@/lib/hausa-audio";

const CATEGORIES = ["All", "Basics", "Greetings", "Numbers", "Colors", "Food", "Family"];

export default function Vocabulary() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  
  const { data: vocab, isLoading } = useGetVocabulary({ 
    category: activeCategory === "All" ? undefined : activeCategory 
  });

  const speak = (text: string) => {
    if (!speakHausa(text)) {
      toast({
        title: "Hausa audio unavailable",
        description: "This browser does not provide a Hausa-capable voice. No English voice was used as a substitute.",
        variant: "destructive",
      });
    }
  };

  const filteredVocab = vocab?.filter(word => 
    word.hausa.toLowerCase().includes(searchQuery.toLowerCase()) || 
    word.english.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8 pb-12">
      <div className="text-center md:text-left mb-6">
        <h1 className="text-3xl font-display font-bold mb-3">Vocabulary</h1>
        <p className="text-muted-foreground font-medium">Expand your Hausa dictionary.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search in English or Hausa..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 rounded-2xl border-2 bg-card font-medium text-lg"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <Button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            variant={activeCategory === cat ? "default" : "outline"}
            className={`rounded-xl font-bold whitespace-nowrap border-2 ${
              activeCategory === cat ? 'shadow-sm' : 'bg-card text-foreground'
            }`}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : filteredVocab.length === 0 ? (
        <div className="bg-card border-2 border-border rounded-3xl p-12 text-center text-muted-foreground font-medium">
          No words found matching "{searchQuery}" in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVocab.map((word) => (
            <div key={word.id} className="bg-card border-2 border-border rounded-2xl p-6 hover:border-primary/40 transition-colors shadow-sm group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-display font-bold text-primary mb-1">{word.hausa}</h3>
                  <p className="text-sm font-bold text-muted-foreground tracking-wide">/{word.pronunciation}/</p>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="rounded-full opacity-50 group-hover:opacity-100 group-hover:bg-primary/10 group-hover:text-primary transition-all"
                  onClick={() => speak(word.hausa)}
                >
                  <Volume2 className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-xl font-bold text-foreground mb-4">{word.english}</p>
              
              {word.example && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-sm font-medium italic text-foreground mb-1">"{word.example}"</p>
                  <p className="text-sm font-medium text-muted-foreground">{word.exampleTranslation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
