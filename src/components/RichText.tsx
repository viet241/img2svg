import type { ReactNode } from 'react';

interface RichTextProps {
    text: string;
}

export function RichText({ text }: RichTextProps) {
    const parts = text.split(/(<[^>]+>.*?<\/[^>]+>)/g);

    return (
        <>
            {parts.map((part, index) => {
                const pickMatch = part.match(/^<pick>(.*)<\/pick>$/);
                if (pickMatch) {
                    return (
                        <span key={index} className="text-black underline">
                            {pickMatch[1]}
                        </span>
                    );
                }

                const strongMatch = part.match(/^<strong>(.*)<\/strong>$/);
                if (strongMatch) {
                    return (
                        <strong key={index} className="text-slate-600">
                            {strongMatch[1]}
                        </strong>
                    );
                }

                return <span key={index}>{part}</span>;
            })}
        </>
    );
}
