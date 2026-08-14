/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Permit, PermitType, PermitStatus, SandboxRole, UserProfile } from '../types';

const HASH_123 = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';

export const USER_PROFILES: Record<SandboxRole, UserProfile> = {
  REQUESTER: {
    empCode: 'EMP101',
    password: HASH_123,
    sandboxRole: 'REQUESTER',
    username: 'ahmad_eng',
    fullNameAr: 'م. أحمد المنفذ',
    fullNameEn: 'Eng. Ahmed Al-Monafed',
    fullNameZh: '艾哈迈德 工程师',
    roleAr: 'مشرف الفريق المنفذ',
    roleEn: 'Maintenance Engineer',
    roleZh: '维保工程师 / 申请人',
    departmentAr: 'إدارة الصيانة',
    departmentEn: 'Maintenance Administration',
    departmentZh: '维保管理部'
  },
  PRODUCTION: {
    empCode: 'EMP102',
    password: HASH_123,
    sandboxRole: 'PRODUCTION',
    username: 'turki_prod',
    fullNameAr: 'م. تركي اليوسف',
    fullNameEn: 'Eng. Turki Al-Yousef',
    fullNameZh: '图尔基 经理',
    roleAr: 'مدير التشغيل والتحكم (الإنتاج)',
    roleEn: 'Production Manager',
    roleZh: '生产经理 / 审批人',
    departmentAr: 'إدارة الإنتاج والتشغيل',
    departmentEn: 'Production & Operations Administration',
    departmentZh: '生产运营部'
  },
  ELECTRICAL: {
    empCode: 'EMP103',
    password: HASH_123,
    sandboxRole: 'ELECTRICAL',
    username: 'ali_elec',
    fullNameAr: 'م. علي عبد الله',
    fullNameEn: 'Eng. Ali Abdullah',
    fullNameZh: '阿里 经理',
    roleAr: 'رئيس إدارة الكهرباء والـ LOTO',
    roleEn: 'Electrical Manager',
    roleZh: '电气主管 / LOTO审批人',
    departmentAr: 'إدارة الكهرباء',
    departmentEn: 'Electrical Administration',
    departmentZh: '电气管理部'
  },
  HSE: {
    empCode: 'EMP104',
    password: HASH_123,
    sandboxRole: 'HSE',
    username: 'asaad_hse',
    fullNameAr: 'م. أسعد الشمراني',
    fullNameEn: 'Eng. Asaad Al-Shamrani',
    fullNameZh: '阿萨德 工程师',
    roleAr: 'مشرف سيفيتي (HSE Inspector)',
    roleEn: 'HSE Inspector',
    roleZh: '安全监督员 (HSE)',
    departmentAr: 'إدارة السلامة والصحة المهنية',
    departmentEn: 'Safety & Occupational Health Administration (HSE)',
    departmentZh: '安全健康与环保部 (HSE)'
  }
};

export const PERMIT_TYPES_INFO = {
  HOT: {
    labelAr: '🔥 تصريح عمل ساخن',
    labelEn: '🔥 Hot Work',
    labelZh: '🔥 动火作业',
    color: 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400',
    iconName: 'Flame'
  },
  COLD: {
    labelAr: '❄️ تصريح عمل بارد',
    labelEn: '❄️ Cold Work',
    labelZh: '❄️ 冷工作业',
    color: 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400',
    iconName: 'Droplets'
  },
  ELECTRICAL: {
    labelAr: '⚡ تصريح الأعمال الكهربائية',
    labelEn: '⚡ Electrical Work',
    labelZh: '⚡ 电气作业',
    color: 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400',
    iconName: 'Zap'
  },
  LOTO: {
    labelAr: '🔒 تصريح عزل الطاقة',
    labelEn: '🔒 LOTO / Energy Isolation',
    labelZh: '🔒 能量隔离',
    color: 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400',
    iconName: 'Lock'
  },
  HEIGHT: {
    labelAr: '🏗️ تصريح العمل على ارتفاع',
    labelEn: '🏗️ Work at Height',
    labelZh: '🏗️ 高处作业',
    color: 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400',
    iconName: 'ArrowUpCircle'
  },
  CONFINED: {
    labelAr: '🚪 تصريح دخول الأماكن المغلقة',
    labelEn: '🚪 Confined Space Entry',
    labelZh: '🚪 受限空间进入',
    color: 'border-amber-600 bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400',
    iconName: 'Box'
  },
  EXCAVATION: {
    labelAr: '⛏️ تصريح أعمال الحفر',
    labelEn: '⛏️ Excavation',
    labelZh: '⛏️ 挖掘作业',
    color: 'border-orange-600 bg-orange-50 text-orange-800 dark:bg-orange-950/20 dark:text-orange-400',
    iconName: 'Pickaxe'
  },
  LIFTING: {
    labelAr: '🏗️ تصريح عمليات الرفع',
    labelEn: '🏗️ Lifting Operations',
    labelZh: '🏗️ 吊装作业',
    color: 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400',
    iconName: 'Crane'
  },
  LINE_BREAKING: {
    labelAr: '☣️ تصريح فتح الخطوط والمعدات',
    labelEn: '☣️ Line Breaking',
    labelZh: '☣️ 管线打开',
    color: 'border-lime-600 bg-lime-50 text-lime-800 dark:bg-lime-950/20 dark:text-lime-400',
    iconName: 'Wrench'
  },
  CHEMICAL: {
    labelAr: '🧪 تصريح التعامل مع المواد الكيميائية',
    labelEn: '🧪 Hazardous Chemicals',
    labelZh: '🧪 危险化学品',
    color: 'border-pink-500 bg-pink-50 text-pink-700 dark:bg-pink-950/20 dark:text-pink-400',
    iconName: 'FlaskConical'
  }
};

