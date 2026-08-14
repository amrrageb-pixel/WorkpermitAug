const fs = require('fs');

let text = fs.readFileSync('frontend/src/components/PermitDetail.tsx', 'utf-8');

// Replace the first block
const blockToReplace1 = `{language === 'ar' ? \`✓ قفل برقم: \${permit.lotoLockNumber} معتمد\` : \`✓ Lock: \${permit.lotoLockNumber} Approved\`}`;
const newBlock1 = `{language === 'ar' ? \`✓ تم التوثيق (\${permit.lotoDetails?.length || 0} نقطة)\` : \`✓ Verified (\${permit.lotoDetails?.length || 0} Points)\`}`;
text = text.replace(blockToReplace1, newBlock1);

// Replace second block
const regex2 = /<div className=\"grid grid-cols-2 gap-3 text-xs text-neutral-600 bg-white dark:bg-neutral-900 p-2\.5 rounded-lg border border-neutral-100 text-start\">\s*<p><strong>{language === 'ar' \? 'رقم قفل الأمان: ' : 'Lock ID: '}.*?<\/div>/s;
const newBlock2 = `  <div className="bg-white dark:bg-neutral-900 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 text-start">
  {permit.lotoDetails && permit.lotoDetails.length > 0 ? (
    <div className="space-y-2 mb-3">
    {permit.lotoDetails.map((l, idx) => (
      <div key={l.id} className="flex justify-between items-center bg-purple-50/50 dark:bg-purple-900/10 p-2 rounded border border-purple-100 dark:border-purple-900/30 text-xs text-neutral-700 dark:text-neutral-300">
        <div className="flex flex-wrap items-center gap-3">
          <span className="bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]">{idx + 1}</span>
          <span>📍 {l.isolationPoint}</span>
          <span className="text-neutral-400">|</span>
          <span>⚡ {l.energyType}</span>
          <span className="text-neutral-400">|</span>
          <span>🔒 {l.lockTagNumber}</span>
          {l.isolatorName && <><span className="text-neutral-400">|</span><span>👤 {l.isolatorName}</span></>}
        </div>
      </div>
    ))}
    </div>
  ) : (
    <p className="text-xs text-neutral-500 mb-3">{language === 'ar' ? 'لا يوجد نقاط LOTO مسجلة.' : 'No LOTO points registered.'}</p>
  )}
  <p className="text-xs text-neutral-600 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800"><strong>{language === 'ar' ? 'تقرير الكهرباء: ' : 'Comment: '}</strong>{permit.electricalComment}</p>
  </div>`;
text = text.replace(regex2, newBlock2);

// Replace third block
const regex3 = /<div className=\"grid grid-cols-1 md:grid-cols-2 gap-3\">\s*<div>\s*<label.*?LOTO Lock Lockout ID.*?<\/div>\s*<\/div>/s;
const newBlock3 = `  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-lg">
  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
  <input
  disabled={permit.productionRequired && !permit.productionApproval}
  placeholder={language === 'ar' ? 'نقطة العزل' : 'Isolation Point'}
  value={lotoPt}
  onChange={e => setLotoPt(e.target.value)}
  className="text-xs p-2 border border-neutral-200 dark:border-neutral-700 rounded bg-neutral-50 dark:bg-neutral-800 focus:outline-none"
  />
  <select
  disabled={permit.productionRequired && !permit.productionApproval}
  value={lotoEnergy}
  onChange={e => setLotoEnergy(e.target.value as any)}
  className="text-xs p-2 border border-neutral-200 dark:border-neutral-700 rounded bg-neutral-50 dark:bg-neutral-800 focus:outline-none"
  >
  <option value="ELECTRICAL">{language === 'ar' ? '⚡ كهربائي' : '⚡ Electrical'}</option>
  <option value="MECHANICAL">{language === 'ar' ? '⚙️ ميكانيكي' : '⚙️ Mechanical'}</option>
  <option value="HYDRAULIC">{language === 'ar' ? '💧 هيدروليكي' : '💧 Hydraulic'}</option>
  <option value="PNEUMATIC">{language === 'ar' ? '💨 نيوماتيكي' : '💨 Pneumatic'}</option>
  <option value="OTHER">{language === 'ar' ? '🔧 أخرى' : '🔧 Other'}</option>
  </select>
  <input
  disabled={permit.productionRequired && !permit.productionApproval}
  placeholder={language === 'ar' ? 'رقم القفل/البطاقة' : 'Lock/Tag #'}
  value={lotoTag}
  onChange={e => setLotoTag(e.target.value)}
  className="text-xs p-2 border border-neutral-200 dark:border-neutral-700 rounded bg-neutral-50 dark:bg-neutral-800 focus:outline-none"
  />
  <input
  disabled={permit.productionRequired && !permit.productionApproval}
  placeholder={language === 'ar' ? 'اسم المنفذ' : 'Isolator Name'}
  value={lotoIsolator}
  onChange={e => setLotoIsolator(e.target.value)}
  className="text-xs p-2 border border-neutral-200 dark:border-neutral-700 rounded bg-neutral-50 dark:bg-neutral-800 focus:outline-none"
  />
  <button
  type="button"
  disabled={permit.productionRequired && !permit.productionApproval}
  onClick={addLoto}
  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded p-2 text-xs font-bold transition-colors"
  >
  {language === 'ar' ? '+ إضافة' : '+ Add LOTO'}
  </button>
  </div>
  
  {lotoDetails.length > 0 && (
  <div className="space-y-1.5 mt-2 border-t border-neutral-100 dark:border-neutral-800 pt-2">
  {lotoDetails.map((l, idx) => (
  <div key={l.id} className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-800 p-2 rounded border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-700 dark:text-neutral-300">
  <div className="flex items-center gap-3">
  <span className="bg-purple-100 text-purple-700 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]">{idx + 1}</span>
  <span>📍 {l.isolationPoint}</span>
  <span className="text-neutral-400">|</span>
  <span>⚡ {l.energyType}</span>
  <span className="text-neutral-400">|</span>
  <span>🔒 {l.lockTagNumber}</span>
  {l.isolatorName && <><span className="text-neutral-400">|</span><span>👤 {l.isolatorName}</span></>}
  </div>
  <button type="button" onClick={() => setLotoDetails(prev => prev.filter(x => x.id !== l.id))} className="text-red-500 hover:text-red-700 p-1">
  <Trash2 className="w-3.5 h-3.5" />
  </button>
  </div>
  ))}
  </div>
  )}
  </div>`;
text = text.replace(regex3, newBlock3);

fs.writeFileSync('frontend/src/components/PermitDetail.tsx', text);
console.log('Update Complete');
