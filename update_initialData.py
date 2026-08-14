import re

with open('frontend/src/utils/initialData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

new_permit_types_info = """export const PERMIT_TYPES_INFO = {
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
};"""

regex = r'export const PERMIT_TYPES_INFO = \{[\s\S]*?\n\};\n'
text = re.sub(regex, new_permit_types_info + '\n', text)

with open('frontend/src/utils/initialData.ts', 'w', encoding='utf-8') as f:
    f.write(text)
