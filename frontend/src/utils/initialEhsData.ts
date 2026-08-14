import { Incident, HiraAssessment, SafetyAudit, TrainingRecord, Permit } from '../types';

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: "INC-2026-001",
    titleEn: "Spark Ignition Near Coal Conveyor Belt",
    titleAr: "اشتعال شرارة بالقرب من سير ناقل الفحم",
    type: "NEAR_MISS",
    date: "2026-06-02",
    time: "10:15",
    locationEn: "Coal Shredding Area (Line 1)",
    locationAr: "منطقة تفتيت الفحم (الخط 1)",
    descriptionEn: "During maintenance of coal grinding grinder, a mechanic utilized an angle grinder without placing sparks shields in position. Hot sparks flew towards the coal dust accumulation buffer. A minor smolder was observed and quickly extinguished using a portable CO2 dry powder extinguisher.",
    descriptionAr: "أثناء صيانة طاحونة الفحم، استخدم فني ميكانيكي صاروخ التجليخ دون وضع حواجز حماية الشرر. تطاير الشرر الحار نحو منطقة تجمع غبار الفحم. لوحظ تصاعد دخان بسيط وتم إخماده فوراً باستخدام مطفأة غاز ثاني أكسيد الكربون المحمولة.",
    severity: "MEDIUM",
    reportedByName: "Eng. Ali Abdullah",
    reportedByRoleEn: "Electrical Manager",
    reportedByRoleAr: "رئيس إدارة الكهرباء والـ LOTO",
    status: "INVESTIGATING",
    
    // RCA 5 Whys
    why1En: "Why did the smolder occur? Hot sparks landed directly on coal dust accumulations on the floor.",
    why1Ar: "لماذا تصاعد الدخان؟ تطاير الشرر الساخن مباشرة على تراكمات غبار الفحم على الأرض الفرعية.",
    why2En: "Why did sparks reach the dust? No sparks enclosure or fire-resistant blankets were deployed.",
    why2Ar: "لماذا وصل الشرر إلى الغبار؟ عدم استخدام بطانيات مقاومة للحريق أو حواجز احتواء الشرر.",
    why3En: "Why were fire blankets not deployed? The worker assumed the area was clean and dust-free.",
    why3Ar: "لماذا لم يتم استخدام حواجز الشرر؟ افترض العامل خطأً أن المنطقة بأكملها كانت نظيفة وخالية من الغبار دائمًا.",
    why4En: "Why was there a false assumption? Joint pre-job hazards assessment (HIRA) was not thoroughly reviewed at the site prior to start.",
    why4Ar: "لماذا افترض العامل ذلك؟ لم يتم مراجعة تقييم المخاطر الميداني المشترك (HIRA) بدقة في الموقع قبل البدء.",
    why5En: "Why was HIRA not reviewed? Time pressure to execute coal line repairs to restart production.",
    why5Ar: "لماذا لم يراجعوا تقييم المخاطر؟ ضغوط الوقت لإنجاز إصلاحات خط الفحم واستئناف الإنتاج ومعدلات التشغيل.",
    rootCauseEn: "Production rush led to failure to secure hot work workspace and lack of safety oversight verification.",
    rootCauseAr: "استعجال خط الإنتاج أدى إلى التغاضي عن تأمين منطقة العمل الساخن وغياب التحقق الرقابي من سلامة الإجراءات الميدانية.",
    
    capaActions: [
      {
        id: "CAPA-001A",
        actionEn: "Procure and distribute 15 industrial heavy-duty fire retardant blankets for coal grinding zones.",
        actionAr: "شراء وتوزيع 15 بطانية مقاومة للحريق عالية الجودة مخصصة لمناطق مطاحن الفحم.",
        assignedDepartmentEn: "HSE & Purchasing",
        assignedDepartmentAr: "السلامة والمشتريات",
        dueDate: "2026-06-15",
        status: "DONE"
      },
      {
        id: "CAPA-001B",
        actionEn: "Re-train all mechanical maintenance contractors on hot-work permit checklist procedures.",
        actionAr: "إعادة تدريب جميع مقاولي الصيانة الميكانيكية على إجراءات الفحص الخاصة بتصاريح العمل الساخن.",
        assignedDepartmentEn: "Training",
        assignedDepartmentAr: "التدريب والتطوير",
        dueDate: "2026-06-25",
        status: "PENDING"
      }
    ]
  },
  {
    id: "INC-2026-002",
    titleEn: "Worker Hand Guard Contact with Conveyor Pulley",
    titleAr: "ملامسة وقاء يد أحد العمال لبكرة السير الناقل",
    type: "ACCIDENT",
    date: "2026-05-28",
    time: "14:40",
    locationEn: "Cement Clinker discharge conveyor 12B",
    locationAr: "ناقل الكلنكر الخارج من الفرن 12B",
    descriptionEn: "While clear-up worker was cleaning clinker overflow dust from around the tail pulley frame with a hand shovel, the moving conveyor pulled the shovel tip, causing their gloved left hand to hit the guard rail. Minor wrist strain was treated at the plant clinic.",
    descriptionAr: "أثناء قيام عامل بتنظيف غبار الكلنكر حول بكرة ذيل الناقل باستخدام مجرفة يدوية أثناء عمل الناقل، سحب السير المتحرك طرف المجرفة، مما أدى إلى ارتطام يده اليسرى المحمية بقفاز بمجرى الوقاء الحديدي. تم علاج التواء طفيف بالمعصم في عيادة المصنع.",
    severity: "HIGH",
    reportedByName: "Eng. Turki Al-Yousef",
    reportedByRoleEn: "Production Manager",
    reportedByRoleAr: "مدير التشغيل والتحكم",
    status: "CLOSED",
    
    why1En: "Why did the injury occur? The clean-up shovel got caught in the moving belt-pulley gap.",
    why1Ar: "لماذا حدثت الإصابة؟ انحشرت مجرفة التنظيف اليدوية في فجوة البكرة والسير المتحرك.",
    why2En: "Why was clean-up happening near moving parts? The worker was scraping clinker while the belt was live.",
    why2Ar: "لماذا تم التنظيف بجوار الأجزاء المتحركة؟ كان العامل يزيل الكلنكر يدوياً أثناء تشغيل سير النقل.",
    why3En: "Why was the belt running? No energy isolation (LOTO) was requested, as the worker believed it was a 2-minute minor task.",
    why3Ar: "لماذا كان السير يعمل؟ لم يتم طلب عزل الطاقة (LOTO) لاعتقاد العامل أن العمل بسيط ولن يستغرق سوى دقيقتين فقط.",
    why4En: "Why did the worker clean without LOTO? Lack of hazard awareness and complacency about conveyors.",
    why4Ar: "لماذا نظف العامل دون عزل؟ ضعف الوعي بالمخاطر الميدانية والتهاون في التعامل مع خطورة السيور المتحركة.",
    why5En: "Why did safety supervisor not stop it? Work area was located underneath Clinker silo mezzanine, poorly lit and out of direct line of sight.",
    why5Ar: "لماذا لم يوقفه مشرف السلامة؟ كانت منطقة العمل تقع أسفل ميزانين صومعة الكلنكر، بإضاءة ضعيفة وخارج نطاق الرؤية المباشرة.",
    rootCauseEn: "Routine clean-up carried out on running machinery without obtaining a Cold Work permit & applying standard Lockout/Tagout.",
    rootCauseAr: "تنفيذ أعمال تنظيف روتينية على معدات تدور دون إصدار تصريح عمل بارد مسبق وتطبيق بروتوكول عزل الطاقة المعتمد (LOTO).",
    
    capaActions: [
      {
        id: "CAPA-002A",
        actionEn: "Install permanent mesh enclosing barriers on tail pulleys of conveyors 12A/12B to prevent any reach-in.",
        actionAr: "تركيب شبك حماية مغلق ودائم حول بكرات الذيل بالسيور 12A/12B لمنع أي وصول مادي للأجزاء الدورية.",
        assignedDepartmentEn: "Engineering & Mechanical",
        assignedDepartmentAr: "إدارة الصيانة",
        dueDate: "2026-06-05",
        status: "DONE"
      },
      {
        id: "CAPA-002B",
        actionEn: "Ensure positive lock controls. Shift clean-up times strictly during planned mechanical shutdown slots only.",
        actionAr: "تأمين التحكم الإيجابي. جدولة عمليات تنظيف السيور وصيانتها حصريًا أثناء فترات التوقف المخططة.",
        assignedDepartmentEn: "Production & Operations",
        assignedDepartmentAr: "إدارة الإنتاج والتشغيل",
        dueDate: "2026-06-10",
        status: "DONE"
      }
    ]
  }
];

