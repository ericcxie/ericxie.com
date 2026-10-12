import { ExperienceCard } from "../ui/ExperienceCard";
import {
  communityItems,
  experienceItems,
  schoolItems,
} from "@/content/experience/experiences";

const lists = [
  { title: "Experiences", items: experienceItems },
  { title: "Community", items: communityItems },
];

export default function Experiences() {
  return (
    <div className="space-y-10">
      {lists.map(({ title, items }) => (
        <div key={title}>
          <h1 className="mb-1 text-xl font-bold">{title}</h1>
          <ul className="animated-list -my-3.5">
            {items.map((item, index) => (
              <li key={index}>
                <ExperienceCard item={item} className="py-3.5" />
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div>
        <h1 className="mb-1 text-xl font-bold">School</h1>
        {schoolItems.map((item, index) => (
          <ExperienceCard key={index} item={item} />
        ))}
      </div>
    </div>
  );
}
