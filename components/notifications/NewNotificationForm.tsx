"use client";

import { useState } from "react";

export default function NewNotificationForm() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          type,
          link: link || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        // Optionally reset the form on success
        setTitle("");
        setMessage("");
        setType("info");
        setLink("");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 border p-4 rounded">
      <h3 className="text-lg font-bold">New Notification</h3>
      {error && <p className="text-red-500">{error}</p>}
      <input
        type="text"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        required
        className="border p-2 rounded"
      />
      <textarea
        name="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Message"
        required
        className="border p-2 rounded"
      />
      <select
        name="type"
        value={type}
        onChange={(e) => setType(e.target.value)}
        required
        className="border p-2 rounded"
      >
        <option value="info">Info</option>
        <option value="success">Success</option>
        <option value="warning">Warning</option>
        <option value="error">Error</option>
      </select>
      <input
        type="url"
        name="link"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        placeholder="Optional Link"
        className="border p-2 rounded"
      />
      <button type="submit" disabled={loading} className="bg-blue-500 text-white p-2 rounded">
        {loading ? "Sending..." : "Send Notification"}
      </button>
    </form>
  );
} 