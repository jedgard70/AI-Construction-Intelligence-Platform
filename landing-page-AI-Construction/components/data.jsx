/* Atlas / ConstructAI landing — copy + data
 * Bilingual (pt-BR / en) string dictionary + all section content.
 * Exposes everything to window so other Babel scripts can pick it up.
 */

const COPY = {
  pt: {
    nav: {
      services: "Serviços",
      agents: "Agentes",
      platform: "Plataforma",
      pricing: "Preços",
      faq: "FAQ",
      signin: "Entrar",
      demo: "Solicitar demonstração",
    },
    hero: {
      eyebrow: "v5.3 · enterprise cognitive infrastructure",
      headlinePre: "Trocamos",
      headlineStrike: "achismo",
      headlinePost: "por",
      headlineAccent: "agentes cognitivos.",
      subhead:
        "ConstructAI é o sistema operacional da construção civil brasileira. 8 agentes especializados lendo seu BIM, seu orçamento e seus diários de campo — em tempo real, na sua norma.",
      trust: "Sessão criptografada · LGPD compliant · ABNT NR-18",
      ctaPrimary: "Solicitar demonstração",
      ctaSecondary: "Entrar na plataforma",
      live: "Feed ao vivo · Agentes",
      stats: [
        { num: "8", label: "Agentes cognitivos" },
        { num: "6", label: "Papéis suportados" },
        { num: "R$ 12,4 mi", label: "Sob gestão · obra-piloto" },
      ],
      marquee: [
        "BIM Coordinator AI",
        "Construction Planner AI",
        "Cost Controller AI",
        "Risk Analysis AI",
        "Safety Monitor AI",
        "Investment Analyst AI",
        "Quality Control AI",
        "Doc Intelligence AI",
        "ABNT NBR · ISO 19650 · NR-18 · LGPD · EVM PMI",
      ],
    },
    services: {
      eyebrow: "O que entregamos primeiro",
      title: "8 serviços. Um único portfólio digital.",
      lede:
        "Atlas Construction Intelligence opera como sua engenharia estendida — do permit ao render, sob a mesma plataforma de agentes.",
      items: [
        { title: "Permit Sets", desc: "Pacotes técnicos prontos para aprovação municipal, com checklist NR e ABNT por disciplina." },
        { title: "Residential Construction Docs", desc: "Documentação executiva residencial — plantas, cortes, detalhes, especificações." },
        { title: "Revit Modeling", desc: "Modelagem BIM completa em Revit (LOD 200 → 400), com famílias paramétricas auditáveis." },
        { title: "BIM Coordination", desc: "Clash detection multidisciplinar e coordenação BIM 6D/7D com o agente BIM_Coordinator_AI." },
        { title: "Estimativas", desc: "Orçamento paramétrico EVM-ready com curva-S, CPI/SPI e benchmarking SINAPI/CUB." },
        { title: "Renderização", desc: "Renders fotorrealísticos para venda, aprovação e captação — produzidos pelo ArchVis Pro." },
        { title: "Interior Design", desc: "Projetos de interiores residenciais e corporativos, com biblioteca de mobiliário paramétrica." },
        { title: "Plantas humanizadas", desc: "Plantas ilustradas para marketing imobiliário e materiais de vendas — alto-padrão." },
      ],
    },
    agents: {
      eyebrow: "Núcleo cognitivo",
      title: "8 agentes. Um cérebro de obra.",
      lede:
        "Cada agente lê um corpus diferente — BIM, contratos, diários, orçamentos — e devolve decisões com origem e número de página. Nunca alucinam dados que não viram.",
      items: [
        { num: "01", name: "BIM Coordinator", cls: "BIM_Coordinator_AI", desc: "Clash detection, federação de modelos, validação 6D/7D contra cronograma e custo.", kpi: "Inconsistências/semana", kpiVal: "—" },
        { num: "02", name: "Construction Planner", cls: "Construction_Planner_AI", desc: "Cronograma físico, replanejamento por restrição, análise crítica em CPM.", kpi: "SPI semanal", kpiVal: "0,93" },
        { num: "03", name: "Cost Controller", cls: "Cost_Controller_AI", desc: "EVM, EAC/VAC/TCPI, alerta de desvio paramétrico vs. SINAPI/CUB.", kpi: "CPI atual", kpiVal: "0,81" },
        { num: "04", name: "Risk Analysis", cls: "Risk_Analysis_AI", desc: "Matriz de risco vivo, score por obra, probabilidade × impacto financeiro.", kpi: "Riscos críticos", kpiVal: "3" },
        { num: "05", name: "Safety Monitor", cls: "Safety_Monitor_AI", desc: "Análise de DDS, NR-18, NR-35 e RDOs; correlaciona NCs com indicadores de obra.", kpi: "Dias s/ acidente", kpiVal: "187" },
        { num: "06", name: "Investment Analyst", cls: "Investment_Analyst_AI", desc: "NOI, TIR, payback, sensibilidade a WACC e ESG — output para comitê.", kpi: "TIR base", kpiVal: "19,7%" },
        { num: "07", name: "Quality Control", cls: "Quality_Control_AI", desc: "Não-conformidades, plano de inspeção, rastreabilidade de evidências fotográficas.", kpi: "NCIs abertas", kpiVal: "12" },
        { num: "08", name: "Doc Intelligence", cls: "Doc_Intelligence_AI", desc: "Lê memoriais, contratos e ARTs; extrai cláusulas e referências cruzadas com norma.", kpi: "Documentos lidos", kpiVal: "4.218" },
      ],
    },
    dashboard: {
      eyebrow: "Plataforma · ConstructAI",
      title: "Esse é o painel. Clique em qualquer coisa.",
      lede:
        "Uma plataforma, seis papéis. O painel se reorganiza para o Diretor, o Financeiro, o Coordenador, o Engenheiro de Campo, a Qualidade e o Investidor — sem código, sem dashboard novo.",
    },
    bim: {
      eyebrow: "BIM 6D/7D + EVM",
      title: "Modelo, cronograma e dinheiro no mesmo gráfico.",
      lede:
        "O modelo BIM deixa de ser entrega e vira fonte da verdade. Cada elemento ligado a tarefa, custo, energia operacional e pegada de carbono — auditável e exportável.",
      points: [
        { dim: "3D", name: "Modelo federado", desc: "IFC/Revit multidisciplinar, com clash detection contínuo e LOD por entrega." },
        { dim: "4D", name: "Cronograma", desc: "Cada elemento amarrado a uma atividade. Curva-S física com SPI semanal." },
        { dim: "5D", name: "Custo (EVM)", desc: "PV, EV, AC. CPI/SPI vivos, EAC paramétrico, alerta automático em desvio." },
        { dim: "6D", name: "Operação", desc: "Energia, água, manutenção. Modelo as-built virando gêmeo digital de operação." },
        { dim: "7D", name: "Sustentabilidade", desc: "Pegada de carbono por elemento, métricas ESG, relatório direto para investidor." },
      ],
    },
    proof: {
      eyebrow: "Resultados das obras-piloto",
      headline: "Operar com agentes troca planilha por evidência.",
      foot: "Médias de obra-piloto (n=6) entre 2024–2026 · benchmark SINAPI/CUB",
      cells: [
        { num: "37", unit: "%", label: "Redução em retrabalho de incompatibilidades BIM" },
        { num: "12", unit: "dias", label: "Antecipação média de marcos contratuais" },
        { num: "4,2", unit: "%", label: "Redução de desvio orçamentário (CPI)" },
        { num: "100", unit: "%", label: "Diários de obra reconciliados automaticamente" },
        { num: "8×", unit: "", label: "Mais rápido para fechar memorial descritivo" },
      ],
    },
    roles: {
      eyebrow: "Seis papéis. Seis painéis.",
      title: "Cada cargo lê o mesmo dado de um ângulo diferente.",
      lede: "O ConstructAI não muda o pipeline — ele muda quem decide o quê, e com que evidência.",
      items: [
        { num: "01", title: "Diretor Executivo", desc: "Portfólio, semáforo de obras, NOI consolidado, comitê pronto em 1 clique.", tags: ["NOI", "TIR", "Portfólio"], color: "var(--role-diretor)" },
        { num: "02", title: "Financeiro", desc: "Curva-S, EVM, EAC, TCPI. Conciliação com SINAPI e contratos.", tags: ["CPI/SPI", "EAC", "SINAPI"], color: "var(--role-financeiro)" },
        { num: "03", title: "Coordenador", desc: "Federação BIM, cronograma físico, inconsistências por disciplina.", tags: ["BIM", "Cronograma", "Clash"], color: "var(--role-coordenador)" },
        { num: "04", title: "Engenheiro de Campo", desc: "RDO diário, DDS, NR-18, fotos com geotag. Tudo em mobile.", tags: ["RDO", "NR-18", "Mobile"], color: "var(--role-engenheiro)" },
        { num: "05", title: "Qualidade", desc: "NCIs, plano de inspeção, rastreabilidade de evidência, ART vigente.", tags: ["NCI", "ISO 9001", "Inspeção"], color: "var(--role-qualidade)" },
        { num: "06", title: "Investidor", desc: "TIR, payback, sensibilidade WACC, ESG. Relatório self-service.", tags: ["TIR", "WACC", "ESG"], color: "var(--role-investidor)" },
      ],
    },
    compliance: {
      eyebrow: "Conformidade & segurança",
      title: "Conformidade não é módulo. É o substrato.",
      lede:
        "Cada agente lê a norma certa antes de responder. Cada decisão é assinada digitalmente, criptografada em trânsito e auditável por contrato.",
      items: [
        { badge: "LGPD", title: "Lei 13.709/2018", desc: "Dados em território nacional. DPO interno, base legal por finalidade, exclusão sob demanda." },
        { badge: "ABNT NBR", title: "15575 · 16636", desc: "Desempenho residencial e gerenciamento BIM. Validação automática por elemento." },
        { badge: "NR-18 · 35", title: "Segurança em obra", desc: "Templates de DDS, análise preliminar de risco e bloqueio automático em não conformidade." },
        { badge: "ISO 19650", title: "BIM colaborativo", desc: "CDE estruturado, naming, status de revisão e ciclo aprovação/Publicação rastreável." },
      ],
    },
    cases: {
      eyebrow: "Quem já opera com a gente",
      title: "Construtoras, incorporadoras, escritórios e fundos.",
      logos: [
        { name: "Construtora Horizonte", sub: "Obras residenciais" },
        { name: "Tagus Inc", sub: "Incorporação multifamily" },
        { name: "Pilar Engenharia", sub: "Coorporativo & retail" },
        { name: "Vértice BIM", sub: "Coordenação BIM" },
        { name: "Apex Global", sub: "Operadora-mãe" },
        { name: "Fundo Anchora", sub: "Real estate · investidor" },
      ],
      features: [
        {
          quote: "Em quatro semanas o ConstructAI achou 3 inconsistências de armadura em um memorial de 112 páginas. Reduziu o retrabalho da Torre B em quase 40%.",
          author: "Eng. Camila Vieira",
          role: "Coordenadora BIM · Construtora Horizonte",
          kpi: "37%",
          kpiLabel: "Retrabalho evitado",
        },
        {
          quote: "Mudou minha rotina de comitê. Os agentes geram o relatório do investidor, eu valido as premissas. O que era uma semana virou uma manhã.",
          author: "Rodrigo Senna",
          role: "Diretor Executivo · Tagus Inc",
          kpi: "8×",
          kpiLabel: "Mais rápido em comitê",
        },
      ],
    },
    pricing: {
      eyebrow: "Modelos comerciais",
      title: "Por obra. Por portfólio. Sob contrato.",
      lede:
        "Cobramos pelo que entrega valor: agente ativo, obra sob gestão, document throughput. Sem assento, sem cap por usuário.",
      tiers: [
        {
          name: "Obra única",
          price: "R$ 6.800",
          unit: "/obra/mês",
          desc: "Para obras isoladas com 1 coordenação BIM ativa.",
          features: [
            "Até 4 agentes ativos",
            "1 obra em produção · até 8 mil m²",
            "Curva-S, EVM, NCIs, RDOs ilimitados",
            "Suporte 8/5 em pt-BR",
          ],
          muted: ["ESG investor pack", "ArchVis Pro / Director Cut", "ART/CREA white-label"],
          cta: "Começar piloto",
        },
        {
          name: "Portfólio",
          price: "R$ 24.500",
          unit: "/portfólio/mês",
          tag: "Mais escolhido",
          desc: "Multi-obra com consolidação executiva e financeiro.",
          features: [
            "8 agentes cognitivos completos",
            "Até 10 obras simultâneas",
            "Painel multi-papel (Diretor / Fin / Coord)",
            "Integração SINAPI, CUB, Power BI, ERP",
            "ArchVis Pro · 200 renders/mês",
            "Suporte 24/7 em pt-BR e en",
          ],
          muted: ["Director Cut (vídeo) por adicional"],
          cta: "Falar com engenharia",
          feature: true,
        },
        {
          name: "Enterprise",
          price: "Sob contrato",
          unit: "",
          desc: "Para construtoras top-30, fundos e incorporadoras.",
          features: [
            "Obras ilimitadas",
            "Agentes customizáveis + agentes proprietários",
            "Deploy dedicado (single-tenant)",
            "SLA 99,95% + DPA + auditoria SOC 2",
            "Squad de implementação dedicado",
            "Roadmap conjunto e SOW por trimestre",
          ],
          muted: [],
          cta: "Solicitar proposta",
        },
      ],
    },
    faq: {
      eyebrow: "Perguntas frequentes",
      title: "O que se pergunta antes do piloto.",
      lede: "Se ficou de fora, fale com a gente. O fluxo de pré-venda é técnico — você fala com engenharia, não com SDR.",
      items: [
        { q: "Em quanto tempo um piloto roda?", a: "De 2 a 4 semanas para a primeira obra, dependendo da maturidade BIM. O modelo IFC + o cronograma físico são o caminho crítico. Não pedimos migração de ERP." },
        { q: "Como vocês tratam alucinação dos agentes?", a: "Cada resposta vem com origem (documento, página, elemento BIM, célula da planilha). Quando não há fonte, o agente devolve null — explicitamente. Auditamos amostragem mensal." },
        { q: "Os dados saem do Brasil?", a: "Não. Todo o storage e processamento ficam em região brasileira (São Paulo). Compatível com LGPD, com DPA assinado por padrão." },
        { q: "Vocês competem com Procore / Sienge / Autodesk?", a: "Não somos um ERP nem um BIM authoring. Operamos por cima: lemos seus modelos, seus contratos, seus diários — e devolvemos decisão. Conectamos onde já existe, integrando via API ou OCR." },
        { q: "Quem assina tecnicamente?", a: "Eng. José Edgard de Oliveira (CREA 5071162007). ART por obra emitida automaticamente; opcional para o cliente assumir a responsabilidade técnica." },
        { q: "Posso treinar um agente próprio?", a: "Sim — no tier Enterprise. Você traz o corpus (manuais internos, padrões construtivos, planilhas-modelo). O agente custom roda no seu tenant." },
      ],
    },
    footer: {
      cta: "Pronto para ver sua obra dentro do ConstructAI?",
      ctaBtn: "Solicitar demonstração",
      cols: [
        { h: "Plataforma", links: ["Agentes", "Painéis por papel", "BIM 6D/7D", "EVM analytics", "Conformidade"] },
        { h: "Serviços", links: ["Permit Sets", "Revit Modeling", "BIM Coordination", "Estimativas", "Renderização"] },
        { h: "Empresa", links: ["Sobre", "Casos", "Imprensa", "Contato"] },
        { h: "Recursos", links: ["Manual", "Status", "Changelog v5.3", "Documentação API", "Webinars"] },
      ],
      legal:
        "Atlas Construction Intelligence LLC · ConstructAI™ é uma plataforma operada sob responsabilidade técnica do Eng. José Edgard de Oliveira (CREA 5071162007).",
      copyright: "© 2026 Atlas Construction Intelligence LLC · Todos os direitos reservados",
      version: "v5.3 · enterprise cognitive infrastructure",
    },
    dash: {
      tabs: ["Diretor", "Financeiro", "Coordenador", "Eng. Campo", "Qualidade", "Investidor"],
      url: "constructai.atlas.com/dashboard",
      now: "Hoje",
      legendPV: "Previsto (PV)",
      legendEV: "Agregado (EV)",
      legendAC: "Realizado (AC)",
      cardCurva: "Curva-S · EVM",
      cardCurvaSub: "Portfólio · 6 obras",
      cardAlerts: "Alertas dos agentes",
      cardAlertsSub: "Últimas 24h",
      cardProjects: "Obras em execução",
      cardProjectsSub: "Top 4 por valor",
      projHead: ["Obra", "Status", "CPI", "Avanço"],
      statuses: { run: "Em andamento", late: "Atrasado", plan: "Planejamento", pause: "Pausado" },
    },
  },

  en: {
    nav: {
      services: "Services",
      agents: "Agents",
      platform: "Platform",
      pricing: "Pricing",
      faq: "FAQ",
      signin: "Sign in",
      demo: "Request a demo",
    },
    hero: {
      eyebrow: "v5.3 · enterprise cognitive infrastructure",
      headlinePre: "We replaced",
      headlineStrike: "gut-feel",
      headlinePost: "with",
      headlineAccent: "cognitive agents.",
      subhead:
        "ConstructAI is the operating system for Brazilian civil construction. 8 specialized agents reading your BIM, your budget and your field logs — in real time, on your standards.",
      trust: "Encrypted session · LGPD compliant · ABNT NR-18",
      ctaPrimary: "Request a demo",
      ctaSecondary: "Sign in",
      live: "Live feed · Agents",
      stats: [
        { num: "8", label: "Cognitive agents" },
        { num: "6", label: "Roles supported" },
        { num: "$ 2.4 M", label: "Under management · pilot" },
      ],
      marquee: [
        "BIM Coordinator AI",
        "Construction Planner AI",
        "Cost Controller AI",
        "Risk Analysis AI",
        "Safety Monitor AI",
        "Investment Analyst AI",
        "Quality Control AI",
        "Doc Intelligence AI",
        "ABNT NBR · ISO 19650 · NR-18 · LGPD · EVM PMI",
      ],
    },
    services: {
      eyebrow: "What we ship first",
      title: "8 services. One digital portfolio.",
      lede:
        "Atlas Construction Intelligence acts as your extended engineering team — permit to render, all under the agents platform.",
      items: [
        { title: "Permit Sets", desc: "Approval-ready technical sets, with NR/ABNT checklists by discipline." },
        { title: "Residential Construction Docs", desc: "Executive residential documentation — plans, sections, details, specifications." },
        { title: "Revit Modeling", desc: "Full BIM modeling in Revit (LOD 200 → 400), auditable parametric families." },
        { title: "BIM Coordination", desc: "Multidisciplinary clash detection and 6D/7D coordination via the BIM_Coordinator_AI agent." },
        { title: "Estimating", desc: "EVM-ready parametric budgeting with S-curve, CPI/SPI and SINAPI/CUB benchmarking." },
        { title: "Rendering", desc: "Photoreal renders for sales, approvals and capital raises — powered by ArchVis Pro." },
        { title: "Interior Design", desc: "Residential and corporate interiors, with a parametric furniture library." },
        { title: "Illustrated Plans", desc: "Humanized floor plans for marketing collateral — premium real estate." },
      ],
    },
    agents: {
      eyebrow: "Cognitive core",
      title: "8 agents. One construction brain.",
      lede:
        "Each agent reads a different corpus — BIM, contracts, field logs, budgets — and returns decisions with source and page number. They never hallucinate data they didn't read.",
      items: [
        { num: "01", name: "BIM Coordinator", cls: "BIM_Coordinator_AI", desc: "Clash detection, model federation, 6D/7D validation against schedule and cost.", kpi: "Inconsistencies/wk", kpiVal: "—" },
        { num: "02", name: "Construction Planner", cls: "Construction_Planner_AI", desc: "Physical schedule, constraint-aware replanning, critical-path CPM analysis.", kpi: "Weekly SPI", kpiVal: "0.93" },
        { num: "03", name: "Cost Controller", cls: "Cost_Controller_AI", desc: "EVM, EAC/VAC/TCPI, parametric variance against SINAPI/CUB.", kpi: "Current CPI", kpiVal: "0.81" },
        { num: "04", name: "Risk Analysis", cls: "Risk_Analysis_AI", desc: "Live risk matrix, per-project score, probability × financial impact.", kpi: "Critical risks", kpiVal: "3" },
        { num: "05", name: "Safety Monitor", cls: "Safety_Monitor_AI", desc: "Reads safety talks, NR-18/NR-35 and daily logs; correlates NCs with field signals.", kpi: "Incident-free days", kpiVal: "187" },
        { num: "06", name: "Investment Analyst", cls: "Investment_Analyst_AI", desc: "NOI, IRR, payback, WACC + ESG sensitivity — committee-ready output.", kpi: "Base IRR", kpiVal: "19.7%" },
        { num: "07", name: "Quality Control", cls: "Quality_Control_AI", desc: "Non-conformities, inspection plan, photographic evidence traceability.", kpi: "Open NCRs", kpiVal: "12" },
        { num: "08", name: "Doc Intelligence", cls: "Doc_Intelligence_AI", desc: "Reads specs, contracts and ARTs; extracts clauses and cross-refs to standards.", kpi: "Docs ingested", kpiVal: "4,218" },
      ],
    },
    dashboard: {
      eyebrow: "Platform · ConstructAI",
      title: "This is the dashboard. Click anything.",
      lede:
        "One platform, six roles. The dashboard reshapes for the Director, the CFO lead, the Coordinator, the Field Engineer, the Quality lead and the Investor — no code, no new dashboard.",
    },
    bim: {
      eyebrow: "BIM 6D/7D + EVM",
      title: "Model, schedule and money on the same chart.",
      lede:
        "Your BIM model stops being a deliverable and becomes the source of truth. Every element wired to task, cost, operational energy and carbon — auditable and exportable.",
      points: [
        { dim: "3D", name: "Federated model", desc: "Multidisciplinary IFC/Revit, continuous clash detection, LOD per deliverable." },
        { dim: "4D", name: "Schedule", desc: "Every element tied to an activity. Physical S-curve with weekly SPI." },
        { dim: "5D", name: "Cost (EVM)", desc: "PV, EV, AC. Live CPI/SPI, parametric EAC, automatic variance alerts." },
        { dim: "6D", name: "Operations", desc: "Energy, water, maintenance. As-built model becoming an operations digital twin." },
        { dim: "7D", name: "Sustainability", desc: "Carbon footprint per element, ESG metrics, direct investor report." },
      ],
    },
    proof: {
      eyebrow: "Pilot project results",
      headline: "Operating with agents trades spreadsheet for evidence.",
      foot: "Pilot project averages (n=6) between 2024–2026 · SINAPI/CUB benchmark",
      cells: [
        { num: "37", unit: "%", label: "Less BIM rework on conflicts" },
        { num: "12", unit: "days", label: "Average pull-forward on contract milestones" },
        { num: "4.2", unit: "%", label: "Reduction in budget variance (CPI)" },
        { num: "100", unit: "%", label: "Daily field logs auto-reconciled" },
        { num: "8×", unit: "", label: "Faster to close a specification document" },
      ],
    },
    roles: {
      eyebrow: "Six roles. Six dashboards.",
      title: "Each role reads the same data from a different angle.",
      lede: "ConstructAI doesn't change the pipeline — it changes who decides what, with what evidence.",
      items: [
        { num: "01", title: "Executive Director", desc: "Portfolio, project traffic-light, consolidated NOI, board-ready report in one click.", tags: ["NOI", "IRR", "Portfolio"], color: "var(--role-diretor)" },
        { num: "02", title: "Finance", desc: "S-curve, EVM, EAC, TCPI. SINAPI and contract reconciliation.", tags: ["CPI/SPI", "EAC", "SINAPI"], color: "var(--role-financeiro)" },
        { num: "03", title: "Coordinator", desc: "BIM federation, physical schedule, conflicts by discipline.", tags: ["BIM", "Schedule", "Clash"], color: "var(--role-coordenador)" },
        { num: "04", title: "Field Engineer", desc: "Daily log, safety briefings, NR-18, geo-tagged photos. All mobile.", tags: ["RDO", "NR-18", "Mobile"], color: "var(--role-engenheiro)" },
        { num: "05", title: "Quality", desc: "NCRs, inspection plan, evidence traceability, ART status.", tags: ["NCR", "ISO 9001", "Inspection"], color: "var(--role-qualidade)" },
        { num: "06", title: "Investor", desc: "IRR, payback, WACC sensitivity, ESG. Self-service reports.", tags: ["IRR", "WACC", "ESG"], color: "var(--role-investidor)" },
      ],
    },
    compliance: {
      eyebrow: "Compliance & security",
      title: "Compliance isn't a module. It's the substrate.",
      lede:
        "Each agent reads the right standard before responding. Each decision is digitally signed, encrypted in transit and auditable by contract.",
      items: [
        { badge: "LGPD", title: "Law 13.709/2018", desc: "Data inside Brazilian territory. Internal DPO, legal basis by purpose, on-demand erasure." },
        { badge: "ABNT NBR", title: "15575 · 16636", desc: "Residential performance and BIM management. Automatic per-element validation." },
        { badge: "NR-18 · 35", title: "Site safety", desc: "Safety briefing templates, preliminary risk analysis and auto-block on non-conformity." },
        { badge: "ISO 19650", title: "Collaborative BIM", desc: "Structured CDE, naming, revision status and traceable approval/publish lifecycle." },
      ],
    },
    cases: {
      eyebrow: "Who already operates with us",
      title: "Builders, developers, design firms and funds.",
      logos: [
        { name: "Horizonte Builders", sub: "Residential" },
        { name: "Tagus Inc", sub: "Multifamily development" },
        { name: "Pilar Engineering", sub: "Corporate & retail" },
        { name: "Vértice BIM", sub: "BIM coordination" },
        { name: "Apex Global", sub: "Parent operator" },
        { name: "Anchora Fund", sub: "Real estate · investor" },
      ],
      features: [
        {
          quote: "In four weeks ConstructAI surfaced 3 rebar inconsistencies in a 112-page spec document. It cut rework on Tower B by almost 40%.",
          author: "Eng. Camila Vieira",
          role: "BIM Coordinator · Horizonte Builders",
          kpi: "37%",
          kpiLabel: "Rework avoided",
        },
        {
          quote: "It changed my board routine. The agents draft the investor report, I validate the assumptions. What was a week is now a morning.",
          author: "Rodrigo Senna",
          role: "Executive Director · Tagus Inc",
          kpi: "8×",
          kpiLabel: "Faster to committee",
        },
      ],
    },
    pricing: {
      eyebrow: "Commercial models",
      title: "Per project. Per portfolio. Under contract.",
      lede:
        "We charge for what delivers value: active agent, project under management, document throughput. No seats, no user cap.",
      tiers: [
        {
          name: "Single project",
          price: "$ 1,400",
          unit: "/project/mo",
          desc: "For standalone projects with 1 active BIM coordination.",
          features: [
            "Up to 4 active agents",
            "1 project in production · up to 8,000 m²",
            "Unlimited S-curve, EVM, NCRs, daily logs",
            "8/5 support in pt-BR",
          ],
          muted: ["ESG investor pack", "ArchVis Pro / Director Cut", "ART/CREA white-label"],
          cta: "Start a pilot",
        },
        {
          name: "Portfolio",
          price: "$ 4,900",
          unit: "/portfolio/mo",
          tag: "Most chosen",
          desc: "Multi-project, with executive and finance consolidation.",
          features: [
            "All 8 cognitive agents",
            "Up to 10 concurrent projects",
            "Multi-role dashboard (Director / Fin / Coord)",
            "SINAPI, CUB, Power BI, ERP integration",
            "ArchVis Pro · 200 renders/mo",
            "24/7 support in pt-BR and en",
          ],
          muted: ["Director Cut (video) at additional cost"],
          cta: "Talk to engineering",
          feature: true,
        },
        {
          name: "Enterprise",
          price: "Under contract",
          unit: "",
          desc: "For top-30 builders, funds and developers.",
          features: [
            "Unlimited projects",
            "Customizable + proprietary agents",
            "Dedicated deploy (single-tenant)",
            "SLA 99.95% + DPA + SOC 2 audit",
            "Dedicated implementation squad",
            "Joint roadmap and quarterly SOW",
          ],
          muted: [],
          cta: "Request a proposal",
        },
      ],
    },
    faq: {
      eyebrow: "Frequently asked",
      title: "What gets asked before a pilot.",
      lede: "If yours isn't here, just ask. The pre-sales flow is technical — you talk to engineering, not to an SDR.",
      items: [
        { q: "How long does a pilot take?", a: "2 to 4 weeks for the first project, depending on BIM maturity. The IFC model + physical schedule are the critical path. We do not require ERP migration." },
        { q: "How do you handle agent hallucination?", a: "Every answer carries provenance (document, page, BIM element, spreadsheet cell). When there's no source, the agent returns null — explicitly. We audit monthly." },
        { q: "Does data leave Brazil?", a: "No. All storage and processing live in a Brazilian region (São Paulo). LGPD-compatible, DPA signed by default." },
        { q: "Do you compete with Procore / Sienge / Autodesk?", a: "We aren't an ERP or a BIM authoring tool. We operate on top: we read your models, your contracts, your daily logs — and return decisions. We integrate via API or OCR." },
        { q: "Who is the technical signatory?", a: "Eng. José Edgard de Oliveira (CREA 5071162007). Per-project ART issued automatically; client may assume technical responsibility on request." },
        { q: "Can I train my own agent?", a: "Yes — on Enterprise. You bring the corpus (internal manuals, construction patterns, master spreadsheets). The custom agent runs inside your tenant." },
      ],
    },
    footer: {
      cta: "Ready to see your project inside ConstructAI?",
      ctaBtn: "Request a demo",
      cols: [
        { h: "Platform", links: ["Agents", "Role dashboards", "BIM 6D/7D", "EVM analytics", "Compliance"] },
        { h: "Services", links: ["Permit Sets", "Revit Modeling", "BIM Coordination", "Estimating", "Rendering"] },
        { h: "Company", links: ["About", "Cases", "Press", "Contact"] },
        { h: "Resources", links: ["Manual", "Status", "Changelog v5.3", "API docs", "Webinars"] },
      ],
      legal:
        "Atlas Construction Intelligence LLC · ConstructAI™ is operated under the technical responsibility of Eng. José Edgard de Oliveira (CREA 5071162007).",
      copyright: "© 2026 Atlas Construction Intelligence LLC · All rights reserved",
      version: "v5.3 · enterprise cognitive infrastructure",
    },
    dash: {
      tabs: ["Director", "Finance", "Coordinator", "Field Eng", "Quality", "Investor"],
      url: "constructai.atlas.com/dashboard",
      now: "Today",
      legendPV: "Planned (PV)",
      legendEV: "Earned (EV)",
      legendAC: "Actual (AC)",
      cardCurva: "S-curve · EVM",
      cardCurvaSub: "Portfolio · 6 projects",
      cardAlerts: "Agent alerts",
      cardAlertsSub: "Last 24h",
      cardProjects: "Projects in progress",
      cardProjectsSub: "Top 4 by value",
      projHead: ["Project", "Status", "CPI", "Progress"],
      statuses: { run: "In progress", late: "Late", plan: "Planning", pause: "Paused" },
    },
  },
};

