/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Language } from '../types';

export const DICTIONARY: Record<string, Record<Language, string>> = {
  // Tabs & Navigation
  "Permits to Work": {
    ar: "تصاريح العمل",
    en: "Permits to Work",
    zh: "工作安全许可 (PTW)"
  },
  "Incident Management": {
    ar: "إدارة الحوادث",
    en: "Incident Management",
    zh: "事故与纠正措施 (CAPA)"
  },
  "HIRA Risk Matrix": {
    ar: "تقييم المخاطر",
    en: "HIRA Risk Matrix",
    zh: "HIRA 风险评估矩阵"
  },
  "Compliance Audits": {
    ar: "عمليات التفتيش",
    en: "Compliance Audits",
    zh: "合规安全检查"
  },
  "Safety Trainings": {
    ar: "سجلات الكفاءة",
    en: "Safety Trainings",
    zh: "安全培训与资质"
  },
  "Safety AI Copilot": {
    ar: "جمني مروّج السلامة",
    en: "Safety AI Copilot",
    zh: "Gemini 安全AI助手"
  },
  "Platform Performance": {
    ar: "أداء المنصة والنظام",
    en: "Platform Performance",
    zh: "系统与本地存储性能"
  },
  "Personnel Registry": {
    ar: "إدارة المستخدمين",
    en: "Personnel Registry",
    zh: "人员管理与签发权限"
  },

  // Login Screen
  "System Login": {
    ar: "تسجيل الدخول للنظام",
    en: "System Login",
    zh: "系统登录"
  },
  "Please enter your employee ID and password": {
    ar: "يرجى إدخال الرقم الوظيفي وكلمة المرور",
    en: "Please enter your employee ID and password",
    zh: "请输入您的员工编号和密码"
  },
  "Employee ID or Username": {
    ar: "الرقم الوظيفي أو اسم المستخدم",
    en: "Employee ID or Username",
    zh: "员工编号或用户名"
  },
  "e.g. admin or EMP101": {
    ar: "أدخل الرقم الوظيفي أو admin",
    en: "e.g. admin or EMP101",
    zh: "例如: admin 或 EMP101"
  },
  "Password": {
    ar: "كلمة المرور",
    en: "Password",
    zh: "密码"
  },
  "Remember me": {
    ar: "تذكرني",
    en: "Remember me",
    zh: "记住我"
  },
  "Forgot password?": {
    ar: "نسيت كلمة المرور؟",
    en: "Forgot password?",
    zh: "忘记密码？"
  },
  "Access Control Hub": {
    ar: "الدخول للوحة التحكم",
    en: "Access Control Hub",
    zh: "进入控制中心"
  },
  "Quick Demo Logins for Evaluation": {
    ar: "حسابات الدخول السريع للاختبار والتقييم",
    en: "Quick Demo Logins for Evaluation",
    zh: "快速演示登录账号（用于评估）"
  },
  "Secure login, audited for safety compliance": {
    ar: "دخول آمن ومسجل لأغراض التدقيق",
    en: "Secure login, audited for safety compliance",
    zh: "安全合规系统：所有登录均受审计监控"
  },
  "Invalid Employee ID or password": {
    ar: "الرقم الوظيفي أو كلمة المرور غير صحيحة",
    en: "Invalid Employee ID or password",
    zh: "员工编号或密码无效"
  },

  // General Header
  "CementMaster PTW": {
    ar: "النظام الرقمي لتصاريح العمل (PTW)",
    en: "Master PTW",
    zh: "大师安全作业许可系统"
  },
  "Operations Hub": {
    ar: "إدارة المصنع",
    en: "Operations Hub",
    zh: "生产厂运营中心"
  },
  "Active": {
    ar: "نشط",
    en: "Active",
    zh: "激活"
  },
  "Closed": {
    ar: "مغلق",
    en: "Closed",
    zh: "已关闭"
  },
  "Urgent": {
    ar: "مستعجل",
    en: "Urgent",
    zh: "紧急"
  },
  "My Reports/Mo": {
    ar: "بلاغاتي شهرياً",
    en: "My Reports/Mo",
    zh: "本月我的报告数"
  },
  "My EHS Reports:": {
    ar: "بلاغاتي الميدانية:",
    en: "My EHS Reports:",
    zh: "我的现场安全报告:"
  },
  "Switch to English": {
    ar: "Switch to English",
    en: "Switch to English",
    zh: "切换为英文"
  },
  "تغيير إلى العربية": {
    ar: "تغيير إلى العربية",
    en: "تغيير إلى العربية",
    zh: "切换为阿拉伯文"
  },
  "Log out": {
    ar: "تسجيل الخروج",
    en: "Log out",
    zh: "退出登录"
  },

  // LOTO and Audit Portal Bottom Badges
  "LOTO Secure": {
    ar: "العزل الميكانيكي نشط",
    en: "LOTO Secure",
    zh: "上锁挂牌(LOTO)安全启动"
  },
  "Audited Portal": {
    ar: "نظام المراقبة مفعل",
    en: "Audited Portal",
    zh: "合规审计系统已联机"
  },
  "cement_plant_footer": {
    ar: "البوابة الرسمية للسلامة والصحة المهنية ومراقبة جودة عزل الطاقة (LOTO) بالمصنع الوطني. نظام معتمد NEBOSH.",
    en: "Official Portal for Occupational Safety, Health, and LOTO Isolation Control at the Factory. NEBOSH Cert-validated.",
    zh: "国家生产厂职业健康安全与上锁挂牌 (LOTO) 能源隔离监控系统。符合 NEBOSH 标准。"
  }
};

/**
 * Translate a phrase from English. Falls back to key if not found.
 */
export function t(key: string, lang: Language): string {
  if (DICTIONARY[key] && DICTIONARY[key][lang]) {
    return DICTIONARY[key][lang];
  }
  return key;
}

/**
 * Localized lookup for values that have both English, Arabic, and Chinese keys.
 */
export function getLocalizedValue(
  lang: Language,
  enVal: string | undefined,
  arVal: string | undefined,
  zhVal?: string | undefined
): string {
  if (lang === 'ar' && arVal) return arVal;
  if (lang === 'zh' && zhVal) return zhVal;
  return enVal || arVal || '';
}
