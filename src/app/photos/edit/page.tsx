"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import type { PickedPlace } from "@/lib/places";
import LocationInput from "@/components/ui/LocationInput";

interface PhotoEntry {
  filename: string;
  date: string;
  location: string;
  lng?: number;
  lat?: number;
}

export default function PhotosEditPage() {
  const { password, setPassword, authenticated, loginError, handleLogin, checking, lockedOut } = useAuth();
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [original, setOriginal] = useState<PhotoEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingFilename, setEditingFilename] = useState<string | null>(null);
  const [editLocation, setEditLocation] = useState<PickedPlace>({
    location: "",
  });
  const [editDate, setEditDate] = useState("");
  const [deletedFilenames, setDeletedFilenames] = useState<Set<string>>(
    new Set(),
  );
  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/photos/edit");
      if (res.ok) {
        const data = await res.json();
        setPhotos(data);
        setOriginal(data);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authenticated) fetchPhotos();
  }, [authenticated, fetchPhotos]);

  const markDelete = (filename: string) => {
    setDeletedFilenames((prev) => {
      const next = new Set(prev);
      if (next.has(filename)) {
        next.delete(filename);
      } else {
        next.add(filename);
      }
      return next;
    });
  };

  const startEdit = (photo: PhotoEntry) => {
    setEditingFilename(photo.filename);
    setEditLocation({
      location: photo.location,
      lng: photo.lng,
      lat: photo.lat,
    });
    setEditDate(photo.date ? photo.date.split("T")[0] : "");
  };

  const applyEdit = () => {
    if (!editingFilename) return;
    setPhotos((prev) =>
      prev.map((p) =>
        p.filename === editingFilename
          ? {
              ...p,
              location: editLocation.location,
              lng: editLocation.lng,
              lat: editLocation.lat,
              date: new Date(editDate).toISOString(),
            }
          : p,
      ),
    );
    setEditingFilename(null);
  };

  // A changed location must come from a suggestion so it has coordinates.
  const editingPhoto = photos.find((p) => p.filename === editingFilename);
  const canApply =
    !editLocation.location.trim() ||
    editLocation.lng != null ||
    editLocation.location === editingPhoto?.location;

  const hasChanges = () => {
    if (deletedFilenames.size > 0) return true;
    return JSON.stringify(photos) !== JSON.stringify(original);
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const updatedPhotos = photos.filter(
        (p) => !deletedFilenames.has(p.filename),
      );
      const res = await fetch("/api/photos/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-upload-password": password,
        },
        body: JSON.stringify({
          updates: updatedPhotos,
          deletedFilenames: Array.from(deletedFilenames),
        }),
      });

      if (res.ok) {
        setPhotos(updatedPhotos);
        setOriginal(updatedPhotos);
        setDeletedFilenames(new Set());
        alert("Changes saved and deployed!");
      } else {
        const err = await res.json();
        alert(`Failed to save: ${err.error}`);
      }
    } catch {
      alert("Failed to save changes");
    }
    setSaving(false);
  };

  if (checking) {
    return (
      <main className="flex flex-col gap-4">
        <h1 className="animate-in font-system text-3xl font-bold" style={{ "--index": 1 } as React.CSSProperties}>
          Edit Photos
        </h1>
        <p className="animate-in text-sm text-neutral-500" style={{ "--index": 2 } as React.CSSProperties}>Loading...</p>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="flex flex-col gap-4">
        <h1
          className="animate-in font-system text-3xl font-bold"
          style={{ "--index": 1 } as React.CSSProperties}
        >
          Edit Photos
        </h1>
        <form
          onSubmit={handleLogin}
          className="animate-in flex flex-col gap-4"
          style={{ "--index": 2 } as React.CSSProperties}
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            disabled={lockedOut}
            className="rounded-lg border border-neutral-300 bg-transparent px-4 py-2 text-sm outline-none focus:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:focus:border-neutral-500"
            autoFocus
          />
          {(loginError || lockedOut) && (
            <p className="text-sm text-red-500">
              {lockedOut ? "Too many failed attempts. Try again in 8760 hours." : loginError}
            </p>
          )}
          <button
            type="submit"
            disabled={lockedOut}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Continue
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1
          className="animate-in font-system text-3xl font-bold"
          style={{ "--index": 1 } as React.CSSProperties}
        >
          Edit Photos
        </h1>
        {hasChanges() && (
          <button
            onClick={saveAll}
            disabled={saving}
            className="animate-in rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        )}
      </div>

      <div
        className="animate-in flex flex-col gap-3"
        style={{ "--index": 2 } as React.CSSProperties}
      >
        {loading && (
          <p className="text-sm text-neutral-500">Loading photos...</p>
        )}

        {!loading && photos.length === 0 && (
          <p className="text-sm text-neutral-500">No photos found.</p>
        )}

        {photos.map((photo) => {
          const isDeleted = deletedFilenames.has(photo.filename);
          return (
            <div
              key={photo.filename}
              className={`flex gap-3 rounded-lg border p-3 transition-opacity ${
                isDeleted
                  ? "border-red-300 opacity-50 dark:border-red-800"
                  : "border-neutral-200 dark:border-neutral-800"
              }`}
            >
              <img
                src={`/img/photos/${photo.filename}`}
                alt={photo.filename}
                className="h-20 w-20 flex-shrink-0 rounded-md object-cover"
              />

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-medium">
                    {photo.filename}
                  </span>
                  <div className="ml-2 flex flex-shrink-0 gap-2">
                    {!isDeleted && editingFilename !== photo.filename && (
                      <button
                        onClick={() => startEdit(photo)}
                        className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => markDelete(photo.filename)}
                      className={`text-xs ${
                        isDeleted
                          ? "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                          : "text-red-500 hover:text-red-700 dark:hover:text-red-400"
                      }`}
                    >
                      {isDeleted ? "Undo" : "Delete"}
                    </button>
                  </div>
                </div>

                {editingFilename === photo.filename ? (
                  <div className="flex flex-col gap-1.5">
                    <LocationInput
                      value={editLocation.location}
                      onChange={setEditLocation}
                      autoFocus
                    />
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="rounded border border-neutral-300 bg-transparent px-2 py-1 text-xs outline-none focus:border-neutral-500 dark:border-neutral-700 dark:focus:border-neutral-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={applyEdit}
                        disabled={!canApply}
                        className="self-start text-xs font-medium text-neutral-700 hover:text-neutral-900 disabled:opacity-50 dark:text-neutral-300 dark:hover:text-neutral-100"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => setEditingFilename(null)}
                        className="self-start text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {photo.location || "No location"} &middot;{" "}
                    {photo.date ? photo.date.split("T")[0] : "No date"}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {hasChanges() && (
          <button
            onClick={saveAll}
            disabled={saving}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        )}
      </div>
    </main>
  );
}