/* Live agent feed seed (pulled mostly from the in-app canonical examples) */
const FEED_SEEDS = {
  pt: [
    { agent: "Cost_Controller_AI", pri: "critico", body: "Torre B: aço A572 +22% acima do SINAPI. Substituto sugerido: HEA.", t: -2 },
    { agent: "Doc_Intelligence_AI", pri: "medio", body: "Memorial Torre B: 3 inconsistências de armadura identificadas (págs 47, 89, 112).", t: -7 },
    { agent: "Safety_Monitor_AI", pri: "alto", body: "Obra Recanto: 4 RDOs sem assinatura do encarregado nas últimas 48h.", t: -14 },
    { agent: "BIM_Coordinator_AI", pri: "medio", body: "Conflito Hidráulica × Estrutural no eixo C-12, nível +3,40 m. 2 elementos.", t: -23 },
    { agent: "Quality_Control_AI", pri: "alto", body: "NCI #218 vencida há 4 dias · Forma Reta vs. EPP padrão.", t: -36 },
    { agent: "Construction_Planner_AI", pri: "medio", body: "Caminho crítico replanejado: marco \"Cobertura\" adiantado em 6 dias.", t: -52 },
    { agent: "Investment_Analyst_AI", pri: "info", body: "Sensibilidade WACC+5%: TIR 14,2% ✓ (acima do hurdle 12%).", t: -71 },
    { agent: "Risk_Analysis_AI", pri: "alto", body: "Risco hídrico Promissão: precipitação 7d > 90mm. Pavimentação em janela crítica.", t: -88 },
  ],
  en: [
    { agent: "Cost_Controller_AI", pri: "critico", body: "Tower B: A572 steel +22% above SINAPI. Suggested substitute: HEA.", t: -2 },
    { agent: "Doc_Intelligence_AI", pri: "medio", body: "Tower B specification: 3 rebar inconsistencies found (p. 47, 89, 112).", t: -7 },
    { agent: "Safety_Monitor_AI", pri: "alto", body: "Recanto site: 4 daily logs missing supervisor signature in last 48h.", t: -14 },
    { agent: "BIM_Coordinator_AI", pri: "medio", body: "Plumbing × Structural clash on axis C-12, level +3.40 m. 2 elements.", t: -23 },
    { agent: "Quality_Control_AI", pri: "alto", body: "NCR #218 overdue 4 days · Straight Form vs. standard PPE.", t: -36 },
    { agent: "Construction_Planner_AI", pri: "medio", body: "Critical path replanned: \"Roof\" milestone pulled forward by 6 days.", t: -52 },
    { agent: "Investment_Analyst_AI", pri: "info", body: "WACC+5% sensitivity: IRR 14.2% ✓ (above 12% hurdle).", t: -71 },
    { agent: "Risk_Analysis_AI", pri: "alto", body: "Hydric risk Promissão: 7d rainfall > 90mm. Paving in critical window.", t: -88 },
  ],
};