export const INITIAL_HIRAS: HiraAssessment[] = [
  {
    id: "HIRA-2026-001",
    taskEn: "Welding repairs inside Cement Mill Shell",
    taskAr: "أعمال لحام وإصلاحات داخل غلاف طاحونة الإسمنت",
    areaEn: "Cement Grinding Area Line 2",
    areaAr: "منطقة طواحين الإسمنت - الخط 2",
    hazardEn: "Confined Space Atmosphere depletion & electrocution from high-voltage milling drives",
    hazardAr: "نقص الأكسجين والغازات بالبيئة المغلقة والصعق الميكانيكي من محركات الطحن عالية الجهد",
    consequenceEn: "Asphyxiation, toxic gases poisoning, fatal electric shock from accidental mill rotation",
    consequenceAr: "الاختناق، التسمم بالغازات السامة، صدمة كهربائية قاتلة جراء الدوران الفجائي للطاحونة أو التعثر.",
    
    initialLikelihood: 4,
    initialSeverity: 5,
    initialRiskScore: 20, // Critical
    
    controls: {
      eliminationEn: "Not feasible as structural crack repair requires internal arc weld fusing.",
      eliminationAr: "غير ممكن للإزالة نظراً لأن علاج الشروخ الهيكلية يتطلب صهر ولحام القوس الكهربائي الداخلي.",
      substitutionEn: "Not applicable.",
      substitutionAr: "غير متوفر بدائل في هذا الإجراء ميكانيكياً.",
      engineeringEn: "Full electrical circuit breaker isolation with lockout keys (LOTO). Mechanical pinning of mill shell to prevent rolling. Mandatory forced exhaust fans air replacement.",
      engineeringAr: "عزل كامل للدائرة الكهربائية من القاطع الرئيسي ووضع قفل الأمان (LOTO). تثبيت ميكانيكي لغلاف الطاحونة بالأوتاد ودفع هواء قسري بمراوح شفط وطرد متواصلة.",
      administrativeEn: "Atmospheric test by certified Gas Tester before entry (O2, CO, LEL). Confined Entry Entry Logbook. Station safety watcher continuously at manhole.",
      administrativeAr: "فحص الغازات والهواء بجهاز معاير ومعتمد (للأكسجين، CO، الغازات المتفجرة) قبل المباشرة. تعبئة سجل الدخول والتحكم، وتواجد مراقب سلامة مستمر عند فتحة الدخول.",
      ppeEn: "Double flame retardant overalls, safety harness joined to extraction line, safety helmet, steel boots, safety glasses.",
      ppeAr: "بدلة وقاية مزدوجة ومقاومة للشرر والحرارة، حزام أمان ثلاثي النقاط متصل بحبل إنقاذ، خوذة سلامة، حذاء سلامة فولاذي، نظارة واقية عازلة للشرار."
    },
    
    residualLikelihood: 1,
    residualSeverity: 4,
    residualRiskScore: 4, // Low Green
    status: "APPROVED",
    assessedBy: "Eng. Ahmed Al-Monafed",
    date: "2026-06-03",
    approvedBy: "Eng. Asaad Al-Shamrani",
    approvedAt: "2026-06-04"
  },
  {
    id: "HIRA-2026-002",
    taskEn: "Structural beam inspection on top of Cyclone Preheater 4",
    taskAr: "فحص الكمرات والمقاطع الهيكلية أعلى برج التسخين المسبق الرابع",
    areaEn: "Clinker Pyroprocessing Tower",
    areaAr: "برج تسخين ومعالجة الكلنكر (الفرن)",
    hazardEn: "Working at elevation (52 meters), high thermal ambient heat draft, strong winds",
    hazardAr: "العمل على ارتفاعات شاهقة (52 مترًا)، تيارات حرارية لافحة، رياح شديدة مفاجئة",
    consequenceEn: "Catastrophic fall from height, dropped objects injuring workers beneath, heat exhaustion",
    consequenceAr: "السقوط الكارثي من المرتفعات، سقوط الأدوات وإصابة العمال في المستويات الدنيا، الإجهاد الحراري.",
    
    initialLikelihood: 4,
    initialSeverity: 5,
    initialRiskScore: 20, // Critical
    
    controls: {
      eliminationEn: "Minimize duration. Combine with thermal drone inspections where possible.",
      eliminationAr: "تقليل فترات البقاء لأدنى حد. محاولة دمج الفحص الميداني بالطائرة بدون طيار الحرارية متى أمكن.",
      substitutionEn: "Not applicable.",
      substitutionAr: "لا تتوفر بدائل في هذا الصدد.",
      engineeringEn: "Install permanent guardrails with toe boards. Anchor points tested for 22kN impact. Restrict site access trapdoors.",
      engineeringAr: "تركيب درابزين حديدي دائم مع حواف سفلية مانعة للتدحرج وتوفير نقاط ربط معتمدة ومختبرة لقوة شد 22 كيلو نيوتن. غلق أبواب الصعود للبرج.",
      administrativeEn: "Inspect scaffold stability certificated green tag. Mandatory buddy system. Strict restriction of works if wind exceeds 20 knots. Heat breaks with emergency electrolyte liquids provided.",
      administrativeAr: "فحص متانة السقالات مع تعليق بطاقة السلامة الخضراء للتأكيد. تفعيل نظام الفحص الثنائي (Buddy System). إيقاف فوري للعمل في حال زيادة سرعة الرياح عن 20 عقدة. توفير مستحضرات معالجة الجفاف السريع.",
      ppeEn: "Double lanyard shock absorbing harness, tool lanyards for hand wrenches, heavy-duty gloves, UV face shield.",
      ppeAr: "حزام أمان ذو حبلين ممتص للصدمات، حبال تثبيت المعدات اليدوية لمنع سقوطها، قفازات جلدية خشنة، قناع واقي من الشمس والأشعة فوق البنفسجية."
    },
    
    residualLikelihood: 2,
    residualSeverity: 3,
    residualRiskScore: 6, // Low-Medium
    status: "PENDING_HSE",
    assessedBy: "Eng. Ahmed Al-Monafed",
    date: "2026-06-08"
  }
];

