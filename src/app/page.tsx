import Link from "next/link";
import MasterMap from "@/components/MasterMap";
import ContinueCard from "@/components/ContinueCard";
import ModuleHero from "@/components/ModuleHero";
import { LAB_LIST } from "@/lib/labs";
import { DATASET_LIST } from "@/lib/datasets";
import { modules, totalChapters, totalMinutes } from "@/content/modules";
import { SITE } from "@/lib/site";

export default function HomePage() {
  const populated = modules.filter((m) => m.chapters.length).length;

  return (
    <div className="px-4 pt-8 pb-24 sm:px-6 lg:px-10">
      <section className="relative">
        <ModuleHero motif="map" height={200} />
        <div className="mt-6">
          <p
            className="font-mono text-[11.5px] uppercase tracking-[0.18em]"
            style={{ color: "var(--accent)" }}
          >
            {SITE.name} · {SITE.tagline}
          </p>
          <h1 className="mt-2 max-w-[18ch] text-[clamp(30px,6vw,54px)] leading-[1.05] font-semibold tracking-[-0.035em]">
            All of machine learning, on one map.
          </h1>
          <p className="mt-4 max-w-[62ch] text-[17.5px]" style={{ color: "var(--muted)" }}>
            Nine modules from NumPy to neural networks, every lecture idea expanded into
            the explanation the notes left out, {LAB_LIST.length} labs you can actually
            play with, and the real course datasets underneath.
          </p>

          <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3">
            {[
              ["Modules", `${populated} of ${modules.length} written`],
              ["Chapters", `${totalChapters}`],
              ["Reading time", `${Math.round(totalMinutes / 60)}h ${totalMinutes % 60}m`],
              ["Interactive labs", `${LAB_LIST.length}`],
              ["Datasets", `${DATASET_LIST.length}`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[12px]" style={{ color: "var(--muted-2)" }}>
                  {k}
                </dt>
                <dd className="font-mono text-[19px] font-medium" style={{ color: "var(--accent-2)" }}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <ContinueCard />

      <section className="mt-12">
        <h2 className="mb-1 text-[22px] font-semibold tracking-[-0.02em]">The master map</h2>
        <p className="mb-5 text-[15px]" style={{ color: "var(--muted)" }}>
          Each node is a module; the lines are what you need before it. Rings fill in as
          you mark chapters done.
        </p>
        <MasterMap />
      </section>

      <section className="mt-12 grid gap-3 sm:grid-cols-3">
        {[
          ["/labs", "Labs", `${LAB_LIST.length} interactive explanations, rebuilt from the lecture notebook`],
          ["/data", "Datasets", "The real course CSVs, with column stats and practice tasks"],
          ["/revision", "Revision", "Cheat sheet, formula sheet and every viva question in one place"],
        ].map(([href, title, blurb]) => (
          <Link key={href} href={href} className="panel group p-5 transition-colors">
            <h3 className="text-[17px] font-semibold group-hover:underline">{title}</h3>
            <p className="mt-1.5 text-[14px]" style={{ color: "var(--muted)" }}>
              {blurb}
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
