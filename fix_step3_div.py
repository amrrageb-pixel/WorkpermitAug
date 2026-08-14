import re

with open('frontend/src/components/PermitFormV2.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace )} before STEP 4 with </div>)}
text = text.replace('  )}\n\n  {/* ──── STEP 4: Workers & PPE ──── */}', '  </div>\n  )}\n\n  {/* ──── STEP 4: Workers & PPE ──── */}')

with open('frontend/src/components/PermitFormV2.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