export const INITIAL_AUDITS: SafetyAudit[] = [
  {
    id: "AUDIT-2026-001",
    titleEn: "Electrical LOTO Compliance & Panel Isolation Review",
    titleAr: "تدقيق التوافق مع بروتوكول عزل الطاقة LOTO وعزل اللوحات الكهربائية",
    conductedBy: "Eng. Asaad Al-Shamrani",
    date: "2026-06-05",
    status: "COMPLETED",
    score: 83.3, // 5 compliant out of 6
    items: [
      {
        id: "it-1",
        labelEn: "Physical Padlocks and LOTO stations are fully stocked in high-voltage room.",
        labelAr: "محطات الأقفال وبطاقات العزل البدنية متوفرة ومجهزة بالكامل بغرفة الجهد العالي.",
        compliance: "COMPLIANT"
      },
      {
        id: "it-2",
        labelEn: "Permit records correspond step-by-step with mechanical locking sequences.",
        labelAr: "سجلات تراخيص تصاريح العمل تتطابق خطوة بخطوة مع كشوفات قفل العزل الميكانيكي.",
        compliance: "COMPLIANT"
      },
      {
        id: "it-3",
        labelEn: "Electrical circuits verification test (Dead-Test) performed before permit signoff.",
        labelAr: "إجراء فحص خلو الدوائر والأسلاك من أي تيار (فحص الجهد الصفري) قبل اعتماد التصريح.",
        compliance: "COMPLIANT"
      },
      {
        id: "it-4",
        labelEn: "Contractors' personal locks are applied during active shift handovers.",
        labelAr: "المقاولون يستخدمون أقفالهم الشخصية الخاصة بكل وردية عمل أثناء تبادل المناوبات.",
        compliance: "NON_COMPLIANT",
        comment: "Found two sub-contractors on Mill 2 working under the plant mechanical department master lock rather than applying their own personalized locks. Serious safety violation."
      },
      {
        id: "it-5",
        labelEn: "Clear labeling exists on all Isolator Breakers identifying the related machine.",
        labelAr: "وجود ملصقات واضحة على جميع قواطع العزل لتعريف الآلة المرتبطة بها.",
        compliance: "COMPLIANT"
      },
      {
        id: "it-6",
        labelEn: "Authorized personnel list is posted visible at the isolation room entrance.",
        labelAr: "قائمة الكفاءات والأشخاص المصرح لهم بالدخول معلقة بوضوح على بوابة غرفة العزل.",
        compliance: "COMPLIANT"
      }
    ],
    correctiveActionsNeeded: "Issue direct safety reminder to maintenance contractors. Mandate personal lock sets for all contractual workers during mill shutdowns."
  }
];

