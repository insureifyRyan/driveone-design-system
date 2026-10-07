import sys, types
# pypdf imports cryptography eagerly for encrypted files; this PDF is not
# encrypted and the system cryptography build panics on import, so stub it out.
for name in ["cryptography", "cryptography.exceptions", "cryptography.hazmat",
             "cryptography.hazmat.primitives", "cryptography.hazmat.primitives.ciphers",
             "cryptography.hazmat.primitives.ciphers.algorithms",
             "cryptography.hazmat.primitives.ciphers.modes",
             "cryptography.hazmat.primitives.padding",
             "cryptography.hazmat.backends", "cryptography.hazmat.decrepit",
             "cryptography.hazmat.decrepit.ciphers",
             "cryptography.hazmat.decrepit.ciphers.algorithms"]:
    m = types.ModuleType(name)
    if name == "cryptography.exceptions":
        class UnsupportedAlgorithm(Exception): pass
        m.UnsupportedAlgorithm = UnsupportedAlgorithm
    sys.modules.setdefault(name, m)

from pypdf import PdfReader
r = PdfReader(sys.argv[1])
print("PAGES:", len(r.pages), file=sys.stderr)
for i, p in enumerate(r.pages, 1):
    t = p.extract_text() or ""
    print(f"\n========== PAGE {i} ==========\n{t}")
