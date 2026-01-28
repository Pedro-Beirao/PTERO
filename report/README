1. Distributions

The style file "feupteses.sty" defines setups for dissertations presented at FEUP.

Currently, it supports a generic setup (PhD by default) and setups for specific
MSc degrees (and a specific config/degree.cfg file).

Both Portuguese and English versions are supported (see `main.tex`).

Read the comments in `main.tex` file and modify accordingly.

Use folder ``figures'' to keep all your figures.
Use folder ``backmatter'' for your bibliography files.

The distribution has been tested with ''pdflatex''.

There's an (official) **template at Overleaf**: 
https://www.overleaf.com/latex/templates/feup-dissertation-format/qrsrxjjwzrzf

2. feupteses.sty style package

To use the package, please ensure that:
- you are using the the "report" document class with "a4paper" 
\documentclass[a4paper]{report}
- your files are UFT8 encoded
\usepackage[utf8]{inputenc}

To load the package, use the usual method:

\usepackage[<options>]{feupteses}

Options by topic:
- Language: portugues (English by default)
- Degree:  meec, meic, mem, mesw, mci
- Layout: juri, final (default: provisional)
- Media: onpaper (default: online)
- Internal references: backrefs (default: none)

Additional options for feupteses.sty:
- portugues: titles, etc in Portuguese
- onpaper: links are not shown (for paper versions)
- backrefs: include back references from bibliography to citation place
- iso: format references according to ISO 690 standard (default is chicago).

3. Document structure

The document should start with a Prolog environment (see main.tex).

\StartBody should be used to indicate the start of the main text.

Use the command \PrintBib where you want to place the references.

4. Automatically loaded packages
 
The feupteses package loads the standard packages listed below.
Do not load them again.

- acronym
- array
- babel
- backref
- biblatex
- booktabs
- caption
- couriers
- csquotes
- draftwatermark
- eurosym
- fancyhdr
- float
- fontenc
- geometry
- graphicx
- helvet
- hyperref
- ifpdf
- indentfirst
- lineno
- longtable
- mathptmx
- multirow
- setspace
- siunitx
- url
- xcolor

5.  Versions

Distribution: FEUP-TESES
Current version: v2025
feupteses.sty: 1.1.4

Changes for v2025:
1. add preliminary support for "Honour declaration" (currently disabled)
2. load package longtables update
3. load package siunitx for SI unit rules and style conventions
4. load package acronym
5. remove "A collection of existing standards can be found in~\textcite{kn:Mat93}"
6. change the structure of the distribution to use new folders: config/, fontmatter/, body/ and backmatter/

Changes for v2024:
1. added prologue section for "UN Sustainable Development Goals"
2. added mci option for MCI
3. bibtex replaced by biblatex

Changes for v2021:
1. Appendices after bibliography
2. Single page documents by default
3. Link colors are now 'engineering'
4. Automatic centering of figure and table contents with extra space

Changes for v2017:
1. added mesw option for MESW
2. master thesis use numeric referencing (sorted)

Changes for v2014:
1. use indentfirst for portuguese
2. added miem option (Daniel Moura) for MIEM

Changes for v2012b:
1. references before the numbered appendixes

Changes for v2012:
1. new logo (UPorto FEUP)
2. new Portuguese spelling rules 
3. uses feupteses.sty 1.1
4. new option (backrefs) for reversed references from bibliography to citation page
5. new command to define additional text for the front page (\additionalfronttext)

Changes for v2011b:
1. support for url and lastcheckd fields in bibliographies (conversion
done with urlbst: http://ctan.mackichan.com/biblio/bibtex/contrib/urlbst/urlbst.htm)

Changes for v2011a:
1. correct indication of technical report in unsrt-pt.bst (thanks to Marcelo Almeida)

Changes for v2011:
1. new option scheme
2. support for line numbers in jury version
3. changes to status indication (jury, final)
4. removed support for versioning

Changes for v2009f:
1. option onpaper: hide hyperlinks

Changes for v2009e:
1. plainnat-pt.bst: finished conversion to Portuguese.
2. unsrt-pt.bst: added to the distribution

-- First version created in 2008