"use client";

import { ReactNode } from "react";

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  user?: string;
  icon: ReactNode;
  iconBgColor: string;
  titleColor?: string;
}

interface PageTimelineProps {
  events: TimelineEvent[];
}

export function PageTimeline({ events }: PageTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-4 text-theme-muted text-sm">
        Nenhum evento registrado
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.id} className="flex gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${event.iconBgColor}`}>
            {event.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className={`font-medium ${event.titleColor || "text-white"}`}>
              {event.title}
            </div>
            {event.timestamp && (
              <div className="text-sm text-theme-muted">{event.timestamp}</div>
            )}
            {event.user && (
              <div className="text-xs text-theme-muted">por {event.user}</div>
            )}
            {event.description && (
              <div className="text-sm text-theme-muted mt-1">{event.description}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