/* Sample projects for the embedded mini-dashboard */
const DASH_PROJECTS = {
  pt: [
    { code: "OBR-2026-001", name: "Edifício Recanto · Torre A", status: "run",   cpi: "0,93", progress: 68 },
    { code: "OBR-2026-002", name: "Edifício Recanto · Torre B", status: "late",  cpi: "0,81", progress: 41 },
    { code: "OBR-2026-003", name: "Galpão Industrial Promissão", status: "run",  cpi: "1,02", progress: 82 },
    { code: "OBR-2026-004", name: "Retrofit Sede Apex SP",       status: "plan", cpi: "—",    progress: 6  },
  ],
  en: [
    { code: "OBR-2026-001", name: "Recanto Building · Tower A", status: "run",  cpi: "0.93", progress: 68 },
    { code: "OBR-2026-002", name: "Recanto Building · Tower B", status: "late", cpi: "0.81", progress: 41 },
    { code: "OBR-2026-003", name: "Promissão Industrial Hub",   status: "run",  cpi: "1.02", progress: 82 },
    { code: "OBR-2026-004", name: "Apex SP HQ Retrofit",        status: "plan", cpi: "—",    progress: 6  },
  ],
};

const DASH_ALERTS = {
  pt: [
    { agent: "Cost_Controller_AI",     pri: "critico", level: "danger", body: "Torre B: aço A572 +22% acima do SINAPI. Substituto sugerido: HEA." },
    { agent: "Doc_Intelligence_AI",    pri: "medio",   level: "info",   body: "Memorial Torre B: 3 inconsistências de armadura (págs 47, 89, 112)." },
    { agent: "Safety_Monitor_AI",      pri: "alto",    level: "warn",   body: "Recanto: 4 RDOs sem assinatura do encarregado em 48h." },
  ],
  en: [
    { agent: "Cost_Controller_AI",  pri: "critico", level: "danger", body: "Tower B: A572 steel +22% above SINAPI. Suggested: HEA." },
    { agent: "Doc_Intelligence_AI", pri: "medio",   level: "info",   body: "Tower B spec: 3 rebar inconsistencies (p. 47, 89, 112)." },
    { agent: "Safety_Monitor_AI",   pri: "alto",    level: "warn",   body: "Recanto: 4 daily logs missing supervisor signature in 48h." },
  ],
};

