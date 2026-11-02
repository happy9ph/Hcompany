import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  User,
  Users,
  Building2,
  Building,
  ShieldCheck,
  Code2,
  GraduationCap,
  Handshake,
  Search,
  MessageCircle,
  Share2,
  HelpCircle,
} from "lucide-react";
import { api } from "../lib/api.js";
import { useUser } from "../context/Usercontext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

const COMPANY_SIZES = [
  { value: "solo", labelKey: "auth.sizeSolo", Icon: User },
  { value: "small", labelKey: "auth.sizeSmall", Icon: Users },
  { value: "medium", labelKey: "auth.sizeMedium", Icon: Building2 },
  { value: "large", labelKey: "auth.sizeLarge", Icon: Building },
];

const INTERESTS = [
  { value: "Cybersécurité", Icon: ShieldCheck },
  { value: "Développement web & mobile", Icon: Code2 },
  { value: "Formation", Icon: GraduationCap },
  { value: "Devenir partenaire", Icon: Handshake },
];

const REFERRALS = [
  { value: "Recherche en ligne", Icon: Search },
  { value: "Recommandation", Icon: MessageCircle },
  { value: "Réseaux sociaux", Icon: Share2 },
  { value: "Autre", Icon: HelpCircle },
];

export default function Onboarding() {
  const { t } = useLanguage();
  const { withAuth, user } = useUser();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ company_size: "", primary_interest: "", referral_source: "" });
  const [suggestion, setSuggestion] = useState(null);
  const [saving, setSaving] = useState(false);

  function pick(key, value) {
    setAnswers((a) => ({ ...a, [key]: value }));
    if (step < 2) {
      setTimeout(() => setStep((s) => s + 1), 250);
    } else {
      submit({ ...answers, [key]: value });
    }
  }

  async function submit(finalAnswers) {
    setSaving(true);
    try {
      const result = await withAuth((token) => api.onboarding.submit(token, finalAnswers));
      setSuggestion(result.suggestions?.[0] || null);
      setStep(3);
    } catch {
      navigate("/");
    } finally {
      setSaving(false);
    }
  }

  function finish() {
    navigate("/", { state: { justOnboarded: true } });
  }

  const steps = [
    { title: t("auth.onboardingQ1"), key: "company_size", options: COMPANY_SIZES.map((s) => ({ ...s, label: t(s.labelKey) })) },
    { title: t("auth.onboardingQ2"), key: "primary_interest", options: INTERESTS.map((i) => ({ ...i, label: i.value })) },
    { title: t("auth.onboardingQ3"), key: "referral_source", options: REFERRALS.map((r) => ({ ...r, label: r.value })) },
  ];

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-8">
          <span className="font-display text-xl text-ink">H-Company</span>
          {step < 3 && (
            <button onClick={finish} className="text-xs text-ink-soft hover:text-ink transition-colors">
              {t("auth.onboardingSkip")}
            </button>
          )}
        </div>

        <div className="flex gap-1.5 mb-10">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-1 flex-1 rounded-full bg-line overflow-hidden">
              <motion.div
                className="h-full bg-coffee"
                initial={{ width: 0 }}
                animate={{ width: i <= step ? "100%" : "0%" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step < 3 ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-sm font-medium text-coffee mb-2">
                {t("auth.onboardingStep")} {step + 1} {t("auth.onboardingOf")} 3
              </p>
              <h1 className="font-display text-2xl sm:text-3xl text-ink mb-8 leading-snug">{steps[step].title}</h1>

              <div className="grid sm:grid-cols-2 gap-3">
                {steps[step].options.map(({ value, label, Icon }) => (
                  <motion.button
                    key={value}
                    onClick={() => pick(steps[step].key, value)}
                    disabled={saving}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 text-left rounded-2xl border border-line bg-surface px-5 py-4 hover:border-coffee-light hover:shadow-[0_12px_30px_-18px_rgba(30,26,23,0.25)] transition-all disabled:opacity-50"
                  >
                    <span className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center text-coffee shrink-0">
                      <Icon size={18} />
                    </span>
                    <span className="text-sm font-medium text-ink">{label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="text-center py-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                className="w-16 h-16 rounded-2xl bg-[#C89A3D]/15 flex items-center justify-center text-coffee-dark mx-auto mb-6"
              >
                <Sparkles size={26} />
              </motion.div>
              <h1 className="font-display text-2xl text-ink mb-2">{t("auth.onboardingDone")}</h1>
              <p className="text-sm text-stone mb-8 max-w-xs mx-auto">{t("auth.onboardingDoneLead")}</p>

              {suggestion && (
                <div className="bg-surface border border-line rounded-2xl p-5 mb-8 text-left max-w-sm mx-auto">
                  <p className="text-ink font-medium mb-1">{suggestion.title}</p>
                  <p className="text-sm text-stone">{suggestion.description}</p>
                </div>
              )}

              <button
                onClick={finish}
                className="inline-flex items-center gap-2 rounded-full bg-ink text-cream text-sm font-medium px-7 py-3.5 hover:bg-coffee-dark transition-colors"
              >
                {t("auth.onboardingContinue")}
                <ArrowRight size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
