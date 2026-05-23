/* App — top-level orchestration: tweaks, language, role focus */

const { useState: useStateA, useEffect: useEffectA } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "lang": "pt",
  "mode": "light",
  "accent": "blue",
  "density": "regular",
  "agentsLayout": "4x2",
  "roleIndex": 0,
  "headline": ""
}/*EDITMODE-END*/;

function App() {
  const [tweak, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const t = COPY[tweak.lang] || COPY.pt;

  /* Apply theme/density/accent to document */
  useEffectA(() => {
    document.documentElement.setAttribute("data-mode", tweak.mode);
    document.documentElement.setAttribute("data-density", tweak.density);
    document.documentElement.setAttribute("data-accent", tweak.accent);
    document.documentElement.setAttribute("lang", tweak.lang === "pt" ? "pt-BR" : "en");
  }, [tweak.mode, tweak.density, tweak.accent, tweak.lang]);

  const setRoleIndex = (i) => setTweak("roleIndex", i);

  return (
    <React.Fragment>
      <Nav t={t} lang={tweak.lang} setLang={(v) => setTweak("lang", v)} />
      <Hero t={t} lang={tweak.lang} headlineOverride={tweak.headline} />
      <Marquee items={t.hero.marquee} />
      <Services t={t} />
      <Agents t={t} layout={tweak.agentsLayout} />
      <DashboardSection t={t} lang={tweak.lang} roleIndex={tweak.roleIndex} setRoleIndex={setRoleIndex} />
      <BimEvm t={t} lang={tweak.lang} />
      <Proof t={t} />
      <Roles t={t} />
      <Compliance t={t} />
      <Cases t={t} />
      <Pricing t={t} />
      <Faq t={t} />
      <Footer t={t} lang={tweak.lang} />

      <TweaksPanel>
        <TweakSection label={tweak.lang === "pt" ? "Idioma & tema" : "Language & theme"} />
        <TweakRadio
          label={tweak.lang === "pt" ? "Idioma" : "Language"}
          value={tweak.lang}
          options={["pt", "en"]}
          onChange={(v) => setTweak("lang", v)}
        />
        <TweakRadio
          label={tweak.lang === "pt" ? "Modo" : "Mode"}
          value={tweak.mode}
          options={["light", "dark"]}
          onChange={(v) => setTweak("mode", v)}
        />
        <TweakRadio
          label={tweak.lang === "pt" ? "Densidade" : "Density"}
          value={tweak.density}
          options={["compact", "regular", "airy"]}
          onChange={(v) => setTweak("density", v)}
        />

        <TweakSection label={tweak.lang === "pt" ? "Cor de destaque" : "Accent color"} />
        <TweakRadio
          label={tweak.lang === "pt" ? "Acento" : "Accent"}
          value={tweak.accent}
          options={["blue", "amber", "green"]}
          onChange={(v) => setTweak("accent", v)}
        />

        <TweakSection label={tweak.lang === "pt" ? "Layout" : "Layout"} />
        <TweakRadio
          label={tweak.lang === "pt" ? "Agentes" : "Agents grid"}
          value={tweak.agentsLayout}
          options={["3x3", "4x2", "list"]}
          onChange={(v) => setTweak("agentsLayout", v)}
        />
        <TweakSelect
          label={tweak.lang === "pt" ? "Painel focado em" : "Dashboard role"}
          value={String(tweak.roleIndex)}
          options={t.dash.tabs.map((tab, i) => ({ value: String(i), label: tab }))}
          onChange={(v) => setTweak("roleIndex", Number(v))}
        />

        <TweakSection label={tweak.lang === "pt" ? "Hero" : "Hero"} />
        <TweakText
          label={tweak.lang === "pt" ? "Manchete (vazio = padrão)" : "Headline (blank = default)"}
          value={tweak.headline}
          placeholder={tweak.lang === "pt" ? "Use a manchete padrão" : "Use default headline"}
          onChange={(v) => setTweak("headline", v)}
        />
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
