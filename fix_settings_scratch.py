import os

path = r'C:\Users\ParthSancheti\.gemini\antigravity\brain\938a59d0-439a-44f8-a14f-586532c2af74\scratch\settings3.txt'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Let's fix the missing closing tags at the end of the file in settings3
content = content.replace('          </motion.div>\n  );\n}\n', '          </motion.div>\n        )}\n      </AnimatePresence>\n    </motion.div>\n  );\n}\n')

with open(r'D:\skcti\app\(student)\settings\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