export const STATUS_INFO = {
  DRAFT: {
    labelAr: 'مسودة',
    labelEn: 'Draft',
    labelZh: '草稿',
    color: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
  },
  PENDING_DEPT: {
    labelAr: 'قيد الاعتمادات المبدئية',
    labelEn: 'Pending Approvals',
    labelZh: '等待各部门审批',
    color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900'
  },
  HSE_REVIEW: {
    labelAr: 'مراجعة قسم السلامة',
    labelEn: 'HSE Review',
    labelZh: '安全环保部(HSE)审核',
    color: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900'
  },
  ACTIVE: {
    labelAr: 'نشط وساري',
    labelEn: 'Active',
    labelZh: '激活并生效中',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900'
  },
  PENDING_CLOSE: {
    labelAr: 'طلب الإغلاق الميداني',
    labelEn: 'Pending Closure',
    labelZh: '申请现场关闭',
    color: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900'
  },
  CLOSED: {
    labelAr: 'مغلق بأمان',
    labelEn: 'Closed',
    labelZh: '安全关闭并归档',
    color: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900'
  },
  SUSPENDED: {
    labelAr: 'معلّق مؤقتاً',
    labelEn: 'Suspended',
    labelZh: '已暂停',
    color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900'
  },
  REJECTED: {
    labelAr: 'مرفوض',
    labelEn: 'Rejected',
    labelZh: '已驳回',
    color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900'
  },
  EXPIRED: {
    labelAr: 'منتهي الصلاحية',
    labelEn: 'Expired',
    labelZh: '已过期',
    color: 'bg-rose-200 text-rose-900 border-rose-400 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
  }
};

export const STANDARD_PPES = [
  { id: 'helmet', labelAr: 'خوذة سلامة', labelEn: 'Safety Helmet' },
  { id: 'shoes', labelAr: 'حذاء سلامة مقاوم للمخاطر', labelEn: 'Steel Toe Safety Shoes' },
  { id: 'glasses', labelAr: 'نظارة حماية عازلة', labelEn: 'Safety Glasses' },
  { id: 'gloves_mech', labelAr: 'قفازات جلدية ميكانيكية', labelEn: 'Mechanical Leather Gloves' },
  { id: 'gloves_heat', labelAr: 'قفازات لحام عازلة للحرارة', labelEn: 'Welding Heat-Resistant Gloves' },
  { id: 'harness', labelAr: 'حزام أمان لكامل الجسم (ارتفاعات)', labelEn: 'Full-Body Safety Harness' },
  { id: 'mask_gas', labelAr: 'قناع تنفس مزود بفلتر غازات سامة', labelEn: 'Respirator mask with toxic gas filter' },
  { id: 'detector_gas', labelAr: 'جهاز رصد الغازات المحمول لدعم المراقبة', labelEn: 'Portable multi-gas detector' },
  { id: 'ear', labelAr: 'سدادات أذن مضادة للضوضاء العالية', labelEn: 'Ear Plugs / Muffs' },
  { id: 'vest', labelAr: 'سترة عاكسة للضوء عالية الوضوح', labelEn: 'High-Visibility Vest' }
];

export const STANDARD_HAZARDS = [
  { id: 'fire', labelAr: 'حريق - انفجار جراء الغازات أو الأخشاب', labelEn: 'Fire / Explosion Hazard' },
  { id: 'toxic_gas', labelAr: 'اختناق أو انبعاث غازات سامة (CO, H2S)', labelEn: 'Suffocation / Toxic Gases (CO, H2S)' },
  { id: 'falling', labelAr: 'سقوط من مرتفع أو انزلاق', labelEn: 'Fall from Height / Slip and Trip' },
  { id: 'electrocution', labelAr: 'صعق كهربائي جراء تشغيل خط إنتاج نشط', labelEn: 'Electrocution / Physical Contact with Live Wires' },
  { id: 'heat_burn', labelAr: 'حروق من أسطح حارة (جدار الفرن اللافح)', labelEn: 'Severe Heat Burns (Kiln Clinker Walls)' },
  { id: 'entrapment', labelAr: 'انحشار داخل تروس وناقل الحركة المعدني', labelEn: 'Entrapment / Pinched by Rotating Gears' },
  { id: 'dust', labelAr: 'تطاير غبار الإسمنت الكثيف (أضرار بالعين/التنفس)', labelEn: 'Heavy Particulate Cement Dust Exposure' }
];

