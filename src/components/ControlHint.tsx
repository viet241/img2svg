import type { ReactNode } from 'react';

interface ControlHintProps {
    children: ReactNode;
}

export function ControlHint({ children }: ControlHintProps) {
    return (
        <p className="text-[10px] leading-relaxed text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-2">
            {children}
        </p>
    );
}