/* Per-role KPI sets for the mini-dashboard. Index aligns with dash.tabs. */
const DASH_KPIS = {
  pt: [
    /* Diretor */
    [
      { lbl: "NOI portfólio", val: "R$ 12,4 mi", meta: "+8,2% YoY", trend: "up" },
      { lbl: "Obras ativas",  val: "6",          meta: "1 atrasada", trend: "down" },
      { lbl: "CPI médio",      val: "0,94",      meta: "Meta ≥ 0,95", trend: "down" },
      { lbl: "SPI médio",      val: "0,97",      meta: "+0,03 sem.", trend: "up" },
    ],
    /* Financeiro */
    [
      { lbl: "EAC consolidado", val: "R$ 41,2 mi", meta: "+2,1% vs PV", trend: "down" },
      { lbl: "VAC",             val: "−R$ 860 mil", meta: "Alerta", trend: "down" },
      { lbl: "TCPI",            val: "1,07",        meta: "Recuperável", trend: "up" },
      { lbl: "Desvio SINAPI",    val: "+4,2%",      meta: "Aço A572", trend: "down" },
    ],
    /* Coordenador */
    [
      { lbl: "Clashes abertos", val: "23", meta: "−4 sem. ant.", trend: "up" },
      { lbl: "LOD médio",       val: "350", meta: "Meta 400",     trend: "down" },
      { lbl: "Modelos federados", val: "12", meta: "+2 disciplinas", trend: "up" },
      { lbl: "Caminho crítico",  val: "−6 dias", meta: "Replanejado", trend: "up" },
    ],
    /* Eng. Campo */
    [
      { lbl: "RDOs ass. (24h)", val: "32/36", meta: "4 pendentes",  trend: "down" },
      { lbl: "DDS realizados",   val: "7/7",  meta: "OK",            trend: "up" },
      { lbl: "NR-18",           val: "98%",   meta: "1 NC aberta",  trend: "up" },
      { lbl: "Dias s/ acidente", val: "187",  meta: "Meta ≥ 90",     trend: "up" },
    ],
    /* Qualidade */
    [
      { lbl: "NCIs abertas",     val: "12",  meta: "3 críticas",    trend: "down" },
      { lbl: "Inspeções no mês", val: "184", meta: "+12 vs mês ant.", trend: "up" },
      { lbl: "Conform. inspeções", val: "96,4%", meta: "Meta ≥ 95%", trend: "up" },
      { lbl: "ART vigente",       val: "Sim", meta: "Eng. resp.",   trend: "up" },
    ],
    /* Investidor */
    [
      { lbl: "TIR base",    val: "19,7%", meta: "Hurdle 12%",        trend: "up" },
      { lbl: "Payback",     val: "5,2 a", meta: "Cenário base",       trend: "up" },
      { lbl: "WACC+5%",     val: "14,2%", meta: "Acima do hurdle ✓",  trend: "up" },
      { lbl: "ESG score",   val: "78/100", meta: "Acima da mediana", trend: "up" },
    ],
  ],
  en: [
    /* Director */
    [
      { lbl: "Portfolio NOI", val: "$ 2.4 M", meta: "+8.2% YoY",       trend: "up" },
      { lbl: "Active projects", val: "6",     meta: "1 late",          trend: "down" },
      { lbl: "Avg CPI",       val: "0.94",   meta: "Target ≥ 0.95",   trend: "down" },
      { lbl: "Avg SPI",       val: "0.97",   meta: "+0.03 WoW",       trend: "up" },
    ],
    /* Finance */
    [
      { lbl: "Consolidated EAC", val: "$ 8.0 M", meta: "+2.1% vs PV",  trend: "down" },
      { lbl: "VAC",              val: "−$ 168 K", meta: "Alert",        trend: "down" },
      { lbl: "TCPI",             val: "1.07",     meta: "Recoverable", trend: "up" },
      { lbl: "SINAPI variance",   val: "+4.2%",   meta: "A572 steel",  trend: "down" },
    ],
    /* Coordinator */
    [
      { lbl: "Open clashes",     val: "23",      meta: "−4 vs prev wk", trend: "up" },
      { lbl: "Avg LOD",          val: "350",     meta: "Target 400",    trend: "down" },
      { lbl: "Federated models", val: "12",      meta: "+2 disciplines", trend: "up" },
      { lbl: "Critical path",    val: "−6 days", meta: "Replanned",     trend: "up" },
    ],
    /* Field Eng */
    [
      { lbl: "Signed daily logs (24h)", val: "32/36", meta: "4 pending", trend: "down" },
      { lbl: "Safety briefings",        val: "7/7",   meta: "OK",        trend: "up" },
      { lbl: "NR-18",                   val: "98%",   meta: "1 NC open", trend: "up" },
      { lbl: "Incident-free days",      val: "187",   meta: "Target ≥ 90", trend: "up" },
    ],
    /* Quality */
    [
      { lbl: "Open NCRs",           val: "12",    meta: "3 critical",     trend: "down" },
      { lbl: "Inspections this mo", val: "184",   meta: "+12 vs prev",    trend: "up" },
      { lbl: "Inspection pass rate", val: "96.4%", meta: "Target ≥ 95%",   trend: "up" },
      { lbl: "ART status",           val: "Active", meta: "Eng. of record", trend: "up" },
    ],
    /* Investor */
    [
      { lbl: "Base IRR", val: "19.7%", meta: "12% hurdle",       trend: "up" },
      { lbl: "Payback",  val: "5.2y",  meta: "Base scenario",     trend: "up" },
      { lbl: "WACC+5%",  val: "14.2%", meta: "Above hurdle ✓",   trend: "up" },
      { lbl: "ESG score", val: "78/100", meta: "Above median",     trend: "up" },
    ],
  ],
};

Object.assign(window, { COPY, FEED_SEEDS, DASH_PROJECTS, DASH_ALERTS, DASH_KPIS });
