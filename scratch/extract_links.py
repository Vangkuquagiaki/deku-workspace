import zipfile
import xml.etree.ElementTree as ET
import glob
import os

files = glob.glob(r'f:\discord-clone-main\kaggle\*Seed Data*.docx')
if files:
    path = files[0]
    with zipfile.ZipFile(path) as z:
        rels_xml = z.read('word/_rels/document.xml.rels')
        rels_tree = ET.fromstring(rels_xml)
        rel_map = {}
        for r in rels_tree:
            rid = r.attrib.get('Id')
            target = r.attrib.get('Target')
            rel_map[rid] = target

        doc_xml = z.read('word/document.xml')
        doc_tree = ET.fromstring(doc_xml)
        
        with open(r'f:\discord-clone-main\scratch\extracted_links.txt', 'w', encoding='utf-8') as out:
            out.write('=== HYPERLINKS IN DOCUMENT ===\n')
            for elem in doc_tree.iter():
                if elem.tag.endswith('hyperlink'):
                    rid = elem.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
                    text = ''.join([t.text for t in elem.iter() if t.text])
                    target = rel_map.get(rid, 'UNKNOWN')
                    out.write(f'{text} -> {target}\n')

print("Extraction completed!")
