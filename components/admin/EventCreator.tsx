"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { MapPin, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  uploadEventImage,
  createEvent,
  type CreateEventData,
} from "@/app/(intranet)/events/actions";

const MAX_SIZE = 5 * 1024 * 1024;

export function EventCreator() {
  const [title, setTitle] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [requiresRegistration, setRequiresRegistration] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Bild darf maximal 5 MB groß sein.");
      e.target.value = "";
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Titel ist Pflicht.");
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const formData = new FormData();
        formData.set("file", imageFile);
        const { url, error } = await uploadEventImage(formData);
        if (error) {
          toast.error(error);
          setSubmitting(false);
          return;
        }
        imageUrl = url;
      }
      const data: CreateEventData = {
        title: title.trim(),
        description: description.trim(),
        event_date: eventDate,
        event_time: eventTime.trim(),
        end_time: eventEndTime.trim(),
        location: location.trim(),
        organizer: organizer.trim(),
        image_url: imageUrl,
        requires_registration: requiresRegistration,
      };
      const { id, error } = await createEvent(data);
      if (error) {
        toast.error(error);
        setSubmitting(false);
        return;
      }
      toast.success("Event erstellt.");
      setTitle("");
      setOrganizer("");
      setLocation("");
      setEventDate("");
      setEventTime("");
      setEventEndTime("");
      setDescription("");
      setRequiresRegistration(false);
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error("Ein Fehler ist aufgetreten.");
    } finally {
      setSubmitting(false);
    }
  }

  const previewDate = eventDate
    ? new Date(eventDate + (eventTime ? "T" + eventTime : "")).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        ...(eventTime && { hour: "2-digit", minute: "2-digit" }),
      })
    : "Datum wählen";

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="ev-title">Titel</Label>
          <Input
            id="ev-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. Semestereröffnung"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ev-organizer">Veranstalter</Label>
          <Input
            id="ev-organizer"
            value={organizer}
            onChange={(e) => setOrganizer(e.target.value)}
            placeholder="Name oder Abteilung"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ev-location">Ort</Label>
          <Input
            id="ev-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Veranstaltungsort"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ev-date">Datum</Label>
            <Input
              id="ev-date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5" lang="de">
            <Label htmlFor="ev-time">Uhrzeit</Label>
            <Input
              id="ev-time"
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ev-end-time">End-Uhrzeit (optional)</Label>
            <Input
              id="ev-end-time"
              type="time"
              value={eventEndTime}
              onChange={(e) => setEventEndTime(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ev-desc">Beschreibung</Label>
          <textarea
            id="ev-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Kurzbeschreibung des Events..."
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ev-image">Bild (max. 5 MB)</Label>
          <Input
            ref={fileInputRef}
            id="ev-image"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="ev-reg"
            checked={requiresRegistration}
            onCheckedChange={(v) => setRequiresRegistration(v === true)}
          />
          <Label htmlFor="ev-reg" className="cursor-pointer text-sm font-normal">
            Anmeldung erforderlich
          </Label>
        </div>
        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? "Wird erstellt..." : "Event erstellen"}
        </Button>
      </div>

      <div className="lg:sticky lg:top-4">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Live-Vorschau</p>
        <Card className="max-w-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center gap-3 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {organizer || "Veranstalter"}
                </p>
                <p className="text-xs text-muted-foreground">{previewDate}</p>
              </div>
            </div>
            <div className="border-t px-3 pb-3 pt-2">
              {title && <p className="font-semibold">{title}</p>}
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                {description || "Beschreibung …"}
              </p>
            </div>
            {imagePreview && (
              <div className="relative w-full border-t aspect-[1.91/1] overflow-hidden bg-muted">
                <img
                  src={imagePreview}
                  alt="Vorschau"
                  className="h-full w-full object-cover object-center"
                />
              </div>
            )}
            {location && (
              <div className="flex items-center gap-1.5 border-t px-3 py-2 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{location}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