export const PRECAUTIONS = [
  { id: 'loto_chk', labelAr: 'تطبيق إجراءات عزل الطاقة وتثبيت الأقفال LOTO', labelEn: 'Ensure physical LOTO application on the circuit breaker' },
  { id: 'gas_chk', labelAr: 'فحص الهواء والغازات في الصوامع قبل دخول العمال', labelEn: 'Perform gas test before allowing entry' },
  { id: 'fire_ext', labelAr: 'توفير طفايات حريق صالحة ومنتشرة بموقع اللحام', labelEn: 'Place functioning fire extinguishers next to hot zone' },
  { id: 'scaffold_chk', labelAr: 'فحص تماسك وصلاحية السقالة وتعليق كارت الأمان المعتمد', labelEn: 'Inspect scaffold and tag green tag safety cert' },
  { id: 'supervisor_chk', labelAr: 'تواجد مراقب دائم على باب الغرفة المغلقة طوال فترة العمل', labelEn: 'Station a continuous standby watcher at the entrance' },
  { id: 'ppe_chk', labelAr: 'التثبت النهائي من ارتداء الجميع لمعدات الوقاية الشخصية', labelEn: 'Verify all staff are strictly wearing required PPE' },
  { id: 'isolation_chk', labelAr: 'إغلاق المحابس وتفريغ السوائل والمواد الناعمة بالسيور', labelEn: 'Close feed valves and flush continuous belts' }
];

export const INITIAL_PERMITS: Permit[] = [];

// === NEBOSH Gap A: Control Measures / Safety Precautions ===
export const NEBOSH_CONTROL_MEASURES = [
  { id: 'area_barricaded', labelAr: 'تم تسوير / تطويق منطقة العمل بالحواجز', labelEn: 'Work area barricaded / cordoned off' },
  { id: 'fire_extinguisher', labelAr: 'تم وضع طفاية حريق صالحة في موقع العمل', labelEn: 'Fire extinguisher positioned at work site' },
  { id: 'adjacent_isolated', labelAr: 'تم عزل المعدات والأنابيب المجاورة', labelEn: 'Adjacent equipment / pipelines isolated' },
  { id: 'area_ventilated', labelAr: 'تم تهوية منطقة العمل / توفير هواء قسري', labelEn: 'Work area ventilated / forced air supply' },
  { id: 'hot_surfaces_cooled', labelAr: 'تم تبريد / عزل الأسطح الساخنة', labelEn: 'Hot surfaces cooled / insulated' },
  { id: 'spill_containment', labelAr: 'تم وضع وسائل احتواء التسرب والصرف', labelEn: 'Drainage / spill containment in place' },
  { id: 'warning_signs', labelAr: 'تم وضع لافتات التحذير والحواجز الإرشادية', labelEn: 'Warning signs / barriers posted' },
  { id: 'personnel_notified', labelAr: 'تم إخطار جميع الأفراد المتأثرين', labelEn: 'All affected personnel notified' },
];

// === NEBOSH Gap D: Type-Specific Safety Conditions ===
export const HOT_WORK_CONDITIONS = [
  { id: 'hw_fire_watch_assigned', labelAr: 'تم تعيين مراقب حريق (Fire Watch)', labelEn: 'Fire watch person assigned', type: 'checkbox' as const },
  { id: 'hw_combustibles_removed', labelAr: 'تم إزالة المواد القابلة للاشتعال في نطاق 11 متر', labelEn: 'Combustible materials removed within 11m radius', type: 'checkbox' as const },
  { id: 'hw_fire_watch_person', labelAr: 'اسم مراقب الحريق المعين', labelEn: 'Fire watch assigned person name', type: 'text' as const },
  { id: 'hw_fire_watch_duration', labelAr: 'مدة مراقبة الحريق بعد الانتهاء (بالدقائق)', labelEn: 'Fire watch duration after completion (min)', type: 'number' as const },
  { id: 'hw_vapour_test', labelAr: 'نتيجة فحص الأبخرة القابلة للاشتعال', labelEn: 'Flammable vapour test result', type: 'text' as const },
];

export const CONFINED_SPACE_CONDITIONS = [
  { id: 'cs_continuous_monitoring', labelAr: 'تم تفعيل المراقبة الجوية المستمرة', labelEn: 'Continuous atmospheric monitoring active', type: 'checkbox' as const },
  { id: 'cs_standby_person', labelAr: 'اسم الشخص المناوب عند المدخل', labelEn: 'Standby person assigned at entry', type: 'text' as const },
  { id: 'cs_rescue_equipment', labelAr: 'تم تجهيز معدات الإنقاذ (حامل ثلاثي)', labelEn: 'Rescue tripod / equipment staged', type: 'checkbox' as const },
  { id: 'cs_entry_log', labelAr: 'يتم تسجيل حركة الدخول والخروج', labelEn: 'Entry/exit log maintained', type: 'checkbox' as const },
  { id: 'cs_communication', labelAr: 'وسيلة الاتصال بين العامل والمراقب', labelEn: 'Communication method (entrant ↔ standby)', type: 'text' as const },
];

export const HEIGHT_WORK_CONDITIONS = [
  { id: 'ht_scaffold_cert', labelAr: 'شهادة فحص السقالة سارية المفعول', labelEn: 'Scaffold inspection certificate valid', type: 'checkbox' as const },
  { id: 'ht_anchor_points', labelAr: 'تم فحص نقاط تثبيت حزام الأمان', labelEn: 'Fall arrest anchor points inspected', type: 'checkbox' as const },
  { id: 'ht_exclusion_zone', labelAr: 'تم إنشاء منطقة حظر أسفل موقع العمل', labelEn: 'Exclusion zone below work area established', type: 'checkbox' as const },
  { id: 'ht_rescue_plan', labelAr: 'خطة إنقاذ العامل المعلق جاهزة', labelEn: 'Rescue plan for suspended worker ready', type: 'checkbox' as const },
];

