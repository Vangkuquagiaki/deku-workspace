import zipfile
import xml.etree.ElementTree as ET
import glob
import os
import datetime

output_file = r'f:\discord-clone-main\scratch\updated_docx_content.txt'

files = glob.glob(r'f:\discord-clone-main\kaggle\*.docx')
# sort by modification time descending
files.sort(key=lambda x: os.path.getmtime(x), reverse=True)

with open(output_file, 'w', encoding='utf-8') as out:
    for path in files:
        mtime = datetime.datetime.fromtimestamp(os.path.getmtime(path)).isoformat()
        out.write(f"\n==========================================\n")
        out.write(f"FILE: {os.path.basename(path)}\n")
        out.write(f"MODIFIED AT: {mtime}\n")
        out.write(f"SIZE: {os.path.getsize(path)} bytes\n")
        out.write(f"==========================================\n")
        try:
            with zipfile.ZipFile(path) as z:
                xml_content = z.read('word/document.xml')
                tree = ET.fromstring(xml_content)
                paragraphs = []
                for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                    texts = [node.text for node in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
                    if texts:
                        paragraphs.append(''.join(texts))
                out.write('\n'.join(paragraphs))
                out.write('\n')
        except Exception as e:
            out.write(f"Error reading {path}: {e}\n")

with open(r'f:\discord-clone-main\scratch\status.txt', 'w', encoding='utf-8') as s:
    s.write("DONE")
