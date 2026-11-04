import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Play, PlayCircle } from "lucide-react";
import NavBar from "../../components/layout/NavBar.jsx";
import Footer from "../../components/layout/Footer.jsx";
import FAQ from "../../components/sections/FAQ.jsx";
import BackLink from "../../components/ui/BackLink.jsx";
import CourseCard from "../../components/learning/CourseCard.jsx";
import CourseCover from "../../components/learning/CourseCover.jsx";
import CertificateSection from "../../components/sections/CertificateSection.jsx";
import { HowItWorks, InPersonBand, PlansTeaser, SectionHead, useLearningUi } from "../../components/learning/Shared.jsx";
import { SkeletonCard } from "../../components/ui/Skeleton.jsx";
import { usePageMeta } from "../../components/ui/HeadManager.jsx";
import { useCourses, formatDuration } from "../../data/courses.js";

function HeroPlayer({ courses }) {
  const list = courses.slice(0, 3);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-latte/10 blur-2xl" aria-hidden="true" />
      <div className="relative rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur-sm p-4 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)]">
        <div className="relative aspect-video rounded-2xl overflow-hidden">
          {list[0] ? <CourseCover course={list[0]} className="absolute inset-0" /> : <div className="absolute inset-0 bg-coffee-dark" />}
          <div className="absolute inset-0 bg-black/25" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-16 h-16 rounded-full bg-cream-fixed text-ink-fixed flex items-center justify-center shadow-xl">
              <Play size={24} fill="currentColor" className="ml-1" />
            </span>
          </span>
          <span className="absolute left-3 bottom-3 text-[0.7rem] font-medium text-white/90 bg-black/50 rounded-full px-3 py-1">
            {list[0]?.title}
          </span>
        </div>
        <ul className="mt-3 space-y-2">
          {list.map((c, i) => (
            <li key={c.id} className="flex items-center gap-3 rounded-xl bg-white/[0.06] px-3 py-2.5 text-cream-fixed">
              <PlayCircle size={16} className={i === 0 ? "text-latte" : "text-cream-fixed/50"} />
              <span className="text-sm truncate flex-1">{c.title}</span>
              <span className="text-[0.65rem] text-cream-fixed/50">{formatDuration(c.total_seconds) || c.level}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export default function LearningHub() {
  const ui = useLearningUi();
  const { status, courses, offline } = useCourses();
  const [cat, setCat] = useState("all");
  usePageMeta({ title: ui.brand, description: ui.hero.lead });

  const categories = useMemo(() => [...new Set(courses.map((c) => c.category).filter(Boolean))], [courses]);
  const shown = cat === "all" ? courses : courses.filter((c) => c.category === cat);

  return (
    <div className="min-h-screen bg-cream">
      <NavBar onDark />

      <section className="relative overflow-hidden bg-[#2E1D12] text-cream-fixed pt-28 pb-20 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,#4A3020,transparent_60%)]" aria-hidden="true" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" aria-hidden="true">
          <pattern id="lh-dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#fff" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#lh-dots)" />
        </svg>
        <div className="relative max-w-content mx-auto">
          <BackLink to="/partenaires#partenaires" className="inline-flex items-center gap-2 text-sm text-cream-fixed/70 hover:text-cream-fixed mb-8">
            <ArrowLeft size={15} />
            {ui.back}
          </BackLink>
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-14 items-center">
            <div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-medium text-latte uppercase tracking-widest mb-4">
                {ui.hero.eyebrow}
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] mb-6"
              >
                {ui.hero.title}
              </motion.h1>
              <p className="text-cream-fixed/75 text-lg leading-relaxed max-w-xl mb-9">{ui.hero.lead}</p>
              <div className="flex flex-wrap gap-3 mb-12">
                <a href="#catalogue" className="inline-flex items-center gap-2 rounded-full bg-cream-fixed text-ink-fixed text-sm font-medium px-6 py-3.5 hover:scale-[1.03] transition-transform">
                  <Play size={14} fill="currentColor" />
                  {ui.hero.ctaWatch}
                </a>
                <Link to="/formations/inscription" className="inline-flex items-center gap-2 rounded-full border border-cream-fixed/30 text-cream-fixed text-sm font-medium px-6 py-3.5 hover:bg-white/10 transition-colors">
                  {ui.hero.ctaRegister}
                  <ArrowRight size={15} />
                </Link>
              </div>
              <dl className="grid grid-cols-3 gap-4 max-w-lg">
                {ui.hero.facts.map((f) => (
                  <div key={f.v}>
                    <dt className="font-display text-2xl">{f.v}</dt>
                    <dd className="text-xs text-cream-fixed/60 mt-1 leading-snug">{f.l}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <HeroPlayer courses={courses} />
          </div>
        </div>
      </section>

      <HowItWorks />

      <CertificateSection onGetStarted={() => document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" })} />

      <section id="catalogue" className="px-6 pb-20 max-w-content mx-auto scroll-mt-24">
        <SectionHead eyebrow={ui.catalog.eyebrow} title={ui.catalog.title} lead={ui.catalog.lead} />
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8" role="tablist">
            {["all", ...categories].map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={cat === c}
                onClick={() => setCat(c)}
                className={`rounded-full text-sm px-4 py-2 border transition-colors ${
                  cat === c ? "bg-ink text-cream border-ink" : "border-line text-ink-soft hover:border-coffee-light"
                }`}
              >
                {c === "all" ? ui.catalog.all : c}
              </button>
            ))}
          </div>
        )}
        {status === "loading" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <p className="text-ink-soft">{ui.catalog.empty}</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shown.map((c, i) => (
              <CourseCard key={c.id} course={c} index={i} />
            ))}
          </div>
        )}
        {offline && status === "ready" && (
          <p className="text-xs text-ink-faint mt-6">Aperçu hors ligne : les vidéos s'affichent dès que le serveur répond.</p>
        )}
      </section>

      <PlansTeaser />

      <InPersonBand />

      <FAQ eyebrow={ui.faq.eyebrow} heading={ui.faq.heading} items={ui.faq.items.map((i) => ({ question: i.q, answer: i.a }))} />

      <Footer />
    </div>
  );
}
