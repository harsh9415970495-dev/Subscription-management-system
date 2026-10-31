import React from 'react';
import { Button } from './Button';

export interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  title,
  onClose,
  children,
  actions,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-surface border-2 border-line w-full max-w-lg p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <h2 className="font-mono text-sm uppercase font-bold text-ink tracking-wider m-0">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="font-mono text-xs font-bold text-ink hover:text-red px-1 cursor-pointer"
          >
            [×]
          </button>
        </div>
        <div className="py-2 text-xs font-mono text-ink">
          {children}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-line pt-3">
          {actions ? (
            actions
          ) : (
            <Button variant="secondary" onClick={onClose}>
              CLOSE
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