// === NEBOSH Gap F: Communication Methods ===
export const COMMUNICATION_METHODS = [
  { id: 'radio', labelAr: 'جهاز لاسلكي (راديو)', labelEn: 'Two-way Radio' },
  { id: 'phone', labelAr: 'هاتف محمول', labelEn: 'Mobile Phone' },
  { id: 'visual', labelAr: 'إشارات بصرية', labelEn: 'Visual Signals' },
  { id: 'intercom', labelAr: 'نظام اتصال داخلي', labelEn: 'Intercom System' },
  { id: 'runner', labelAr: 'شخص مسؤول عن نقل الرسائل', labelEn: 'Designated Runner' },
];

// === NEBOSH Gap I: Hand-back / Closure Checklist ===
export const HANDBACK_CHECKLIST = [
  { id: 'hb_area_cleaned', labelAr: 'تم تنظيف واستعادة منطقة العمل', labelEn: 'Work area cleaned and restored' },
  { id: 'hb_workers_accounted', labelAr: 'تم التأكد من مغادرة جميع العمال', labelEn: 'All workers accounted for' },
  { id: 'hb_tools_removed', labelAr: 'تم إزالة جميع الأدوات والمعدات', labelEn: 'All tools and equipment removed' },
  { id: 'hb_isolation_restored', labelAr: 'تم إزالة العزل المؤقت / استعادة الدائم', labelEn: 'Temporary isolation removed / permanent restored' },
  { id: 'hb_area_safe', labelAr: 'المنطقة آمنة للعمليات الاعتيادية', labelEn: 'Area safe for normal operations' },
];

// === NEBOSH Gap C: Worker Certification Types ===
export const WORKER_CERTIFICATIONS = [
  { id: 'cert_hot_work', labelAr: 'شهادة أعمال اللحام والقطع', labelEn: 'Hot Work Certification' },
  { id: 'cert_confined', labelAr: 'شهادة الدخول للأماكن المغلقة', labelEn: 'Confined Space Entry Certification' },
  { id: 'cert_height', labelAr: 'شهادة العمل على المرتفعات', labelEn: 'Working at Height Certification' },
  { id: 'cert_loto', labelAr: 'شهادة عزل الطاقة LOTO', labelEn: 'LOTO Energy Isolation Certification' },
  { id: 'cert_first_aid', labelAr: 'شهادة الإسعافات الأولية', labelEn: 'First Aid Certification' },
  { id: 'cert_fire_warden', labelAr: 'شهادة مراقب الحريق', labelEn: 'Fire Warden Certification' },
];

// === MOCK DATA FOR NEW 5-STEP WIZARD ===
export const MOCK_HIRAS = [
  { id: 'hira-001', title: 'HIRA: صيانة المضخة الرئيسية (Main Pump Maintenance)', hazards: ['تسرب كيميائي', 'كهرباء جهد عالي', 'انزلاق وتعثر'] },
  { id: 'hira-002', title: 'HIRA: لحام أنابيب الغاز (Gas Pipe Welding)', hazards: ['حريق وانفجار', 'أبخرة سامة', 'درجات حرارة عالية'] },
  { id: 'hira-003', title: 'HIRA: تنظيف خزان الوقود (Fuel Tank Cleaning)', hazards: ['اختناق', 'مواد قابلة للاشتعال', 'إضاءة ضعيفة'] },
];

export const MOCK_WORKERS = [
  { id: 'EMP101', name: 'م. أحمد المنفذ', role: 'مشرف الصيانة والتنفيذ', certifications: ['cert_loto', 'cert_hot_work'] },
  { id: 'EMP102', name: 'م. تركي اليوسف', role: 'مدير التشغيل والإنتاج', certifications: ['cert_loto', 'cert_confined'] },
  { id: 'EMP103', name: 'م. علي عبد الله', role: 'رئيس قسم الكهرباء والـ LOTO', certifications: ['cert_loto', 'cert_height'] },
  { id: 'EMP104', name: 'م. أسعد الشمراني', role: 'مدير السلامة والصحة المهنية (HSE)', certifications: ['cert_confined', 'cert_hot_work', 'cert_loto', 'cert_height'] },
  { id: 'EMP105', name: 'كمال سالم', role: 'فني أول ميكانيكا وصيانة', certifications: ['cert_loto'] },
  { id: 'EMP106', name: 'باسم جلال', role: 'فني كهرباء وعزل معتمد', certifications: ['cert_loto'] },
  { id: 'EMP107', name: 'صابر حلمي', role: 'فاحص غازات واقتحام أماكن مغلقة', certifications: ['cert_confined'] },
  { id: 'EMP108', name: 'سعيد جمال', role: 'فني أعمال ساخنة ولحام', certifications: ['cert_hot_work'] }
];

