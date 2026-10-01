import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import { Bell, Brain, Calendar, MessageSquare, Stethoscope, Check, CheckCheck } from "lucide-react";

/* Chọn icon theo notification type */
const TYPE_ICON = {
  ai_result_shared:     { Icon: Brain,         cls: "text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30" },
  consultation_reply:   { Icon: MessageSquare,  cls: "text-cyan-500 bg-cyan-100 dark:bg-cyan-900/30" },
  appointment_reminder: { Icon: Calendar,       cls: "text-amber-500 bg-amber-100 dark:bg-amber-900/30" },
  consultation_new:     { Icon: Stethoscope,    cls: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30" },
};

const fmtTime = (dateStr) => {
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const diffMin  = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay  = Math.floor(diffHour / 24);
  if (diffMin < 1)    return "Vừa xong";
  if (diffMin < 60)   return `${diffMin} phút trước`;
  if (diffHour < 24)  return `${diffHour} giờ trước`;
  if (diffDay < 7)    return `${diffDay} ngày trước`;
  return d.toLocaleDateString("vi-VN");
};

const NotificationBadge = () => {
  const { items, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  /* Đóng dropdown khi click ngoài */
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleItemClick = async (notif) => {
    if (!notif.is_read) await markRead(notif.id);
    setOpen(false);
    if (notif.link) navigate(notif.link);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-bg-app text-text-dim transition hover:bg-bg-surface hover:text-text-main dark:bg-slate-800 dark:hover:bg-slate-700"
        aria-label="Thông báo"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E06666] px-1 text-[9px] font-bold leading-none text-white ring-2 ring-bg-surface">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border-main/60 bg-bg-surface shadow-2xl shadow-black/10 dark:bg-slate-900 dark:border-slate-700/60">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-main/40 px-4 py-3 dark:border-slate-700/40">
            <h3 className="flex items-center gap-2 text-sm font-bold text-text-main">
              <Bell className="h-4 w-4 text-[#E06666]" />
              Thông báo
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#E06666] px-1.5 py-0.5 text-[9px] font-bold text-white">{unreadCount}</span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-text-dim transition hover:bg-bg-app hover:text-text-main"
              >
                <CheckCheck className="h-3 w-3" /> Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border-main/20 dark:divide-slate-700/40">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-text-dim">
                <Bell className="h-8 w-8 opacity-20" />
                <p className="text-xs">Chưa có thông báo nào</p>
              </div>
            ) : (
              items.map((notif) => {
                const cfg = TYPE_ICON[notif.type] || { Icon: Bell, cls: "text-slate-500 bg-slate-100 dark:bg-slate-800" };
                const IconComp = cfg.Icon;
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-bg-app dark:hover:bg-slate-800/60 ${
                      !notif.is_read ? "bg-indigo-50/40 dark:bg-indigo-900/10" : ""
                    }`}
                  >
                    {/* Icon */}
                    <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${cfg.cls}`}>
                      <IconComp className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-snug ${notif.is_read ? "text-text-dim" : "font-semibold text-text-main"}`}>
                        {notif.title}
                      </p>
                      {notif.body && (
                        <p className="mt-0.5 truncate text-[10px] text-text-dim">{notif.body}</p>
                      )}
                      <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-text-dim/60">
                        {fmtTime(notif.created_at)}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!notif.is_read && (
                      <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-500" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-border-main/40 px-4 py-2 dark:border-slate-700/40">
              <p className="text-center text-[10px] text-text-dim">{items.length} thông báo gần đây</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBadge;
