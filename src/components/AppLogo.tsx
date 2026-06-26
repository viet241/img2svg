import { iconUrl } from '../lib/icon-config';

type AppLogoProps = {
    className?: string;
};

export function AppLogo({ className = 'h-[2.925rem] w-[2.925rem] sm:h-[3.25rem] sm:w-[3.25rem]' }: AppLogoProps) {
    return (
        <img
            src={iconUrl('/icon.svg')}
            alt=""
            aria-hidden="true"
            className={`shrink-0 rounded-xl shadow-sm object-cover ${className}`}
            width={52}
            height={52}
        />
    );
}
