'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import PrintShareModal from '../components/PrintShareModal'

// ─── Types ──────────────────────────────────────────────────────
type Module = 'dashboard' | 'clash' | 'permits' | 'docs' | 'workflow' | 'reports' | 'upload' | 'codes' | 'residential' | 'coordination' | 'quantities' | 'feasibility'
type ClashItem = { id:string; discipline:string; severity:'Critical'|'Major'|'Minor'; description:string; location:string; status:string }

const CLASH_DATA: ClashItem[] = [
  { id:'CLH-001', discipline:'MEP vs Structural', severity:'Critical', description:'HVAC duct 24"×12" collides with W18×50 beam at grid C-4, elevation +14\'6"', location:'Level 3 · Grid C-4', status:'Open' },
  { id:'CLH-002', discipline:'Plumbing vs Structural', severity:'Critical', description:'4" sanitary drain conflicts with concrete slab penetration at grid A-7', location:'Level 2 · Grid A-7', status:'Open' },
  { id:'CLH-003', discipline:'Electrical vs MEP', severity:'Major', description:'Conduit bank 4×1.5" EMT routing conflicts with mechanical chase at AHU-3', location:'Mechanical Room 102', status:'Under Review' },
  { id:'CLH-004', discipline:'Architectural vs Structural', severity:'Major', description:'Curtain wall anchor bracket conflicts with HSS 6×6 column at north facade', location:'Level 1 · North Facade', status:'Under Review' },
  { id:'CLH-005', discipline:'Fire Protection vs MEP', severity:'Minor', description:'Sprinkler branch line conflicts with supply air duct at corridor 2B', location:'Level 2 · Corridor 2B', status:'Resolved' },
  { id:'CLH-006', discipline:'Plumbing vs Electrical', severity:'Minor', description:'Domestic water riser in proximity to panel EB-2, clearance under NEC 110.26', location:'Electrical Room 1A', status:'Open' },
]

const PERMIT_CHECKLIST = [
  { id:'P1', label:'Site Plan — Civil Survey', status:'Complete', reviewer:'City Planning Dept.' },
  { id:'P2', label:'Architectural Floor Plans (all levels)', status:'Complete', reviewer:'Building Dept.' },
  { id:'P3', label:'Foundation & Structural Plans', status:'In Review', reviewer:'Structural Plan Check' },
  { id:'P4', label:'MEP — Mechanical Plans', status:'In Review', reviewer:'Mechanical Inspector' },
  { id:'P5', label:'MEP — Electrical Plans (E-series)', status:'Pending', reviewer:'Electrical Plan Check' },
  { id:'P6', label:'MEP — Plumbing Plans (P-series)', status:'Pending', reviewer:'Plumbing Inspector' },
  { id:'P7', label:'Energy Compliance (Title 24 / IECC)', status:'Pending', reviewer:'Energy Compliance' },
  { id:'P8', label:'Fire & Life Safety Plans', status:'Not Started', reviewer:'Fire Marshal' },
  { id:'P9', label:'Accessibility Review (ADA / IBC)', status:'Not Started', reviewer:'ADA Coordinator' },
  { id:'P10', label:'Stormwater SWPPP', status:'Not Started', reviewer:'Environmental Dept.' },
]

const WORKFLOW_TASKS = [
  { id:'T1', title:'Revit Model QA/QC — Level 3', assignee:'BIM Coordinator', due:'May 24', priority:'High', status:'In Progress' },
  { id:'T2', title:'Structural Clash Report — Phase 2', assignee:'Structural BIM', due:'May 22', priority:'Critical', status:'Overdue' },
  { id:'T3', title:'Permit Set PDF Export — City Submittal', assignee:'CAD Drafter', due:'May 26', priority:'High', status:'Not Started' },
  { id:'T4', title:'MEP Coordination RFI #47', assignee:'MEP Engineer', due:'May 25', priority:'Medium', status:'In Progress' },
  { id:'T5', title:'Spec Section 03300 — Concrete', assignee:'Estimator', due:'May 28', priority:'Medium', status:'Not Started' },
  { id:'T6', title:'Shop Drawing Review — Steel', assignee:'PM', due:'May 23', priority:'High', status:'Under Review' },
]

const MARKET_ROLES = [
  { role:'BIM Coordinator', rate:'$85–$130/hr', demand:'Very High ↑', icon:'🏗️' },
  { role:'Revit Specialist', rate:'$70–$110/hr', demand:'Very High ↑', icon:'📐' },
  { role:'CAD Drafter', rate:'$45–$75/hr', demand:'High ↑', icon:'📏' },
  { role:'Permit Technician', rate:'$55–$85/hr', demand:'High ↑', icon:'📋' },
  { role:'BIM Modeler', rate:'$65–$100/hr', demand:'Very High ↑', icon:'🏢' },
  { role:'Estimator', rate:'$75–$120/hr', demand:'High ↑', icon:'💰' },
  { role:'Construction Doc Mgr', rate:'$90–$140/hr', demand:'High ↑', icon:'📁' },
  { role:'Residential Designer', rate:'$55–$90/hr', demand:'Medium →', icon:'🏠' },
]

// ─── US Building Codes ──────────────────────────────────────────
const US_CODES = [
  {
    id: 'irc',
    name: 'IRC 2021',
    full: 'International Residential Code',
    scope: '1 & 2 Family Dwellings + Townhouses ≤ 3 stories',
    icon: '🏠',
    color: '#185FA5',
    bg: '#EFF4FF',
    adoptedBy: 'Most US states — check local amendments',
    chapters: [
      { ref: 'R301',      title: 'Design Criteria',                   desc: 'Wind, seismic, snow, flood loads. Wind speed maps, exposure categories, design wind pressure.' },
      { ref: 'R302',      title: 'Fire-Resistant Construction',        desc: 'Exterior wall fire-resistance based on lot-line distance. Projections, openings, penetrations.' },
      { ref: 'R303',      title: 'Light, Ventilation & Heating',      desc: 'Min. 8% floor area for glazing, 4% for ventilation. Min 68°F habitable space heating.' },
      { ref: 'R401–R404', title: 'Foundations',                       desc: 'Footings, foundation walls, slabs-on-grade. Min. depth per frost line. Drainage requirements.' },
      { ref: 'R501–R507', title: 'Floors',                            desc: 'Wood floor framing, span tables, notching/boring limits, floor sheathing.' },
      { ref: 'R601–R614', title: 'Wall Construction',                 desc: 'Wood framing, braced wall panels, insulation, sheathing, exterior wall covering.' },
      { ref: 'R702–R703', title: 'Interior/Exterior Wall Covering',   desc: 'Gypsum board, weather-resistive barrier, water-managed cladding systems.' },
      { ref: 'R801–R807', title: 'Roof-Ceiling Construction',         desc: 'Rafter/ceiling joist span tables, attic ventilation (1/150 ratio), roof sheathing.' },
      { ref: 'R902',      title: 'Roof Classification',               desc: 'Class A, B, C roofing. Fire exposure requirements. Re-roofing provisions.' },
      { ref: 'R1001–R1006', title: 'Masonry / Fireplace & Chimney', desc: 'Hearth extension min. 16" front, 8" sides. Flue sizing. Smoke chamber.' },
      { ref: 'E3501–E3706', title: 'Electrical (NEC Derivative)',    desc: 'Service entrance, panel sizing, branch circuits, AFCI/GFCI requirements per NEC.' },
      { ref: 'P2503–P3114', title: 'Plumbing',                      desc: 'DWV sizing, water supply, fixture units, cleanouts, trap requirements.' },
      { ref: 'M1301–M1411', title: 'Mechanical / HVAC',             desc: 'Equipment installation, combustion air, duct sizing, exhaust ventilation.' },
    ],
  },
  {
    id: 'ibc',
    name: 'IBC 2021',
    full: 'International Building Code',
    scope: 'Commercial, Multi-Family, Mixed-Use, Assembly, Institutional',
    icon: '🏢',
    color: '#534AB7',
    bg: '#F0EEFF',
    adoptedBy: '49 states + DC (with local amendments)',
    chapters: [
      { ref: 'Ch. 3',       title: 'Use & Occupancy Classification',     desc: 'Groups A (Assembly), B (Business), E (Educational), F (Factory), H (Hazardous), I (Institutional), M (Mercantile), R (Residential), S (Storage), U (Utility).' },
      { ref: 'Ch. 5',       title: 'General Building Heights & Areas',   desc: 'Max height/stories/area per construction type and occupancy. Sprinkler increases. Mixed-use area aggregation.' },
      { ref: 'Ch. 6',       title: 'Types of Construction',              desc: 'Types I-A through V-B. Fire-resistance ratings for structural elements, exterior walls, floor/ceiling assemblies.' },
      { ref: 'Ch. 7',       title: 'Fire & Smoke Protection Features',   desc: 'Fire walls, fire barriers, fire partitions. Rated corridor construction. Shaft enclosures. Opening protectives.' },
      { ref: 'Ch. 9',       title: 'Fire Protection Systems',            desc: 'Automatic sprinkler (NFPA 13/13R/13D). Standpipes. Fire alarm & detection (NFPA 72). Smoke control.' },
      { ref: 'Ch. 10',      title: 'Means of Egress',                   desc: 'Occupant load calc. Exit widths. Travel distance limits. Dead-end corridors. Stairway requirements. Emergency lighting.' },
      { ref: 'Ch. 11',      title: 'Accessibility',                      desc: 'ADA & ABA standards. Accessible routes, parking, restrooms, signage. Accessible means of egress. FHA requirements.' },
      { ref: 'Ch. 13',      title: 'Energy Efficiency (IECC)',           desc: 'Compliance via prescriptive or performance path. COMcheck software. U-factors, SHGCs, R-values by climate zone.' },
      { ref: 'Ch. 16',      title: 'Structural Design — Loads',          desc: 'Dead, live, roof, wind (ASCE 7), seismic (ASCE 7 Ch. 11-12), snow, rain, flood, tsunami loads. Load combinations.' },
      { ref: 'Ch. 17',      title: 'Special Inspections & Tests',        desc: 'Statement of Special Inspections. Concrete, steel, masonry, soils, fire-resistive assemblies, sprayed fire-resistant materials.' },
      { ref: 'Ch. 18',      title: 'Soils & Foundations',                desc: 'Geotechnical investigation. Allowable bearing capacity. Foundation requirements. Grading and drainage.' },
      { ref: 'Ch. 19',      title: 'Concrete',                           desc: 'ACI 318 by reference. Mix design, reinforcement, cover, formwork, testing, special inspection.' },
      { ref: 'Ch. 22',      title: 'Steel',                              desc: 'AISC 360 (design), AISC 341 (seismic), AWS D1.1 (welding). High-strength bolts, connections.' },
      { ref: 'Ch. 26–30',   title: 'Gypsum Board / Plastering',         desc: 'Fire-resistance assemblies, GA-600. Shaft wall assemblies. Separation between occupancies.' },
    ],
  },
  {
    id: 'nec',
    name: 'NEC 2023',
    full: 'National Electrical Code (NFPA 70)',
    scope: 'All electrical installations — residential, commercial, industrial',
    icon: '⚡',
    color: '#B87000',
    bg: '#FFF8E6',
    adoptedBy: 'Adopted by all 50 states (some use 2020 or 2017 edition)',
    chapters: [
      { ref: 'Art. 100',    title: 'Definitions',                        desc: 'Authoritative definitions: AHJ, bonding, branch circuit, feeder, grounded/grounding, identified, labeled, listed, service, utilization equipment.' },
      { ref: 'Art. 110',    title: 'Requirements for Electrical Installations', desc: 'Min. working clearances (110.26): 36" front panel depth, 30" width, 6\'6" headroom. Examination of equipment. Interrupting ratings.' },
      { ref: 'Art. 200',    title: 'Use of Grounded (Neutral) Conductors', desc: 'White/gray insulation for grounded conductors. Identification of terminals. Polarity.' },
      { ref: 'Art. 210',    title: 'Branch Circuits',                    desc: 'Small appliance circuits (20A). Bathroom circuits. AFCI (210.12) — all 120V 15/20A circuits in dwelling. GFCI (210.8) — bathrooms, kitchens, outdoors, basements.' },
      { ref: 'Art. 220',    title: 'Branch-Circuit & Service Load Calc', desc: 'Demand factors for feeders. Cooking equipment demand. Lighting load calculations. Service load for dwellings (220.82, optional calc 220.83).' },
      { ref: 'Art. 230',    title: 'Services',                           desc: 'Service entrance conductors. Overhead clearances (230.24). Underground service. Disconnecting means. Service equipment.' },
      { ref: 'Art. 240',    title: 'Overcurrent Protection',             desc: 'Fuse and CB ratings. Location of overcurrent devices. Standard ratings (15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100A…). Coordination.' },
      { ref: 'Art. 250',    title: 'Grounding & Bonding',                desc: 'System grounding. Equipment grounding conductors (EGC) sizing per 250.122. Grounding electrode system (250.50). UFER ground. Bonding of metal piping.' },
      { ref: 'Art. 300',    title: 'Wiring Methods — General',           desc: 'Wiring in spaces. Cable routing. Securing and supporting. Protection from damage. Fill calculations. Wet/damp locations.' },
      { ref: 'Art. 310',    title: 'Conductors for General Wiring',      desc: 'Conductor ampacity tables (310.15). Temperature ratings (60°C, 75°C, 90°C). Derating for conduit fill. Aluminum conductor requirements.' },
      { ref: 'Art. 406',    title: 'Receptacles, Cord Connectors & Attachment Plugs', desc: 'GFCI protection locations. Tamper-resistant receptacles in dwelling units. Weatherproof in-use covers. Isolated ground receptacles.' },
      { ref: 'Art. 408',    title: 'Switchboards, Switchgear & Panelboards', desc: 'Panel labeling. Dedicated space (408.18). Max 42 circuits per panelboard. Main bonding jumper. Neutral bar bonding.' },
      { ref: 'Art. 410',    title: 'Luminaires, Lampholders',            desc: 'Recessed lighting near insulation. Type IC vs non-IC. Wet/damp location fixtures. Emergency lighting (700). Exit signs (701).' },
      { ref: 'Art. 700–701', title: 'Emergency & Legally Required Standby', desc: 'Transfer time requirements. Generator sizing. ATS. UPS systems. Maintenance requirements. Testing intervals.' },
    ],
  },
  {
    id: 'fbc',
    name: 'FBC 8th Ed.',
    full: 'Florida Building Code (2023)',
    scope: 'All construction in Florida — includes FL-specific amendments to IBC/IRC',
    icon: '🌴',
    color: '#2D7A4F',
    bg: '#E6F4ED',
    adoptedBy: 'Statewide — Florida only. Local amendments require state approval.',
    chapters: [
      { ref: 'FBC Ch. 16',  title: 'Structural — Wind Loads (ASCE 7-22)', desc: 'Ultimate design wind speed maps per risk category. Florida is Risk Cat II/III/IV statewide. 170+ mph in South FL. Product approval required.' },
      { ref: 'HVHZ',        title: 'High Velocity Hurricane Zone',        desc: 'Applies to Miami-Dade and Broward counties only. Strictest wind requirements in the US (185 mph+). NOA (Notice of Acceptance) required for all products. Separate HVHZ code provisions.' },
      { ref: 'FBC R301.2.1.1', title: 'Wind Exposure Categories (Residential)', desc: 'Exposure B, C, D based on terrain. South FL coast = Exposure D. Wood frame must be designed per WFCM or engineering. Continuous load path required.' },
      { ref: 'FBC Ch. 18',  title: 'Soils — Special FL Requirements',    desc: 'Expansive soils (not typical in FL). Organic soils — common in South FL, require remediation. High water table considerations. Soil testing mandatory for most projects.' },
      { ref: 'Impact Glazing', title: 'Impact-Resistant Glazing',        desc: 'Required in Wind-Borne Debris Regions (all of South FL, coastal areas). Large missile test (ASTM E1996). Opening protection or SMS. Miami-Dade NOA or FL product approval.' },
      { ref: 'FBC Energy',  title: 'Florida Energy Code (IECC w/ FL Amend.)', desc: 'Mandatory blower door test (≤ 5 ACH50 residential). EnergyGauge software. Solar-ready provisions (FBC R406). Manual J for HVAC sizing.' },
      { ref: 'FBC Plumbing', title: 'Florida Plumbing Code',             desc: 'Based on IPC. Septic systems under FDEP. Backflow prevention. Water heater elevation in flood zones. Rain water harvesting provisions.' },
      { ref: 'FBC Mech.',   title: 'Florida Mechanical Code (HVAC)',     desc: 'Based on IMC. Manual J/S/D required. Duct leakage testing (4 CFM25 per 100 SF). Air handler in conditioned space or R-8 duct insulation.' },
      { ref: 'FBC Elec.',   title: 'Florida Electrical Code',            desc: 'Based on NEC 2023. Additional GFCI requirements. Surge protection (FBC E280.0). Generator and EV provisions. Solar PV (Art. 690).' },
      { ref: 'FBC Flood',   title: 'Flood-Resistant Construction',       desc: 'ASCE 24-14 by reference. Lowest Floor Elevation (LFE) above BFE. Flood openings in enclosures. V-Zone pile/column foundations. Breakaway walls.' },
      { ref: 'FBC Roof',    title: 'Roofing — FL Requirements',          desc: '25-year warranty minimum for commercial. Steep-slope: min 2 layers felt + roof covering. Low-slope: FM approvals. Miami-Dade NOA for HVHZ. Metal roof fastening.' },
      { ref: 'FBC 553',     title: 'Florida Statute 553 — Building Codes', desc: 'State law requiring statewide uniform code. 7th edition adopted March 2023. Local amendments process. Product approval system (floridabuilding.org).' },
    ],
  },
]

