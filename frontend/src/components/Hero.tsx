import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Calculator, BookOpen, Users, Shield, Star, ArrowRight } from "lucide-react";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Islamic Pattern Background */}
      <div className="absolute inset-0 islamic-pattern opacity-30" />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-dark/5 via-transparent to-gold/5" />
      
      <div className="relative container mx-auto px-6 pt-32 pb-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Bismillah */}
          <div className="mb-8 animate-fade-in">
            <span className="font-arabic text-4xl text-gold">بسم الله الرحمن الرحيم</span>
          </div>
          
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 gold-gradient rounded-full blur-xl opacity-30" />
              <div className="relative w-24 h-24 gold-gradient rounded-full flex items-center justify-center">
                <span className="text-3xl font-arabic text-emerald-dark">م</span>
              </div>
            </div>
          </div>
          
          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-emerald-dark via-gold to-emerald-dark bg-clip-text text-transparent">
            Mirath
          </h1>
          <h2 className="text-3xl md:text-4xl font-arabic text-gold mb-6">ميراث</h2>
          
          {/* Subtitle */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            Islamic Inheritance Calculator
          </p>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-8">
            Accurate Sharia-compliant inheritance distribution based on the Holy Quran and Sunnah.
            Supporting all four Sunni madhabs.
          </p>
          
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              variant="gold"
              size="lg"
              onClick={() => navigate("/calculator")}
              className="text-lg px-8"
            >
              <Calculator className="w-5 h-5 mr-2" />
              Start Calculation
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/about")}
              className="text-lg px-8"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Learn More
            </Button>
          </div>
        </div>

        {/* Why Mirath Section */}
        <div className="max-w-6xl mx-auto mt-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-2">Why Mirath?</h3>
            <p className="text-muted-foreground">Combining centuries of Islamic jurisprudence with modern technology</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-card rounded-xl p-6 text-center border border-gold/20 card-hover">
              <div className="w-16 h-16 gold-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-8 h-8 text-emerald-dark" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Precise Calculations</h4>
              <p className="font-arabic text-gold mb-2 text-sm">حسابات دقيقة</p>
              <p className="text-muted-foreground text-sm">
                Automated Faraidh calculations implementing fixed shares, Asaba, Hajb, Awl, and Radd rules.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-card rounded-xl p-6 text-center border border-gold/20 card-hover">
              <div className="w-16 h-16 gold-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-emerald-dark" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Multi-Madhab Support</h4>
              <p className="font-arabic text-gold mb-2 text-sm">دعم المذاهب</p>
              <p className="text-muted-foreground text-sm">
                Supporting Hanafi, Shafi'i, Maliki, and Hanbali schools of jurisprudence.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-card rounded-xl p-6 text-center border border-gold/20 card-hover">
              <div className="w-16 h-16 gold-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-emerald-dark" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Quranic References</h4>
              <p className="font-arabic text-gold mb-2 text-sm">المراجع القرآنية</p>
              <p className="text-muted-foreground text-sm">
                Every calculation backed by references from Surah An-Nisa and authenticated Hadith.
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto mt-20 pt-10 border-t border-gold/20">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Star className="w-5 h-5 text-gold mt-1" />
                <div>
                  <h4 className="font-semibold">Sharia-Compliant</h4>
                  <p className="text-sm text-muted-foreground">Strict adherence to Quran and Sunnah</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-gold mt-1" />
                <div>
                  <h4 className="font-semibold">100% Accurate</h4>
                  <p className="text-sm text-muted-foreground">Verified by Islamic scholars</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <ArrowRight className="w-5 h-5 text-gold mt-1" />
                <div>
                  <h4 className="font-semibold">Step-by-Step Explanation</h4>
                  <p className="text-sm text-muted-foreground">Understand how each share is calculated</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calculator className="w-5 h-5 text-gold mt-1" />
                <div>
                  <h4 className="font-semibold">Legal Documents</h4>
                  <p className="text-sm text-muted-foreground">Generate court-ready PDF documents</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;