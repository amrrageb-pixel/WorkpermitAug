import re

def update_permit_detail():
    with open('frontend/src/components/PermitDetail.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Block 1
    old_b1 = """  {permit.electricalApproval ? (
  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
  {language === 'ar' ? `✓ قفل برقم: ${permit.lotoLockNumber} معتمد` : `✓ Lock: ${permit.lotoLockNumber} Approved`}
  </span>"""
    new_b1 = """  {permit.electricalApproval ? (
  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
  {language === 'ar' ? `✓ تم التوثيق (${permit.lotoDetails?.length || 0} نقطة)` : `✓ Verified (${permit.lotoDetails?.length || 0} Points)`}
  </span>"""

    # Block 2
    old_b2 = """  {permit.electricalApproval ? (
  <div className="grid grid-cols-2 gap-3 text-xs text-neutral-600 bg-white dark:bg-neutral-900 p-2.5 rounded-lg border border-neutral-100 text-start">
  <p><strong>{language === 'ar' ? 'رقم قفل الأمان: ' : 'Lock ID: '}</strong>{permit.lotoLockNumber}</p>
  <p><strong>{language === 'ar' ? 'رقم مفتاح التحكم: ' : 'Key ID: '}</strong>{permit.lotoKeyNumber}</p>
  <p className="col-span-2 pt-1 border-t border-neutral-100"><strong>{language === 'ar' ? 'تقرير الكهرباء: ' : 'Comment: '}</strong>{permit.electricalComment}</p>
  </div>"""
    new_b2 = """  {permit.electricalApproval ? (
  <div className="bg-white dark:bg-neutral-900 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 text-start">
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
  </div>"""

    # Block 3
    old_b3 = """  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
  <div>
  <label className="block text-[11px] font-bold text-neutral-500 mb-1">{language === 'ar' ? 'رقم قفل العزل الفعلي (LOTO Lock No):' : 'LOTO Lock Lockout ID:'}</label>
  <input
  id="loto-lock-input"
  type="text"
  disabled={permit.productionRequired && !permit.productionApproval}
  value={lotoLock}
  onChange={(e) => setLotoLock(e.target.value)}
  placeholder="e.g. LOTO-E-401"
  className={`w-full text-xs p-2 bg-white dark:bg-neutral-900 border rounded-lg focus:outline-none ${
  permit.productionRequired && !permit.productionApproval
  ? 'border-neutral-200 dark:border-neutral-800 opacity-60 cursor-not-allowed'
  : 'border-neutral-200 dark:border-neutral-800'
  }`}
  />
  </div>
  <div>
  <label className="block text-[11px] font-bold text-neutral-500 mb-1">{language === 'ar' ? 'رقم مفتاح صندوق المحولات (Safety Key No):' : 'LOTO Safety Control Key No:'}</label>
  <input
  id="loto-key-input"
  type="text"
  disabled={permit.productionRequired && !permit.productionApproval}
  value={lotoKey}
  onChange={(e) => setLotoKey(e.target.value)}
  placeholder="e.g. KEY-401-A"
  className={`w-full text-xs p-2 bg-white dark:bg-neutral-900 border rounded-lg focus:outline-none ${
  permit.productionRequired && !permit.productionApproval
  ? 'border-neutral-200 dark:border-neutral-800 opacity-60 cursor-not-allowed'
  : 'border-neutral-200 dark:border-neutral-800'
  }`}
  />
  </div>
  </div>"""
    
    new_b3 = """  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-lg">
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
  {language === 'ar' ? '+ إضافة' : '+ Add'}
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
  </div>"""

    content = content.replace(old_b1, new_b1)
    content = content.replace(old_b2, new_b2)
    content = content.replace(old_b3, new_b3)
    
    with open('frontend/src/components/PermitDetail.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
        
if __name__ == '__main__':
    update_permit_detail()
    print('done')
