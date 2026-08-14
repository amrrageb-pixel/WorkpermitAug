import re

with open('frontend/src/components/PermitFormV2.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the extra } at step 4
text = text.replace('{/* ──── STEP 4: Workers & PPE ──── */}}', '{/* ──── STEP 4: Workers & PPE ──── */}')

# Now for the missing ). The error says "Expected ) but found { " at line 915 which is the footer navigation.
# This means there's an open '(' before it.
# Wait, let's look at the footer navigation:
#  <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex justify-between items-center ">
#  {currentStep < totalSteps ? (
#  <button

# The error might be because line 911 `)}` was matched with something else, or `currentStep === 4 && (` was actually never closed properly.
# Let's count the `{` and `}` or `(` and `)`.
# Actually, the problem is line 687 was `}}`. Since it was inside JSX, the compiler saw `}` and closed something incorrectly.
# Let's write the file after fixing the first error and see if the second error disappears!
with open('frontend/src/components/PermitFormV2.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
