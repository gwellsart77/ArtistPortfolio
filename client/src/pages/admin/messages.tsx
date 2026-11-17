import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Input } from "@/components/ui/input";
import { Mail, Search } from "lucide-react";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  subscribeToNewsletter: boolean | null;
  createdAt: string;
}

/**
 * Inbox for messages sent through the Contact page. They were always saved,
 * but there was no place in the admin to read them.
 */
export default function AdminMessages() {
  const { data: messages = [], isLoading, error } = useQuery<ContactMessage[]>({
    queryKey: ["/api/admin/messages"],
  });
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  // Opening /admin/messages#m12 jumps to and opens message 12
  useEffect(() => {
    const m = window.location.hash.match(/^#m(\d+)$/);
    if (m && messages.length) {
      const id = Number(m[1]);
      setOpenId(id);
      setTimeout(() => document.getElementById(`m${id}`)?.scrollIntoView({ block: "center" }), 50);
    }
  }, [messages.length]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((m) =>
      [m.name, m.email, m.subject, m.message].some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [messages, query]);

  const fmt = (d: string) =>
    new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <AdminLayout title="Inbox" description="Messages people sent through the Contact page, newest first.">
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6e6a63]" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email or text"
          className="pl-9 bg-white"
          aria-label="Search messages"
        />
      </div>

      <div className="bg-white border border-[#e3e0da] rounded-lg">
        {isLoading ? (
          <p className="px-5 py-8 text-sm text-[#6e6a63]">Loading…</p>
        ) : error ? (
          <p className="px-5 py-8 text-sm text-[#8b3a2e]">Couldn't load messages. Try refreshing the page.</p>
        ) : filtered.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[#6e6a63]">{messages.length ? "No messages match your search." : "No messages yet."}</p>
        ) : (
          <ul className="divide-y divide-[#e3e0da]">
            {filtered.map((m) => {
              const open = openId === m.id;
              const reply = `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent("Re: " + m.subject)}`;
              return (
                <li key={m.id} id={`m${m.id}`}>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : m.id)}
                    aria-expanded={open}
                    className={`w-full text-left px-5 py-4 hover:bg-[#f7f6f3] ${open ? "bg-[#f7f6f3]" : ""}`}
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="text-sm truncate">
                        <span className="font-medium">{m.name}</span>
                        <span className="text-[#6e6a63]"> · {m.subject}</span>
                      </p>
                      <span className="text-xs text-[#6e6a63] shrink-0">{fmt(m.createdAt)}</span>
                    </div>
                    {!open && <p className="text-xs text-[#6e6a63] truncate mt-1">{m.message}</p>}
                  </button>
                  {open && (
                    <div className="px-5 pb-5 bg-[#f7f6f3]">
                      <p className="text-xs text-[#6e6a63] mb-3">
                        {m.email}
                        {m.subscribeToNewsletter ? " · asked to join the newsletter" : ""}
                      </p>
                      <p className="text-sm leading-relaxed whitespace-pre-line text-[#1b1a18]">{m.message}</p>
                      <a
                        href={reply}
                        className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#1b1a18] px-4 py-2 text-xs uppercase tracking-[0.14em] text-white hover:bg-black"
                      >
                        <Mail className="h-4 w-4" /> Reply by email
                      </a>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p className="mt-3 text-xs text-[#6e6a63]">{messages.length} message{messages.length === 1 ? "" : "s"} in total.</p>
    </AdminLayout>
  );
}