// === PDF Checklists (A to G) ===
export const PDF_CHECKLISTS = {
  ppe: [
    { id: 'ppe_dust_mask', labelAr: 'كمامة أتربة', labelEn: 'Dust Mask' },
    { id: 'ppe_safety_glasses', labelAr: 'نظارات عمل', labelEn: 'Safety Glasses' },
    { id: 'ppe_mech_gloves', labelAr: 'كفوف ميكانيك', labelEn: 'Mechanical Gloves' },
    { id: 'ppe_oil_gloves', labelAr: 'كفوف زيت وشحم', labelEn: 'Oil & Grease Gloves' },
    { id: 'ppe_elec_gloves', labelAr: 'كفوف كهرباء', labelEn: 'Electrical Gloves' },
    { id: 'ppe_ear_plugs', labelAr: 'سدادة الاذن', labelEn: 'Ear Plugs' },
    { id: 'ppe_weld_face', labelAr: 'واقي وجه لحام', labelEn: 'Welding Face Shield' },
    { id: 'ppe_weld_mask', labelAr: 'كمامة غازات لحام', labelEn: 'Welding Gas Mask' },
    { id: 'ppe_weld_jacket', labelAr: 'جاكيت لحام', labelEn: 'Welding Jacket' },
    { id: 'ppe_weld_suit', labelAr: 'بدلة لحام', labelEn: 'Welding Suit' },
    { id: 'ppe_weld_gloves', labelAr: 'كفوف لحام', labelEn: 'Welding Gloves' },
    { id: 'ppe_thermal_suit', labelAr: 'بدلة حرارية', labelEn: 'Thermal Suit' },
    { id: 'ppe_head_shoulder', labelAr: 'حزمله رأس وكتف', labelEn: 'Head & Shoulder Cover' },
    { id: 'ppe_safety_harness', labelAr: 'حزام أمان', labelEn: 'Safety Harness' },
    { id: 'ppe_single_lanyard', labelAr: 'سنجل لانيارد', labelEn: 'Single Lanyard' },
    { id: 'ppe_double_lanyard', labelAr: 'دبل لانيارد', labelEn: 'Double Lanyard' },
    { id: 'ppe_clear_face', labelAr: 'واقي وجه شفاف', labelEn: 'Clear Face Shield' },
    { id: 'ppe_rubber_boots', labelAr: 'حذاء مطاطي برقبة', labelEn: 'Rubber Boots' },
    { id: 'ppe_chem_gloves', labelAr: 'كفوف مواد كيميائية', labelEn: 'Chemical Gloves' },
    { id: 'ppe_coal_suit', labelAr: 'بدلة فحم', labelEn: 'Coal Suit' },
    { id: 'ppe_breathing_app', labelAr: 'جهاز تنفس', labelEn: 'Breathing Apparatus' },
    { id: 'ppe_heat_gloves', labelAr: 'كفوف حراري', labelEn: 'Heat Resistant Gloves' },
    { id: 'ppe_gas_weld_goggles', labelAr: 'نظارة لحام غاز', labelEn: 'Gas Welding Goggles' },
  ],
  general: [
    { id: 'gen_hira', labelAr: 'تم إعداد تقييم المخاطر وتمت مناقشته خلال ملخص السلامة قبل العمل', labelEn: 'HIRA prepared and discussed during safety briefing' },
    { id: 'gen_ppe', labelAr: 'تم توفير مهمات الوقاية الشخصية المطلوبة في القسم (A) وهي بحالة جيدة', labelEn: 'Required PPE provided and in good condition' },
    { id: 'gen_lighting', labelAr: 'الإضاءة الكافية متوفرة', labelEn: 'Sufficient lighting provided' },
    { id: 'gen_access', labelAr: 'الوصول آمن لمكان العمل ولا يوجد خطر سقوط', labelEn: 'Safe access to workplace without fall hazard' },
    { id: 'gen_clear_area', labelAr: 'مكان العمل خالي من أي معوقات', labelEn: 'Workplace free of obstacles' },
    { id: 'gen_isolate_hazards', labelAr: 'تم عزل جميع المخاطر بالمكان', labelEn: 'All hazards isolated' },
    { id: 'gen_tools_inspected', labelAr: 'تم فحص العدد وهي آمنة ومناسبة للعمل وغير مصنعة داخلياً', labelEn: 'Tools inspected, safe, suitable, and not homemade' },
    { id: 'gen_trained_team', labelAr: 'جميع افراد الفريق مدربين ومؤهلين لأداء العمل', labelEn: 'All team members trained and qualified' },
    { id: 'gen_notify_affected', labelAr: 'تم التنبيه والتنسيق مع جميع المتأثرين بالعمل', labelEn: 'Notified and coordinated with all affected personnel' },
    { id: 'gen_escape_routes', labelAr: 'جميع أفراد الفريق يعلمون مسالك الهروب ونقطة التجمع من مكان العمل', labelEn: 'Team knows escape routes and assembly point' },
  ],
  hotWork: [
    { id: 'hot_clear_11m', labelAr: 'تم تطهير منطقة العمل من أي مواد قابلة للاشتعال في نطاق مسافة 11 م', labelEn: 'Work area cleared of combustibles within 11m' },
    { id: 'hot_inspect_tools', labelAr: 'تم فحص جميع أدوات اللحام بالغاز والخراطيم وجميعها سليمة', labelEn: 'Gas welding tools and hoses inspected' },
    { id: 'hot_flashback', labelAr: 'تم التأكد من وجود مانع رجوع اللهب ومحبس عدم الرجوع', labelEn: 'Flashback arrestor and check valve present' },
    { id: 'hot_cylinders_upright', labelAr: 'تحريك وتشغيل الاسطوانات يتم وهي في الوضع الرأسي مربوطة بسلسلة', labelEn: 'Cylinders moved/operated upright and chained' },
    { id: 'hot_hoses_protected', labelAr: 'الخراطيم والاسطوانات بعيدة عن الغلو المتساقط من اللحام أو القطع', labelEn: 'Hoses/cylinders protected from falling slag' },
    { id: 'hot_slag_contained', labelAr: 'الغلو المتساقط من اللحام أو القطع يتم احتوائة ومنع انتشار', labelEn: 'Falling slag contained' },
    { id: 'hot_extinguisher', labelAr: 'طفاية حريق متاحة بجوار العمل وهناك فرد مدرب عليها في فريق العمل', labelEn: 'Fire extinguisher available and trained person present' },
    { id: 'hot_cables_routed', labelAr: 'خراطيم أو كابلات اللحام أو القطع تم تمديدها بطريق لا تؤدي الي التعثر', labelEn: 'Hoses/cables routed safely to prevent tripping' },
    { id: 'hot_machine_safe', labelAr: 'تم فحص ماكينة اللحام والتأكد من سلامة الكبلات والتأريض والبنسمة', labelEn: 'Welding machine, cables, and grounding inspected' },
    { id: 'hot_plug_used', labelAr: 'تم توصيل ماكينة اللحام باستخدام فيش كهربائي بلوحة الكهرباء', labelEn: 'Welding machine plugged properly into electrical panel' },
  ],
  hotMaterial: [
    { id: 'mat_coord_control', labelAr: 'تم التنسيق مع مشغل الفرن في غرفة التحكم لتهيئة ظروف آمنة', labelEn: 'Coordinated with Kiln operator in control room' },
    { id: 'mat_comm_control', labelAr: 'يوجد إتصال دائم بين ملاحظ الإنتاج ومشغل الفرن في غرفة التحكم', labelEn: 'Continuous communication between prod supervisor and kiln operator' },
    { id: 'mat_isolate_air_cannon', labelAr: 'تم عزل الإير كانون في نفس الدور والأدوار العلوية وتفريغها من الهواء', labelEn: 'Air cannons isolated and depressurized' },
    { id: 'mat_thermal_suit', labelAr: 'ارتداء البدلة الحرارية سليمة وكاملة لحماية الجسم بالكامل', labelEn: 'Full and intact thermal suit worn' },
    { id: 'mat_cleaning_tools', labelAr: 'عدد وأدوات النظافة والتسليك (مواسير.....) سليمة وآمنة', labelEn: 'Cleaning/rodding tools safe and intact' },
    { id: 'mat_cleaning_level', labelAr: 'تتم النظافة او التسليك من مستوى اعلى من مستوى باب التسليك', labelEn: 'Cleaning/rodding done from a level above the access door' },
    { id: 'mat_evacuate_below', labelAr: 'تم إخلاء وغلق المنطقة أسفل العمل ووضع شريط تحذيري', labelEn: 'Area below evacuated, closed, and barricaded' },
    { id: 'mat_rotate_workers', labelAr: 'يتم تدوير افراد العمل بصفة مستمرة للحماية من الاجهاد الحراري', labelEn: 'Workers rotated continuously to prevent heat stress' },
    { id: 'mat_extinguisher_near', labelAr: 'طفاية الحريق بالقرب من العمل ولا يوجد معوقات للوصول إليها', labelEn: 'Fire extinguisher nearby and accessible' },
    { id: 'mat_water_source', labelAr: 'يوجد مصدر مياه لحالات الطوارئ', labelEn: 'Emergency water source available' },
    { id: 'mat_escape_clear', labelAr: 'ممر الهروب في اتجاه أمن وخالي من المعوقات', labelEn: 'Escape route safe and clear' },
  ],
  lifting: [
    { id: 'lift_equipment_safe', labelAr: 'وسائل الرفع (الوير -السلاسل-أحزمة ) سليمة ومعتمدة وليس بها عقد', labelEn: 'Lifting gears safe, certified, knot-free' },
    { id: 'lift_machine_inspected', labelAr: 'تم فحص معدة الرفع و تعمل بصورة جيدة تم فحص الكرين ومعتمد', labelEn: 'Lifting machine/crane inspected and certified' },
    { id: 'lift_operator_licensed', labelAr: 'مشغل معدة الرفع مدرب و مرخص له', labelEn: 'Crane operator trained and licensed' },
    { id: 'lift_rigger_qualified', labelAr: 'عمليه التصبين تتم من خلال فني مؤهل (العتال)', labelEn: 'Rigging done by qualified rigger' },
    { id: 'lift_path_clear', labelAr: 'مسار الرفع خالي من أي معوقات', labelEn: 'Lifting path clear of obstacles' },
    { id: 'lift_capacity_ok', labelAr: 'قدرة وسائل الرفع المستخدمة أكبر من الحمل المراد رفعة', labelEn: 'Lifting capacity exceeds the load' },
    { id: 'lift_plan_over_5t', labelAr: 'تم مراجعة خطة الرفع في حالة ان الحمولة اكثر من 5 طن', labelEn: 'Lifting plan reviewed if load > 5t' },
    { id: 'lift_hook_safe', labelAr: 'تم فحص الهوك وهو في حالة سليمة والقفل الخاص به ايضاً', labelEn: 'Hook and its safety latch inspected' },
    { id: 'lift_isolate_cables', labelAr: 'تم التأكد من عزل جميع الاسلاك والكابلات التي تمر بالقرب من منطقة الرفع', labelEn: 'Nearby cables and wires isolated' },
    { id: 'lift_weather_ok', labelAr: 'حالة الطقس وسرعة الرياح جيدة وتسمح بعملية الرفع', labelEn: 'Weather and wind conditions permit lifting' },
    { id: 'lift_tag_line', labelAr: 'يتم استخدام حبل التوجيه من قبل مساعد رفع (حواش)', labelEn: 'Tag line used by assistant' },
    { id: 'lift_barricade', labelAr: 'تم تحديد منطقة الرفع لمنع العاملين من الوقوف/المرور ووضع شريط عازل', labelEn: 'Lifting area barricaded to prevent access' },
    { id: 'lift_supervision', labelAr: 'يوجد إشرف مستمر على عملية الرفع', labelEn: 'Continuous supervision over lifting operation' },
  ],
  confinedSpace: [
    { id: 'cs_air_quality', labelAr: 'حالة الهواء تسمح بالعمل ولا يوجد غازات سامه أو قابلة للاشتعال', labelEn: 'Air quality allows work, no toxic/flammable gases' },
    { id: 'cs_temp_ok', labelAr: 'درجة حرارة داخل المكان المغلق اقل من 40-45 درجة', labelEn: 'Internal temperature below 40-45°C' },
    { id: 'cs_ventilation', labelAr: 'التهوية مناسبة وتسمح بتجديد الهواء داخل المكان المغلق', labelEn: 'Adequate ventilation allows fresh air circulation' },
    { id: 'cs_safe_access', labelAr: 'هناك وصول آمن لمكان الدخول (سلالم/منصات/سقالات)', labelEn: 'Safe access to entry point' },
    { id: 'cs_workers_fit', labelAr: 'الأشخاص القائمين بالعمل مؤهلين ولائقين طبياً', labelEn: 'Workers are qualified and medically fit' },
    { id: 'cs_clear_hazards', labelAr: 'تم إزالة أي مواد متراكمة أو أشياء من أعلى قد تؤدي الي أصابة أو أغراق في الخامة أو إنسداد المخرج', labelEn: 'Accumulated materials removed to prevent engulfment/blockage' },
    { id: 'cs_lighting_24v', labelAr: 'الإضاءة كافية داخل المكان ومن مصابيح 24 فولت', labelEn: 'Sufficient lighting from 24V lamps' },
    { id: 'cs_local_exhaust', labelAr: 'استخدام شفاطات موضعية في أماكن اللحام', labelEn: 'Local exhaust used for welding inside' },
    { id: 'cs_standby_watcher', labelAr: 'هناك مراقب للعمل من الخارج للمساعدة ومدرب في حالة الطوارئ', labelEn: 'Standby watcher present outside, trained for emergency' },
    { id: 'cs_rescue_plan', labelAr: 'تم مراجعة طريقة وخطة الإنقاذ في حالة الطوارئ', labelEn: 'Rescue method and emergency plan reviewed' },
  ],
  workAtHeight: [
    { id: 'wh_use_harness', labelAr: 'استخدام حزام أمان', labelEn: 'Safety harness used', isHeader: true },
    { id: 'wh_trained_fit', labelAr: 'فريق العمل مدرب للعمل على ارتفاع ولائق طبياً', labelEn: 'Team trained and medically fit for height' },
    { id: 'wh_harness_safe', labelAr: 'تم التأكد من حالة حزام الأمان وهو في حالة سليمة', labelEn: 'Safety harness inspected and in good condition' },
    { id: 'wh_drop_zone', labelAr: 'تم تحديد منطقة السقوط وعزلها', labelEn: 'Drop zone identified and barricaded' },
    { id: 'wh_anchor_safe', labelAr: 'تم التأكد فنياً من السلامة ومتانة نقطة التعليق', labelEn: 'Anchor point strength technically verified' },
    { id: 'wh_anchor_above_head', labelAr: 'نقطة التعليق اعلى مستوى رأس العامل وتضمن سقوط حر', labelEn: 'Anchor point above head level to limit free fall' },
    { id: 'wh_rescue_plan', labelAr: 'خطة الإنقاذ تم مراجعتها قبل البدء', labelEn: 'Rescue plan reviewed before start' },
    { id: 'wh_anchor_capacity', labelAr: 'نقطة التعليق تتحمل 1 طن/عامل والوصول لها آمن', labelEn: 'Anchor holds 1 ton/worker and safely accessible' },
    
    { id: 'wh_use_scaffold', labelAr: 'استخدام سقالة (سقالة رقم ................)', labelEn: 'Use of Scaffold', isHeader: true },
    { id: 'wh_scaffold_inspected', labelAr: 'قبل الصعود على السقالة تم مراجعتها من مشرف السلامة وعلق عليها الكارت الأخضر', labelEn: 'Scaffold inspected by safety supervisor (Green Tag)' },
    { id: 'wh_scaffold_no_change', labelAr: 'تم مراجعة السقالة وهي وفقا لنموذج انشاء السقالة ولم يتم أي تغيير بها', labelEn: 'Scaffold complies with design, no changes made' },
    { id: 'wh_scaffold_harness', labelAr: 'جميع العاملين يرتدوا حزام أمن', labelEn: 'All workers wearing safety harnesses' },

    { id: 'wh_use_basket', labelAr: 'استخدام السلة والونش "ممنوع الخروج منه"', labelEn: 'Use of Man-Basket (No exit permitted)', isHeader: true },
    { id: 'wh_basket_wires_safe', labelAr: 'وايرات الرفع والسلة سليمة ومعتمدة وتم فحصها', labelEn: 'Lifting wires and basket inspected, certified' },
    { id: 'wh_basket_licensed', labelAr: 'السلة والونش مرخص', labelEn: 'Basket and crane are licensed' },
    { id: 'wh_basket_test_run', labelAr: 'تم تجربة الصندوق فارغ للوصول الى مكان', labelEn: 'Empty basket test run completed to work location' },
    { id: 'wh_basket_harness_tied', labelAr: 'تم تثبيت حزام الأمان بالسلة', labelEn: 'Safety harnesses anchored to basket' },
    { id: 'wh_basket_weather_ok', labelAr: 'حالة الطقس وسرعة الرياح جيدة وتسمح بالعمل على السلة والونش', labelEn: 'Weather and wind allow basket operation' },
    { id: 'wh_basket_load_ok', labelAr: 'إجمالي الحمل داخل المنصة لا يتجاوز الحمل الآمن للسلة والونش', labelEn: 'Total platform load within SWL of basket/crane' },
  ],
};

