#!/usr/bin/env python3

import re

# Read the file
with open('src/IDE/services/aiService.ts', 'r') as f:
    content = f.read()

# Fix all ai.models.generateContent calls
content = re.sub(
    r'const response = await ai\.models\.generateContent\(',
    'const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });\n        const response = await model.generateContent(',
    content
)

# Fix remaining ai.models.generateContent calls that might have different spacing
content = re.sub(
    r'const response = await ai\.models\.generateContent\(',
    'const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });\n     const response = await model.generateContent(',
    content
)

# Fix Type references
content = content.replace('Type.OBJECT', '"object"')
content = content.replace('Type.STRING', '"string"')
content = content.replace('Type.ARRAY', '"array"')
content = content.replace('Type.INTEGER', '"integer"')
content = content.replace('Type.BOOLEAN', '"boolean"')

# Remove model parameter from generateContent calls since it's now in getGenerativeModel
content = re.sub(r'model: [\'"]gemini-[^\'",]+[\'"],\s*', '', content)

# Write back
with open('src/IDE/services/aiService.ts', 'w') as f:
    f.write(content)

print("Fixed AI service calls!")