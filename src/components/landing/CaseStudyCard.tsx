import { motion } from "framer-motion";
import type { CaseStudy } from "@/data/landingContent";
import AnimatedCounter from "./AnimatedCounter";
import VideoCard from "./VideoCard";
import PlaceholderBanner from "./PlaceholderBanner";

interface Props {
  caseStudy: CaseStudy;
  reverse?: boolean;
}

const CaseStudyCard = ({ caseStudy, reverse = false }: Props) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.6 }}
    className={`grid lg:grid-cols-2 gap-10 lg:gap-14 items-center ${reverse ? "lg:[&>div:first-child]:order-2" : ""}`}
  >
    <div className="grid grid-cols-2 gap-3">
      {caseStudy.creatives.slice(0, 4).map((c, i) => (
        <VideoCard key={c.id} src={c.src} type={c.type} aspect="9/16" index={i} isPlaceholder={c.isPlaceholder} />
      ))}
    </div>

    <div>
      <div className="flex items-center gap-3 mb-4">
        <img src={caseStudy.clientLogo} alt={caseStudy.clientName} className="h-8 w-auto object-contain" />
        {caseStudy.isPlaceholder && <PlaceholderBanner label={`case ${caseStudy.clientName}`} />}
      </div>
      <h3 className="font-heading font-extrabold uppercase text-2xl md:text-3xl leading-tight">{caseStudy.headline}</h3>
      <p className="mt-4 text-muted-foreground leading-relaxed">{caseStudy.context}</p>
      <p className="mt-3 text-muted-foreground leading-relaxed">{caseStudy.intervention}</p>

      <div className="mt-8 grid grid-cols-2 gap-6">
        {caseStudy.metrics.map((m, i) => (
          <div key={`${caseStudy.id}-metric-${i}`}>
            <p className="font-heading font-extrabold text-3xl md:text-4xl text-[#C8E64A]">
              <AnimatedCounter value={m.value} prefix={m.prefix} suffix={m.suffix} />
            </p>
            <p className="text-sm text-muted-foreground mt-1 leading-tight">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

export default CaseStudyCard;
