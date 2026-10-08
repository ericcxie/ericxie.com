"use client";
// ExperienceCard.tsx

type ExperienceItem = {
  company: string;
  position: string;
  location: string;
  date: string;
  logo: string;
  // Wide wordmarks need more room than the default 24px box
  logoWidth?: number;
  color: string;
  link: string;
  present: boolean;
  incoming: boolean;
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// "05/2026 - 08/2026" -> "May – Aug 2026"; the year shows twice only when the range spans years
const formatRange = (range: string) => {
  const [start, end] = range.split("-").map((part) => {
    const [month, year] = part.trim().split("/");
    return { month: MONTHS[Number(month) - 1], year };
  });
  if (!start.month || !end?.month) return range;
  return start.year === end.year
    ? `${start.month} – ${end.month} ${end.year}`
    : `${start.month} ${start.year} – ${end.month} ${end.year}`;
};

export const ExperienceCard = ({ item }: { item: ExperienceItem }) => {
  return (
    <a href={item.link} target="_blank" rel="noopener noreferrer">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-100 text-neutral-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:border-neutral-800 dark:bg-[#1c1c1c] dark:text-neutral-400 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          {/* The logo file is used as a mask, so it renders as a silhouette in the text colour */}
          <span
            role="img"
            aria-label={`${item.company} logo`}
            className="h-6 bg-current"
            style={{
              width: item.logoWidth ?? 24,
              maskImage: `url(${item.logo})`,
              WebkitMaskImage: `url(${item.logo})`,
              maskSize: "contain",
              WebkitMaskSize: "contain",
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskPosition: "center",
            }}
          />
        </div>
        <div className="ml-3 flex flex-grow flex-col justify-between">
          <span className="text-[15px] font-bold md:text-lg">
            {item.company}
            {item.present && (
              <span className="ml-1 rounded-lg bg-gray-200 px-2 pb-1 pt-1.5 text-sm font-normal text-text-light-body dark:bg-[#252525] dark:text-text-dark-headerDark">
                Present
              </span>
            )}
            {item.incoming && (
              <span className="ml-1 rounded-lg bg-gray-200 px-2 pb-1 pt-1.5 text-sm font-normal text-text-light-body dark:bg-[#252525] dark:text-text-dark-headerDark">
                Incoming
              </span>
            )}
          </span>
          <span className="text-[13px] dark:text-text-dark-body">
            {item.position}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[13px] text-text-light-body dark:text-text-dark-headerDark md:text-sm">
            {item.location}
          </span>
          <span className="text-xs text-text-light-body dark:text-text-dark-headerDark md:text-[13px]">
            {formatRange(item.date)}
          </span>
        </div>
      </div>
    </a>
  );
};
