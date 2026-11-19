import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ChapterView from "@/components/ChapterView";
import { getAllChapterSlugs, getChapter } from "@/content/modules";

/** Required under `output: "export"` — a dynamic route with no params is a build error. */
export function generateStaticParams() {
  return getAllChapterSlugs().map((slug) => ({ slug }));
}

interface Props {
  // Next 16: params is a Promise and must be awaited.
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const chapter = getChapter(slug);
  if (!chapter) return { title: "Not found" };
  return { title: chapter.title, description: chapter.description };
}

export default async function ChapterPage({ params }: Props) {
  const { slug } = await params;
  const chapter = getChapter(slug);
  if (!chapter) notFound();
  return <ChapterView chapter={chapter} />;
}
