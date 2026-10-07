# The signed form

`AAS-VSC-1-11-2022-platinum.pdf` is the contract this program sells, supplied by
the client on 7 Oct 2026. `AAS-VSC-1-11-2022-platinum.txt` is its extracted
text, so a claim can be checked with `grep` instead of by memory, and
`extract.py` is how the text was produced (pypdf, with `cryptography` stubbed
out because the image's build of it panics on import; run it with `python3 -I`).

**md5 of the PDF: `4c4ee09c6aea80943b50cd2b51015059`.** Re-extract rather than
trusting the .txt if that ever disagrees.

`brand/offer.json` is the machine-readable summary and carries a `_basis` note
quoting this form for every claim. This directory is the source those notes
quote. When the two disagree, the form wins and `offer.json` is the thing to
fix.

## Administrator and obligor: read the state line, not the default

The DEFINITIONS section names `Ascent Administration Services, LLC` as
Administrator/Obligor, and then replaces it per state:

| State | Administrator | Obligor |
|---|---|---|
| default | Ascent Administration Services, LLC | Ascent Administration Services, LLC |
| New York | ORIAS Warranty Services | ORIAS Warranty Services |
| California | Old Republic Insured Automotive Services, Inc. | Old Republic Insured Automotive Services, Inc. |
| Florida | Minnehoma Automobile Association, Inc. | Old Republic Insurance Company |

**In New York, ORIAS replaces Ascent in BOTH roles**, not just as obligor. That
is one line of the form and it is easy to get half right: a client-facing
document in this project said "administered by Ascent, with ORIAS as the New
York obligor", which is wrong for every Ferrario customer. The generated email
footer was correct, because `email/build.mjs` resolves one `OBLIGOR` value from
`offer.json`'s `obligor_by_state` and prints it for both roles.

Florida is the only state where the two genuinely differ, so anything that
models this as a single value is right for NY and CA and wrong for FL. Check
before adding a Florida rooftop.

Ferrario Ford is in NY, so for every contract this campaign sells today the
administrator and obligor are both ORIAS Warranty Services.
