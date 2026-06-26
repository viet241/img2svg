import { FileImage } from 'lucide-react';
import { useI18n } from '../i18n/context';

interface GlobalDropOverlayProps {
    visible: boolean;
}

export function GlobalDropOverlay({ visible }: GlobalDropOverlayProps) {
    const { t } = useI18n();

    if (!visible) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none p-4 sm:p-6">
            <div className="flex h-full w-full items-center justify-center rounded-2xl border-2 border-dashed border-black/70 bg-white/80 backdrop-blur-sm shadow-lg">
                <div className="text-center px-6">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                        <FileImage className="h-7 w-7 text-black" />
                    </div>
                    <p className="text-base font-semibold text-slate-900">{t('sidebar.pageDrop')}</p>
                    <p className="mt-1 text-xs text-slate-500">{t('sidebar.pageDropHint')}</p>
                </div>
            </div>
        </div>
    );
}
