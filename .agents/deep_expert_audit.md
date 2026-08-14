# 🔬 تقرير فحص عميق — منظور خبير سلامة + خبير برمجيات
# Deep Expert Audit — HSE Domain Expert + Software Engineering Expert

> هذا التقرير يتجاوز الفحص السطحي ويغطي ثغرات لن تُكتشف إلا بمعرفة عميقة بمعايير السلامة الصناعية وأنماط هندسة البرمجيات.

---

# الجزء الأول: منظور خبير السلامة المهنية (HSE / NEBOSH / ISO 45001)

## ملاحظة حرجة 1: انتحال هوية المعتمِد (Identity Spoofing)

**ما اكتشفته:**
أسماء المعتمِدين **مكتوبة نصاً ثابتاً** في الكود بغض النظر عن المستخدم الفعلي:

| الملف | السطر | القيمة الثابتة |
|---|---|---|
| [PermitDetail.tsx:219](file:///C:/Users/Kail/antigravity/Permit-to-Work-System-33/frontend/src/components/PermitDetail.tsx#L219) | `productionApprover` | `'م. تركي اليوسف'` — دائماً |
| [PermitDetail.tsx:306](file:///C:/Users/Kail/antigravity/Permit-to-Work-System-33/frontend/src/components/PermitDetail.tsx#L306) | `electricalApprover` | `'م. علي عبد الله'` — دائماً |
| [PermitDetail.tsx:356](file:///C:/Users/Kail/antigravity/Permit-to-Work-System-33/frontend/src/components/PermitDetail.tsx#L356) | `gasTester` | `'م. أسعد الشمراني'` — دائماً |
| [PermitDetail.tsx:411](file:///C:/Users/Kail/antigravity/Permit-to-Work-System-33/frontend/src/components/PermitDetail.tsx#L411) | `hseApprover` | `'م. أسعد الشمراني'` — دائماً |
| [HiraManager.tsx:96](file:///C:/Users/Kail/antigravity/Permit-to-Work-System-33/frontend/src/components/HiraManager.tsx#L96) | `assessedBy` | `'Eng. Ahmed Al-Monafed'` — دائماً |

**الأثر الحقيقي في بيئة صناعية:**
- إذا سجّل أي مستخدم آخر الدخول بدور "Production" وضغط "اعتماد"، يُسجّل الاعتماد باسم "م. تركي" وليس باسمه الحقيقي.
- في حالة وقوع حادث وتحقيق قضائي، سجل التدقيق يُشير لشخص لم يعتمد فعلاً — هذا **تزوير في الوثائق الرسمية**.
- وفق **NEBOSH IGC Element 1**، مسؤولية التصريح تقع على المُوقِّع الفعلي. إذا كان التوقيع مزوراً، الحماية القانونية تسقط.

> [!CAUTION]
> **في نظام PTW حقيقي، هذا يعني أن كل اعتماد في السجل غير موثوق — بصرف النظر عن من وقّعه فعلاً.**

---

## ملاحظة حرجة 2: لا يوجد حماية ضد SIMOPS (العمليات المتزامنة)

**ما هو SIMOPS:** Simultaneous Operations — عندما يوجد أكثر من تصريح عمل نشط في نفس الموقع أو في مواقع متجاورة، مما يخلق مخاطر مركّبة لم يُقيّمها أي تصريح منفرد.

**مثال واقعي خطير:**
- تصريح لحام ساخن (HOT) في الطابق الثاني من برج التسخين
- تصريح أماكن مغلقة (CONFINED) في نفس البرج على الطابق الأول
- الشرر من اللحام ينزل إلى المكان المغلق حيث قد تتراكم أبخرة

**حالة النظام:** يوجد حقل `crossReferencedPermits` في [types.ts:160](file:///C:/Users/Kail/antigravity/Permit-to-Work-System-33/frontend/src/types.ts#L160) ولكنه **لا يُستخدم أبداً في أي منطق**. Dashboard يعرض مؤشراً بصرياً `isConflicting` لكنه للعرض فقط — لا يمنع الإنشاء ولا يُجبر على مراجعة SIMOPS.

---

## ملاحظة حرجة 3: انتهاء صلاحية التصريح بدون حماية

**حالة النظام:** حقل `endDate` موجود ومُعبأ (مثلاً `2026-07-16T16:00`) لكن **لا يوجد أي كود يفحصه**.

**الأثر في بيئة صناعية:**
وفق **NEBOSH NGC1 Section 4.2** و **ISO 45001 Clause 8.1.2**، التصريح المنتهي يجب أن يُلغى تلقائياً. العمل بتصريح منتهي يعادل العمل بدون تصريح — وهو مخالفة من الدرجة الأولى في أي مصنع.

عملياً: عامل ينظر لشاشة هاتفه، يرى التصريح `ACTIVE` (أخضر)، يبدأ العمل — رغم أن الصلاحية انتهت قبل 3 ساعات.

---

## ملاحظة حرجة 4: فحص الغازات مرة واحدة فقط

**حالة النظام:** Gas Test يُجرى مرة واحدة عند مرحلة `HSE_REVIEW`. بعد إصدار التصريح (`ACTIVE`)، لا يوجد آلية لتكرار الفحص أو تذكير بإعادته.

**المتطلب الصناعي:**
- **OSHA 29 CFR 1910.146**: فحص الغازات في الأماكن المغلقة يجب أن يكون **مستمراً** أو على الأقل **كل ساعتين**
- **NEBOSH IGC**: يوصي بفحص كل تبديل وردية، وبعد أي توقف عمل يتجاوز 30 دقيقة
- النظام الحالي يُجري الفحص مرة واحدة ويعتبره ساريًا طوال عمر التصريح — وهذا خطأ جوهري

---

## ملاحظة حرجة 5: Toolbox Talk بدون تتبع حقيقي

**حالة النظام:** يوجد حقل `toolboxTalkCompleted: boolean` في [types.ts:152](file:///C:/Users/Kail/antigravity/Permit-to-Work-System-33/frontend/src/types.ts#L152). هو checkbox فقط — لا يُسجّل:
- من أجرى الـ Toolbox Talk
- متى أُجري
- من حضره
- ما هي المواضيع التي نوقشت

**المتطلب الصناعي:** وفق **ISO 45001 Clause 7.4**، يجب توثيق محتوى الإحاطة الأمنية والحاضرين بشكل قابل للتتبع.

---

## ملاحظة حرجة 6: التحقق من الكفاءات سطحي

**حالة النظام:** يوجد `competencyWorkers: CompetencyWorker[]` و `workerCertifications: string[]` في types.ts. لكن:
- لا يوجد ربط بين شهادات العامل في `TrainingRecord` وبيانات العمال في التصريح
- لا يوجد تحقق تلقائي من صلاحية الشهادة (منتهية أم لا)
- حقل `competencyStatus: 'QUALIFIED' | 'EXPIRED' | 'NOT_REQUIRED'` يُعبأ يدوياً — لا يُفحص ضد قاعدة بيانات التدريب

**المتطلب الصناعي:** عامل بشهادة أعمال ساخنة منتهية الصلاحية يجب ألا يُسمح بإضافته لتصريح عمل ساخن — تلقائياً.

---

## ملاحظة حرجة 7: لا يوجد Job Safety Analysis (JSA) مستقل

**التحليل:** النظام يعتمد على HIRA كتقييم مخاطر عام، لكنه لا يوفر JSA خاصة بكل مهمة ضمن التصريح. الفرق المهم:
- **HIRA**: تقييم مخاطر عام لنشاط (مثل "لحام في الفرن")
- **JSA/JHA**: تحليل تفصيلي خطوة بخطوة لكل مرحلة عمل (1-تجهيز المعدات، 2-عزل الطاقة، 3-بدء اللحام...)

وفق **OSHA 3071** و **NEBOSH NGC2 Element 4**، التصاريح عالية الخطورة تحتاج JSA مفصل بجانب HIRA.

---

## ملاحظة حرجة 8: إجراءات الطوارئ غير مكتملة

**حالة النظام:** يوجد حقول: `emergencyAssemblyPoint`, `emergencyContact`, `rescuePlanRequired`, `rescueEquipmentOnStandby`, `firstAidKitConfirmed`.

**ما ينقص:**
- لا يوجد رقم هاتف طوارئ المصنع / الإطفاء / الإسعاف كحقل إلزامي
- لا يوجد إجراء إخلاء مرتبط بالتصريح
- لا يوجد ربط بخطة الطوارئ العامة للموقع (ERP - Emergency Response Plan)
- `rescuePlanRequired` هو checkbox — لا يحتوي على تفاصيل خطة الإنقاذ الفعلية

---

## ملاحظة 9: قائمة PPE ثابتة لكل أنواع التصاريح

**حالة النظام:** قائمة `STANDARD_PPES` في [initialData.ts:195-206](file:///C:/Users/Kail/antigravity/Permit-to-Work-System-33/frontend/src/utils/initialData.ts#L195-L206) تحتوي 10 عناصر ثابتة تظهر لكل أنواع التصاريح.

**المتطلب:** PPE يجب أن يكون **مخصصاً حسب نوع التصريح**. مثلاً:
- العمل الساخن يحتاج: بدلة لحام + واقي وجه + كفوف لحام (وليس حزام أمان)
- العمل على ارتفاع يحتاج: حزام أمان + لانيارد مزدوج (وليس قناع غازات)

**ملاحظة إيجابية:** `PDF_CHECKLISTS.ppe` يحتوي 23 عنصر PPE تفصيلي — لكنه يظهر ككتلة واحدة بدون تصنيف حسب نوع العمل.

---

## ملاحظة 10: الإغلاق لا يتحقق من إزالة LOTO

**حالة النظام:** عند إغلاق التصريح، يوجد `HANDBACK_CHECKLIST` مع 5 بنود. لكن لا يوجد:
- تتبع فردي لإزالة كل قفل LOTO (من أزاله؟ متى؟)
- تأكيد أن مالك القفل هو من أزاله (OSHA 29 CFR 1910.147 يُلزم أن صاحب القفل فقط يُزيله)
- تحقق من أن كل نقاط العزل المسجلة عند الفتح تم استعادتها

---

## ملاحظة 11: لا يوجد تدقيق ميداني مستقل

**التحليل:** النظام يعتمد على **التقييم الذاتي** — أي أن نفس الشخص الذي ينشئ تقييم المخاطر يمكنه إنشاء التصريح واعتماده (إذا كان لديه الصلاحيات). لا يوجد:
- فصل بين من يُنشئ HIRA ومن يعتمده (حالياً كلاهما ممكن لنفس الشخص)
- تدقيق عشوائي ميداني من طرف ثالث
- متطلب "Four-Eyes Principle" (مبدأ العينين الأربع)

---

## ملاحظة 12: H₂S غائب من فحص الغازات

**حالة النظام:** Gas Test يقيس: O₂, LEL, CO.

**ما ينقص:** **H₂S (كبريتيد الهيدروجين)** — وهو الغاز الأكثر فتكاً في الأماكن المغلقة الصناعية:
- الحد الآمن: <10 ppm (OSHA PEL)
- 100 ppm = فقدان وعي خلال دقائق
- حقل `h2s` موجود في [types.ts:30](file:///C:/Users/Kail/antigravity/Permit-to-Work-System-33/frontend/src/types.ts#L30) داخل `GasReadings` لكنه **لا يُستخدم في واجهة فحص الغازات** — يُفحص O₂, LEL, CO فقط

---

# الجزء الثاني: منظور خبير هندسة البرمجيات

## ملاحظة 1: Race Condition في تحميل البيانات

**الموقع:** [App.tsx:568-774](file:///C:/Users/Kail/antigravity/Permit-to-Work-System-33/frontend/src/App.tsx#L568-L774)

**التحليل:** `useEffect` لتحميل البيانات يعتمد على `[isLoggedIn, currentUser, activeTenant?.id, tenants]`. أربعة متغيرات تعتمد على بعضها البعض — تغيير أي منها يُعيد تشغيل Effect بالكامل. عند تسجيل الدخول:
1. `isLoggedIn` يتغير ← يبدأ التحميل
2. `currentUser` يتغير بعد ملّي ثوانٍ ← يبدأ التحميل **مرة ثانية**
3. `activeTenant` يتغير ← يبدأ التحميل **مرة ثالثة**
4. `tenants` يتغير ← **مرة رابعة**

النتيجة: 4 عمليات تحميل متوازية من Firestore عند كل تسجيل دخول، مع احتمال أن نتيجة قديمة تُكتب فوق نتيجة أحدث (race condition).

---

## ملاحظة 2: Stale Closure في معالجات الأحداث

**التحليل:** كل handler في `App.tsx` (مثل `handleAddIncident`, `handleUpdateUser`) يلتقط قيمة `currentUser` و `activeTenant` في وقت التعريف. إذا تغيّر المستخدم أو الشركة بين تعريف الدالة واستدعائها، الدالة تستخدم القيمة القديمة.

مثال: مستخدم يبدأ إنشاء حادث ← يتم تبديل الشركة في تبويب آخر ← يُحفظ الحادث ← يُسجّل الحادث تحت الشركة القديمة وليس الجديدة.

---

## ملاحظة 3: تسرّب ذاكرة محتمل (Memory Leak)

**الموقع:** [App.tsx:558-564](file:///C:/Users/Kail/antigravity/Permit-to-Work-System-33/frontend/src/App.tsx#L558-L564)

```
const timer = setInterval(updateTime, 60000);
return () => clearInterval(timer);
```

هذا الـ cleanup صحيح لـ timer. لكن `initTenants()` يُنفّذ عمليات `async` بدون cleanup. إذا أُلغي المكوّن قبل انتهاء الـ async call، يحاول `setTenants()` تحديث مكوّن محذوف.

---

## ملاحظة 4: localStorage كقاعدة بيانات كاملة

**التحليل:** عندما لا يكون Firebase متاحاً، النظام يخزن **كل** البيانات في localStorage:
- `ehs_users_local` — كل المستخدمين (بما فيهم password hashes)
- `ehs_permits_local` — كل التصاريح
- `ehs_incidents_local`, `ehs_hiras_local`, `ehs_audits_local`, `ehs_trainings_local`

localStorage له حد 5-10 MB حسب المتصفح. في نظام إنتاجي مع مئات التصاريح والحوادث، هذا الحد سيُستنفد ← الكتابة تفشل بصمت ← فقدان بيانات.

---

## ملاحظة 5: Firestore Batch Limit

**الموقع:** دوال `dbSave*Batch` في [firebase.ts](file:///C:/Users/Kail/antigravity/Permit-to-Work-System-33/frontend/src/utils/firebase.ts#L95-L116)

**التحليل:** Firestore `writeBatch` يدعم **500 عملية كتابة كحد أقصى** لكل batch. الكود لا يُقسّم المصفوفات الكبيرة. إذا كان لدى شركة أكثر من 500 مستخدم أو تصريح، `batch.commit()` يفشل بخطأ.

---

## ملاحظة 6: TypeScript بدون استفادة حقيقية

**التحليل العميق:**
- `let db: any = null` — كل عمليات Firestore تمر عبر `any`
- `(doc as any)` — يتكرر في عدة أماكن
- `(import.meta as any).env` — بدلاً من تعريف Vite env types
- `Infinity` يُستخدم كقيمة لـ `maxUsers` و `storageLimitGb` في Tenant — هذه القيمة لا تُسلسل بشكل صحيح في JSON (تتحول إلى `null`)

**الأثر:** TypeScript يُستخدم كـ JavaScript مع تعليقات نوعية. لا يمنع أخطاء runtime لأن الأنواع الحرجة مُتجاوَزة بـ `any`.

---

## ملاحظة 7: `Infinity` في Firestore

**مشكلة مُحددة:** `tenant-2m` لديه `maxUsers: Infinity` و `storageLimitGb: Infinity`. عند حفظه في Firestore:
- `JSON.stringify(Infinity)` → `null`
- Firestore SDK يُحوّل `Infinity` إلى `null` أو يرفضه

هذا يعني أن tenant-2m إذا حُفظ وأُعيد تحميله من Firestore، ستصبح `maxUsers = null` وكل فحوصات `hasReachedUserLimit` ستفشل بشكل غير متوقع.

---

## ملاحظة 8: 30+ useState في مكوّن واحد

**الموقع:** [PermitFormV2.tsx:37-102](file:///C:/Users/Kail/antigravity/Permit-to-Work-System-33/frontend/src/components/PermitFormV2.tsx#L37-L102)

**العدد:** 28 `useState` + 5 `useEffect` في مكوّن واحد فقط. هذا يعني:
- كل تغيير في أي حقل يُعيد render المكوّن بالكامل (1,348 سطر JSX)
- لا يوجد `useMemo` أو `useCallback` لتحسين الأداء
- على هاتف محمول قديم، كتابة حرف في حقل النص ستكون بطيئة بشكل ملحوظ

---

## ملاحظة 9: لا يوجد Input Validation على مستوى النموذج

**التحليل:** نموذج إنشاء التصريح (PermitFormV2) يتحقق فقط من أن `title` و `location` غير فارغين. لا يتحقق من:
- هل `endDate` بعد `startDate`؟
- هل `startDate` في المستقبل (وليس في الماضي)؟
- هل طول العنوان معقول (وليس حرف واحد)؟
- هل عدد العمال المسجلين > 0؟
- هل تم اختيار PPE واحد على الأقل؟

---

## ملاحظة 10: أسماء المعتمِدين hardcoded تمنع Multi-Tenancy الحقيقي

**التحليل:** نظام Multi-Tenant يفترض أن كل شركة لديها موظفوها الخاصون. لكن أسماء المعتمِدين ثابتة ("م. تركي", "م. علي", "م. أسعد") بغض النظر عن الشركة. شركة Solar Grid Operations ستظهر اعتماداتها بأسماء موظفي Demo Manufacturing.

---

## ملاحظة 11: No Optimistic/Pessimistic Locking

**التحليل:** إذا فتح شخصان نفس التصريح في نفس الوقت:
1. المستخدم A يفتح التصريح (حالة PENDING_DEPT)
2. المستخدم B يفتح نفس التصريح (حالة PENDING_DEPT)
3. المستخدم A يعتمد ← يتحول إلى HSE_REVIEW
4. المستخدم B يعتمد ← يكتب فوق بيانات A لأنه يستخدم النسخة القديمة

لا يوجد `version` field أو `updatedAt` check لمنع الكتابة المتزامنة (Conflict Resolution).

---

## ملاحظة 12: HIRA يُنشأ بحالة `PENDING_HSE` بدون مسار اعتماد

**الموقع:** [HiraManager.tsx:95](file:///C:/Users/Kail/antigravity/Permit-to-Work-System-33/frontend/src/components/HiraManager.tsx#L95)

`status: 'PENDING_HSE'` — يُنشأ بهذه الحالة لكن **لا يوجد زر "اعتماد" أو "رفض"** في واجهة HiraManager. التقييم يبقى عالقاً في حالة PENDING_HSE إلى الأبد. رغم ذلك، يظهر في قائمة التصاريح كخيار مرتبط.

---

## ملاحظة 13: `checkReadOnly` لا يحمي التصاريح

**الموقع:** [App.tsx:288-296](file:///C:/Users/Kail/antigravity/Permit-to-Work-System-33/frontend/src/App.tsx#L288-L296)

`checkReadOnly` يفحص فقط انتهاء اشتراك الشركة. لكن **لا يوجد فحص مماثل** لمنع:
- تعديل تصريح من شركة أخرى (Cross-Tenant Mutation)
- تعديل تصريح مغلق (CLOSED)
- تعديل تصريح مرفوض (REJECTED)
- اعتماد تصريح بدون الدور المناسب (الفحص يتم في UI فقط بإخفاء الزر — لكن الدالة `onUpdatePermit` لا تتحقق)

---

## ملاحظة 14: N+1 Query Problem

**الموقع:** [firebase.ts:119-139](file:///C:/Users/Kail/antigravity/Permit-to-Work-System-33/frontend/src/utils/firebase.ts#L119-L139)

```typescript
for (const tenantId of ids) {
  const querySnapshot = await getDocs(collection(db, 'ehs_tenants', tenantId, 'users'));
}
```

كل كيان (users, permits, incidents, hiras, audits, trainings) يُحمّل بحلقة `for...of` لكل tenant. مع 5 شركات و 6 كيانات = **30 طلب Firestore** عند تسجيل دخول admin. لا يوجد تحميل متوازي (`Promise.all`).

---

## ملاحظة 15: Event Handlers تُعرّف جديدة كل render

**التحليل:** App.tsx يحتوي 30+ event handler معرّفة كـ `const handleX = async () => {...}` داخل جسم المكوّن. كل render يُنشئ 30 دالة جديدة ← 30 reference جديد ← كل مكوّن فرعي يتلقى props جديدة ← re-render شلالي لكل التطبيق.

---

# الجزء الثالث: خطة التطوير (مُرتّبة بالأولوية بناءً على الفحص العميق)

## 🔴 فوري (قبل أي استخدام حقيقي)

| # | المهمة | السبب |
|---|---|---|
| 1 | **ربط اسم المعتمِد بـ `currentUser` الفعلي** | انتحال الهوية — ثغرة سلامة وقانونية |
| 2 | **تفعيل Firebase Auth + تأمين Firestore Rules** | كل البيانات مكشوفة حالياً |
| 3 | **إضافة انتهاء صلاحية تلقائي** | خطر سلامة مباشر |
| 4 | **إضافة H₂S لفحص الغازات** | الحقل موجود في types لكن غير مستخدم |
| 5 | **إزالة كلمات المرور المكشوفة** | ثغرة أمنية حرجة |
| 6 | **إضافة Error Boundary** | منع الشاشة البيضاء |

## 🟠 قبل الاستخدام الإنتاجي

| # | المهمة | السبب |
|---|---|---|
| 7 | **اعتماد HIRA (زر اعتماد/رفض)** | التقييمات عالقة في PENDING بدون مخرج |
| 8 | **فحص غازات دوري (كل ساعتين)** | متطلب OSHA/NEBOSH |
| 9 | **SIMOPS detection + منع التعارض** | حماية من مخاطر مركّبة |
| 10 | **تحقق من صلاحية شهادات العمال** | ربط TrainingRecord بـ CompetencyWorker |
| 11 | **Input validation شامل للنماذج** | منع بيانات غير منطقية |
| 12 | **إصلاح Infinity في Tenant** | يتحول لـ null في Firestore |
| 13 | **Optimistic Locking (version field)** | منع الكتابة المتزامنة |

## 🟡 تحسينات جوهرية

| # | المهمة | السبب |
|---|---|---|
| 14 | **Promise.all لتحميل البيانات** | تقليل 30 طلب إلى 6 |
| 15 | **تقسيم App.tsx + Context/Zustand** | قابلية الصيانة |
| 16 | **React.memo + useCallback** | أداء على الأجهزة المحمولة |
| 17 | **Toolbox Talk كسجل كامل** | توثيق الحاضرين والمحتوى |
| 18 | **PPE مخصص حسب نوع التصريح** | دقة معدات الحماية |
| 19 | **تتبع إزالة أقفال LOTO فردياً** | متطلب OSHA 1910.147 |
| 20 | **JSA/JHA مستقل لكل تصريح** | تحليل خطوة بخطوة |
