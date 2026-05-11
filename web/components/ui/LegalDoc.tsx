type LegalSection = {
  heading: string;
  body?: string[];
  items?: string[];
};

interface LegalDocProps {
  lastUpdated: string;
  sections: LegalSection[];
  closing?: string;
}

export function LegalDoc({ lastUpdated, sections, closing }: LegalDocProps) {
  return (
    <section className="mx-auto max-w-3xl px-5 md:px-8 pb-24">
      <p className="font-mono text-[10px] md:text-xs uppercase tracking-wider text-white/60">
        {lastUpdated}
      </p>
      <hr className="my-8 border-white/[0.08]" />
      <div className="space-y-8">
        {sections.map((s, i) => (
          <div key={i}>
            <h2 className="text-lg md:text-xl font-bold text-white">
              {s.heading}
            </h2>
            {s.body && s.body.length > 0 && (
              <div className="mt-3 space-y-3">
                {s.body.map((p, j) => (
                  <p
                    key={j}
                    className="text-sm md:text-base text-white/65 leading-relaxed"
                  >
                    {p}
                  </p>
                ))}
              </div>
            )}
            {s.items && s.items.length > 0 && (
              <ul className="mt-3 space-y-2 list-disc pl-5 marker:text-primary/70">
                {s.items.map((item, j) => (
                  <li
                    key={j}
                    className="text-sm md:text-base text-white/65 leading-relaxed"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      {closing && (
        <>
          <hr className="my-10 border-white/[0.08]" />
          <p className="text-xs md:text-sm text-white/65 text-center">
            {closing}
          </p>
        </>
      )}
    </section>
  );
}
