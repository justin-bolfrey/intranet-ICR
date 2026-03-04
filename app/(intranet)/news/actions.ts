"use server";

import { revalidatePath, unstable_cache } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export type NewsActionState = {
  success: boolean;
  error: string;
};

export type NewsItem = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author_vorname: string;
  author_nachname: string;
};

export async function createNews(
  _prev: NewsActionState,
  formData: FormData
): Promise<NewsActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Nicht eingeloggt." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = ((profile?.["Rolle"] as string) ?? "member").trim().toLowerCase();
  if (role !== "admin" && role !== "board") {
    return { success: false, error: "Keine Berechtigung." };
  }

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const content = (formData.get("content") as string | null)?.trim() ?? "";

  if (!title || !content) {
    return { success: false, error: "Betreff und Nachricht sind Pflichtfelder." };
  }

  const { error } = await supabase.from("news").insert({
    title,
    content,
    author_id: user.id,
  });

  if (error) {
    return { success: false, error: `Fehler beim Erstellen: ${error.message}` };
  }

  revalidatePath("/news");
  revalidatePath("/", "layout");
  return { success: true, error: "" };
}

async function fetchNewsFromDb(): Promise<NewsItem[]> {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: newsRows, error } = await admin
    .from("news")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !newsRows) {
    return [];
  }

  const authorIds = [...new Set(newsRows.map((n) => n.author_id as string))];

  const { data: authors } = await admin
    .from("profiles")
    .select("user_id, Vorname, Nachname")
    .in("user_id", authorIds);

  const authorMap = new Map<string, { vorname: string; nachname: string }>();
  if (authors) {
    for (const a of authors) {
      authorMap.set(a.user_id as string, {
        vorname: ((a.Vorname as string) ?? "").trim(),
        nachname: ((a.Nachname as string) ?? "").trim(),
      });
    }
  }

  return newsRows.map((row) => {
    const author = authorMap.get(row.author_id as string);
    return {
      id: row.id as string,
      title: (row.title as string) ?? "",
      content: (row.content as string) ?? "",
      created_at: (row.created_at as string) ?? "",
      author_vorname: author?.vorname ?? "Unbekannt",
      author_nachname: author?.nachname ?? "",
    };
  });
}

export const getNews = unstable_cache(fetchNewsFromDb, ["news-list"], {
  revalidate: 60,
});

export async function markNewsAsRead(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("profiles")
    .update({ letzter_news_aufruf: new Date().toISOString() })
    .eq("user_id", user.id);
}

export async function checkUnreadNews(lastReadAt: string | null): Promise<boolean> {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = admin.from("news").select("id", { count: "exact", head: true });

  if (lastReadAt) {
    query = query.gt("created_at", lastReadAt);
  }

  const { count } = await query;
  return (count ?? 0) > 0;
}

export async function deleteNews(id: string): Promise<{ error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Nicht eingeloggt." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = ((profile?.["Rolle"] as string) ?? "member").trim().toLowerCase();
  if (role !== "admin" && role !== "board") {
    return { error: "Nur Admins/Vorstand dürfen News entfernen." };
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await admin.from("news").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/news");
  revalidatePath("/", "layout");
  return { error: "" };
}
