import { NewsCard } from "@/components/news/NewsCard";
import { getNews, markNewsAsRead } from "./actions";

export default async function NewsPage() {
  await markNewsAsRead();
  const news = await getNews();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Schwarzes Brett</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Neuigkeiten und Ankündigungen für alle Mitglieder.
        </p>
      </div>

      {news.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Noch keine Neuigkeiten vorhanden.
        </div>
      ) : (
        <div className="space-y-4">
          {news.map((item) => {
            const date = new Date(item.created_at);
            const formatted = !Number.isNaN(date.getTime())
              ? date.toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            return (
              <NewsCard
                key={item.id}
                title={item.title}
                content={item.content}
                author={`${item.author_vorname} ${item.author_nachname}`.trim()}
                date={formatted}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
