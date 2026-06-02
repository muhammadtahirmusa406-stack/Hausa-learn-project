import { useGetLessonCategories } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Check, Lock, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Learn() {
  const { data: categories, isLoading } = useGetLessonCategories();

  if (isLoading) {
    return (
      <div className="space-y-12 py-8 flex flex-col items-center">
        {[1, 2].map((i) => (
          <div key={i} className="w-full max-w-md space-y-6">
            <div className="h-16 bg-muted rounded-2xl animate-pulse" />
            <div className="flex flex-col items-center gap-8">
              <div className="w-20 h-20 bg-muted rounded-full animate-pulse" />
              <div className="w-20 h-20 bg-muted rounded-full animate-pulse ml-12" />
              <div className="w-20 h-20 bg-muted rounded-full animate-pulse mr-12" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-12 py-4 pb-24 md:pb-8 flex flex-col items-center animate-in fade-in duration-500">
      {categories?.map((category, catIndex) => (
        <div key={category.name} className="w-full max-w-md">
          {/* Category Header */}
          <div className="bg-card border-2 border-border rounded-2xl p-4 mb-8 shadow-sm sticky top-16 md:top-20 z-10 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">
                Unit {catIndex + 1}: {category.name}
              </h2>
              <p className="text-sm font-medium text-muted-foreground mt-1">
                {category.completedCount} / {category.totalCount} completed
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              {Math.round((category.completedCount / category.totalCount) * 100)}%
            </div>
          </div>

          {/* Skill Tree */}
          <div className="flex flex-col items-center space-y-6 relative py-4">
            {/* Connecting line behind nodes */}
            <div className="absolute top-0 bottom-0 w-4 bg-muted/50 -z-10 rounded-full" />

            {category.lessons.map((lesson, index) => {
              // Create a zigzag pattern
              const offsetClasses = [
                "translate-x-0",
                "translate-x-12",
                "translate-x-0",
                "-translate-x-12",
              ];
              const offset = offsetClasses[index % 4];

              return (
                <div
                  key={lesson.id}
                  className={cn(
                    "relative flex flex-col items-center transition-all duration-300",
                    offset
                  )}
                >
                  <Link href={lesson.isUnlocked ? `/lesson/${lesson.id}` : "#"}>
                    <div
                      className={cn(
                        "w-[84px] h-[84px] rounded-full flex items-center justify-center border-b-8 active:border-b-0 active:translate-y-2 transition-all cursor-pointer shadow-sm relative group",
                        lesson.isCompleted
                          ? "bg-secondary border-secondary/80 text-secondary-foreground"
                          : lesson.isUnlocked
                          ? "bg-primary border-primary/80 text-primary-foreground"
                          : "bg-muted border-border text-muted-foreground cursor-not-allowed"
                      )}
                    >
                      {/* Icon */}
                      <span className="text-3xl">
                        {lesson.isCompleted ? (
                          <Check className="w-10 h-10 stroke-[3]" />
                        ) : lesson.isUnlocked ? (
                          <Star className="w-10 h-10 stroke-[2] fill-current opacity-80" />
                        ) : (
                          <Lock className="w-8 h-8 stroke-[2.5]" />
                        )}
                      </span>

                      {/* Tooltip on hover for unlocked lessons */}
                      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-sm font-bold py-2 px-4 rounded-xl whitespace-nowrap pointer-events-none hidden md:block shadow-lg">
                        {lesson.title}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-foreground rotate-45" />
                      </div>
                    </div>
                  </Link>

                  {/* Title underneath */}
                  <span className="mt-4 font-bold text-foreground text-center w-32 line-clamp-2 leading-tight">
                    {lesson.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