// === OSHA Specific Checklists (Version 2) ===
export const OSHA_CHECKLISTS: Record<string, Array<{id: string, labelAr: string, labelEn: string, isHeader?: boolean}>> = {
  lotoVerification: [
    { id: 'osha_loto_equipment_shutdown', labelAr: 'إيقاف تشغيل المعدة بالكامل', labelEn: 'Equipment completely shut down' },
    { id: 'osha_loto_energy_isolated', labelAr: 'فصل مصادر الطاقة', labelEn: 'Energy sources isolated' },
    { id: 'osha_loto_locks_applied', labelAr: 'وضع الأقفال واللافتات (LOTO)', labelEn: 'Locks and tags applied (LOTO)' },
    { id: 'osha_loto_residual_energy', labelAr: 'تفريغ الطاقة الكامنة/المتبقية', labelEn: 'Residual energy relieved/restrained' },
    { id: 'osha_loto_zero_energy_verified', labelAr: 'التحقق من حالة الطاقة الصفرية (Zero Energy State)', labelEn: 'Zero Energy State verified via test' }
  ],
  confinedSpace: [
    { id: 'osha_cs_atmosphere_tested', labelAr: 'تم فحص الغازات قبل الدخول', labelEn: 'Pre-entry atmospheric testing completed' },
    { id: 'osha_cs_continuous_monitor', labelAr: 'مراقبة مستمرة للغازات أثناء العمل', labelEn: 'Continuous atmospheric monitoring' },
    { id: 'osha_cs_ventilation_on', labelAr: 'تشغيل التهوية الميكانيكية المستمرة', labelEn: 'Continuous mechanical ventilation running' },
    { id: 'osha_cs_attendant_present', labelAr: 'وجود مراقب خارج المكان المغلق (Attendant)', labelEn: 'Attendant present outside space' },
    { id: 'osha_cs_rescue_equipment', labelAr: 'توفر معدات الإنقاذ غير المتدخل (Non-entry rescue)', labelEn: 'Non-entry rescue equipment in place' },
    { id: 'osha_cs_communication', labelAr: 'نظام تواصل فعال بين العمال والمراقب', labelEn: 'Communication system established' }
  ],
  hotWork: [
    { id: 'osha_hw_35ft_rule', labelAr: 'إزالة أو تغطية المواد القابلة للاشتعال ضمن 35 قدماً (11 متر)', labelEn: 'Combustibles removed/covered within 35 ft' },
    { id: 'osha_hw_fire_extinguisher', labelAr: 'توفر طفاية حريق جاهزة للاستخدام', labelEn: 'Fire extinguisher ready and accessible' },
    { id: 'osha_hw_fire_watch', labelAr: 'مراقب حريق أثناء العمل ولمدة 30-60 دقيقة بعد الانتهاء', labelEn: 'Fire watch during & 30-60 mins after work' },
    { id: 'osha_hw_welding_screens', labelAr: 'استخدام حواجز لحماية الآخرين من الشرر/الضوء', labelEn: 'Welding screens/shields in place' },
    { id: 'osha_hw_ventilation', labelAr: 'تهوية موضعية كافية', labelEn: 'Adequate local exhaust ventilation' }
  ],
  generalSafety: [
    { id: 'osha_gen_barricades', labelAr: 'وضع حواجز ولافتات تحذيرية', labelEn: 'Barricades and warning signs posted' },
    { id: 'osha_gen_ppe_verified', labelAr: 'فحص معدات الوقاية الشخصية', labelEn: 'PPE inspected and worn' },
    { id: 'osha_gen_tools_inspected', labelAr: 'فحص المعدات والأدوات اليدوية', labelEn: 'Hand and power tools inspected' },
    { id: 'osha_gen_emergency_routes', labelAr: 'التأكد من خلو مسارات الطوارئ', labelEn: 'Emergency routes kept clear' }
  ]
};
