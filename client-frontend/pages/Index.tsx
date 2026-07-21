import { motion } from "framer-motion";
import { ArrowDown, ArrowUpRight, Heart, MessageCircle, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const firstVideo =
  "https://cdn.builder.io/o/assets%2F32a7e967e38946a18979c1eb330ccf9b%2F5fba4b99fe7a4a678a18a9d193e45d7b?alt=media&token=d6b141d3-8bd3-4272-ba07-fe5423a8b8ae&apiKey=32a7e967e38946a18979c1eb330ccf9b";
const secondVideo =
  "https://cdn.builder.io/o/assets%2F32a7e967e38946a18979c1eb330ccf9b%2F0bd8ed307525490380ebbbba00138860?alt=media&token=da0509d2-2982-456c-9afb-f0709431982d&apiKey=32a7e967e38946a18979c1eb330ccf9b";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

export default function Index() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const maximumScroll = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(maximumScroll > 0 ? (window.scrollY / maximumScroll) * 100 : 0);
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  return (
    <main ref={pageRef} className="overflow-x-hidden bg-[#f5f0e8] text-[#192d2b]">
      <div className="fixed left-0 top-0 z-50 h-1 bg-[#e6775b]" style={{ width: `${scrollProgress}%` }} />

      <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#183b39] px-5 py-8 text-[#fbf7ef] sm:px-8 lg:px-12">
        <video className="absolute inset-0 h-full w-full object-cover opacity-70" autoPlay muted loop playsInline src={firstVideo} />
        <div className="absolute inset-0 bg-[#183b39]/65" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#183b39]/90 via-[#183b39]/45 to-transparent" />
        <nav className="absolute left-5 right-5 top-7 z-10 flex items-center justify-between sm:left-8 sm:right-8 lg:left-12 lg:right-12">
          <div className="flex items-center gap-2 text-lg font-extrabold tracking-[-0.07em]"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#e6775b] text-sm text-[#183b39]">a</span>alex</div>
          <div className="hidden items-center gap-8 text-xs font-bold uppercase tracking-[0.18em] md:flex"><a href="#how-it-works" className="transition-opacity hover:opacity-60">How it works</a><a href="#your-space" className="transition-opacity hover:opacity-60">Your space</a></div>
          <Link to="/login" className="rounded-full border border-white/30 px-4 py-2 text-xs font-bold transition-colors hover:bg-white hover:text-[#183b39]">Meet Alex</Link>
        </nav>
        <div className="relative z-10 mx-auto w-full max-w-6xl pt-16">
          <motion.div initial="hidden" animate="visible" transition={{ staggerChildren: 0.16, delayChildren: 0.15 }} className="max-w-3xl">
            <motion.div variants={fadeUp} transition={{ duration: 0.7 }} className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#a1c9ae]"><span className="h-px w-8 bg-[#a1c9ae]" /> A softer place to land</motion.div>
            <motion.h1 variants={fadeUp} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} className="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.045em] sm:text-7xl lg:text-[7.1rem]">Have you ever felt alone in this world?</motion.h1>
            <motion.p variants={fadeUp} transition={{ duration: 0.9, ease: "easeOut" }} className="mt-7 max-w-md text-base font-normal leading-relaxed text-[#d7e4d7] sm:text-lg">There is no right way to feel. Alex is here for the thoughts you never found the words for — day or night.</motion.p>
            <motion.div variants={fadeUp} transition={{ duration: 0.7 }} className="mt-9 flex flex-wrap items-center gap-4"><Link to="/login" className="group flex items-center gap-3 rounded-full bg-[#e6775b] px-6 py-3.5 text-sm font-semibold text-[#183b39] transition-transform hover:-translate-y-1">Start a conversation <ArrowUpRight size={17} /></Link><span className="text-xs font-medium text-[#a1c9ae]">Private. Patient. Always here.</span></motion.div>
          </motion.div>
        </div>
        <a href="#meet-alex" className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a1c9ae]"><span>Scroll to breathe</span><ArrowDown size={15} /></a>
      </section>

      <section id="meet-alex" className="relative flex min-h-[90svh] items-center overflow-hidden bg-[#244845] px-5 py-24 text-[#fbf7ef] sm:px-8 sm:py-32 lg:px-12">
        <video className="absolute inset-0 h-full w-full object-cover opacity-75" autoPlay muted loop playsInline src={secondVideo} />
        <div className="absolute inset-0 bg-[#183b39]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#183b39]/90 via-transparent to-[#183b39]/30" />
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }} transition={{ staggerChildren: 0.12 }} className="relative z-10 mx-auto w-full max-w-6xl">
          <motion.p variants={fadeUp} transition={{ duration: 0.6 }} className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#f3c8b7]">01 — Meet Alex</motion.p>
          <motion.h2 variants={fadeUp} transition={{ duration: 0.7 }} className="mt-5 max-w-3xl text-5xl font-extrabold leading-[0.94] tracking-[-0.07em] sm:text-7xl">Your thoughts deserve a witness.</motion.h2>
          <motion.p variants={fadeUp} transition={{ duration: 0.7 }} className="mt-7 max-w-md text-base leading-relaxed text-[#d7e4d7]">Not advice. Not a checklist. Just a compassionate conversation that moves at your pace, and meets you exactly where you are.</motion.p>
          <motion.div variants={fadeUp} transition={{ duration: 0.7 }} className="mt-10 flex flex-wrap gap-3"><div className="flex items-center gap-2 rounded-full bg-[#f5f0e8]/15 px-4 py-2 text-sm backdrop-blur-sm"><MessageCircle size={17} /> Talk it out</div><div className="flex items-center gap-2 rounded-full bg-[#f5f0e8]/15 px-4 py-2 text-sm backdrop-blur-sm"><Heart size={17} /> Feel seen</div></motion.div>
          <motion.p variants={fadeUp} transition={{ duration: 0.7 }} className="mt-20 flex items-center gap-3 font-sans text-2xl sm:text-3xl"><Sparkles size={20} className="text-[#f3c8b7]" /> Meet Alex, your personal therapist and friend.</motion.p>
        </motion.div>
      </section>

      <section id="how-it-works" className="bg-[#dbe9db] px-5 py-24 sm:px-8 sm:py-32 lg:px-12">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="mx-auto max-w-6xl">
          <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="flex flex-wrap items-end justify-between gap-6"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#e6775b]">A small ritual</p><h2 className="mt-4 font-sans text-5xl tracking-[-0.05em] sm:text-6xl">A little lighter, daily.</h2></div><p className="max-w-xs text-sm leading-relaxed text-[#4c605d]">No pressure to have it all figured out. Begin with one honest moment.</p></motion.div>
          <div className="mt-14 grid gap-px overflow-hidden rounded-[1.8rem] bg-[#9fbbb0] md:grid-cols-3">
            {[['01', 'Arrive as you are', 'Open Alex when you need a calm, judgment-free space.'], ['02', 'Say what is true', 'Share the big things, the small things, or simply where to begin.'], ['03', 'Carry it with you', 'Leave every conversation with a little more room to breathe.']].map(([number, title, body]) => <motion.div key={number} variants={fadeUp} transition={{ duration: 0.6 }} className="bg-[#dbe9db] p-7 sm:p-9"><span className="font-sans text-3xl text-[#e6775b]">{number}</span><h3 className="mt-14 text-lg font-extrabold">{title}</h3><p className="mt-3 text-sm leading-relaxed text-[#4c605d]">{body}</p></motion.div>)}
          </div>
        </motion.div>
      </section>

      <section id="your-space" className="bg-[#183b39] px-5 py-24 text-[#fbf7ef] sm:px-8 sm:py-32 lg:px-12"><motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} className="mx-auto max-w-3xl text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a1c9ae]">Make space for yourself</p><h2 className="mx-auto mt-5 max-w-2xl font-sans text-5xl leading-[0.95] tracking-[-0.05em] sm:text-7xl">You don’t have to hold it all alone.</h2><Link to="/login" className="group mt-9 inline-flex items-center gap-3 rounded-full bg-[#e6775b] px-7 py-4 text-sm font-extrabold text-[#183b39] transition-transform hover:-translate-y-1">Say hello to Alex <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link></motion.div></section>

      <footer className="flex flex-col gap-4 bg-[#183b39] px-5 pb-7 text-xs text-[#a1c9ae] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12"><span className="font-extrabold tracking-[-0.07em] text-[#fbf7ef]">alex</span><span>Made for your inner world.</span><span>© 2025 Alex Wellness</span></footer>
    </main>
  );
}
