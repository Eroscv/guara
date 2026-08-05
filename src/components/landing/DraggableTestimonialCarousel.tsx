import type { Testimonial } from "@/data/landingContent";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import PlaceholderBanner from "./PlaceholderBanner";

interface Props {
  testimonials: Testimonial[];
}

const DraggableTestimonialCarousel = ({ testimonials }: Props) => (
  <Carousel opts={{ align: "center", dragFree: true, loop: true }} className="max-w-4xl mx-auto">
    <CarouselContent>
      {testimonials.map((t) => (
        <CarouselItem key={t.id} className="md:basis-2/3">
          <div className="bg-white dark:bg-card rounded-2xl p-8 md:p-10 shadow-card h-full flex flex-col">
            {t.isPlaceholder && <PlaceholderBanner label="foto de depoimento" className="mb-3 self-start" />}
            <h3 className="font-heading font-bold text-lg md:text-xl">{t.headline}</h3>
            <p className="mt-4 text-muted-foreground leading-relaxed italic flex-1">"{t.quote}"</p>
            <div className="mt-6 flex items-center gap-3">
              <img src={t.photo} alt={t.company} className="w-12 h-12 rounded-full object-cover" loading="lazy" />
              <div>
                <p className="font-semibold text-sm">{t.role}</p>
                <p className="text-xs text-muted-foreground">{t.company}</p>
              </div>
            </div>
          </div>
        </CarouselItem>
      ))}
    </CarouselContent>
    <div className="flex justify-center gap-3 mt-8">
      <CarouselPrevious className="static translate-y-0" />
      <CarouselNext className="static translate-y-0" />
    </div>
  </Carousel>
);

export default DraggableTestimonialCarousel;