export const INITIAL_TRAINING: TrainingRecord[] = [
  {
    id: "TR-001",
    titleEn: "NEBOSH IGC Safety and Compliance Masterclass",
    titleAr: "دورة شهادة نيبوش الدولية العامة في السلامة كفاءة الامتثال",
    providerEn: "British safety Council Institute",
    providerAr: "معهد مجلس السلامة البريطاني المعتمد",
    attendees: ["Eng. Asaad Al-Shamrani", "Eng. Ahmed Al-Monafed", "Eng. Turki Al-Yousef"],
    date: "2024-06-15",
    expiryDate: "2029-06-15", // Active
    status: "ACTIVE"
  },
  {
    id: "TR-002",
    titleEn: "Confined Space Rescue & Gas Analysis Procedures",
    titleAr: "إجراءات رصد الغازات والإنقاذ في الأماكن المغلقة والصوامع",
    providerEn: "National Academy of Safety & Training",
    providerAr: "الأكاديمية الوطنية للتدريب والسلامة المهنية",
    attendees: ["Eng. Ahmed Al-Monafed", "Eng. Ali Abdullah", "Kamal Salem (Mechanical Supervisor)"],
    date: "2025-05-18",
    expiryDate: "2026-05-18", // Expired
    status: "EXPIRED"
  },
  {
    id: "TR-003",
    titleEn: "Lockout / Tagout (LOTO) Energy Isolation & Gold Standards",
    titleAr: "عزل الطاقة والبروتوكول الذهبي لتطبيق الأقفال LOTO",
    providerEn: "ISO45001 Global Audit Partners",
    providerAr: "شركاء التدقيق العالمي لمواصفة الأيزو 45001",
    attendees: ["Eng. Ali Abdullah", "Eng. Turki Al-Yousef", "Saeed Gamal (Electrical Supervisor)"],
    date: "2026-01-10",
    expiryDate: "2027-01-10", // Approaching expiry
    status: "ACTIVE"
  }
];

