import Link from "next/link";

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  btnLabel?: string;
  btnHref?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  eyebrow, 
  title, 
  subtitle, 
  btnLabel, 
  btnHref 
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-16 scroll-m-20">
      <div className="max-w-[560px]">
        <div className="flex items-center gap-3 text-[11px] tracking-[0.2em] uppercase text-gold mb-5 font-medium">
          <span className="w-8 h-[1px] bg-gold inline-block" />
          {eyebrow}
        </div>
        <h2 className="text-[clamp(2rem,3.5vw,3rem)] font-serif text-brown-dark leading-[1.1] tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-4 text-txt-muted text-[1rem] leading-relaxed font-light">
            {subtitle}
          </p>
        )}
      </div>
      {btnLabel && btnHref && (
        <Link
          href={btnHref}
          className="group inline-flex items-center gap-2 text-[12px] tracking-[0.12em] uppercase text-brown font-medium hover:text-gold transition-colors mt-4 md:mt-0 w-max"
        >
          {btnLabel}
          <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;
