import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileSearch, ShieldCheck, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

import slide01 from "@/assets/home-carousel-01.jpg";
import slide02 from "@/assets/home-carousel-02.jpg";
import slide03 from "@/assets/home-carousel-03.jpg";
import slide04 from "@/assets/home-carousel-04.jpg";

type Slide = {
  title: string;
  subtitle: string;
  image: string;
};

type Benefit = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

const HomeCarouselSection: React.FC = () => {
  const navigate = useNavigate();
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [active, setActive] = useState(0);

  const slides = useMemo<Slide[]>(
    () => [
      {
        title: "Consultas rápidas, decisão segura",
        subtitle: "Trabalhe com dados confiáveis em poucos segundos.",
        image: slide01,
      },
      {
        title: "Pesquise, valide e economize tempo",
        subtitle: "Centralize suas verificações e ganhe produtividade.",
        image: slide02,
      },
      {
        title: "Resultados claros para você e seu cliente",
        subtitle: "Relatórios objetivos e fáceis de entender.",
        image: slide03,
      },
      {
        title: "Fluxo simples do cadastro à consulta",
        subtitle: "Crie sua conta, escolha um plano e comece agora.",
        image: slide04,
      },
    ],
    []
  );

  const benefits = useMemo<Benefit[]>(
    () => [
      {
        icon: <Zap className="h-4 w-4 text-primary" aria-hidden="true" />,
        title: "Rápido",
        description: "Respostas em segundos",
      },
      {
        icon: <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />,
        title: "Confiável",
        description: "Informação com clareza",
      },
      {
        icon: <FileSearch className="h-4 w-4 text-primary" aria-hidden="true" />,
        title: "Completo",
        description: "Tudo em um só lugar",
      },
    ],
    []
  );

  React.useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setActive(api.selectedScrollSnap());
    };

    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <section aria-label="Destaques" className="w-full">
      <div className="relative w-full overflow-hidden">
        {/* Moldura sutil para destacar do fundo */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/10 to-background/60 pointer-events-none" />

        <Carousel
          setApi={setApi}
          opts={{
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 6500,
              stopOnInteraction: true,
              stopOnMouseEnter: true,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="ml-0">
            {slides.map((slide, idx) => (
              <CarouselItem key={idx} className="pl-0">
                <div className="relative w-full">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    loading={idx === 0 ? "eager" : "lazy"}
                    className={cn(
                      "w-full object-cover",
                      "h-[420px] sm:h-[380px] lg:h-[460px]",
                      "select-none"
                    )}
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/35 to-transparent" />

                  <div className="absolute inset-0">
                    <div className="container mx-auto px-4 sm:px-6 max-w-6xl h-full">
                      <div className="h-full flex items-center py-10 sm:py-12">
                        <div className="w-full sm:max-w-xl text-center sm:text-left">
                          {/* Card de legibilidade no mobile */}
                          <div className="mx-auto sm:mx-0 max-w-[520px] rounded-xl bg-background/55 backdrop-blur-md ring-1 ring-border/60 p-4 sm:p-0 sm:rounded-none sm:bg-transparent sm:backdrop-blur-0 sm:ring-0">
                            <motion.p
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35 }}
                              className="text-xs sm:text-sm font-medium text-muted-foreground"
                            >
                              Plataforma de consultas
                            </motion.p>

                            <AnimatePresence mode="wait">
                              <motion.h1
                                key={`title-${active}`}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.35 }}
                                className="mt-2 text-[22px] leading-tight sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground"
                              >
                                {slide.title}
                              </motion.h1>
                            </AnimatePresence>

                            <AnimatePresence mode="wait">
                              <motion.p
                                key={`subtitle-${active}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.35, delay: 0.05 }}
                                className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-[42ch] mx-auto sm:mx-0"
                              >
                                {slide.subtitle}
                              </motion.p>
                            </AnimatePresence>

                            <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row flex-wrap gap-2">
                              <Button
                                size="sm"
                                className="w-full sm:w-auto"
                                onClick={() => navigate("/registration")}
                              >
                                Começar agora
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => navigate("/planos-publicos")}
                              >
                                Ver planos
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Setas (desktop/tablet) */}
          <CarouselPrevious
            className="hidden sm:flex left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/70 hover:bg-background/85 border-border/60"
            variant="outline"
          />
          <CarouselNext
            className="hidden sm:flex right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/70 hover:bg-background/85 border-border/60"
            variant="outline"
          />

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir para slide ${i + 1}`}
                onClick={() => api?.scrollTo(i)}
                className={cn(
                  "h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full transition-all",
                  i === active
                    ? "bg-primary"
                    : "bg-muted-foreground/40 hover:bg-muted-foreground/60"
                )}
              />
            ))}
          </div>
        </Carousel>
      </div>

      {/* Barra de benefícios (como no exemplo abaixo do banner) */}
      <div className="border-y border-border/60 bg-card/60 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 py-3 sm:py-4">
            {benefits.map((b, idx) => (
              <div
                key={idx}
                className="flex items-center justify-start gap-3 rounded-md px-2 sm:px-2"
              >
                <div className="h-9 w-9 sm:h-8 sm:w-8 rounded-full bg-primary/10 ring-1 ring-primary/15 flex items-center justify-center flex-shrink-0">
                  {b.icon}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground leading-none">
                    {b.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-none">
                    {b.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeCarouselSection;