const SEV_COLOR: Record<string,string> = { Critical:'#A32D2D', Major:'#BA7517', Minor:'#3B6D11' }
const SEV_BG: Record<string,string>    = { Critical:'#FCEBEB', Major:'#FFF3E0', Minor:'#EAF3DE' }
const STATUS_COLOR: Record<string,string> = {
  'Complete':'#3B6D11','In Review':'#185FA5','Pending':'#BA7517',
  'Not Started':'#8890a0','Open':'#A32D2D','Resolved':'#3B6D11','Under Review':'#BA7517',
  'In Progress':'#185FA5','Overdue':'#A32D2D','Critical':'#A32D2D',
  'High':'#BA7517','Medium':'#534AB7',
}
const RESIDENTIAL_SYSTEMS = [
  {
    id: 'foundation',
    icon: '🪨',
    label: 'Foundation Types',
    systems: [
      { name: 'Slab-on-Grade', code: 'IRC R403.1', desc: 'Most common in TX/FL/AZ. Monolithic or post-tension. Thickened edges at bearing walls. PT cables at 4\'-0" OC per geotechnical report.', specs: ['Min 4" concrete slab', 'Post-tension: 150 ksi strands', 'Vapor retarder: 10-mil polyethylene', 'Compacted fill: 95% proctor'] },
      { name: 'Crawl Space', code: 'IRC R408', desc: 'Common in SE and Carolinas. Vented or conditioned (sealed). Min 18" clearance from grade to bottom of floor joist.', specs: ['Min 18" clearance floor joist', 'Vent area: 1:150 floor area', 'Ground cover: 6-mil vapor barrier', 'Access: 18"×24" min opening'] },
      { name: 'Basement / Walk-out', code: 'IRC R404', desc: 'Prevalent in midwest and northeast. ICF or poured concrete walls. Waterproofing + drainage board on exterior.', specs: ['8" min poured concrete wall', 'Waterproofing: crystalline or membrane', 'Drainage board + 4" perf pipe', 'Window egress: 5.7 sq ft min'] },
      { name: 'Pier & Beam', code: 'IRC R403.1.3', desc: 'Historic TX/Southeast. Steel or concrete piers. Adjustable for expansive soils. Easier utility access. Re-leveling required every 10–15 years.', specs: ['Pier spacing: 8\'-0" max OC', 'Grade beam: 12"×24" min', 'Beam: 4×8 or double 2×10', 'Concrete piers: 12" dia min'] },
      { name: 'Helical Piers', code: 'ICC AC358', desc: 'Engineered deep foundation for poor soils or additions. Torque-installed steel shafts. Immediate load-bearing. Common in expansive clay regions.', specs: ['Min 3" dia shaft', 'Torque: 3,500–10,000 ft-lbs', 'Depth to bearing stratum', 'Corrosion protection: galvanized'] },
    ]
  },
  {
    id: 'framing',
    icon: '🪵',
    label: 'Wood Framing',
    systems: [
      { name: 'Platform Frame (Western)', code: 'IRC R602', desc: 'Standard US residential. Each story framed on top of previous. 2×4 or 2×6 studs at 16" OC. Engineered lumber for headers and long spans.', specs: ['Studs: 2×6 @ 16" OC (exterior)', 'Studs: 2×4 @ 16" OC (interior)', 'Double top plate: 2×6 min', 'Headers: LVL or built-up per span table'] },
      { name: 'Advanced Framing (OVE)', code: 'IRC R602 / DOE', desc: 'Optimized Value Engineering — 2×6 @ 24" OC, single top plate, insulated headers. 20–30% less lumber, higher R-value walls.', specs: ['2×6 studs @ 24" OC', 'Single top plate w/ rim board', 'Insulated or no headers in gable', 'Aligns joists/rafters/studs'] },
      { name: 'Balloon Frame', code: 'Legacy / IRC R302.12', desc: 'Pre-1940s construction. Studs run full height 2 stories. Fire-blocking required at every floor level per IRC R302.12.', specs: ['Fire blocking at floor joists', '2-story continuous studs', 'Ledger board for floor support', 'Firestop: 2" nominal material'] },
      { name: 'Cold-Form Steel Framing', code: 'AISI S230', desc: 'Non-combustible. Common in SE high-wind zones. 18-gauge tracks and studs. Thermal bridging managed with CI insulation.', specs: ['18-ga or 20-ga studs', '8" deep @ 24" OC typical', 'Screw pattern: #10 screws', 'CI: 1" min polyiso exterior'] },
    ]
  },
  {
    id: 'drywall',
    icon: '🧱',
    label: 'Drywall Systems',
    systems: [
      { name: 'Standard GWB (5/8")', code: 'IRC R702 / ASTM C36', desc: 'Standard interior finish. 5/8" Type X at fire-rated assemblies. 1/2" at non-rated walls and ceilings.', specs: ['5/8" Type X: fire-rated 1-hour', '1/2" standard: non-rated', 'Fasteners: 1-5/8" drywall screws', 'Screw spacing: 8" OC framing'] },
      { name: 'Mold-Resistant (Greenboard)', code: 'ASTM C1396', desc: 'Bathrooms, laundry, kitchens. Paper-faced mold-resistant core. NOT a substitute for cement board in wet areas at tile.', specs: ['5/8" or 1/2" thickness', 'Paper or fiberglass faced', 'Max humidity: 95% RH', 'Requires vapor retarder in walls'] },
      { name: 'Cement Board / Tile Backer', code: 'TCNA / ANSI A108', desc: 'Tile substrate in showers, tub surrounds, floors. HardieBacker, DensShield, USG Durock. Requires waterproof membrane for showers.', specs: ['1/4" or 1/2" thickness', 'Screw: 1-1/4" wafer head', 'Waterproof membrane over board', 'Alkali-resistant mesh tape'] },
      { name: 'Shaft Wall / Area Separation', code: 'UL U467 / IRC R302.2', desc: '2-hour assembly between townhome units. 1" coreboard + 5/8" Type X. No shared framing — independent chase walls.', specs: ['2-hour UL assembly', 'No penetrations allowed', 'EIFS or gypsum cap at top', 'Extends from foundation to roof'] },
    ]
  },
  {
    id: 'roofing',
    icon: '🏠',
    label: 'Roofing Systems',
    systems: [
      { name: 'Asphalt Shingles (Class A)', code: 'IRC R905.2 / ASTM D3462', desc: 'Most common US residential. 3-tab or architectural (laminated). Min 2:12 slope with low-slope underlayment. 30-yr architectural standard.', specs: ['Min slope: 2:12 w/ 2 layers felt', 'Ice & water shield: 24" past wall', 'Starter strip: min 8" exposure', 'Nailing: 4 nails per shingle'] },
      { name: 'Metal Roofing (Standing Seam)', code: 'IRC R905.10', desc: 'High-wind and hurricane zones (FL, TX coast). 24-ga steel or 0.032 aluminum. Concealed clips — no exposed fasteners. 50-yr life.', specs: ['24 or 26 ga steel', 'Panel width: 12"–18"', 'Concealed clip @ 24" OC', 'Min slope: 1/4:12 for hidden seam'] },
      { name: 'Tile (Concrete / Clay)', code: 'IRC R905.3', desc: 'Dominant in FL and SW. Min 4:12 slope. Dead load 8–14 PSF — structural must account for weight. Superior longevity (50+ years).', specs: ['Min slope: 4:12', 'Underlayment: 2-layer No. 30 felt', 'Battens: 1×4 horizontal', 'Hip/ridge: mortar-set or mechanically fastened'] },
      { name: 'Flat / Low-Slope (TPO/EPDM)', code: 'IRC R905.12 / NRCA', desc: 'Patio covers, additions, commercial rooftop. TPO heat-welded seams. EPDM vulcanized rubber. Min 1/4:12 slope to drain.', specs: ['TPO: 45-mil or 60-mil', 'EPDM: 60-mil black', 'Seams: heat-welded (TPO) or taped', 'Insulation: 3" polyiso min'] },
    ]
  },
  {
    id: 'hvac',
    icon: '🌡️',
    label: 'HVAC Layouts',
    systems: [
      { name: 'Forced Air (Split System)', code: 'IRC M1401 / ACCA Manual J/D/S', desc: 'Dominant US residential. Gas furnace + AC condenser or heat pump. Manual J load calc required. Duct sizing per Manual D.', specs: ['Blower: 400 CFM/ton typical', 'Supply: 0.1" WC static pressure', 'Return: min 150 sq in / ton', 'Duct leakage: max 4% conditioned'] },
      { name: 'Heat Pump (Air-Source)', code: 'IRC M1401 / AHRI 210/240', desc: 'Standard in mild climates (SE, Pacific NW). Single unit handles heating and cooling. 2024 energy code default in many states. COP 3.0–4.5.', specs: ['Min SEER2: 15.2 (south), 14.3 (north)', 'Min HSPF2: 7.5', 'Auxiliary heat: strip or gas backup', 'Defrost cycle: below 35°F'] },
      { name: 'Mini-Split (Ductless)', code: 'IRC M1401', desc: 'Multi-zone control. No ductwork. Ideal for additions and renovations. Wall mount, ceiling cassette, or concealed air handler.', specs: ['1 outdoor to 4–8 indoor heads', 'Refrigerant line: 3/8" + 5/8"', 'Drain line: 3/4" PVC', 'Linesets: max 100\' without booster'] },
      { name: 'Geothermal (Ground-Source)', code: 'IRC M1401 / IGSHPA', desc: 'Ultra-efficient. COP 4–6. Vertical bores or horizontal loops. High upfront cost, 30% federal tax credit (IRA 2022), 25-yr life.', specs: ['Vertical: 150–250 ft/ton bore', 'Horizontal: 400–600 sq ft/ton', 'Loop: 3/4" or 1" HDPE', 'Antifreeze: propylene glycol 20%'] },
    ]
  },
  {
    id: 'electrical',
    icon: '⚡',
    label: 'Electrical Plans',
    systems: [
      { name: 'Service & Panel', code: 'NEC 2023 Art. 230/240', desc: '200A minimum for new residential. 400A for EV + heat pump + induction. Main breaker, 42-space panel standard. Arc-fault and GFCI requirements.', specs: ['200A min service (new)', 'Panel: 42-space minimum', 'AFCI: all branch circuits (Art. 210.12)', 'GFCI: kitchen/bath/garage/outdoor/basement'] },
      { name: 'Branch Circuits — Kitchen', code: 'NEC Art. 210.11', desc: 'Minimum 2 small appliance circuits at 20A. Dedicated 20A refrigerator circuit. Range: 50A/240V. Dishwasher: 20A/120V dedicated.', specs: ['2× 20A small appliance circuits', '1× 20A refrigerator dedicated', '50A/240V range or oven', '20A dishwasher dedicated'] },
      { name: 'EV Charging Rough-In', code: 'NEC 625 / IRC E3602', desc: '2021 IRC requires EV-ready conduit in new single-family. 50A/240V circuit to garage. Many states mandate Level 2 ready outlet.', specs: ['50A/240V 14-50R outlet', '1" conduit to panel', 'NEMA 14-50 or hardwired EVSE', 'Outdoor GFCI if exposed'] },
      { name: 'Low-Voltage / Smart Home', code: 'NEC Art. 725/800', desc: 'Cat6A structured wiring, coax, security, speakers. Separate low-voltage panel. Conduit sleeves for future upgrades. Ring / Nest pre-wire packages.', specs: ['Cat6A at all rooms (2 ports)', 'Coax at TV locations', '1" conduit sleeves between floors', 'Low-voltage panel in closet'] },
    ]
  },
  {
    id: 'plumbing',
    icon: '🚿',
    label: 'Plumbing Plans',
    systems: [
      { name: 'Water Supply (PEX)', code: 'IRC P2903 / ASTM F876', desc: 'PEX-A or PEX-B replacing copper in new construction. Manifold system for individual shut-offs. Color coded: red hot, blue cold. No solder joints.', specs: ['3/4" main to manifold', '1/2" branch to fixtures', 'PEX-A preferred (crosslinked)', 'Manifold: 10-port min for 3/2 home'] },
      { name: 'DWV (Drain/Waste/Vent)', code: 'IRC P3001', desc: 'ABS or PVC drainage. 3" min stack to water closet. 2" for lavs. Air admittance valves where conventional venting impractical. Slope: 1/4" per foot.', specs: ['4" house sewer to septic/public', '3" stack: WC and washing machine', '2" branch: lav, tub, shower', 'Slope: 1/4" per foot of run'] },
      { name: 'Water Heater — Tankless', code: 'IRC P2801', desc: 'On-demand heating. Gas (199,000 BTU) or electric (240V 80A). Condensing units require PVC flue. Min 3/4" gas line at 7" WC.', specs: ['Gas: 3/4" min gas line', '199,000 BTU max input', 'Condensing: PVC flue 2" or 3"', 'Isolation valves + pressure relief'] },
      { name: 'Irrigation / Outdoor', code: 'IRC P2904 / UPC 603', desc: 'Backflow preventer required at all irrigation connections. Separate zone valve manifold. Rain sensor required in FL and water-restricted states.', specs: ['Backflow: RPZ or dual check', 'Zone valves: 3/4" poly or brass', 'Rain/soil sensor: FL required', 'Max pressure: 150 PSI at meter'] },
    ]
  },
  {
    id: 'permit',
    icon: '📋',
    label: 'Permit Workflow',
    systems: [
      { name: 'Pre-Application Phase', code: 'Local AHJ', desc: 'Zoning check, HOA approval, setback verification, utility locate (811). Title search and deed restrictions. Pre-application meeting with AHJ for complex projects.', specs: ['Zoning: setbacks, height, FAR', 'HOA submission: 30–45 day review', '811 locate: 3 business days min', 'Survey: signed & sealed required'] },
      { name: 'Permit Submission', code: 'IRC R105 / Local AHJ', desc: 'Full permit set: site plan, floor plans, elevations, sections, structural calcs, MEP plans, energy compliance (ResCheck/COMcheck). Digital submission in most jurisdictions.', specs: ['Site plan: FEMA flood zone check', 'Structural: wet stamp PE if required', 'Energy: ResCheck 2021 IECC', 'MEP: mechanical, electrical, plumbing'] },
      { name: 'Plan Review & Corrections', code: 'IRC R105.3', desc: 'Typical 10–21 business day review. Plan check comments (PCCs) issued. One revision cycle included. Second re-check may incur fee.', specs: ['1st review: 10–21 business days', 'Response: 30–90 days to resubmit', 'Redlines: mark-up each comment', 'Expedited plan check: 50–100% fee'] },
      { name: 'Inspection Sequence', code: 'IRC R109', desc: 'Sequential inspections: foundation → framing → rough MEP (mechanical/electrical/plumbing) → insulation → drywall → final. Each must be approved before next phase starts.', specs: ['Foundation: after form, before pour', 'Rough frame: after sheathing, before insulation', 'Rough MEP: before drywall', 'Final: C of O issuance'] },
    ]
  },
]

// ─── Coordination Data ──────────────────────────────────────────
const RFI_LOG = [
  { id:'RFI-001', subject:'Footing depth at grid C-4 per geotech report', discipline:'Structural', from:'GC', to:'EOR', issued:'2026-05-01', due:'2026-05-08', status:'Open', days:18 },
  { id:'RFI-002', subject:'HVAC duct routing alternative — Level 3 corridor 2B', discipline:'MEP', from:'GC', to:'MEC', issued:'2026-05-03', due:'2026-05-10', status:'Answered', days:16 },
  { id:'RFI-003', subject:'Window head height at curtain wall — north facade', discipline:'Architectural', from:'GC', to:'AOR', issued:'2026-05-06', due:'2026-05-13', status:'Open', days:13 },
  { id:'RFI-004', subject:'Fire sprinkler branch line — corridor conflict resolution', discipline:'Fire Protection', from:'Subcontractor', to:'FPE', issued:'2026-05-08', due:'2026-05-15', status:'Pending', days:11 },
  { id:'RFI-005', subject:'Electrical panel location — mechanical room 102 clearance', discipline:'Electrical', from:'GC', to:'EE', issued:'2026-05-10', due:'2026-05-17', status:'Answered', days:9 },
  { id:'RFI-006', subject:'Slab penetration sleeve size at sanitary stack grid A-7', discipline:'Plumbing', from:'Subcontractor', to:'PE', issued:'2026-05-12', due:'2026-05-19', status:'Open', days:7 },
]

const SUBMITTAL_LOG = [
  { id:'SUB-001', spec:'03 30 00', title:'Cast-in-Place Concrete Mix Design', sub:'ABC Ready Mix', submitted:'2026-04-20', reviewed:'2026-04-28', status:'Approved', rev:1 },
  { id:'SUB-002', spec:'05 12 00', title:'Structural Steel Shop Drawings', sub:'Steel Fab Inc', submitted:'2026-04-25', reviewed:'2026-05-05', status:'Approved w/ Comments', rev:2 },
  { id:'SUB-003', spec:'07 21 00', title:'Thermal Insulation — Spray Polyurethane', sub:'Insul-Rite LLC', submitted:'2026-05-02', reviewed:'—', status:'Under Review', rev:1 },
  { id:'SUB-004', spec:'08 11 13', title:'Hollow Metal Doors & Frames', sub:'Ceco Door', submitted:'2026-05-05', reviewed:'—', status:'Under Review', rev:1 },
  { id:'SUB-005', spec:'22 10 00', title:'Plumbing Piping — PEX-A System', sub:'Uponor NA', submitted:'2026-05-08', reviewed:'—', status:'Pending', rev:1 },
  { id:'SUB-006', spec:'26 24 16', title:'Panelboard — Square D 400A', sub:'Graybar Electric', submitted:'2026-04-15', reviewed:'2026-04-22', status:'Approved', rev:1 },
]

