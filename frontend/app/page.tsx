import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import HowItWorks from "@/components/HowItWorks";
import ForFreelancers from "@/components/ForFreelancers";
import ForLPs from "@/components/ForLPs";
import ContractActions from "@/components/ContractActions";
import BuiltOnStellar from "@/components/BuiltOnStellar";
import OpenSource from "@/components/OpenSource";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Stats />
      <HowItWorks />
      <ForFreelancers />
      <ForLPs />
      <ContractActions />
      <BuiltOnStellar />
      <OpenSource />
      <Footer />
    </main>
  );
}
