"""Builds src/fonts/*.woff2 from Google Fonts' sources (github.com/google/fonts): each file is converted to WOFF2
and nothing else, so every font stays complete and keeps its name (several reserve it under the OFL).
Needs fonttools and brotli. Run: python dev/build-fonts.py <folder for downloads> [output folder, default src/fonts]
"""
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from fontTools.ttLib import TTFont

RAW = "https://raw.githubusercontent.com/google/fonts/main/"
OUT = Path(__file__).resolve().parent.parent / "src" / "fonts"

# Output file: source path in google/fonts. Italics sit beside each upright.
FONTS = {
    "GoogleSans": "ofl/googlesans/GoogleSans[GRAD,opsz,wght].ttf",
    "GoogleSans-Italic": "ofl/googlesans/GoogleSans-Italic[GRAD,opsz,wght].ttf",
    "Inter": "ofl/inter/Inter[opsz,wght].ttf",
    "Inter-Italic": "ofl/inter/Inter-Italic[opsz,wght].ttf",
    "Roboto": "ofl/roboto/Roboto[wdth,wght].ttf",
    "Roboto-Italic": "ofl/roboto/Roboto-Italic[wdth,wght].ttf",
    "OpenSans": "ofl/opensans/OpenSans[wdth,wght].ttf",
    "OpenSans-Italic": "ofl/opensans/OpenSans-Italic[wdth,wght].ttf",
    "Lato-Regular": "ofl/lato/Lato-Regular.ttf",
    "Lato-Italic": "ofl/lato/Lato-Italic.ttf",
    "Lato-Bold": "ofl/lato/Lato-Bold.ttf",
    "Lato-BoldItalic": "ofl/lato/Lato-BoldItalic.ttf",
    "Montserrat": "ofl/montserrat/Montserrat[wght].ttf",
    "Montserrat-Italic": "ofl/montserrat/Montserrat-Italic[wght].ttf",
    "Poppins-Regular": "ofl/poppins/Poppins-Regular.ttf",
    "Poppins-Italic": "ofl/poppins/Poppins-Italic.ttf",
    "Poppins-Bold": "ofl/poppins/Poppins-Bold.ttf",
    "Poppins-BoldItalic": "ofl/poppins/Poppins-BoldItalic.ttf",
    "Nunito": "ofl/nunito/Nunito[wght].ttf",
    "Nunito-Italic": "ofl/nunito/Nunito-Italic[wght].ttf",
    "DMSans": "ofl/dmsans/DMSans[opsz,wght].ttf",
    "DMSans-Italic": "ofl/dmsans/DMSans-Italic[opsz,wght].ttf",
    "WorkSans": "ofl/worksans/WorkSans[wght].ttf",
    "WorkSans-Italic": "ofl/worksans/WorkSans-Italic[wght].ttf",
    "SourceSans3": "ofl/sourcesans3/SourceSans3[wght].ttf",
    "SourceSans3-Italic": "ofl/sourcesans3/SourceSans3-Italic[wght].ttf",
    "Figtree": "ofl/figtree/Figtree[wght].ttf",
    "Figtree-Italic": "ofl/figtree/Figtree-Italic[wght].ttf",
    "AtkinsonHyperlegibleNext": "ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext[wght].ttf",
    "AtkinsonHyperlegibleNext-Italic": "ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext-Italic[wght].ttf",
    "Lexend": "ofl/lexend/Lexend[wght].ttf",
    "Raleway": "ofl/raleway/Raleway[wght].ttf",
    "Raleway-Italic": "ofl/raleway/Raleway-Italic[wght].ttf",
    "Merriweather": "ofl/merriweather/Merriweather[opsz,wdth,wght].ttf",
    "Merriweather-Italic": "ofl/merriweather/Merriweather-Italic[opsz,wdth,wght].ttf",
    "Lora": "ofl/lora/Lora[wght].ttf",
    "Lora-Italic": "ofl/lora/Lora-Italic[wght].ttf",
    "PlayfairDisplay": "ofl/playfairdisplay/PlayfairDisplay[wght].ttf",
    "PlayfairDisplay-Italic": "ofl/playfairdisplay/PlayfairDisplay-Italic[wght].ttf",
    "EBGaramond": "ofl/ebgaramond/EBGaramond[wght].ttf",
    "EBGaramond-Italic": "ofl/ebgaramond/EBGaramond-Italic[wght].ttf",
    "LibreBaskerville": "ofl/librebaskerville/LibreBaskerville[wght].ttf",
    "LibreBaskerville-Italic": "ofl/librebaskerville/LibreBaskerville-Italic[wght].ttf",
    "SourceSerif4": "ofl/sourceserif4/SourceSerif4[opsz,wght].ttf",
    "SourceSerif4-Italic": "ofl/sourceserif4/SourceSerif4-Italic[opsz,wght].ttf",
    "Literata": "ofl/literata/Literata[opsz,wght].ttf",
    "Literata-Italic": "ofl/literata/Literata-Italic[opsz,wght].ttf",
    "RobotoSlab": "apache/robotoslab/RobotoSlab[wght].ttf",
    "JetBrainsMono": "ofl/jetbrainsmono/JetBrainsMono[wght].ttf",
    "JetBrainsMono-Italic": "ofl/jetbrainsmono/JetBrainsMono-Italic[wght].ttf",
    "FiraCode": "ofl/firacode/FiraCode[wght].ttf",
    "SourceCodePro": "ofl/sourcecodepro/SourceCodePro[wght].ttf",
    "SourceCodePro-Italic": "ofl/sourcecodepro/SourceCodePro-Italic[wght].ttf",
    "IBMPlexMono-Regular": "ofl/ibmplexmono/IBMPlexMono-Regular.ttf",
    "IBMPlexMono-Italic": "ofl/ibmplexmono/IBMPlexMono-Italic.ttf",
    "IBMPlexMono-Bold": "ofl/ibmplexmono/IBMPlexMono-Bold.ttf",
    "IBMPlexMono-BoldItalic": "ofl/ibmplexmono/IBMPlexMono-BoldItalic.ttf",
    "Oswald": "ofl/oswald/Oswald[wght].ttf",
    "BebasNeue-Regular": "ofl/bebasneue/BebasNeue-Regular.ttf",
    "Caveat": "ofl/caveat/Caveat[wght].ttf",
    "Pacifico-Regular": "ofl/pacifico/Pacifico-Regular.ttf",
    "ComicNeue-Regular": "ofl/comicneue/ComicNeue-Regular.ttf",
    "ComicNeue-Italic": "ofl/comicneue/ComicNeue-Italic.ttf",
    "ComicNeue-Bold": "ofl/comicneue/ComicNeue-Bold.ttf",
    "ComicNeue-BoldItalic": "ofl/comicneue/ComicNeue-BoldItalic.ttf",
}



def build(name, source, downloads):
    local = downloads / Path(source).name
    if not local.exists():
        urllib.request.urlretrieve(RAW + urllib.parse.quote(source), local)
    font = TTFont(local)
    font.flavor = "woff2"
    out = OUT / f"{name}.woff2"
    font.save(out)
    return out.stat().st_size


if __name__ == "__main__":
    downloads = Path(sys.argv[1])
    if len(sys.argv) > 2:
        OUT = Path(sys.argv[2])
    downloads.mkdir(parents=True, exist_ok=True)
    total = 0
    for name, source in FONTS.items():
        size = build(name, source, downloads)
        total += size
        print(f"{name}: {size // 1024} KB")
    print(f"total {total / 1024 / 1024:.1f} MB")
