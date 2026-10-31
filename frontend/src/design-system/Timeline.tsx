import React from 'react';
import { StatusTag, StatusType } from './StatusTag';

export interface TimelineEvent {
  timestamp: string;
  actor: string;
  fromState?: StatusType | string;
  toState: StatusType | string;
  note?: string;
}

export interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ events, className = '' }) => {
  if (events.length === 0) {
    return <div className="font-mono text-xs text-ink-muted">NO EVENTS RECORDED.</div>;
  }

  return (
    <div className={`border border-line divide-y divide-line ${className}`}>
      {events.map((ev, idx) => (
        <div key={idx} className="p-2.5 bg-surface text-xs font-mono flex flex-col gap-1">
          <div className="flex items-center justify-between text-ink-muted text-[11px]">
            <span>{ev.timestamp}</span>
            <span className="uppercase font-bold tracking-wider">BY {ev.actor}</span>
          </div>
          <div className="flex items-center gap-2 my-0.5">
            {ev.fromState && (
              <>
                <StatusTag status={ev.fromState} />
                <span className="text-ink font-bold">›</span>
              </>
            )}
            <StatusTag status={ev.toState} />
          </div>
          {ev.note && <div className="text-ink text-[11px] mt-0.5">NOTE: {ev.note}</div>}
        </div>
      ))}
    </div>
  );
};
