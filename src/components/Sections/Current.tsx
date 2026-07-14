import Map from "@/components/ui/Map";

export default function Current() {
  return (
    <>
      <h1 className="mb-1 text-xl font-bold">Current</h1>
      <p className="mb-3 text-sm text-text-light-body dark:text-text-dark-body md:text-base">
        I&apos;m currently on a co-op term in Vancouver. If you&apos;re around,
        let&apos;s connect!
      </p>
      <div className="relative">
        <Map lng={-123.1207} lat={49.2827} />
        <div className="absolute bottom-4 left-4 flex items-center rounded-lg bg-neutral-100/75 px-4 py-1.5 backdrop-blur dark:bg-neutral-900/75 md:bottom-6 md:left-6">
          <p className="text-primary text-sm font-medium">Vancouver, BC</p>
        </div>
      </div>

      <div className="space-y-2 rounded-lg py-4">
        {interestsData.map((interest) => (
          <div
            className="flex items-start sm:items-center"
            key={interest.title}
          >
            <span className="mr-2 min-w-[80px] md:min-w-fit">
              {interest.title}
            </span>
            <div className="hidden flex-grow border-t border-dashed border-text-light-body dark:border-text-dark-body sm:inline"></div>
            <span className="ml-2 block text-left text-base text-text-light-body dark:text-text-dark-body sm:text-center">
              {interest.content}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

const interestsData = [
  {
    title: "Interests",
    content: "Photography, investing, personal finance",
  },
  {
    title: "Learning",
    content: "Snowboarding, open banking, design",
  },
  {
    title: "Listening",
    content: "The Design of Everyday Things, Motley Fool Money, Acquired",
  },
];