const COORD_MATRIX = [
  { discipline:'Architecture', lead:'AOR', model:'ARCH-v3.rvt', lod:'LOD 350', clashes:4, status:'Active' },
  { discipline:'Structural', lead:'EOR', model:'STRUCT-v2.rvt', lod:'LOD 300', clashes:7, status:'Active' },
  { discipline:'Mechanical', lead:'MEC', model:'MECH-v2.rvt', lod:'LOD 300', clashes:12, status:'Active' },
  { discipline:'Plumbing', lead:'PE', model:'PLBG-v1.rvt', lod:'LOD 300', clashes:3, status:'Active' },
  { discipline:'Electrical', lead:'EE', model:'ELEC-v1.rvt', lod:'LOD 200', clashes:1, status:'In Progress' },
  { discipline:'Fire Protection', lead:'FPE', model:'FP-v1.rvt', lod:'LOD 300', clashes:2, status:'Active' },
]

// ─── Quantities Data ─────────────────────────────────────────────
const CSI_TAKEOFF = [
  { div:'03', title:'Concrete', unit:'CY', qty:487, unitCost:285, notes:'3000 PSI slab + footings' },
  { div:'04', title:'Masonry', unit:'SF', qty:3200, unitCost:22, notes:'CMU block exterior — 8" std' },
  { div:'05', title:'Metals / Structural Steel', unit:'TON', qty:48, unitCost:4200, notes:'W-shapes + HSS columns' },
  { div:'06', title:'Wood & Plastics (Rough Framing)', unit:'MBF', qty:124, unitCost:980, notes:'2×6 SPF #2 @ 16" OC' },
  { div:'07', title:'Thermal & Moisture Protection', unit:'SF', qty:8400, unitCost:4.8, notes:'Spray foam R-21 + TPO roof' },
  { div:'08', title:'Openings (Doors / Windows)', unit:'EA', qty:62, unitCost:1450, notes:'Aluminum storefront + hollow metal' },
  { div:'09', title:'Finishes (Drywall / Flooring / Paint)', unit:'SF', qty:22000, unitCost:18, notes:'5/8" GWB, LVT, level 5 finish' },
  { div:'22', title:'Plumbing', unit:'FIX', qty:38, unitCost:2800, notes:'PEX-A supply, PVC DWV, tankless HW' },
  { div:'23', title:'HVAC', unit:'TON', qty:18, unitCost:3600, notes:'Split system + ductwork, Manual J' },
  { div:'26', title:'Electrical', unit:'AMP', qty:400, unitCost:185, notes:'400A service, AFCI, EV-ready, LV' },
  { div:'31', title:'Earthwork / Site', unit:'CY', qty:1200, unitCost:42, notes:'Cut, fill, compact, haul' },
  { div:'32', title:'Exterior Improvements', unit:'SF', qty:6500, unitCost:14, notes:'Concrete walks, asphalt paving' },
]

// ─── Feasibility Data ────────────────────────────────────────────
const FEASIBILITY_MARKETS = [
  { city:'Dallas, TX', type:'Single Family', avgSF:2800, landCost:95000, hardCost:185, softCost:28, salePrice:485000, roi:22.4, capRate:6.8, daysOnMkt:18 },
  { city:'Austin, TX', type:'Single Family', avgSF:2400, landCost:145000, hardCost:210, softCost:32, salePrice:620000, roi:18.6, capRate:5.9, daysOnMkt:22 },
  { city:'Tampa, FL', type:'Single Family', avgSF:2600, landCost:85000, hardCost:195, softCost:29, salePrice:520000, roi:24.1, capRate:7.1, daysOnMkt:15 },
  { city:'Orlando, FL', type:'Single Family', avgSF:2500, landCost:75000, hardCost:188, softCost:27, salePrice:465000, roi:21.8, capRate:6.5, daysOnMkt:20 },
  { city:'Phoenix, AZ', type:'Single Family', avgSF:2700, landCost:90000, hardCost:175, softCost:26, salePrice:490000, roi:25.3, capRate:7.4, daysOnMkt:12 },
  { city:'Charlotte, NC', type:'Single Family', avgSF:2650, landCost:72000, hardCost:168, softCost:24, salePrice:440000, roi:26.8, capRate:7.8, daysOnMkt:14 },
]

const STATUS_BG: Record<string,string> = {
  'Complete':'#EAF3DE','In Review':'#EFF4FF','Pending':'#FFF3E0',
  'Not Started':'#f4f5f7','Open':'#FCEBEB','Resolved':'#EAF3DE','Under Review':'#FFF3E0',
  'In Progress':'#EFF4FF','Overdue':'#FCEBEB','Critical':'#FCEBEB',
  'High':'#FFF3E0','Medium':'#F0EEFF',
}

