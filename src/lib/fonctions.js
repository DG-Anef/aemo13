// Fonction de traitement des caractères spéciaux

export function t(text) {
    return text
        // Minuscules
        .replace(/ç/g, "\u00E7")
        .replace(/à/g, "\u00E0")
        .replace(/â/g, "\u00E2")
        .replace(/é/g, "\u00E9")
        .replace(/è/g, "\u00E8")
        .replace(/ê/g, "\u00EA")
        .replace(/ë/g, "\u00EB")
        .replace(/î/g, "\u00EE")
        .replace(/ï/g, "\u00CF")
        .replace(/ô/g, "\u00F4")
        .replace(/ö/g, "\u00F6")
        .replace(/û/g, "\u00FB")
        .replace(/ü/g, "\u00FC")
        .replace(/œ/g, "\u0153")
        .replace(/æ/g, "\u00E6")

        // Majuscules
        .replace(/Ç/g, "\u00C7")
        .replace(/À/g, "\u00C0")
        .replace(/Â/g, "\u00C2")
        .replace(/É/g, "\u00C9")
        .replace(/È/g, "\u00C8")
        .replace(/Ê/g, "\u00CA")
        .replace(/Ë/g, "\u00CB")
        .replace(/Î/g, "\u00CE")
        .replace(/Ï/g, "\u00CF")
        .replace(/Ô/g, "\u00D4")
        .replace(/Ö/g, "\u00D6")
        .replace(/Û/g, "\u00DB")
        .replace(/Ü/g, "\u00DC")
        .replace(/Œ/g, "\u0152")
        .replace(/Æ/g, "\u00C6");
}