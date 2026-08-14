const fs = require('fs');

let text = fs.readFileSync('frontend/src/components/PermitFormV2.tsx', 'utf-8');

// 1. Remove the floating LOTO properties
const regex1 = /value=\{lotoPt\}[\s\S]*?<option value=\"MECHANICAL\">\{language === 'ar' \? '⚙️ ميكانيكي' : '⚙️ Mechanical'\}<\/option>/;
text = text.replace(regex1, '');

// 2. Remove the stray closing bracket at the end of step 3
// Let's find:
//     </div>
//   </div>
// 
//   </div>
//   )}
// 
//   {/* ──── STEP 4: Workers & PPE ──── */}
const regex2 = /<\/div>\s*<\/div>\s*<\/div>\s*\)\}\s*\{\/\* ──── STEP 4: Workers & PPE ──── \*\//;
const newBlock2 = `    </div>
  </div>
  
  {/* ──── STEP 4: Workers & PPE ──── */}`;
text = text.replace(regex2, newBlock2);

// 3. Since we removed a closing brace for step 3, we probably need to add one?
// Wait, Step 3 starts with {currentStep === 3 && ( 
// so it SHOULD be closed. Let's see if currentStep === 2 was closed.
// Let's write the whole content back to check with tsc.
fs.writeFileSync('frontend/src/components/PermitFormV2.tsx', text);
console.log('Fixed syntax?');