export default function BimOpsPage() {
  const router = useRouter()
  const [activeModule, setActiveModule] = useState<Module>('dashboard')
  const [projectCtx, setProjectCtx] = useState<{id:string;name:string;code:string}|null>(null)
  const [printData, setPrintData] = useState<{title:string;content:string}|null>(null)

  // Read tab and projectId from URL on mount
  useEffect(() => {
    if (!router.isReady) return
    if (router.query.tab) setActiveModule(router.query.tab as Module)
    const pid = router.query.projectId as string
    if (pid) {
      try {
        const all = JSON.parse(localStorage.getItem('atlas_projects') || '[]')
        const found = all.find((p: {id:string;name:string;code:string}) => p.id === pid)
        if (found) setProjectCtx({ id: found.id, name: found.name, code: found.code })
      } catch {}
    }
  }, [router.isReady, router.query.tab, router.query.projectId])
  const [analyzing, setAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState('')
  const [aiContext, setAiContext] = useState('')
  const [uploadedFile, setUploadedFile] = useState<{name:string,size:string}|null>(null)
  const [uploading, setUploading] = useState(false)
  const [reportRunning, setReportRunning] = useState(false)
  const [reportResult, setReportResult] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  // Vision analysis state
  const [uploadBase64, setUploadBase64] = useState('')
  const [uploadMediaType, setUploadMediaType] = useState('image/jpeg')
  const [uploadIsPDF, setUploadIsPDF] = useState(false)
  const [clashVisionResult, setClashVisionResult] = useState('')
  const [clashVisionLoading, setClashVisionLoading] = useState(false)
  const clashFileRef = useRef<HTMLInputElement>(null)
  const [qtyVisionResult, setQtyVisionResult] = useState('')
  const [qtyVisionLoading, setQtyVisionLoading] = useState(false)
  const qtyFileRef = useRef<HTMLInputElement>(null)

  const criticalClashes = CLASH_DATA.filter(c => c.severity === 'Critical').length
  const openClashes = CLASH_DATA.filter(c => c.status === 'Open').length
  const permitDone = PERMIT_CHECKLIST.filter(p => p.status === 'Complete').length
  const overdueTask = WORKFLOW_TASKS.filter(t => t.status === 'Overdue').length

  async function runAIAnalysis(context: string, prompt: string) {
    setAnalyzing(true); setAiResult(''); setAiContext(context)
    try {
      const res = await fetch('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          model:'claude-sonnet-4-6', max_tokens:1500,
          system:`You are BIMForge AI — the most advanced AI BIM Operations platform for the US construction market. You specialize in:
- BIM clash detection and resolution (Revit, Navisworks, IFC)
- Permit documentation for US jurisdictions (IBC, ADA, NFPA, Title 24, IECC, local codes)
- Construction documentation (CSI MasterFormat, AIA formats)
- BIM coordination workflows (LOD 300-500, COBie, BCF)
- Quality control and issue tracking
- AI-powered construction reporting
Respond in English. Be technically precise, cite US building codes and standards when relevant.`,
          messages:[{ role:'user', content: prompt }]
        })
      })
      const data = await res.json()
      setAiResult(data?.content?.[0]?.text || 'Analysis complete.')
    } catch { setAiResult('Connection error. Please check API configuration.') }
    setAnalyzing(false)
  }

  async function handleBIMUpload(file: File) {
    setUploading(true)
    const isImage = file.type.startsWith('image/')
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

    if (isImage || isPDF) {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const mt = isImage ? (file.type || 'image/jpeg') : 'application/pdf'
      setUploadBase64(base64)
      setUploadMediaType(mt)
      setUploadIsPDF(isPDF)
      setUploadedFile({ name: file.name, size: `${(file.size/1048576).toFixed(1)} MB` })
      setUploading(false)
      setActiveModule('clash')
      setAnalyzing(true); setAiResult(''); setAiContext('BIM Upload Analysis')
      try {
        const res = await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6', max_tokens: 2000,
            system: `You are BIMForge AI — advanced AI BIM Operations platform for US construction. You specialize in clash detection, quantity takeoff, LOD assessment, permit readiness, and COBie compliance. Be technically precise and cite US building codes.`,
            messages: [{ role: 'user', content: [
              { type: isPDF ? 'document' : 'image', source: { type: 'base64', media_type: mt, data: base64 } } as any,
              { type: 'text', text: `Analyze this construction document/drawing: "${file.name}".

Provide a complete BIM analysis:

### MODEL HEALTH
Overall score (0-100) with breakdown by discipline.

### CLASH DETECTION
Identify ALL visible clashes between disciplines (Structural, MEP, Architectural). For each clash: ID, disciplines, severity (Critical/Major/Minor), exact description, location.

### QUANTITY TAKEOFF
Estimate major quantities from the drawing (concrete CY, masonry SF, steel TON, framing LF, roofing SF, MEP rough-in allowance) with unit costs USD.

### LOD ASSESSMENT
Current Level of Development per discipline vs. required LOD 300+.

### PERMIT READINESS
Checklist items complete vs. missing. Critical path blockers.

### IMMEDIATE ACTIONS
Top 5 actions before permit submission.` }
            ]}]
          })
        })
        const data = await res.json()
        setAiResult(data?.content?.[0]?.text || 'Analysis complete — no content returned.')
      } catch { setAiResult('Connection error. Check ANTHROPIC_API_KEY configuration.') }
      setAnalyzing(false)
    } else {
      setUploadedFile({ name: file.name, size: `${(file.size/1048576).toFixed(1)} MB` })
      setUploading(false)
      setActiveModule('clash')
      runAIAnalysis('BIM Upload Analysis',
        `A BIM file was uploaded: "${file.name}" (${(file.size/1048576).toFixed(1)} MB).
For best AI analysis, upload a PDF or image (JPG/PNG) of your floor plan or BIM screenshot.
Provide analysis for a US commercial project: 1) Model Health Score; 2) Clash Detection Summary by discipline; 3) LOD Assessment; 4) IFC Export Readiness; 5) COBie Completeness; 6) Recommended actions before permit submission.`)
    }
  }

  async function generatePermitReport() {
    setReportRunning(true); setReportResult('')
    try {
      const res = await fetch('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          model:'claude-sonnet-4-6', max_tokens:1200,
          system:`You are BIMForge AI — US permit documentation specialist. Generate precise, professional permit submission reports citing IBC, ADA, NFPA, and local codes.`,
          messages:[{ role:'user', content:`Generate an AI Permit Readiness Report for a commercial project:
- ${permitDone}/${PERMIT_CHECKLIST.length} checklist items complete
- ${PERMIT_CHECKLIST.filter(p=>p.status==='In Review').length} items in review
- ${PERMIT_CHECKLIST.filter(p=>p.status==='Pending').length} items pending
- ${PERMIT_CHECKLIST.filter(p=>p.status==='Not Started').length} items not started

Provide: 1) Overall permit readiness score (0-100%); 2) Critical path items blocking submission; 3) Estimated review timeline by department; 4) Common AHJ (Authority Having Jurisdiction) comments to anticipate; 5) Recommended submission strategy.` }]
        })
      })
      const data = await res.json()
      setReportResult(data?.content?.[0]?.text || '')
    } catch { setReportResult('Error generating report.') }
    setReportRunning(false)
  }

  const s = {
    page:   { minHeight:'100vh', background:'#0d1117', fontFamily:"'Geist',system-ui,sans-serif", display:'flex', flexDirection:'column' as const },
    topbar: { background:'#161b22', borderBottom:'1px solid #30363d', padding:'0 24px', height:56,
      display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 },
    sidebar:{ width:220, background:'#161b22', borderRight:'1px solid #30363d', display:'flex',
      flexDirection:'column' as const, padding:'16px 0', flexShrink:0 },
    content:{ flex:1, overflowY:'auto' as const, padding:'24px' },
    card:   { background:'#161b22', border:'1px solid #30363d', borderRadius:12, padding:'18px 20px', marginBottom:14 },
    cardBlue:{ background:'#0d2137', border:'1px solid #185FA5', borderRadius:12, padding:'18px 20px', marginBottom:14 },
    secTit: { fontSize:11, fontWeight:700, color:'#8b93a7', textTransform:'uppercase' as const,
      letterSpacing:'.1em', marginBottom:14 },
    kpi:    { background:'#0d1117', border:'1px solid #30363d', borderRadius:10, padding:'14px 16px' },
    kpiV:   { fontSize:24, fontWeight:700, fontFamily:'monospace', marginBottom:3 },
    kpiL:   { fontSize:10, color:'#8b93a7', fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'.06em' },
    badge:  (status: string) => ({ fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:20,
      background: STATUS_BG[status]||'#f4f5f7', color:STATUS_COLOR[status]||'#8890a0' }),
    navItem:(active:boolean) => ({ display:'flex', alignItems:'center', gap:10, padding:'9px 16px',
      cursor:'pointer', fontSize:13, fontWeight:500, transition:'all .15s', borderRadius:0,
      background: active ? '#185FA520' : 'transparent',
      color: active ? '#58a6ff' : '#8b93a7',
      borderLeft: active ? '2px solid #185FA5' : '2px solid transparent' }),
    btn:    { padding:'9px 20px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8,
      fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' },
    btnGhost:{ padding:'7px 14px', background:'transparent', color:'#58a6ff', border:'1px solid #30363d',
      borderRadius:8, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
    input:  { padding:'9px 12px', background:'#0d1117', border:'1px solid #30363d', borderRadius:8,
      fontSize:13, color:'#e6edf3', outline:'none', fontFamily:'inherit', width:'100%' },
    pre:    { background:'#0d1117', border:'1px solid #30363d', borderRadius:8, padding:'14px 16px',
      fontSize:11, lineHeight:1.8, color:'#e6edf3', whiteSpace:'pre-wrap' as const, fontFamily:'monospace',
      maxHeight:400, overflowY:'auto' as const },
  }

  const NAV = [
    { id:'dashboard', icon:'📊', label:'Executive Dashboard' },
    { id:'upload',       icon:'⬆️', label:'BIM Upload' },
    { id:'coordination', icon:'🤝', label:'Coordenação' },
    { id:'clash',        icon:'⚡', label:'Compatibilização' },
    { id:'quantities',   icon:'📐', label:'Quantitativos' },
    { id:'workflow',     icon:'🏗️', label:'BIM Management' },
    { id:'residential',  icon:'🏠', label:'Construção' },
    { id:'feasibility',  icon:'📊', label:'Viabilidade' },
    { id:'docs',         icon:'📁', label:'Doc. Executiva' },
    { id:'permits',      icon:'📋', label:'Permits' },
    { id:'codes',        icon:'📖', label:'US Codes' },
    { id:'reports',      icon:'📈', label:'AI Reports' },
  ]

  // Coordination
  const [coordTab, setCoordTab] = useState<'rfi'|'submittal'|'matrix'|'meeting'>('rfi')
  const [coordAI, setCoordAI] = useState('')
  const [coordAILoading, setCoordAILoading] = useState(false)
  // Per-project RFIs
  const [projectRFIs, setProjectRFIs] = useState<{id:string;subject:string;discipline:string;status:string;date:string}[]>([])
  const [newRFI, setNewRFI] = useState({ subject:'', discipline:'Architectural' })
  const [showAddRFI, setShowAddRFI] = useState(false)

  useEffect(() => {
    const pid = router.query.projectId as string
    if (!pid) return
    try {
      const stored = JSON.parse(localStorage.getItem(`atlas_bimops_rfis_${pid}`) || '[]')
      setProjectRFIs(stored)
    } catch {}
  }, [router.query.projectId])

  function addProjectRFI() {
    if (!newRFI.subject.trim()) return
    const pid = router.query.projectId as string
    const entry = {
      id: `RFI-P${String(projectRFIs.length + 1).padStart(3,'0')}`,
      subject: newRFI.subject.trim(),
      discipline: newRFI.discipline,
      status: 'Open',
      date: new Date().toLocaleDateString('en-US'),
    }
    const updated = [entry, ...projectRFIs]
    setProjectRFIs(updated)
    if (pid) {
      try { localStorage.setItem(`atlas_bimops_rfis_${pid}`, JSON.stringify(updated)) } catch {}
    }
    setNewRFI({ subject:'', discipline:'Architectural' })
    setShowAddRFI(false)
  }
  // Quantities
  const [qtyAI, setQtyAI] = useState('')
  const [qtyAILoading, setQtyAILoading] = useState(false)
  const [qtyMarkup, setQtyMarkup] = useState(15)
  // Feasibility
  const [feasCity, setFeasCity] = useState('Dallas, TX')
  const [feasSF, setFeasSF] = useState(2800)
  const [feasLand, setFeasLand] = useState(95000)
  const [feasHard, setFeasHard] = useState(185)
  const [feasSoft, setFeasSoft] = useState(28)
  const [feasSale, setFeasSale] = useState(485000)
  const [feasAI, setFeasAI] = useState('')
  const [feasAILoading, setFeasAILoading] = useState(false)
  // Residential
  const [activeResSystem, setActiveResSystem] = useState('foundation')
  const [resQuery, setResQuery] = useState('')
  const [resAI, setResAI] = useState('')
  const [resAILoading, setResAILoading] = useState(false)
  const [activeCode, setActiveCode] = useState('irc')
  const [codeQuery, setCodeQuery] = useState('')
  const [codeAI, setCodeAI] = useState('')
  const [codeAILoading, setCodeAILoading] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string|null>(null)

  async function askCodeAI(query: string, codeId: string) {
    if (!query.trim()) return
    setCodeAILoading(true); setCodeAI('')
    const code = US_CODES.find(c => c.id === codeId)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6', max_tokens: 1200,
          system: `You are a US building code expert specializing in ${code?.full} (${code?.name}). You have deep knowledge of all US building codes: IRC, IBC, NEC/NFPA 70, and the Florida Building Code. Provide precise, actionable answers citing specific code sections. Always mention when local amendments may apply.`,
          messages: [{ role: 'user', content: `Code: ${code?.full} (${code?.name})\n\nQuestion: ${query}\n\nProvide a precise answer citing specific sections. Include practical application notes for construction professionals.` }]
        })
      })
      const data = await res.json()
      setCodeAI(data?.content?.[0]?.text || 'Response complete.')
    } catch { setCodeAI('Connection error. Please check API configuration.') }
    setCodeAILoading(false)
  }

  async function generateCodeChecklist(codeId: string, discipline: string) {
    setCodeAILoading(true); setCodeAI('')
    const code = US_CODES.find(c => c.id === codeId)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6', max_tokens: 1500,
          system: `You are a US building code compliance expert. Generate precise, field-ready compliance checklists for construction professionals.`,
          messages: [{ role: 'user', content: `Generate a compliance checklist for ${discipline} under ${code?.full} (${code?.name}). Format as a numbered checklist with: section reference, requirement, pass/fail criteria. Focus on the most common compliance failures and inspector questions. Include 15-20 items.` }]
        })
      })
      const data = await res.json()
      setCodeAI(data?.content?.[0]?.text || '')
    } catch { setCodeAI('Error generating checklist.') }
    setCodeAILoading(false)
  }

  return (
    <>
      <Head><title>BIMForge AI — US Construction Intelligence Platform</title></Head>
      <div style={s.page}>

        {/* Topbar */}
        <div style={s.topbar}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <button onClick={() => router.back()}
              style={{ background:'none', border:'none', cursor:'pointer', color:'#8b93a7', fontSize:18 }}>←</button>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#185FA5,#534AB7)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>⚡</div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:'#e6edf3' }}>BIMForge AI</div>
                <div style={{ fontSize:10, color:'#8b93a7' }}>AI BIM Operations Platform · US Market</div>
              </div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {projectCtx && (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 12px',
                borderRadius:20, background:'#185FA520', border:'1px solid #185FA5' }}>
                <span style={{ fontSize:10, color:'#58a6ff' }}>📁</span>
                <span style={{ fontSize:11, color:'#58a6ff', fontWeight:600 }}>{projectCtx.code}</span>
                <span style={{ fontSize:11, color:'#8b93a7' }}>{projectCtx.name}</span>
                <button onClick={() => router.push(`/projeto/${projectCtx.id}`)}
                  style={{ fontSize:10, color:'#58a6ff', background:'none', border:'none',
                    cursor:'pointer', padding:0, textDecoration:'underline' }}>← Projeto</button>
              </div>
            )}
            <div style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:'#185FA520',
              color:'#58a6ff', fontWeight:600, border:'1px solid #185FA5' }}>CORE NUCLEUS · v1.0</div>
            <div style={{ fontSize:10, color:'#8b93a7' }}>Claude AI · claude-sonnet-4-6</div>
          </div>
        </div>

        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
          {/* Sidebar */}
          <div style={s.sidebar}>
            <div style={{ padding:'0 16px 12px', fontSize:10, color:'#8b93a7', fontWeight:700,
              textTransform:'uppercase' as const, letterSpacing:'.1em' }}>Core Nucleus</div>
            {NAV.map(n => (
              <div key={n.id} style={s.navItem(activeModule===n.id)}
                onClick={() => { setActiveModule(n.id as Module); setAiResult('') }}>
                <span style={{ fontSize:15 }}>{n.icon}</span>
                <span>{n.label}</span>
              </div>
            ))}
            <div style={{ marginTop:'auto', padding:'16px', borderTop:'1px solid #30363d' }}>
              <div style={{ fontSize:10, color:'#8b93a7', marginBottom:8, fontWeight:700,
                textTransform:'uppercase' as const, letterSpacing:'.08em' }}>Advanced Nucleus</div>
              {['ESG Advanced','IoT Full','Digital Twin','RL Optimization','Monte Carlo'].map(f => (
                <div key={f} style={{ fontSize:11, color:'#8b93a7', padding:'4px 0',
                  display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ color:'#30363d' }}>🔒</span> {f}
                </div>
              ))}
              <div style={{ marginTop:8, fontSize:10, padding:'5px 10px', borderRadius:6,
                background:'#30363d', color:'#8b93a7', textAlign:'center' as const }}>Coming Q3 2026</div>
            </div>
          </div>

          {/* Main Content */}
          <div style={s.content}>

            {/* ── DASHBOARD ── */}
            {activeModule === 'dashboard' && (
              <>
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:20, fontWeight:700, color:'#e6edf3', marginBottom:4 }}>
                    Executive Dashboard
                  </div>
                  <div style={{ fontSize:12, color:'#8b93a7' }}>
                    AI-powered overview · Commercial Project · San Francisco, CA
                  </div>
                </div>

                {/* KPIs */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
                  {[
                    { v:String(openClashes), l:'Open Clashes', c:'#A32D2D', icon:'⚡' },
                    { v:`${criticalClashes}`, l:'Critical Issues', c:'#BA7517', icon:'🔴' },
                    { v:`${permitDone}/${PERMIT_CHECKLIST.length}`, l:'Permit Items Done', c:'#3B6D11', icon:'📋' },
                    { v:`${overdueTask}`, l:'Overdue Tasks', c:'#A32D2D', icon:'⏰' },
                  ].map(k => (
                    <div key={k.l} style={s.kpi}>
                      <div style={{ fontSize:13, marginBottom:4 }}>{k.icon}</div>
                      <div style={{ ...s.kpiV, color:k.c }}>{k.v}</div>
                      <div style={s.kpiL}>{k.l}</div>
                    </div>
                  ))}
                </div>

                {/* Market Roles */}
                <div style={s.card}>
                  <div style={s.secTit}>🇺🇸 US Market Demand — Key Roles</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                    {MARKET_ROLES.map(r => (
                      <div key={r.role} style={{ background:'#0d1117', border:'1px solid #30363d',
                        borderRadius:8, padding:'10px 12px' }}>
                        <div style={{ fontSize:16, marginBottom:4 }}>{r.icon}</div>
                        <div style={{ fontSize:11, fontWeight:600, color:'#e6edf3', marginBottom:3 }}>{r.role}</div>
                        <div style={{ fontSize:11, color:'#3B6D11', fontWeight:700, marginBottom:2 }}>{r.rate}</div>
                        <div style={{ fontSize:9, color: r.demand.includes('Very') ? '#58a6ff' : r.demand.includes('High') ? '#3B6D11' : '#BA7517',
                          fontWeight:600 }}>{r.demand}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Intelligence */}
                <div style={s.cardBlue}>
                  <div style={s.secTit}>🤖 BIMForge AI Intelligence</div>
                  {!aiResult && !analyzing && (
                    <div style={{ textAlign:'center' as const, padding:'20px 0' }}>
                      <div style={{ fontSize:36, marginBottom:12 }}>⚡</div>
                      <div style={{ fontSize:14, fontWeight:600, color:'#e6edf3', marginBottom:8 }}>
                        Run AI Project Intelligence
                      </div>
                      <div style={{ fontSize:12, color:'#8b93a7', marginBottom:20, maxWidth:420, margin:'0 auto 20px' }}>
                        BIMForge AI analyzes your entire project — clashes, permits, schedule, cost, and compliance risks — in seconds.
                      </div>
                      <button style={s.btn} onClick={() => runAIAnalysis('dashboard',
                        `Perform a comprehensive AI project intelligence analysis for a US commercial construction project in San Francisco, CA:
- ${openClashes} open BIM clashes (${criticalClashes} critical)
- Permit progress: ${permitDone}/${PERMIT_CHECKLIST.length} items complete
- ${overdueTask} overdue workflow tasks
- Budget: $12.4M | Schedule: 18 months | Phase: Construction Documents (50% CD)

Provide executive-level analysis with: 1) Overall Project Health Score (0-100); 2) Top 3 risks requiring immediate action; 3) Permit timeline forecast; 4) Clash resolution priority matrix; 5) Budget risk assessment; 6) Next 30-day action plan. Reference IBC 2021, ADA, NFPA 72 where applicable.`)}>
                        ▶ Run AI Analysis
                      </button>
                    </div>
                  )}
                  {analyzing && aiContext === 'dashboard' && (
                    <div style={{ display:'flex', flexDirection:'column' as const, alignItems:'center', padding:'30px 0', gap:12 }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid #185FA5',
                        borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }} />
                      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                      <div style={{ fontSize:13, color:'#58a6ff' }}>BIMForge AI analyzing project...</div>
                    </div>
                  )}
                  {aiResult && aiContext === 'dashboard' && (
                    <>
                      <div style={s.pre}>{aiResult}</div>
                      <button onClick={() => setPrintData({ title:'BIMForge AI — Executive Dashboard Report', content: aiResult })}
                        style={{ marginTop:10, padding:'7px 16px', background:'#185FA520', border:'1px solid #185FA540', borderRadius:7, color:'#58a6ff', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                        🖨️ Imprimir / Compartilhar
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

            {/* ── BIM UPLOAD ── */}
            {activeModule === 'upload' && (
              <>
                <div style={{ fontSize:20, fontWeight:700, color:'#e6edf3', marginBottom:16 }}>
                  ⬆️ BIM Upload & Analysis
                </div>
                <div style={s.card}>
                  <div style={s.secTit}>Upload BIM / CAD Files</div>
                  <div style={{ border:'2px dashed #30363d', borderRadius:12, padding:'40px 24px',
                    textAlign:'center' as const, cursor:'pointer', transition:'all .2s',
                    background: uploading ? '#0d2137' : '#0d1117' }}
                    onClick={() => fileRef.current?.click()}>
                    <div style={{ fontSize:48, marginBottom:12 }}>
                      {uploading ? '⏳' : uploadedFile ? '✅' : '📤'}
                    </div>
                    <div style={{ fontSize:16, fontWeight:600, color:'#e6edf3', marginBottom:8 }}>
                      {uploading ? 'Processing BIM file...'
                        : uploadedFile ? `✅ ${uploadedFile.name} uploaded`
                        : 'Drop BIM / CAD file here or click to select'}
                    </div>
                    <div style={{ fontSize:12, color:'#8b93a7', marginBottom:14 }}>
                      Revit (.rvt) · IFC · NWD/NWC · DWG · DXF · FBX · OBJ
                    </div>
                    <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap' as const }}>
                      {['Revit','IFC','Navisworks','AutoCAD','Rhino','SketchUp'].map(f => (
                        <span key={f} style={{ fontSize:10, padding:'3px 10px', borderRadius:20,
                          background:'#185FA520', color:'#58a6ff', fontWeight:600, border:'1px solid #185FA540' }}>
                          {f}
                        </span>
                      ))}
                    </div>
                    <input ref={fileRef} type="file" style={{ display:'none' }}
                      accept=".rvt,.ifc,.nwd,.nwc,.dwg,.dxf,.fbx,.obj,.stl,.step,.pdf,image/*"
                      onChange={e => { const f = e.target.files?.[0]; if(f) handleBIMUpload(f) }} />
                  </div>

                  {uploadedFile && !uploading && (
                    <div style={{ marginTop:12, padding:'12px 16px', background:'#0d2137',
                      border:'1px solid #185FA5', borderRadius:8, display:'flex',
                      alignItems:'center', justifyContent:'space-between' }}>
                      <div>
                        <div style={{ fontSize:12, fontWeight:600, color:'#58a6ff' }}>{uploadedFile.name}</div>
                        <div style={{ fontSize:11, color:'#8b93a7' }}>{uploadedFile.size} · AI analysis running →</div>
                      </div>
                      <button style={s.btn} onClick={() => setActiveModule('clash')}>View Analysis →</button>
                    </div>
                  )}
                </div>

                {/* BIM Intelligence explainer */}
                <div style={s.card}>
                  <div style={s.secTit}>What BIMForge AI Analyzes</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    {[
                      { icon:'⚡', title:'Clash Detection', desc:'Automated hard, soft and workflow clash detection across all disciplines (Arch, Struct, MEP)' },
                      { icon:'📐', title:'LOD Validation', desc:'Validates Level of Development 200–500 compliance per AIA E203 and BIM execution plan' },
                      { icon:'📋', title:'Permit Readiness', desc:'Checks completeness against IBC, ADA, local amendments for AHJ submission' },
                      { icon:'🔗', title:'COBie Export', desc:'Auto-generates Construction Operations Building information exchange for owner handover' },
                      { icon:'📊', title:'4D Schedule Link', desc:'Links BIM elements to CPM schedule for 4D simulation and milestone tracking' },
                      { icon:'💰', title:'5D Cost Link', desc:'Connects model quantities to estimating for real-time budget tracking' },
                    ].map(f => (
                      <div key={f.title} style={{ display:'flex', gap:12, padding:'12px',
                        background:'#0d1117', borderRadius:8, border:'1px solid #30363d' }}>
                        <div style={{ fontSize:22, flexShrink:0 }}>{f.icon}</div>
                        <div>
                          <div style={{ fontSize:12, fontWeight:600, color:'#e6edf3', marginBottom:3 }}>{f.title}</div>
                          <div style={{ fontSize:11, color:'#8b93a7', lineHeight:1.4 }}>{f.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {aiResult && aiContext === 'BIM Upload Analysis' && (
                  <div style={s.card}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                      <div style={s.secTit}>🤖 AI Model Analysis Result</div>
                      <button onClick={() => setPrintData({ title:`BIM Analysis — ${uploadedFile?.name ?? 'Model'}`, content: aiResult })}
                        style={{ padding:'5px 12px', background:'#185FA520', border:'1px solid #185FA540', borderRadius:7, color:'#58a6ff', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                        🖨️ Imprimir / Compartilhar
                      </button>
                    </div>
                    <div style={s.pre}>{aiResult}</div>
                  </div>
                )}
              </>
            )}

            {/* ── CLASH DETECTION ── */}
            {activeModule === 'clash' && (
              <>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:20, fontWeight:700, color:'#e6edf3', marginBottom:2 }}>⚡ Clash Detection</div>
                    <div style={{ fontSize:12, color:'#8b93a7' }}>{CLASH_DATA.length} clashes detected · AI-powered resolution guidance</div>
                  </div>
                  <button style={s.btn} onClick={() => runAIAnalysis('clash',
                    `Analyze these BIM clashes for a US commercial project and provide: 1) Priority resolution matrix ranked by impact and cost-to-fix; 2) Specific RFI language for each critical clash; 3) Coordination meeting agenda; 4) Estimated resolution cost per clash; 5) BCF issue markup recommendations. Clashes: ${CLASH_DATA.map(c=>`${c.id}: ${c.severity} — ${c.description} at ${c.location}`).join('; ')}`)}>
                    🤖 AI Clash Analysis
                  </button>
                </div>

                {/* Real Vision Analysis Panel */}
                <div style={{ background:'#0d2137', border:'1px solid #185FA5', borderRadius:10, padding:'14px 16px', marginBottom:14 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#58a6ff', marginBottom:8, textTransform:'uppercase' as const, letterSpacing:'.08em' }}>
                    🔍 Analyze Real Drawing / BIM Screenshot
                  </div>
                  <div style={{ fontSize:11, color:'#8b93a7', marginBottom:10 }}>
                    Upload a floor plan image or PDF — Claude Vision detects real clashes, conflicts and code violations.
                  </div>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <button style={{ ...s.btn, background:'#238636' }} onClick={() => clashFileRef.current?.click()}>
                      📁 Upload Floor Plan / BIM Image
                    </button>
                    <input ref={clashFileRef} type="file" style={{ display:'none' }}
                      accept="image/*,.pdf"
                      onChange={async e => {
                        const f = e.target.files?.[0]; if (!f) return
                        if (clashFileRef.current) clashFileRef.current.value = ''
                        setClashVisionLoading(true); setClashVisionResult('')
                        const isImage = f.type.startsWith('image/')
                        const isPDF = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
                        const base64 = await new Promise<string>((resolve, reject) => {
                          const reader = new FileReader()
                          reader.onload = () => resolve((reader.result as string).split(',')[1])
                          reader.onerror = reject; reader.readAsDataURL(f)
                        })
                        const mt = isImage ? (f.type || 'image/jpeg') : 'application/pdf'
                        try {
                          const res = await fetch('/api/chat', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              model: 'claude-sonnet-4-6', max_tokens: 2000,
                              system: `You are BIMForge AI — expert BIM clash detection specialist. Analyze construction drawings with precision, citing US building codes (IBC, NFPA, ADA, NEC).`,
                              messages: [{ role: 'user', content: [
                                { type: isPDF ? 'document' : 'image', source: { type: 'base64', media_type: mt, data: base64 } } as any,
                                { type: 'text', text: `Perform detailed clash detection analysis on this drawing "${f.name}".

For each clash found:
- **ID**: CLH-XXX
- **Disciplines**: (e.g., MEP vs Structural)
- **Severity**: Critical / Major / Minor
- **Description**: Exact conflict description with dimensions if visible
- **Location**: Grid reference or room name
- **Code Reference**: Applicable IBC/NFPA/ADA section
- **Resolution**: Recommended fix

Also provide:
### SUMMARY
Total clashes by severity and discipline pair.

### PRIORITY MATRIX
Ranked list of clashes by urgency and cost impact.

### COORDINATION NOTES
Items requiring immediate RFI or design team coordination.` }
                              ]}]
                            })
                          })
                          const data = await res.json()
                          setClashVisionResult(data?.content?.[0]?.text || 'No analysis returned.')
                        } catch { setClashVisionResult('Connection error. Check ANTHROPIC_API_KEY.') }
                        setClashVisionLoading(false)
                      }} />
                    {clashVisionLoading && <span style={{ fontSize:12, color:'#58a6ff' }}>⏳ Claude Vision analyzing...</span>}
                  </div>
                  {clashVisionResult && !clashVisionLoading && (
                    <>
                      <div style={{ ...s.pre, marginTop:12, maxHeight:500 }}>{clashVisionResult}</div>
                      <button onClick={() => setPrintData({ title:'BIMForge AI — Real Clash Detection Report', content: clashVisionResult })}
                        style={{ marginTop:8, padding:'5px 12px', background:'#185FA520', border:'1px solid #185FA540', borderRadius:7, color:'#58a6ff', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                        🖨️ Imprimir / Compartilhar
                      </button>
                    </>
                  )}
                </div>

                {/* Clash summary */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
                  {(['Critical','Major','Minor'] as const).map(sev => {
                    const cnt = CLASH_DATA.filter(c=>c.severity===sev).length
                    return (
                      <div key={sev} style={{ ...s.kpi, borderLeft:`3px solid ${SEV_COLOR[sev]}` }}>
                        <div style={{ ...s.kpiV, color:SEV_COLOR[sev] }}>{cnt}</div>
                        <div style={s.kpiL}>{sev} Clashes</div>
                      </div>
                    )
                  })}
                </div>

                {/* Clash list */}
                <div style={s.card}>
                  <div style={s.secTit}>Clash Report</div>
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:8 }}>
                    {CLASH_DATA.map(cl => (
                      <div key={cl.id} style={{ background:'#0d1117', border:`1px solid ${SEV_COLOR[cl.severity]}33`,
                        borderLeft:`3px solid ${SEV_COLOR[cl.severity]}`, borderRadius:8, padding:'12px 14px' }}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:6 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <span style={{ fontSize:10, fontFamily:'monospace', color:'#8b93a7' }}>{cl.id}</span>
                            <span style={s.badge(cl.severity)}>{cl.severity}</span>
                            <span style={{ fontSize:10, fontWeight:600, color:'#58a6ff' }}>{cl.discipline}</span>
                          </div>
                          <span style={s.badge(cl.status)}>{cl.status}</span>
                        </div>
                        <div style={{ fontSize:12, color:'#e6edf3', marginBottom:4, lineHeight:1.5 }}>{cl.description}</div>
                        <div style={{ fontSize:11, color:'#8b93a7' }}>📍 {cl.location}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {analyzing && aiContext === 'clash' && (
                  <div style={{ ...s.card, textAlign:'center' as const, padding:'30px' }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid #185FA5',
                      borderTopColor:'transparent', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
                    <div style={{ fontSize:13, color:'#58a6ff' }}>AI analyzing clash report...</div>
                  </div>
                )}
                {aiResult && aiContext === 'clash' && (
                  <div style={s.card}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                      <div style={s.secTit}>🤖 AI Clash Analysis & Resolution</div>
                      <button onClick={() => setPrintData({ title:'AI Clash Analysis & Resolution Report', content: aiResult })}
                        style={{ padding:'5px 12px', background:'#185FA520', border:'1px solid #185FA540', borderRadius:7, color:'#58a6ff', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                        🖨️ Imprimir / Compartilhar
                      </button>
                    </div>
                    <div style={s.pre}>{aiResult}</div>
                  </div>
                )}
              </>
            )}

            {/* ── PERMITS ── */}
            {activeModule === 'permits' && (
              <>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:20, fontWeight:700, color:'#e6edf3', marginBottom:2 }}>📋 Permit Documentation</div>
                    <div style={{ fontSize:12, color:'#8b93a7' }}>AHJ Submission Tracker · San Francisco Building Dept.</div>
                  </div>
                  <button style={s.btn} onClick={generatePermitReport} disabled={reportRunning}>
                    {reportRunning ? '⏳ Generating...' : '🤖 AI Permit Report'}
                  </button>
                </div>

                {/* Progress bar */}
                <div style={s.card}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:12, color:'#e6edf3' }}>
                    <span style={{ fontWeight:600 }}>Overall Permit Readiness</span>
                    <span style={{ color:'#3B6D11', fontWeight:700 }}>{Math.round((permitDone/PERMIT_CHECKLIST.length)*100)}%</span>
                  </div>
                  <div style={{ height:8, background:'#30363d', borderRadius:4, overflow:'hidden', marginBottom:14 }}>
                    <div style={{ width:`${(permitDone/PERMIT_CHECKLIST.length)*100}%`, height:'100%',
                      background:'linear-gradient(90deg,#3B6D11,#97C459)', borderRadius:4, transition:'width .5s' }} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                    {[
                      { l:'Complete', v:permitDone, c:'#3B6D11' },
                      { l:'In Review', v:PERMIT_CHECKLIST.filter(p=>p.status==='In Review').length, c:'#185FA5' },
                      { l:'Pending', v:PERMIT_CHECKLIST.filter(p=>p.status==='Pending').length, c:'#BA7517' },
                      { l:'Not Started', v:PERMIT_CHECKLIST.filter(p=>p.status==='Not Started').length, c:'#8890a0' },
                    ].map(k => (
                      <div key={k.l} style={{ textAlign:'center' as const, padding:'8px',
                        background:'#0d1117', borderRadius:8, border:'1px solid #30363d' }}>
                        <div style={{ fontSize:20, fontWeight:700, color:k.c }}>{k.v}</div>
                        <div style={{ fontSize:9, color:'#8b93a7', fontWeight:600 }}>{k.l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Checklist */}
                <div style={s.card}>
                  <div style={s.secTit}>Permit Submittal Checklist</div>
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:6 }}>
                    {PERMIT_CHECKLIST.map(p => (
                      <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12,
                        padding:'10px 12px', background:'#0d1117', borderRadius:8, border:'1px solid #30363d' }}>
                        <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0,
                          background: p.status==='Complete'?'#3B6D11':p.status==='In Review'?'#185FA5':'#30363d',
                          display:'flex', alignItems:'center', justifyContent:'center', fontSize:10 }}>
                          {p.status==='Complete'?'✓':p.status==='In Review'?'→':''}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:12, fontWeight:500, color:'#e6edf3' }}>{p.label}</div>
                          <div style={{ fontSize:10, color:'#8b93a7', marginTop:2 }}>{p.reviewer}</div>
                        </div>
                        <span style={s.badge(p.status)}>{p.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {reportResult && (
                  <div style={s.card}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                      <div style={s.secTit}>🤖 AI Permit Readiness Report</div>
                      <button onClick={() => setPrintData({ title:'AI Permit Readiness Report', content: reportResult })}
                        style={{ padding:'5px 12px', background:'#185FA520', border:'1px solid #185FA540', borderRadius:7, color:'#58a6ff', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                        🖨️ Imprimir / Compartilhar
                      </button>
                    </div>
                    <div style={s.pre}>{reportResult}</div>
                  </div>
                )}
              </>
            )}

            {/* ── US BUILDING CODES ── */}
            {activeModule === 'codes' && (
              <>
                <div style={{ fontSize:20, fontWeight:700, color:'#e6edf3', marginBottom:4 }}>📖 US Building Codes</div>
                <div style={{ fontSize:12, color:'#8b93a7', marginBottom:20 }}>IRC · IBC · NEC (NFPA 70) · Florida Building Code — reference + AI compliance assistant</div>

                {/* Code selector tabs */}
                <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' as const }}>
                  {US_CODES.map(code => (
                    <button key={code.id} onClick={() => { setActiveCode(code.id); setCodeAI(''); setExpandedSection(null) }}
                      style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 16px',
                        background: activeCode === code.id ? code.color : '#161b22',
                        color: activeCode === code.id ? '#fff' : '#8b93a7',
                        border: `1px solid ${activeCode === code.id ? code.color : '#30363d'}`,
                        borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all .15s' }}>
                      <span>{code.icon}</span>
                      <span>{code.name}</span>
                    </button>
                  ))}
                </div>

                {US_CODES.filter(c => c.id === activeCode).map(code => (
                  <div key={code.id}>
                    {/* Code header */}
                    <div style={{ background:`${code.color}18`, border:`1px solid ${code.color}44`, borderRadius:12, padding:'16px 20px', marginBottom:16 }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap' as const, gap:12 }}>
                        <div>
                          <div style={{ fontSize:22, fontWeight:800, color:code.color, marginBottom:4 }}>
                            {code.icon} {code.full}
                          </div>
                          <div style={{ fontSize:12, color:'#8b93a7', marginBottom:6 }}>
                            <strong style={{ color:'#e6edf3' }}>Scope:</strong> {code.scope}
                          </div>
                          <div style={{ fontSize:11, color:'#8b93a7' }}>
                            <strong style={{ color:'#e6edf3' }}>Adopted by:</strong> {code.adoptedBy}
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                          {['Structural','Electrical','Plumbing','HVAC'].map(disc => (
                            <button key={disc} onClick={() => generateCodeChecklist(code.id, disc)}
                              style={{ padding:'6px 12px', background:'#0d1117', border:`1px solid ${code.color}66`, borderRadius:6,
                                color:code.color, fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                              ✓ {disc} Checklist
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* AI Q&A */}
                    <div style={{ ...s.card, marginBottom:16 }}>
                      <div style={{ ...s.secTit, color:code.color }}>🤖 Ask {code.name} AI</div>
                      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                        <input
                          style={s.input}
                          placeholder={`Ask anything about ${code.name}… e.g. "What is the min. egress window size?" or "GFCI requirements for kitchen"`}
                          value={codeQuery}
                          onChange={e => setCodeQuery(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && askCodeAI(codeQuery, code.id)}
                        />
                        <button style={{ ...s.btn, background:code.color, whiteSpace:'nowrap' as const, flexShrink:0 }}
                          onClick={() => askCodeAI(codeQuery, code.id)} disabled={codeAILoading || !codeQuery.trim()}>
                          {codeAILoading ? '⏳' : '→ Ask'}
                        </button>
                      </div>
                      {/* Quick questions */}
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' as const }}>
                        {(code.id === 'irc' ? [
                          'Min. egress window size bedroom',
                          'Smoke detector requirements',
                          'Stair riser/tread dimensions',
                          'Attic ventilation ratio',
                          'Deck ledger connection',
                        ] : code.id === 'ibc' ? [
                          'Occupancy load calculation',
                          'Exit width requirements',
                          'Travel distance to exit',
                          'Sprinkler requirement thresholds',
                          'Type V-B max height and area',
                        ] : code.id === 'nec' ? [
                          'GFCI locations in dwelling',
                          'AFCI requirements 2023',
                          'Panel working clearance 110.26',
                          'EV charger circuit requirements',
                          'Solar PV disconnecting means',
                        ] : [
                          'HVHZ product approval process',
                          'Impact glazing requirements',
                          'Wind speed South Florida',
                          'Duct leakage test requirement',
                          'Blower door test requirement',
                        ]).map(q => (
                          <button key={q} onClick={() => { setCodeQuery(q); askCodeAI(q, code.id) }}
                            style={{ padding:'4px 10px', background:'#0d1117', border:'1px solid #30363d', borderRadius:20,
                              fontSize:10, color:'#8b93a7', cursor:'pointer', fontFamily:'inherit', transition:'border-color .15s' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = code.color}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#30363d'}>
                            {q}
                          </button>
                        ))}
                      </div>

                      {codeAILoading && (
                        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'16px 0', color:'#58a6ff', fontSize:13 }}>
                          <div style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${code.color}`,
                            borderTopColor:'transparent', animation:'spin 0.8s linear infinite', flexShrink:0 }} />
                          Consulting {code.name}…
                        </div>
                      )}
                      {codeAI && !codeAILoading && (
                        <>
                          <div style={{ ...s.pre, marginTop:12, borderLeft:`3px solid ${code.color}` }}>{codeAI}</div>
                          <button onClick={() => setPrintData({ title:`${code.name} — AI Code Reference`, content: codeAI })}
                            style={{ marginTop:8, padding:'5px 12px', background:'#185FA520', border:'1px solid #185FA540', borderRadius:7, color:'#58a6ff', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                            🖨️ Imprimir / Compartilhar
                          </button>
                        </>
                      )}
                    </div>

                    {/* Code sections reference */}
                    <div style={s.card}>
                      <div style={s.secTit}>📋 Key Code Sections — {code.name}</div>
                      <div style={{ display:'flex', flexDirection:'column' as const, gap:6 }}>
                        {code.chapters.map((ch, i) => (
                          <div key={i}
                            onClick={() => setExpandedSection(expandedSection === `${code.id}-${i}` ? null : `${code.id}-${i}`)}
                            style={{ background:'#0d1117', border:`1px solid ${expandedSection === `${code.id}-${i}` ? code.color+'66' : '#30363d'}`,
                              borderLeft:`3px solid ${expandedSection === `${code.id}-${i}` ? code.color : '#30363d'}`,
                              borderRadius:8, padding:'10px 14px', cursor:'pointer', transition:'all .15s' }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                <span style={{ fontSize:10, fontFamily:'monospace', color:code.color, fontWeight:700,
                                  background:`${code.color}18`, padding:'2px 8px', borderRadius:4, flexShrink:0 }}>{ch.ref}</span>
                                <span style={{ fontSize:12, fontWeight:600, color:'#e6edf3' }}>{ch.title}</span>
                              </div>
                              <span style={{ fontSize:11, color:'#8b93a7' }}>{expandedSection === `${code.id}-${i}` ? '▲' : '▼'}</span>
                            </div>
                            {expandedSection === `${code.id}-${i}` && (
                              <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid #30363d' }}>
                                <div style={{ fontSize:12, color:'#cac4d0', lineHeight:1.7, marginBottom:10 }}>{ch.desc}</div>
                                <button onClick={e => { e.stopPropagation(); askCodeAI(`Explain ${ch.ref} — ${ch.title} in practical terms with examples and common mistakes to avoid.`, code.id) }}
                                  style={{ ...s.btnGhost, fontSize:10, borderColor:`${code.color}44`, color:code.color }}>
                                  🤖 AI Explain This Section
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* ── RESIDENTIAL SYSTEMS ── */}
            {activeModule === 'residential' && (
              <>
                <div style={{ fontSize:20, fontWeight:700, color:'#e6edf3', marginBottom:4 }}>🏠 Residential Construction Systems</div>
                <div style={{ fontSize:12, color:'#8b93a7', marginBottom:16 }}>US residential construction types, specs, and code references — wood framing · drywall · roofing · HVAC · electrical · plumbing · permit workflow · foundation</div>

                {/* System selector tabs */}
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' as const, marginBottom:18 }}>
                  {RESIDENTIAL_SYSTEMS.map(sys => (
                    <button key={sys.id} onClick={() => { setActiveResSystem(sys.id); setResAI('') }}
                      style={{ padding:'8px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer',
                        background: activeResSystem === sys.id ? '#238636' : '#161b22',
                        color: activeResSystem === sys.id ? '#fff' : '#8b93a7',
                        border: `1px solid ${activeResSystem === sys.id ? '#238636' : '#30363d'}` }}>
                      {sys.icon} {sys.label}
                    </button>
                  ))}
                </div>

                {/* Active system detail */}
                {RESIDENTIAL_SYSTEMS.filter(rs => rs.id === activeResSystem).map(sys => (
                  <div key={sys.id}>
                    {/* System cards */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:18 }}>
                      {sys.systems.map(item => (
                        <div key={item.name} style={{ background:'#161b22', border:'1px solid #30363d', borderRadius:10, padding:16 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                            <div style={{ fontSize:13, fontWeight:700, color:'#e6edf3' }}>{item.name}</div>
                            <span style={{ fontSize:10, background:'#0d1117', border:'1px solid #30363d',
                              color:'#58a6ff', padding:'2px 7px', borderRadius:10, whiteSpace:'nowrap' as const }}>
                              {item.code}
                            </span>
                          </div>
                          <div style={{ fontSize:11, color:'#8b93a7', lineHeight:1.5, marginBottom:10 }}>{item.desc}</div>
                          <div style={{ fontSize:11, color:'#3fb950', fontWeight:600, marginBottom:5 }}>Key Specs:</div>
                          {item.specs.map(spec => (
                            <div key={spec} style={{ fontSize:11, color:'#c9d1d9', padding:'3px 0',
                              borderBottom:'1px solid #21262d', display:'flex', gap:6 }}>
                              <span style={{ color:'#238636' }}>▸</span> {spec}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* AI Q&A for this system */}
                    <div style={{ background:'#161b22', border:'1px solid #30363d', borderRadius:10, padding:16 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#e6edf3', marginBottom:10 }}>
                        🤖 AI Assistant — {sys.icon} {sys.label}
                      </div>
                      <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                        <input value={resQuery} onChange={e => setResQuery(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && resQuery && (async () => {
                            setResAILoading(true)
                            const q = resQuery; setResQuery('')
                            const r = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'},
                              body: JSON.stringify({ messages:[{ role:'user', content:`You are a US residential construction expert. System: ${sys.label}. Question: ${q}. Provide practical answer with code refs (IRC/NEC/local), typical specs, cost range, and common mistakes. Be concise.` }] }) })
                            const d = await r.json()
                            setResAI(d.content?.[0]?.text || d.error || 'No response')
                            setResAILoading(false)
                          })()}
                          placeholder={`Ask about ${sys.label}...`}
                          style={{ flex:1, background:'#0d1117', border:'1px solid #30363d', borderRadius:6,
                            padding:'8px 12px', color:'#e6edf3', fontSize:12 }} />
                        <button onClick={async () => {
                          if (!resQuery) return
                          setResAILoading(true)
                          const q = resQuery; setResQuery('')
                          const r = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'},
                            body: JSON.stringify({ messages:[{ role:'user', content:`You are a US residential construction expert. System: ${sys.label}. Question: ${q}. Provide practical answer with code refs (IRC/NEC/local), typical specs, cost range, and common mistakes. Be concise.` }] }) })
                          const d = await r.json()
                          setResAI(d.content?.[0]?.text || d.error || 'No response')
                          setResAILoading(false)
                        }} style={{ ...s.btn, whiteSpace:'nowrap' as const }}>
                          Ask AI
                        </button>
                      </div>

                      {/* Quick question chips */}
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' as const, marginBottom:10 }}>
                        {sys.id === 'foundation' && ['What soil tests are needed?', 'PT slab vs conventional slab cost?', 'When is PE stamp required?', 'Expansive clay soil recommendations'].map(q => (
                          <button key={q} onClick={() => setResQuery(q)}
                            style={{ fontSize:10, padding:'3px 9px', background:'#0d1117', border:'1px solid #30363d',
                              color:'#8b93a7', borderRadius:12, cursor:'pointer' }}>{q}</button>
                        ))}
                        {sys.id === 'framing' && ['LVL vs solid lumber headers?', '2×6 vs 2×4 wall cost difference?', 'Advanced framing energy savings?', 'Wind uplift connections hurricane zone'].map(q => (
                          <button key={q} onClick={() => setResQuery(q)}
                            style={{ fontSize:10, padding:'3px 9px', background:'#0d1117', border:'1px solid #30363d',
                              color:'#8b93a7', borderRadius:12, cursor:'pointer' }}>{q}</button>
                        ))}
                        {sys.id === 'drywall' && ['Drywall thickness for 1-hour fire rating?', 'Cement board vs Schluter for showers?', 'Level 5 finish cost premium?', 'Type X vs Type C drywall'].map(q => (
                          <button key={q} onClick={() => setResQuery(q)}
                            style={{ fontSize:10, padding:'3px 9px', background:'#0d1117', border:'1px solid #30363d',
                              color:'#8b93a7', borderRadius:12, cursor:'pointer' }}>{q}</button>
                        ))}
                        {sys.id === 'roofing' && ['Metal roof cost vs shingles?', 'Wind rating for FL coastal zones?', 'Tile roof structural requirements?', 'Ice and water shield coverage rules'].map(q => (
                          <button key={q} onClick={() => setResQuery(q)}
                            style={{ fontSize:10, padding:'3px 9px', background:'#0d1117', border:'1px solid #30363d',
                              color:'#8b93a7', borderRadius:12, cursor:'pointer' }}>{q}</button>
                        ))}
                        {sys.id === 'hvac' && ['Manual J load calc requirements?', 'Heat pump vs gas furnace in Texas?', 'Mini-split for room addition?', 'HVAC duct leakage test procedure'].map(q => (
                          <button key={q} onClick={() => setResQuery(q)}
                            style={{ fontSize:10, padding:'3px 9px', background:'#0d1117', border:'1px solid #30363d',
                              color:'#8b93a7', borderRadius:12, cursor:'pointer' }}>{q}</button>
                        ))}
                        {sys.id === 'electrical' && ['200A vs 400A panel for EV + heat pump?', 'AFCI circuit requirements 2023?', 'EV charging rough-in best practices?', 'Whole-home generator sizing'].map(q => (
                          <button key={q} onClick={() => setResQuery(q)}
                            style={{ fontSize:10, padding:'3px 9px', background:'#0d1117', border:'1px solid #30363d',
                              color:'#8b93a7', borderRadius:12, cursor:'pointer' }}>{q}</button>
                        ))}
                        {sys.id === 'plumbing' && ['PEX-A vs PEX-B for residential?', 'Tankless vs tank water heater ROI?', 'Drain slope requirements?', 'Backflow preventer requirements by state'].map(q => (
                          <button key={q} onClick={() => setResQuery(q)}
                            style={{ fontSize:10, padding:'3px 9px', background:'#0d1117', border:'1px solid #30363d',
                              color:'#8b93a7', borderRadius:12, cursor:'pointer' }}>{q}</button>
                        ))}
                        {sys.id === 'permit' && ['Typical permit timeline by state?', 'What triggers a PE stamp requirement?', 'How to respond to plan check comments?', 'Expedited permit options'].map(q => (
                          <button key={q} onClick={() => setResQuery(q)}
                            style={{ fontSize:10, padding:'3px 9px', background:'#0d1117', border:'1px solid #30363d',
                              color:'#8b93a7', borderRadius:12, cursor:'pointer' }}>{q}</button>
                        ))}
                      </div>

                      {resAILoading && (
                        <div style={{ textAlign:'center' as const, padding:'16px', color:'#58a6ff', fontSize:12 }}>
                          ⏳ AI analyzing {sys.label}...
                        </div>
                      )}
                      {resAI && !resAILoading && (
                        <>
                          <div style={{ background:'#0d1117', border:'1px solid #30363d', borderRadius:8,
                            padding:14, fontSize:12, color:'#c9d1d9', lineHeight:1.7,
                            fontFamily:'monospace', whiteSpace:'pre-wrap' as const }}>
                            {resAI}
                          </div>
                          <button onClick={() => setPrintData({ title:'AI Assistant — Residential Construction Systems', content: resAI })}
                            style={{ marginTop:8, padding:'5px 12px', background:'#185FA520', border:'1px solid #185FA540', borderRadius:7, color:'#58a6ff', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                            🖨️ Imprimir / Compartilhar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* ── CONSTRUCTION DOCS ── */}
            {activeModule === 'docs' && (
              <>
                <div style={{ fontSize:20, fontWeight:700, color:'#e6edf3', marginBottom:16 }}>📁 Construction Documentation</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  {[
                    { title:'Specifications (CSI MasterFormat)', items:['Division 00 — Procurement','Division 01 — General Requirements','Division 03 — Concrete','Division 05 — Metals','Division 07 — Thermal & Moisture','Division 09 — Finishes','Division 22 — Plumbing','Division 26 — Electrical'] },
                    { title:'Drawing Sets', items:['A-Series: Architectural (A0.1–A8.5)','S-Series: Structural (S0.1–S6.2)','M-Series: Mechanical (M0.1–M5.3)','P-Series: Plumbing (P0.1–P3.1)','E-Series: Electrical (E0.1–E5.2)','C-Series: Civil / Site (C0.1–C3.4)','FP-Series: Fire Protection (FP1–FP3)','L-Series: Landscape (L0.1–L2.2)'] },
                  ].map(sec => (
                    <div key={sec.title} style={s.card}>
                      <div style={s.secTit}>{sec.title}</div>
                      {sec.items.map(item => (
                        <div key={item} style={{ display:'flex', alignItems:'center', gap:8,
                          padding:'7px 0', borderBottom:'1px solid #30363d', fontSize:12, color:'#e6edf3' }}>
                          <span style={{ color:'#3B6D11', fontWeight:700 }}>✓</span> {item}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div style={s.card}>
                  <div style={s.secTit}>🤖 AI Documentation Assistant</div>
                  <button style={s.btn} onClick={() => runAIAnalysis('docs',
                    `Generate a Construction Documentation QA checklist for a US commercial project in San Francisco. Include: 1) Sheet completeness check (all series A/S/M/P/E/C/FP); 2) CSI MasterFormat spec sections required for IBC 2021 compliance; 3) ADA accessibility documentation requirements; 4) Energy compliance (Title 24) documentation; 5) Common AHJ comment categories and how to pre-empt them; 6) Coordination between drawings and specs — 10 most common conflicts. Reference actual IBC, ADA, SFBC local amendments.`)}>
                    🤖 Generate Documentation QA Report
                  </button>
                  {analyzing && aiContext === 'docs' && (
                    <div style={{ textAlign:'center' as const, padding:'20px 0', color:'#58a6ff', fontSize:13 }}>
                      ⏳ AI generating documentation report...
                    </div>
                  )}
                  {aiResult && aiContext === 'docs' && (
                    <>
                      <div style={{ ...s.pre, marginTop:14 }}>{aiResult}</div>
                      <button onClick={() => setPrintData({ title:'AI Documentation QA Report', content: aiResult })}
                        style={{ marginTop:8, padding:'5px 12px', background:'#185FA520', border:'1px solid #185FA540', borderRadius:7, color:'#58a6ff', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                        🖨️ Imprimir / Compartilhar
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

            {/* ── WORKFLOW ── */}
            {activeModule === 'workflow' && (
              <>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                  <div style={{ fontSize:20, fontWeight:700, color:'#e6edf3' }}>🔄 AI Workflow Automation</div>
                  <button style={s.btn} onClick={() => runAIAnalysis('workflow',
                    `Analyze this construction workflow and provide AI automation recommendations: Tasks: ${WORKFLOW_TASKS.map(t=>`${t.id}: ${t.title} (${t.status}, priority: ${t.priority}, due: ${t.due}, assignee: ${t.assignee})`).join('; ')}. Provide: 1) Critical path analysis; 2) Resource reallocation recommendations; 3) Automated notification triggers; 4) Risk-adjusted schedule; 5) 3-day sprint plan to clear backlog. Reference industry standard BIM execution plan practices.`)}>
                    🤖 AI Workflow Optimizer
                  </button>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
                  {[
                    { l:'Total Tasks', v:WORKFLOW_TASKS.length, c:'#58a6ff' },
                    { l:'In Progress', v:WORKFLOW_TASKS.filter(t=>t.status==='In Progress').length, c:'#185FA5' },
                    { l:'Overdue', v:overdueTask, c:'#A32D2D' },
                    { l:'Under Review', v:WORKFLOW_TASKS.filter(t=>t.status==='Under Review').length, c:'#BA7517' },
                  ].map(k => (
                    <div key={k.l} style={s.kpi}>
                      <div style={{ ...s.kpiV, color:k.c }}>{k.v}</div>
                      <div style={s.kpiL}>{k.l}</div>
                    </div>
                  ))}
                </div>

                <div style={s.card}>
                  <div style={s.secTit}>Active Tasks</div>
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:8 }}>
                    {WORKFLOW_TASKS.map(t => (
                      <div key={t.id} style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto',
                        alignItems:'center', gap:12, padding:'12px 14px', background:'#0d1117',
                        borderRadius:8, border:`1px solid ${STATUS_COLOR[t.status]||'#30363d'}33`,
                        borderLeft:`3px solid ${STATUS_COLOR[t.priority]||STATUS_COLOR[t.status]||'#30363d'}` }}>
                        <div>
                          <div style={{ fontSize:12, fontWeight:600, color:'#e6edf3', marginBottom:3 }}>{t.title}</div>
                          <div style={{ fontSize:11, color:'#8b93a7' }}>👤 {t.assignee}</div>
                        </div>
                        <div style={{ fontSize:11, color:'#8b93a7', whiteSpace:'nowrap' as const }}>📅 {t.due}</div>
                        <span style={s.badge(t.priority)}>{t.priority}</span>
                        <span style={s.badge(t.status)}>{t.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {analyzing && aiContext === 'workflow' && (
                  <div style={{ ...s.card, textAlign:'center' as const, padding:'24px' }}>
                    <div style={{ fontSize:13, color:'#58a6ff' }}>⏳ AI optimizing workflow...</div>
                  </div>
                )}
                {aiResult && aiContext === 'workflow' && (
                  <div style={s.card}>
                    <div style={s.secTit}>🤖 AI Workflow Optimization</div>
                    <div style={s.pre}>{aiResult}</div>
                    <button onClick={() => setPrintData({ title:'AI Workflow Optimization Report', content: aiResult })}
                      style={{ marginTop:8, padding:'5px 12px', background:'#185FA520', border:'1px solid #185FA540', borderRadius:7, color:'#58a6ff', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                      🖨️ Imprimir / Compartilhar
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ── REPORTS ── */}
            {activeModule === 'reports' && (
              <>
                <div style={{ fontSize:20, fontWeight:700, color:'#e6edf3', marginBottom:16 }}>📈 AI Reports</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                  {[
                    { icon:'⚡', title:'Clash Detection Report', desc:'Full clash matrix with resolution priority, BCF markup, and coordination meeting agenda.', ctx:'clash_report', prompt:'Generate a complete Clash Detection Report for a US commercial project. Include: executive summary, clash matrix by discipline pair, BCF issue markup recommendations, coordination meeting agenda, resolution timeline, and cost impact estimate. Format professionally for owner/GC distribution.' },
                    { icon:'📋', title:'Permit Readiness Report', desc:'AHJ submission checklist with IBC compliance verification and timeline forecast.', ctx:'permit_report', prompt:'Generate a Permit Readiness Report for an SF commercial project. Include: overall readiness score, critical path to submission, anticipated AHJ comments, code compliance summary (IBC 2021, SFBC, ADA, Title 24), and recommended submission strategy.' },
                    { icon:'🏗️', title:'BIM Execution Plan', desc:'Project-specific BEP per AIA E203 and AGC BIM Forum standards.', ctx:'bep', prompt:'Generate a BIM Execution Plan (BEP) outline per AIA E203 and AGC BIM Forum LOD Specification. Include: project information, BIM uses, model management protocol, file naming convention, coordinate system, LOD matrix by discipline, clash detection protocol, and owner deliverable schedule.' },
                    { icon:'📊', title:'Weekly Construction Report', desc:'AI-generated progress report for owner, GC, and PM distribution.', ctx:'weekly', prompt:'Generate a professional Weekly Construction Progress Report for a US commercial project. Include: this week\'s accomplishments, next week\'s planned work, schedule status (ahead/behind), budget status, open RFIs and submittals, safety report (0 incidents), weather impacts, and executive summary. Format for owner distribution.' },
                  ].map(r => (
                    <div key={r.title} style={{ ...s.card, cursor:'pointer' }}
                      onClick={() => { if(!analyzing) runAIAnalysis(r.ctx, r.prompt) }}>
                      <div style={{ fontSize:24, marginBottom:8 }}>{r.icon}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#e6edf3', marginBottom:4 }}>{r.title}</div>
                      <div style={{ fontSize:11, color:'#8b93a7', lineHeight:1.5, marginBottom:12 }}>{r.desc}</div>
                      <button style={s.btnGhost}>
                        {analyzing && aiContext === r.ctx ? '⏳ Generating...' : '▶ Generate with AI'}
                      </button>
                    </div>
                  ))}
                </div>

                {aiResult && ['clash_report','permit_report','bep','weekly'].includes(aiContext) && (
                  <div style={s.card}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                      <div style={s.secTit}>🤖 Generated Report</div>
                      <div style={{ display:'flex', gap:8 }}>
                        <button style={s.btnGhost} onClick={() => setPrintData({ title:'BIMForge AI — Generated Report', content: aiResult })}>🖨️ Imprimir / Compartilhar</button>
                      </div>
                    </div>
                    <div style={s.pre}>{aiResult}</div>
                  </div>
                )}
              </>
            )}

            {/* ── COORDENAÇÃO ── */}
            {activeModule === 'coordination' && (
              <>
                <div style={{ fontSize:20, fontWeight:700, color:'#e6edf3', marginBottom:4 }}>🤝 BIM Coordination</div>
                <div style={{ fontSize:12, color:'#8b93a7', marginBottom:16 }}>RFI log · Submittal log · Coordination matrix · Meeting minutes · AI coordination reports</div>

                {/* Sub-tabs */}
                <div style={{ display:'flex', gap:8, marginBottom:18 }}>
                  {([['rfi','📝 RFI Log'],['submittal','📦 Submittal Log'],['matrix','📐 Coord. Matrix'],['meeting','📅 Meetings']] as const).map(([id,label]) => (
                    <button key={id} onClick={() => setCoordTab(id)}
                      style={{ padding:'8px 16px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer',
                        background: coordTab === id ? '#185FA5' : '#161b22',
                        color: coordTab === id ? '#fff' : '#8b93a7',
                        border: `1px solid ${coordTab === id ? '#185FA5' : '#30363d'}` }}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* RFI Log */}
                {coordTab === 'rfi' && (
                  <div style={s.card}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                      <div style={s.secTit}>📝 RFI Log — {RFI_LOG.length + projectRFIs.length} Issues</div>
                      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                        <span style={{ fontSize:11, color:'#f85149' }}>● {RFI_LOG.filter(r=>r.status==='Open').length + projectRFIs.filter(r=>r.status==='Open').length} Open</span>
                        <span style={{ fontSize:11, color:'#3fb950' }}>● {RFI_LOG.filter(r=>r.status==='Answered').length} Answered</span>
                        <button onClick={() => setShowAddRFI(v=>!v)}
                          style={{ ...s.btn, padding:'5px 14px', fontSize:11 }}>+ New RFI</button>
                      </div>
                    </div>
                    {showAddRFI && (
                      <div style={{ background:'#0d1117', border:'1px solid #185FA5', borderRadius:8,
                        padding:'14px 16px', marginBottom:14, display:'flex', gap:10, flexWrap:'wrap' as const,
                        alignItems:'flex-end' }}>
                        <div style={{ flex:2, minWidth:200 }}>
                          <div style={{ fontSize:10, color:'#8b93a7', marginBottom:4, fontWeight:600 }}>SUBJECT *</div>
                          <input style={s.input} placeholder="Describe the RFI…"
                            value={newRFI.subject} onChange={e => setNewRFI(v=>({...v,subject:e.target.value}))}
                            onKeyDown={e => e.key==='Enter' && addProjectRFI()} />
                        </div>
                        <div style={{ flex:1, minWidth:150 }}>
                          <div style={{ fontSize:10, color:'#8b93a7', marginBottom:4, fontWeight:600 }}>DISCIPLINE</div>
                          <select style={{ ...s.input, cursor:'pointer' }}
                            value={newRFI.discipline} onChange={e => setNewRFI(v=>({...v,discipline:e.target.value}))}>
                            {['Architectural','Structural','MEP','Civil','Geotechnical','Fire Protection','Other'].map(d =>
                              <option key={d}>{d}</option>)}
                          </select>
                        </div>
                        <div style={{ display:'flex', gap:8 }}>
                          <button style={s.btn} onClick={addProjectRFI}>Add RFI</button>
                          <button style={s.btnGhost} onClick={() => setShowAddRFI(false)}>Cancel</button>
                        </div>
                      </div>
                    )}
                    <div style={{ overflowX:'auto' as const }}>
                      <table style={{ width:'100%', borderCollapse:'collapse' as const, fontSize:11 }}>
                        <thead>
                          <tr style={{ borderBottom:'1px solid #30363d' }}>
                            {['RFI #','Subject','Discipline','From','To','Issued','Due','Days Open','Status'].map(h => (
                              <th key={h} style={{ padding:'6px 10px', textAlign:'left' as const, color:'#8b93a7', fontWeight:600, whiteSpace:'nowrap' as const }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {projectRFIs.map(r => (
                            <tr key={r.id} style={{ borderBottom:'1px solid #21262d', background:'#0d2137' }}>
                              <td style={{ padding:'8px 10px', color:'#f0a500', fontWeight:700 }}>{r.id}</td>
                              <td style={{ padding:'8px 10px', color:'#e6edf3', maxWidth:260 }}>{r.subject}</td>
                              <td style={{ padding:'8px 10px', color:'#8b93a7' }}>{r.discipline}</td>
                              <td style={{ padding:'8px 10px', color:'#8b93a7' }}>Project Team</td>
                              <td style={{ padding:'8px 10px', color:'#8b93a7' }}>AOR</td>
                              <td style={{ padding:'8px 10px', color:'#8b93a7', whiteSpace:'nowrap' as const }}>{r.date}</td>
                              <td style={{ padding:'8px 10px', color:'#8b93a7' }}>—</td>
                              <td style={{ padding:'8px 10px', color:'#f85149', fontWeight:700 }}>0d</td>
                              <td style={{ padding:'8px 10px' }}>
                                <span style={{ padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700,
                                  background:'#FCEBEB', color:'#A32D2D' }}>Open</span>
                              </td>
                            </tr>
                          ))}
                          {RFI_LOG.map(r => (
                            <tr key={r.id} style={{ borderBottom:'1px solid #21262d' }}>
                              <td style={{ padding:'8px 10px', color:'#58a6ff', fontWeight:700 }}>{r.id}</td>
                              <td style={{ padding:'8px 10px', color:'#e6edf3', maxWidth:260 }}>{r.subject}</td>
                              <td style={{ padding:'8px 10px', color:'#8b93a7' }}>{r.discipline}</td>
                              <td style={{ padding:'8px 10px', color:'#8b93a7' }}>{r.from}</td>
                              <td style={{ padding:'8px 10px', color:'#8b93a7' }}>{r.to}</td>
                              <td style={{ padding:'8px 10px', color:'#8b93a7', whiteSpace:'nowrap' as const }}>{r.issued}</td>
                              <td style={{ padding:'8px 10px', color:'#8b93a7', whiteSpace:'nowrap' as const }}>{r.due}</td>
                              <td style={{ padding:'8px 10px', color: r.days > 14 ? '#f85149' : r.days > 7 ? '#d29922' : '#3fb950', fontWeight:700 }}>{r.days}d</td>
                              <td style={{ padding:'8px 10px' }}>
                                <span style={{ padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700,
                                  background: r.status==='Open'?'#FCEBEB': r.status==='Answered'?'#EAF3DE':'#FFF3E0',
                                  color: r.status==='Open'?'#A32D2D': r.status==='Answered'?'#3B6D11':'#BA7517' }}>
                                  {r.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Submittal Log */}
                {coordTab === 'submittal' && (
                  <div style={s.card}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                      <div style={s.secTit}>📦 Submittal Log — {SUBMITTAL_LOG.length} Items</div>
                      <div style={{ display:'flex', gap:8 }}>
                        <span style={{ fontSize:11, color:'#3fb950' }}>● {SUBMITTAL_LOG.filter(s=>s.status.startsWith('Approved')).length} Approved</span>
                        <span style={{ fontSize:11, color:'#58a6ff' }}>● {SUBMITTAL_LOG.filter(s=>s.status==='Under Review').length} In Review</span>
                      </div>
                    </div>
                    <div style={{ overflowX:'auto' as const }}>
                      <table style={{ width:'100%', borderCollapse:'collapse' as const, fontSize:11 }}>
                        <thead>
                          <tr style={{ borderBottom:'1px solid #30363d' }}>
                            {['Sub #','Spec Section','Title','Subcontractor','Submitted','Reviewed','Rev','Status'].map(h => (
                              <th key={h} style={{ padding:'6px 10px', textAlign:'left' as const, color:'#8b93a7', fontWeight:600, whiteSpace:'nowrap' as const }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {SUBMITTAL_LOG.map(r => (
                            <tr key={r.id} style={{ borderBottom:'1px solid #21262d' }}>
                              <td style={{ padding:'8px 10px', color:'#58a6ff', fontWeight:700 }}>{r.id}</td>
                              <td style={{ padding:'8px 10px', color:'#d2a679', fontFamily:'monospace' }}>{r.spec}</td>
                              <td style={{ padding:'8px 10px', color:'#e6edf3' }}>{r.title}</td>
                              <td style={{ padding:'8px 10px', color:'#8b93a7' }}>{r.sub}</td>
                              <td style={{ padding:'8px 10px', color:'#8b93a7', whiteSpace:'nowrap' as const }}>{r.submitted}</td>
                              <td style={{ padding:'8px 10px', color:'#8b93a7', whiteSpace:'nowrap' as const }}>{r.reviewed}</td>
                              <td style={{ padding:'8px 10px', color:'#8b93a7', textAlign:'center' as const }}>R{r.rev}</td>
                              <td style={{ padding:'8px 10px' }}>
                                <span style={{ padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700,
                                  background: r.status.startsWith('Approved')?'#EAF3DE': r.status==='Under Review'?'#EFF4FF':'#FFF3E0',
                                  color: r.status.startsWith('Approved')?'#3B6D11': r.status==='Under Review'?'#185FA5':'#BA7517' }}>
                                  {r.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Coordination Matrix */}
                {coordTab === 'matrix' && (
                  <div style={s.card}>
                    <div style={s.secTit}>📐 BIM Coordination Matrix</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
                      {COORD_MATRIX.map(d => (
                        <div key={d.discipline} style={{ background:'#0d1117', border:'1px solid #30363d', borderRadius:8, padding:14 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:'#e6edf3', marginBottom:6 }}>{d.discipline}</div>
                          <div style={{ fontSize:11, color:'#8b93a7', marginBottom:4 }}>Lead: <span style={{ color:'#58a6ff' }}>{d.lead}</span></div>
                          <div style={{ fontSize:11, color:'#8b93a7', marginBottom:4 }}>Model: <span style={{ color:'#d2a679', fontFamily:'monospace' }}>{d.model}</span></div>
                          <div style={{ fontSize:11, color:'#8b93a7', marginBottom:8 }}>LOD: <span style={{ color:'#3fb950' }}>{d.lod}</span></div>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <span style={{ fontSize:11, color: d.clashes > 5 ? '#f85149' : d.clashes > 2 ? '#d29922' : '#3fb950' }}>
                              ⚡ {d.clashes} clashes
                            </span>
                            <span style={{ fontSize:10, padding:'2px 7px', borderRadius:8,
                              background: d.status === 'Active' ? '#EAF3DE' : '#EFF4FF',
                              color: d.status === 'Active' ? '#3B6D11' : '#185FA5' }}>{d.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button style={s.btn} onClick={async () => {
                      setCoordAILoading(true)
                      const r = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'},
                        body: JSON.stringify({ messages:[{ role:'user', content:`Generate a BIM Coordination meeting agenda for a US construction project. Disciplines: ${COORD_MATRIX.map(d=>`${d.discipline} (${d.clashes} clashes, LOD ${d.lod})`).join(', ')}. Open RFIs: ${RFI_LOG.filter(r=>r.status==='Open').map(r=>r.id+': '+r.subject).join('; ')}. Include: meeting objectives, attendee list by role, agenda items with time allocation, clash resolution priorities, RFI action items, model coordination schedule, BCF issue assignments, and next meeting date. Format as a professional meeting agenda.` }] }) })
                      const d = await r.json()
                      setCoordAI(d.content?.[0]?.text || '')
                      setCoordAILoading(false)
                    }}>
                      🤖 Generate Coordination Meeting Agenda
                    </button>
                  </div>
                )}

                {/* Meeting Minutes */}
                {coordTab === 'meeting' && (
                  <div style={s.card}>
                    <div style={s.secTit}>📅 Coordination Meeting Log</div>
                    {[
                      { date:'2026-05-12', title:'BIM Coordination Meeting #8', attendees:'AOR, EOR, MEC, GC, FPE', resolved:3, open:6, action:'Resolve CLH-001 by 5/19; RFI-002 response due' },
                      { date:'2026-04-28', title:'BIM Coordination Meeting #7', attendees:'AOR, EOR, MEC, GC, PE', resolved:5, open:4, action:'Structural model update to LOD 350 by 5/5' },
                      { date:'2026-04-14', title:'BIM Coordination Meeting #6', attendees:'All disciplines', resolved:7, open:2, action:'Federated model re-issue; clash run complete' },
                    ].map(m => (
                      <div key={m.date} style={{ background:'#0d1117', border:'1px solid #30363d', borderRadius:8, padding:14, marginBottom:10 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:'#e6edf3' }}>{m.title}</div>
                          <div style={{ fontSize:11, color:'#8b93a7' }}>{m.date}</div>
                        </div>
                        <div style={{ fontSize:11, color:'#8b93a7', marginBottom:4 }}>👥 {m.attendees}</div>
                        <div style={{ display:'flex', gap:16, marginBottom:6 }}>
                          <span style={{ fontSize:11, color:'#3fb950' }}>✓ {m.resolved} resolved</span>
                          <span style={{ fontSize:11, color:'#f85149' }}>● {m.open} open</span>
                        </div>
                        <div style={{ fontSize:11, color:'#d2a679' }}>▸ {m.action}</div>
                      </div>
                    ))}
                    <button style={s.btn} onClick={async () => {
                      setCoordAILoading(true)
                      const r = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'},
                        body: JSON.stringify({ messages:[{ role:'user', content:`Generate professional BIM Coordination Meeting Minutes for a US commercial construction project. Meeting #9. Include: project info, attendees (AOR, EOR, MEC, GC, PE, FPE), open RFIs: ${RFI_LOG.filter(r=>r.status==='Open').map(r=>r.id+': '+r.subject).join('; ')}. Active clashes: ${COORD_MATRIX.reduce((a,d)=>a+d.clashes,0)} total. Format with: Date/Time/Location, Attendees, Previous Action Items Review, Current Clash Status, RFI Status, New Issues, Action Items with owner and due date, Next Meeting. Professional tone for distribution to project team.` }] }) })
                      const d = await r.json()
                      setCoordAI(d.content?.[0]?.text || '')
                      setCoordAILoading(false)
                    }}>
                      🤖 Generate Meeting Minutes
                    </button>
                  </div>
                )}

                {coordAILoading && (
                  <div style={{ ...s.card, textAlign:'center' as const }}>
                    <div style={{ color:'#58a6ff', fontSize:13 }}>⏳ AI generating coordination document...</div>
                  </div>
                )}
                {coordAI && !coordAILoading && (
                  <div style={s.card}>
                    <div style={s.secTit}>🤖 AI Output</div>
                    <div style={s.pre}>{coordAI}</div>
                    <button onClick={() => setPrintData({ title:'BIM Coordination Meeting Minutes', content: coordAI })}
                      style={{ marginTop:8, padding:'5px 12px', background:'#185FA520', border:'1px solid #185FA540', borderRadius:7, color:'#58a6ff', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                      🖨️ Imprimir / Compartilhar
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ── QUANTITATIVOS ── */}
            {activeModule === 'quantities' && (
              <>
                <div style={{ fontSize:20, fontWeight:700, color:'#e6edf3', marginBottom:4 }}>📐 Quantitativos — Quantity Takeoff</div>
                <div style={{ fontSize:12, color:'#8b93a7', marginBottom:16 }}>CSI MasterFormat · Unit costs USD · AI quantity survey · Cost estimate with markup</div>

                {/* Markup control */}
                <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:18, background:'#161b22',
                  border:'1px solid #30363d', borderRadius:10, padding:'12px 16px' }}>
                  <div style={{ fontSize:12, color:'#e6edf3', fontWeight:600 }}>GC Markup / OH&P:</div>
                  {[10,12,15,18,20].map(pct => (
                    <button key={pct} onClick={() => setQtyMarkup(pct)}
                      style={{ padding:'5px 14px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer',
                        background: qtyMarkup === pct ? '#238636' : '#0d1117',
                        color: qtyMarkup === pct ? '#fff' : '#8b93a7',
                        border: `1px solid ${qtyMarkup === pct ? '#238636' : '#30363d'}` }}>
                      {pct}%
                    </button>
                  ))}
                  <div style={{ marginLeft:'auto', fontSize:13, color:'#3fb950', fontWeight:700 }}>
                    Total Direct: ${CSI_TAKEOFF.reduce((a,i)=>a+i.qty*i.unitCost,0).toLocaleString()} USD
                  </div>
                  <div style={{ fontSize:13, color:'#58a6ff', fontWeight:700 }}>
                    With Markup: ${Math.round(CSI_TAKEOFF.reduce((a,i)=>a+i.qty*i.unitCost,0) * (1+qtyMarkup/100)).toLocaleString()} USD
                  </div>
                </div>

                {/* Takeoff Table */}
                <div style={s.card}>
                  <div style={s.secTit}>CSI MasterFormat Takeoff</div>
                  <div style={{ overflowX:'auto' as const }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' as const, fontSize:12 }}>
                      <thead>
                        <tr style={{ borderBottom:'2px solid #30363d' }}>
                          {['Div','Title','Unit','Qty','Unit Cost (USD)','Direct Cost','w/ Markup','Notes'].map(h => (
                            <th key={h} style={{ padding:'8px 10px', textAlign:'left' as const, color:'#8b93a7', fontWeight:600, whiteSpace:'nowrap' as const }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {CSI_TAKEOFF.map((item, i) => {
                          const direct = item.qty * item.unitCost
                          const withMarkup = Math.round(direct * (1 + qtyMarkup/100))
                          return (
                            <tr key={item.div} style={{ borderBottom:'1px solid #21262d',
                              background: i % 2 === 0 ? 'transparent' : '#0d111733' }}>
                              <td style={{ padding:'9px 10px', color:'#d2a679', fontWeight:700, fontFamily:'monospace' }}>Div {item.div}</td>
                              <td style={{ padding:'9px 10px', color:'#e6edf3', fontWeight:600 }}>{item.title}</td>
                              <td style={{ padding:'9px 10px', color:'#8b93a7', textAlign:'center' as const }}>{item.unit}</td>
                              <td style={{ padding:'9px 10px', color:'#e6edf3', textAlign:'right' as const }}>{item.qty.toLocaleString()}</td>
                              <td style={{ padding:'9px 10px', color:'#8b93a7', textAlign:'right' as const }}>${item.unitCost.toLocaleString()}</td>
                              <td style={{ padding:'9px 10px', color:'#e6edf3', textAlign:'right' as const, fontWeight:600 }}>${direct.toLocaleString()}</td>
                              <td style={{ padding:'9px 10px', color:'#3fb950', textAlign:'right' as const, fontWeight:700 }}>${withMarkup.toLocaleString()}</td>
                              <td style={{ padding:'9px 10px', color:'#8b93a7', fontSize:11 }}>{item.notes}</td>
                            </tr>
                          )
                        })}
                        <tr style={{ borderTop:'2px solid #30363d', background:'#161b22' }}>
                          <td colSpan={5} style={{ padding:'10px', color:'#e6edf3', fontWeight:700, textAlign:'right' as const }}>TOTAL PROJECT ESTIMATE:</td>
                          <td style={{ padding:'10px', color:'#58a6ff', fontWeight:800, textAlign:'right' as const, fontSize:14 }}>
                            ${CSI_TAKEOFF.reduce((a,i)=>a+i.qty*i.unitCost,0).toLocaleString()}
                          </td>
                          <td style={{ padding:'10px', color:'#3fb950', fontWeight:800, textAlign:'right' as const, fontSize:14 }}>
                            ${Math.round(CSI_TAKEOFF.reduce((a,i)=>a+i.qty*i.unitCost,0) * (1+qtyMarkup/100)).toLocaleString()}
                          </td>
                          <td style={{ padding:'10px', color:'#8b93a7', fontSize:11 }}>incl. {qtyMarkup}% OH&P</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display:'flex', justifyContent:'flex-end', marginTop:10 }}>
                    <button onClick={() => setPrintData({
                      title: `CSI MasterFormat Takeoff — ${qtyMarkup}% OH&P`,
                      content: [
                        `CSI MASTERFORMAT TAKEOFF`,
                        `GC Markup/OH&P: ${qtyMarkup}%`,
                        ``,
                        ...CSI_TAKEOFF.map(i => `Div ${i.div} — ${i.title}: ${i.qty.toLocaleString()} ${i.unit} @ $${i.unitCost} = $${(i.qty*i.unitCost).toLocaleString()} (w/ markup: $${Math.round(i.qty*i.unitCost*(1+qtyMarkup/100)).toLocaleString()})`),
                        ``,
                        `TOTAL DIRECT: $${CSI_TAKEOFF.reduce((a,i)=>a+i.qty*i.unitCost,0).toLocaleString()}`,
                        `TOTAL W/ ${qtyMarkup}% MARKUP: $${Math.round(CSI_TAKEOFF.reduce((a,i)=>a+i.qty*i.unitCost,0)*(1+qtyMarkup/100)).toLocaleString()}`,
                      ].join('\n')
                    })} style={{ padding:'7px 16px', background:'#185FA520', border:'1px solid #185FA540', borderRadius:8, color:'#58a6ff', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                      🖨️ Imprimir Takeoff
                    </button>
                  </div>
                </div>

                {/* Real Vision Takeoff */}
                <div style={{ background:'#0d2137', border:'1px solid #185FA5', borderRadius:10, padding:'14px 16px', marginBottom:14 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#58a6ff', marginBottom:8, textTransform:'uppercase' as const, letterSpacing:'.08em' }}>
                    📐 Extract Real Quantities from Drawing
                  </div>
                  <div style={{ fontSize:11, color:'#8b93a7', marginBottom:10 }}>
                    Upload a floor plan or PDF — Claude Vision reads dimensions and extracts real quantity takeoff.
                  </div>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <button style={{ ...s.btn, background:'#238636' }} onClick={() => qtyFileRef.current?.click()}>
                      📁 Upload Drawing for Real Takeoff
                    </button>
                    <input ref={qtyFileRef} type="file" style={{ display:'none' }}
                      accept="image/*,.pdf"
                      onChange={async e => {
                        const f = e.target.files?.[0]; if (!f) return
                        if (qtyFileRef.current) qtyFileRef.current.value = ''
                        setQtyVisionLoading(true); setQtyVisionResult('')
                        const isImage = f.type.startsWith('image/')
                        const isPDF = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
                        const base64 = await new Promise<string>((resolve, reject) => {
                          const reader = new FileReader()
                          reader.onload = () => resolve((reader.result as string).split(',')[1])
                          reader.onerror = reject; reader.readAsDataURL(f)
                        })
                        const mt = isImage ? (f.type || 'image/jpeg') : 'application/pdf'
                        try {
                          const res = await fetch('/api/chat', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              model: 'claude-sonnet-4-6', max_tokens: 2000,
                              system: `You are BIMForge AI — expert quantity surveyor and cost estimator for US construction. Analyze drawings and extract precise quantities with CSI MasterFormat division codes and current US market unit costs.`,
                              messages: [{ role: 'user', content: [
                                { type: isPDF ? 'document' : 'image', source: { type: 'base64', media_type: mt, data: base64 } } as any,
                                { type: 'text', text: `Perform a full quantity takeoff from this drawing "${f.name}".

Extract all quantities visible in the drawing and format as:

### QUANTITY TAKEOFF
| CSI Div | Description | Unit | Qty | Unit Cost USD | Total |
|---------|-------------|------|-----|---------------|-------|
(fill all rows from drawing)

### COST SUMMARY
- Total Direct Cost: $XXX
- With 15% GC Markup: $XXX
- Contingency (10%): $XXX
- **Total Project Estimate: $XXX**

### ASSUMPTIONS & NOTES
List any estimates made, areas where dimensions weren't visible, and recommended clarifications.

### VALUE ENGINEERING
Top 3 opportunities to reduce cost without compromising quality.` }
                              ]}]
                            })
                          })
                          const data = await res.json()
                          setQtyVisionResult(data?.content?.[0]?.text || 'No analysis returned.')
                        } catch { setQtyVisionResult('Connection error. Check ANTHROPIC_API_KEY.') }
                        setQtyVisionLoading(false)
                      }} />
                    {qtyVisionLoading && <span style={{ fontSize:12, color:'#58a6ff' }}>⏳ Claude Vision extracting quantities...</span>}
                  </div>
                  {qtyVisionResult && !qtyVisionLoading && (
                    <>
                      <div style={{ ...s.pre, marginTop:12, maxHeight:500 }}>{qtyVisionResult}</div>
                      <button onClick={() => setPrintData({ title:'BIMForge AI — Real Quantity Takeoff', content: qtyVisionResult })}
                        style={{ marginTop:8, padding:'5px 12px', background:'#185FA520', border:'1px solid #185FA540', borderRadius:7, color:'#58a6ff', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                        🖨️ Imprimir / Compartilhar
                      </button>
                    </>
                  )}
                </div>

                {/* AI Quantity Survey */}
                <div style={s.card}>
                  <div style={s.secTit}>🤖 AI Quantity Survey & Estimate</div>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap' as const, marginBottom:12 }}>
                    {[
                      { label:'Full Cost Estimate Report', prompt:`Generate a detailed construction cost estimate report for a US residential project. CSI divisions covered: ${CSI_TAKEOFF.map(i=>`Div ${i.div} ${i.title}: ${i.qty} ${i.unit} @ $${i.unitCost}/${i.unit} = $${(i.qty*i.unitCost).toLocaleString()}`).join('; ')}. Total direct cost: $${CSI_TAKEOFF.reduce((a,i)=>a+i.qty*i.unitCost,0).toLocaleString()}. Markup: ${qtyMarkup}%. Include: executive summary, CSI division breakdown, assumptions, exclusions, allowances, contingency recommendation (5–10%), and comparison to Sun Belt market benchmarks (TX, FL, AZ).` },
                      { label:'Value Engineering Options', prompt:`Provide value engineering recommendations for a US residential construction project with these quantities: ${CSI_TAKEOFF.map(i=>`Div ${i.div}: $${(i.qty*i.unitCost).toLocaleString()}`).join(', ')}. Total: $${CSI_TAKEOFF.reduce((a,i)=>a+i.qty*i.unitCost,0).toLocaleString()}. Identify top 5 value engineering opportunities with estimated savings, quality impact, and implementation risk. Focus on concrete, steel, MEP, and finishes.` },
                      { label:'Bid Comparison Matrix', prompt:`Generate a bid comparison matrix template for a US construction project. Scope items by CSI division: ${CSI_TAKEOFF.map(i=>`Div ${i.div} — ${i.title}`).join('; ')}. Format a professional bid tabulation with columns for Bidder 1/2/3, base bid, unit prices, alternates, qualifications, and recommended award. Include evaluation criteria and scoring methodology.` },
                    ].map(btn => (
                      <button key={btn.label} style={s.btn} onClick={async () => {
                        setQtyAILoading(true)
                        const r = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'},
                          body: JSON.stringify({ messages:[{ role:'user', content: btn.prompt }] }) })
                        const d = await r.json()
                        setQtyAI(d.content?.[0]?.text || '')
                        setQtyAILoading(false)
                      }}>🤖 {btn.label}</button>
                    ))}
                  </div>
                  {qtyAILoading && <div style={{ textAlign:'center' as const, color:'#58a6ff', padding:16 }}>⏳ AI generating estimate...</div>}
                  {qtyAI && !qtyAILoading && (
                    <>
                      <div style={s.pre}>{qtyAI}</div>
                      <button onClick={() => setPrintData({ title:'AI Quantity Survey & Cost Estimate', content: qtyAI })}
                        style={{ marginTop:8, padding:'5px 12px', background:'#185FA520', border:'1px solid #185FA540', borderRadius:7, color:'#58a6ff', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                        🖨️ Imprimir / Compartilhar
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

            {/* ── VIABILIDADE ── */}
            {activeModule === 'feasibility' && (
              <>
                <div style={{ fontSize:20, fontWeight:700, color:'#e6edf3', marginBottom:4 }}>📊 Viabilidade — Feasibility Analysis</div>
                <div style={{ fontSize:12, color:'#8b93a7', marginBottom:16 }}>Pro forma · IRR / NPV · Sun Belt market comparables · Development budget · AI feasibility report</div>

                {/* Market Comparables */}
                <div style={s.card}>
                  <div style={s.secTit}>🌎 Sun Belt Market Comparables — Single Family</div>
                  <div style={{ overflowX:'auto' as const }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' as const, fontSize:12 }}>
                      <thead>
                        <tr style={{ borderBottom:'2px solid #30363d' }}>
                          {['Market','Avg SF','Land','Hard Cost/SF','Soft Cost/SF','Sale Price','ROI %','Cap Rate','Days on Mkt'].map(h => (
                            <th key={h} style={{ padding:'7px 10px', textAlign:'left' as const, color:'#8b93a7', fontWeight:600, whiteSpace:'nowrap' as const }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {FEASIBILITY_MARKETS.map(m => (
                          <tr key={m.city} onClick={() => {
                            setFeasCity(m.city); setFeasSF(m.avgSF); setFeasLand(m.landCost)
                            setFeasHard(m.hardCost); setFeasSoft(m.softCost); setFeasSale(m.salePrice)
                          }} style={{ borderBottom:'1px solid #21262d', cursor:'pointer',
                            background: feasCity === m.city ? '#1a2940' : 'transparent' }}>
                            <td style={{ padding:'9px 10px', color:'#58a6ff', fontWeight:700 }}>{m.city}</td>
                            <td style={{ padding:'9px 10px', color:'#e6edf3' }}>{m.avgSF.toLocaleString()} SF</td>
                            <td style={{ padding:'9px 10px', color:'#e6edf3' }}>${m.landCost.toLocaleString()}</td>
                            <td style={{ padding:'9px 10px', color:'#e6edf3' }}>${m.hardCost}/SF</td>
                            <td style={{ padding:'9px 10px', color:'#e6edf3' }}>${m.softCost}/SF</td>
                            <td style={{ padding:'9px 10px', color:'#3fb950', fontWeight:700 }}>${m.salePrice.toLocaleString()}</td>
                            <td style={{ padding:'9px 10px', color: m.roi>24?'#3fb950':m.roi>20?'#d29922':'#f85149', fontWeight:700 }}>{m.roi}%</td>
                            <td style={{ padding:'9px 10px', color:'#8b93a7' }}>{m.capRate}%</td>
                            <td style={{ padding:'9px 10px', color:'#8b93a7' }}>{m.daysOnMkt}d</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ fontSize:11, color:'#8b93a7', marginTop:8 }}>▸ Click a row to load market into the pro forma below</div>
                </div>

                {/* Pro Forma Calculator */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                  {/* Inputs */}
                  <div style={s.card}>
                    <div style={s.secTit}>📋 Pro Forma Inputs — {feasCity}</div>
                    {[
                      { label:'Project Size (SF)', val:feasSF, set:setFeasSF },
                      { label:'Land / Lot Cost ($)', val:feasLand, set:setFeasLand },
                      { label:'Hard Cost ($/SF)', val:feasHard, set:setFeasHard },
                      { label:'Soft Cost ($/SF)', val:feasSoft, set:setFeasSoft },
                      { label:'Target Sale Price ($)', val:feasSale, set:setFeasSale },
                    ].map(({ label, val, set }) => (
                      <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                        padding:'8px 0', borderBottom:'1px solid #21262d' }}>
                        <div style={{ fontSize:12, color:'#8b93a7' }}>{label}</div>
                        <input type="number" value={val}
                          onChange={e => set(Number(e.target.value))}
                          style={{ width:120, background:'#0d1117', border:'1px solid #30363d', borderRadius:6,
                            padding:'4px 8px', color:'#e6edf3', fontSize:12, textAlign:'right' as const }} />
                      </div>
                    ))}
                  </div>

                  {/* Results */}
                  <div style={s.card}>
                    {(() => {
                      const hardTotal = feasSF * feasHard
                      const softTotal = feasSF * feasSoft
                      const totalCost = feasLand + hardTotal + softTotal
                      const profit = feasSale - totalCost
                      const roi = ((profit / totalCost) * 100).toFixed(1)
                      const margin = ((profit / feasSale) * 100).toFixed(1)
                      const irr = (parseFloat(roi) * 0.72).toFixed(1)  // simplified 18-month project IRR
                      const costPerSF = (totalCost / feasSF).toFixed(0)
                      return (
                        <>
                          <div style={s.secTit}>📊 Pro Forma Results</div>
                          {[
                            { label:'Hard Cost Total', val:`$${hardTotal.toLocaleString()}`, color:'#e6edf3' },
                            { label:'Soft Cost Total', val:`$${softTotal.toLocaleString()}`, color:'#e6edf3' },
                            { label:'Land Cost', val:`$${feasLand.toLocaleString()}`, color:'#e6edf3' },
                            { label:'Total Development Cost', val:`$${totalCost.toLocaleString()}`, color:'#58a6ff' },
                            { label:'Cost / SF', val:`$${costPerSF}/SF`, color:'#8b93a7' },
                            { label:'Sale Price', val:`$${feasSale.toLocaleString()}`, color:'#3fb950' },
                            { label:'Gross Profit', val:`$${profit.toLocaleString()}`, color: profit > 0 ? '#3fb950' : '#f85149' },
                            { label:'ROI', val:`${roi}%`, color: parseFloat(roi) > 20 ? '#3fb950' : parseFloat(roi) > 12 ? '#d29922' : '#f85149' },
                            { label:'Profit Margin', val:`${margin}%`, color:'#d2a679' },
                            { label:'Estimated IRR (18 mo)', val:`${irr}%`, color:'#58a6ff' },
                          ].map(row => (
                            <div key={row.label} style={{ display:'flex', justifyContent:'space-between',
                              padding:'7px 0', borderBottom:'1px solid #21262d' }}>
                              <div style={{ fontSize:12, color:'#8b93a7' }}>{row.label}</div>
                              <div style={{ fontSize:13, fontWeight:700, color:row.color }}>{row.val}</div>
                            </div>
                          ))}
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Pro Forma Print button */}
                <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
                  <button onClick={() => {
                    const hardTotal = feasSF * feasHard
                    const softTotal = feasSF * feasSoft
                    const totalCost = feasLand + hardTotal + softTotal
                    const profit = feasSale - totalCost
                    const roi = ((profit / totalCost) * 100).toFixed(1)
                    const margin = ((profit / feasSale) * 100).toFixed(1)
                    const irr = (parseFloat(roi) * 0.72).toFixed(1)
                    const costPerSF = (totalCost / feasSF).toFixed(0)
                    setPrintData({
                      title: `Pro Forma — ${feasCity} (${feasSF.toLocaleString()} SF)`,
                      content: [
                        `MERCADO: ${feasCity}`,
                        `Tamanho: ${feasSF.toLocaleString()} SF`,
                        ``,
                        `CUSTOS`,
                        `Hard Cost Total: $${hardTotal.toLocaleString()}`,
                        `Soft Cost Total: $${softTotal.toLocaleString()}`,
                        `Land Cost: $${feasLand.toLocaleString()}`,
                        `Total Development Cost: $${totalCost.toLocaleString()}`,
                        `Cost / SF: $${costPerSF}/SF`,
                        ``,
                        `RESULTADO`,
                        `Sale Price: $${feasSale.toLocaleString()}`,
                        `Gross Profit: $${profit.toLocaleString()}`,
                        `ROI: ${roi}%`,
                        `Profit Margin: ${margin}%`,
                        `Estimated IRR (18 mo): ${irr}%`,
                      ].join('\n')
                    })
                  }} style={{ padding:'8px 18px', background:'#185FA520', border:'1px solid #185FA540', borderRadius:8, color:'#58a6ff', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                    🖨️ Imprimir Pro Forma
                  </button>
                </div>

                {/* AI Feasibility */}
                <div style={s.card}>
                  <div style={s.secTit}>🤖 AI Feasibility Report</div>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap' as const, marginBottom:12 }}>
                    {[
                      { label:'Full Feasibility Report', prompt:`Generate a professional real estate feasibility study for a US residential development in ${feasCity}. Project: ${feasSF.toLocaleString()} SF single-family home. Land: $${feasLand.toLocaleString()}. Hard cost: $${feasHard}/SF ($${(feasSF*feasHard).toLocaleString()} total). Soft cost: $${feasSoft}/SF. Total development cost: $${(feasLand+feasSF*feasHard+feasSF*feasSoft).toLocaleString()}. Target sale: $${feasSale.toLocaleString()}. Include: executive summary, market analysis, development budget, pro forma P&L, sensitivity analysis (±10% sale price, ±15% hard cost), ROI/IRR/NPV, risk factors, and go/no-go recommendation. Professional format for investor presentation.` },
                      { label:'Market Analysis', prompt:`Generate a detailed real estate market analysis for ${feasCity} — residential development. Include: current median prices, price per SF trends (2023–2026), absorption rate, days on market, supply/demand dynamics, major employer base, population growth, permit activity, competitive landscape (tract vs custom builders), and 12-month outlook. Data-driven analysis for development decision-making.` },
                      { label:'Investor Summary (1 page)', prompt:`Create a concise 1-page investor summary for a residential development in ${feasCity}. Project: ${feasSF.toLocaleString()} SF home, total cost $${(feasLand+feasSF*feasHard+feasSF*feasSoft).toLocaleString()}, target sale $${feasSale.toLocaleString()}, projected ROI ${(((feasSale-(feasLand+feasSF*feasHard+feasSF*feasSoft))/(feasLand+feasSF*feasHard+feasSF*feasSoft))*100).toFixed(1)}%. Format for angel investors/family offices. Include deal highlights, use of funds, timeline, exit strategy, and risk mitigation.` },
                    ].map(btn => (
                      <button key={btn.label} style={s.btn} onClick={async () => {
                        setFeasAILoading(true)
                        const r = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'},
                          body: JSON.stringify({ messages:[{ role:'user', content: btn.prompt }] }) })
                        const d = await r.json()
                        setFeasAI(d.content?.[0]?.text || '')
                        setFeasAILoading(false)
                      }}>🤖 {btn.label}</button>
                    ))}
                  </div>
                  {feasAILoading && <div style={{ textAlign:'center' as const, color:'#58a6ff', padding:16 }}>⏳ AI generating feasibility report...</div>}
                  {feasAI && !feasAILoading && (
                    <>
                      <div style={s.pre}>{feasAI}</div>
                      <button onClick={() => setPrintData({ title:'AI Feasibility Analysis Report', content: feasAI })}
                        style={{ marginTop:8, padding:'5px 12px', background:'#185FA520', border:'1px solid #185FA540', borderRadius:7, color:'#58a6ff', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                        🖨️ Imprimir / Compartilhar
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      </div>
      {printData && (
        <PrintShareModal
          title={printData.title}
          onClose={() => setPrintData(null)}
          buildHtml={() => `<h2>Report</h2><div class="text-area">${printData.content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br/>')}</div>`}
          buildText={() => printData.content}
        />
      )}
    </>
  )
}