export const INITIAL_PERMITS_SEED: Permit[] = [
  {
    id: "PTW-HOT-2026-001",
    title: "Kiln Burner Burnout Nozzle Maintenance",
    type: "HOT",
    location: "Rotary Kiln Burner Platform",
    requesterName: "Eng. Ahmed Al-Monafed",
    requesterRoleAr: "مشرف الصيانة الميكانيكية",
    requesterRoleEn: "Maintenance Engineer",
    description: "Welding structural burner sleeve cover plate to avoid hot air leakages during kiln operation.",
    hazards: ["Fire / Explosion Hazard", "Severe Heat Burns (Kiln Clinker Walls)"],
    startDate: "2026-06-08",
    endDate: "2026-06-09",
    status: "ACTIVE",
    productionRequired: true,
    productionApproval: true,
    productionApprover: "Eng. Turki Al-Yousef",
    productionComment: "Kiln is backed down to warm status. Fully cleared for burner tube sleeve welding repairs.",
    productionApprovedAt: "2026-06-08 08:30",
    electricalRequired: true,
    electricalApproval: true,
    electricalApprover: "Eng. Ali Abdullah",
    electricalComment: "Kiln main drive motors are locked, isolated, and tagged under LOTO-KILN-099.",
    electricalApprovedAt: "2026-06-08 09:12",
    lotoRequired: true,
    lotoLockNumber: "L-KILN-099",
    lotoKeyNumber: "K-099-B",
    gasTestRequired: false,
    hseApproval: true,
    hseApprover: "Eng. Asaad Al-Shamrani",
    hseComment: "Fire watches are posted with 2 dry chemical extinguishers. Spark screens are set in place.",
    hseApprovedAt: "2026-06-08 10:00",
    requiredPPE: ["Safety Helmet", "Steel Toe Safety Shoes", "Safety Glasses", "Welding Heat-Resistant Gloves"],
    safetyPrecautionConfirmations: {
      "loto_chk": true,
      "fire_ext": true,
      "ppe_chk": true
    },
    workers: ["Bassem Jalal", "Saber Helmy"],
    auditTrail: [
      {
        id: "aud-1",
        timestamp: "2026-06-08 07:45",
        actionEn: "Permit draft created.",
        actionAr: "تم إنشاء مسودة التصريح.",
        actorName: "Eng. Ahmed Al-Monafed",
        actorRoleEn: "Maintenance Engineer",
        actorRoleAr: "مشرف الصيانة الميكانيكية",
        comment: "Urgent repair needed on the nozzle housing."
      },
      {
        id: "aud-2",
        timestamp: "2026-06-08 10:00",
        actionEn: "Final HSE review approved. Permit is live & active.",
        actionAr: "تم اعتماد مراجعة السلامة النهائية. التصريح مفعل وجار العمل.",
        actorName: "Eng. Asaad Al-Shamrani",
        actorRoleEn: "HSE Inspector",
        actorRoleAr: "مفتش السلامة المهنية",
        comment: "All conditions are verified safely."
      }
    ]
  }
];
