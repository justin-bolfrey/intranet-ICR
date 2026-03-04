import Image from "next/image";
import Link from "next/link";

type BoardMember = {
  name: string;
  role: string;
  focus: string;
  image: string;
  linkedin: string;
};

const BOARD_MEMBERS: BoardMember[] = [
  {
    name: "Maximilian Thiel",
    role: "Chief Executive Officer",
    focus: "1. Vorstandsvorsitzender",
    image: "/board/maximilian-thiel.png",
    linkedin: "https://www.linkedin.com",
  },
  {
    name: "Jannik Frohn",
    role: "Chief Operating Officer",
    focus: "2. Vorstandsvorsitzender",
    image: "/board/jannik-frohn.png",
    linkedin: "https://www.linkedin.com",
  },
  {
    name: "Sarah Adloff",
    role: "Chief Financial Officer",
    focus: "Finance, Legal & HR",
    image: "/board/sarah-adloff.png",
    linkedin: "https://www.linkedin.com",
  },
  {
    name: "Simon Kirchner",
    role: "Chief Investment Officer",
    focus: "Analyst Program & Education",
    image: "/board/simon-kirchner.png",
    linkedin: "https://www.linkedin.com",
  },
  {
    name: "Finn Wollenweber",
    role: "Head of Information Technology",
    focus: "Website & IT Administration",
    image: "/board/finn-wollenweber.png",
    linkedin: "https://www.linkedin.com",
  },
  {
    name: "Hannes Zweyer",
    role: "Head of Relations",
    focus: "Alumni Relations & Member Communication",
    image: "/board/hannes-zweyer.png",
    linkedin: "https://www.linkedin.com",
  },
  {
    name: "Marinus Metzger",
    role: "Chief Marketing Officer",
    focus: "Marketing & Social Media (Instagram)",
    image: "/board/marinus-metzger.png",
    linkedin: "https://www.linkedin.com",
  },
  {
    name: "Kilian Kainz",
    role: "Co – Chief Marketing Officer",
    focus: "Marketing & Social Media (LinkedIn)",
    image: "/board/kilian-kainz.png",
    linkedin: "https://www.linkedin.com",
  },
];

export default function BoardMembersPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Vorstand
        </h1>
        <p className="text-base text-muted-foreground md:text-lg">
          Das aktuelle Vorstandsteam des Investmentclub Regensburg e.V.
        </p>
      </header>

      <section className="grid gap-10 sm:grid-cols-2 xl:grid-cols-3">
        {BOARD_MEMBERS.map((member) => (
          <article
            key={member.name}
            className="group flex flex-col items-center text-center"
          >
            <div className="relative h-44 w-44 overflow-hidden rounded-full border border-border bg-muted shadow-sm transition-all duration-300 group-hover:border-primary/60 group-hover:shadow-lg sm:h-48 sm:w-48 md:h-52 md:w-52">
              <Image
                src={member.image}
                alt={member.name}
                fill
                sizes="176px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            <div className="mt-4 space-y-1">
              <h2 className="text-lg font-semibold">{member.name}</h2>
              <p className="text-sm font-medium text-muted-foreground">
                {member.role}
              </p>
              <p className="text-xs text-muted-foreground">{member.focus}</p>
            </div>

            <div className="mt-4">
              <Link
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`LinkedIn-Profil von ${member.name} öffnen`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-muted-foreground/40 bg-background text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                in
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
