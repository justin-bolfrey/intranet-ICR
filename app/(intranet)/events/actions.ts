"use server";

import { revalidatePath, unstable_cache } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getCachedAuth } from "@/utils/supabase/cached-auth";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const BUCKET = "event-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export type EventRegistration = {
  id: string;
  user_id: string;
  event_id: string;
  vorname: string;
  nachname: string;
};

export type EventWithRegistrations = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  end_time: string | null;
  location: string | null;
  organizer: string | null;
  image_url: string | null;
  requires_registration: boolean;
  created_at: string;
  registrations: EventRegistration[];
};

export type MyEventItem = {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
};

export type MyEventsResult = {
  upcoming: (MyEventItem & { registrations: EventRegistration[] })[];
  attended: MyEventItem[];
};

export type EventParticipant = {
  user_id: string;
  vorname: string;
  nachname: string;
  studiengang: string;
  rolle: string;
};

export async function uploadEventImage(
  formData: FormData
): Promise<{ url: string | null; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { url: null, error: "Nicht eingeloggt." };

  const file = formData.get("file") as File | null;
  if (!file?.size) return { url: null, error: "Keine Datei ausgewählt." };
  if (file.size > MAX_FILE_SIZE)
    return { url: null, error: "Datei darf maximal 5 MB groß sein." };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const allowed = ["jpg", "jpeg", "png", "gif", "webp"];
  if (!allowed.includes(ext)) return { url: null, error: "Nur Bilder (jpg, png, gif, webp) erlaubt." };

  const name = `${user.id}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(name, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) return { url: null, error: error.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(name);
  return { url: publicUrl, error: "" };
}

export type CreateEventData = {
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  end_time: string;
  location: string;
  organizer: string;
  image_url: string | null;
  requires_registration: boolean;
};

export async function createEvent(
  data: CreateEventData
): Promise<{ id: string | null; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { id: null, error: "Nicht eingeloggt." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const role = ((profile?.["Rolle"] as string) ?? "member").trim().toLowerCase();
  if (role !== "admin" && role !== "board")
    return { id: null, error: "Keine Berechtigung." };

  const { data: row, error } = await supabase
    .from("events")
    .insert({
      title: data.title.trim(),
      description: data.description.trim() || null,
      event_date: data.event_date,
      event_time: data.event_time.trim() || null,
      end_time: data.end_time?.trim() || null,
      location: data.location.trim() || null,
      organizer: data.organizer.trim() || null,
      image_url: data.image_url || null,
      requires_registration: !!data.requires_registration,
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };
  revalidatePath("/events");
  revalidatePath("/calendar");
  return { id: (row?.id as string) ?? null, error: "" };
}

export async function deleteEvent(
  eventId: string
): Promise<{ error: string }> {
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
    return { error: "Nur Admins/Vorstand dürfen Events entfernen." };
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Registrierungen zuerst entfernen, um FK-Konflikte zu vermeiden.
  const { error: regError } = await admin
    .from("event_registrations")
    .delete()
    .eq("event_id", eventId);
  if (regError) return { error: regError.message };

  const { error: evError } = await admin
    .from("events")
    .delete()
    .eq("id", eventId);
  if (evError) return { error: evError.message };

  revalidatePath("/events");
  revalidatePath("/calendar");
  revalidatePath("/admin/events");
  return { error: "" };
}

async function fetchEventsFromDb(): Promise<EventWithRegistrations[]> {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: events, error } = await admin
    .from("events")
    .select("*")
    .order("event_date", { ascending: false });

  if (error || !events) return [];

  const eventIds = events.map((e) => e.id as string);
  const { data: regs } = await admin
    .from("event_registrations")
    .select("id, event_id, user_id")
    .in("event_id", eventIds);

  const userIds = [...new Set((regs ?? []).map((r) => r.user_id as string))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("user_id, Vorname, Nachname")
    .in("user_id", userIds.length ? userIds : ["__none__"]);

  const profileMap = new Map<string, { vorname: string; nachname: string }>();
  (profiles ?? []).forEach((p) => {
    profileMap.set(p.user_id as string, {
      vorname: ((p.Vorname as string) ?? "").trim(),
      nachname: ((p.Nachname as string) ?? "").trim(),
    });
  });

  const regList = (regs ?? []).map((r) => ({
    id: r.id as string,
    event_id: r.event_id as string,
    user_id: r.user_id as string,
    ...profileMap.get(r.user_id as string),
    vorname: profileMap.get(r.user_id as string)?.vorname ?? "",
    nachname: profileMap.get(r.user_id as string)?.nachname ?? "",
  }));

  return events.map((e) => ({
    id: e.id as string,
    title: (e.title as string) ?? "",
    description: (e.description as string) ?? null,
    event_date: (e.event_date as string) ?? "",
    event_time: (e.event_time as string) ?? null,
    end_time: (e.end_time as string) ?? null,
    location: (e.location as string) ?? null,
    organizer: (e.organizer as string) ?? null,
    image_url: (e.image_url as string) ?? null,
    requires_registration: !!(e.requires_registration as boolean),
    created_at: (e.created_at as string) ?? "",
    registrations: regList.filter((r) => r.event_id === e.id),
  }));
}

export async function getEvents(): Promise<EventWithRegistrations[]> {
  return unstable_cache(fetchEventsFromDb, ["events-list"], {
    revalidate: 60,
    tags: ["events"],
  })();
}

function getEventEndTimestamp(
  event_date: string,
  event_time: string | null,
  end_time: string | null
): number {
  const time = end_time || event_time || "23:59";
  const dt = new Date(event_date + "T" + time);
  return dt.getTime();
}

export async function getMyEvents(): Promise<MyEventsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { upcoming: [], attended: [] };

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: regs, error: regError } = await admin
    .from("event_registrations")
    .select("event_id")
    .eq("user_id", user.id);

  if (regError || !regs?.length) return { upcoming: [], attended: [] };

  const eventIds = regs.map((r) => r.event_id as string);
  const { data: events, error: evError } = await admin
    .from("events")
    .select("id, title, event_date, event_time, location, requires_registration")
    .in("id", eventIds);

  if (evError) return { upcoming: [], attended: [] };
  if (!events?.length) return { upcoming: [], attended: [] };

  const { data: allRegs } = await admin
    .from("event_registrations")
    .select("id, event_id, user_id")
    .in("event_id", eventIds);
  const userIds = [...new Set((allRegs ?? []).map((r) => r.user_id as string))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("user_id, Vorname, Nachname")
    .in("user_id", userIds.length ? userIds : ["__none__"]);
  const profileMap = new Map<string, { vorname: string; nachname: string }>();
  (profiles ?? []).forEach((p) => {
    profileMap.set(p.user_id as string, {
      vorname: ((p.Vorname as string) ?? "").trim(),
      nachname: ((p.Nachname as string) ?? "").trim(),
    });
  });
  const regList = (allRegs ?? []).map((r) => ({
    id: r.id as string,
    event_id: r.event_id as string,
    user_id: r.user_id as string,
    vorname: profileMap.get(r.user_id as string)?.vorname ?? "",
    nachname: profileMap.get(r.user_id as string)?.nachname ?? "",
  }));

  const now = Date.now();
  const upcoming: (MyEventItem & { registrations: EventRegistration[] })[] = [];
  const attended: MyEventItem[] = [];

  for (const e of events) {
    const event_date = (e.event_date as string) ?? "";
    const event_time = (e.event_time as string) ?? null;
    const end_time = (e as { end_time?: string }).end_time?.trim() || null;
    const endTs = getEventEndTimestamp(event_date, event_time, end_time);
    const item: MyEventItem = {
      id: e.id as string,
      title: (e.title as string) ?? "",
      event_date,
      event_time,
      location: (e.location as string) ?? null,
    };
    if (endTs >= now) {
      upcoming.push({
        ...item,
        registrations: regList.filter((r) => r.event_id === e.id),
      });
    } else {
      attended.push(item);
    }
  }

  upcoming.sort(
    (a, b) =>
      getEventEndTimestamp(a.event_date, a.event_time, null) -
      getEventEndTimestamp(b.event_date, b.event_time, null)
  );
  attended.sort(
    (a, b) =>
      getEventEndTimestamp(b.event_date, b.event_time, null) -
      getEventEndTimestamp(a.event_date, a.event_time, null)
  );

  return { upcoming, attended };
}

export async function getEventWithParticipants(
  eventId: string
): Promise<{
  event: { id: string; title: string; event_date: string; event_time: string | null; location: string | null };
  participants: EventParticipant[];
} | null> {
  const { user, profile } = await getCachedAuth();
  if (!user) return null;
  const role = ((profile?.["Rolle"] as string) ?? "member").trim().toLowerCase();
  if (role !== "admin" && role !== "board") return null;

  const events = await getEvents();
  const eventRow = events.find((e) => e.id === eventId);
  if (!eventRow) return null;

  const registrations = eventRow.registrations ?? [];
  if (registrations.length === 0) {
    return {
      event: {
        id: eventRow.id,
        title: eventRow.title,
        event_date: eventRow.event_date,
        event_time: eventRow.event_time,
        location: eventRow.location ?? null,
      },
      participants: [],
    };
  }

  const userIds = registrations.map((r) => r.user_id).filter(Boolean);
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: profiles } = await admin
    .from("profiles")
    .select('"user_id", "Studiengang / Fach", "Rolle"')
    .in("user_id", userIds.length ? userIds : ["__none__"]);

  const extraByUser = new Map<string, { studiengang: string; rolle: string }>();
  (profiles ?? []).forEach((p) => {
    const raw = p as Record<string, unknown>;
    const uid = String(raw.user_id ?? "");
    if (!uid) return;
    extraByUser.set(uid, {
      studiengang: String(raw["Studiengang / Fach"] ?? "").trim(),
      rolle: String(raw["Rolle"] ?? "").trim(),
    });
  });

  const participants: EventParticipant[] = registrations.map((r) => {
    const extra = extraByUser.get(r.user_id) ?? { studiengang: "", rolle: "" };
    return {
      user_id: r.user_id,
      vorname: r.vorname ?? "",
      nachname: r.nachname ?? "",
      studiengang: extra.studiengang,
      rolle: extra.rolle,
    };
  });

  return {
    event: {
      id: eventRow.id,
      title: eventRow.title,
      event_date: eventRow.event_date,
      event_time: eventRow.event_time,
      location: eventRow.location ?? null,
    },
    participants,
  };
}

export async function toggleRegistration(
  eventId: string,
  isRegistered: boolean
): Promise<{ error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht eingeloggt." };

  if (isRegistered) {
    const { error } = await supabase.from("event_registrations").delete().eq("event_id", eventId).eq("user_id", user.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("event_registrations").insert({ event_id: eventId, user_id: user.id });
    if (error) return { error: error.message };
  }

  revalidatePath("/events");
  revalidatePath("/calendar");
  revalidatePath("/profile");
  return { error: "" };
}
