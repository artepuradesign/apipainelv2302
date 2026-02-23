
import React, { useEffect } from "react";
import MenuSuperior from "@/components/MenuSuperior";
import PublicPlansSection from "@/components/sections/PublicPlansSection";
import Testimonials from "@/components/Testimonials";
import SimpleFooter from "@/components/SimpleFooter";
import ResponsiveHowItWorksSection from "@/components/sections/ResponsiveHowItWorksSection";
import HomeCarouselSection from "@/components/sections/HomeCarouselSection";
import PageLayout from "@/components/layout/PageLayout";

import SocialMediaButtons from "@/components/SocialMediaButtons";

const Index = () => {
  // Initialize AOS when component mounts
  useEffect(() => {
    if (window.AOS) {
      window.AOS.init({
        duration: 600,
        once: true,
        offset: 50,
        delay: 0,
      });
    }
  }, []);

  // Remover o redirecionamento automático - usuário logado pode navegar pelo site

  return (
    <PageLayout
      variant="auth"
      backgroundOpacity="strong"
      showGradients={false}
      className="flex flex-col"
    >
      <MenuSuperior />

      <main className="w-full overflow-x-hidden">
        {/* Destaques */}
        <HomeCarouselSection />

        {/* Como funciona */}
        <ResponsiveHowItWorksSection />

        {/* Planos */}
        <PublicPlansSection />

        {/* Depoimentos */}
        <Testimonials />
      </main>

      <SimpleFooter />
      <SocialMediaButtons />
    </PageLayout>
  );
};

export default Index;

