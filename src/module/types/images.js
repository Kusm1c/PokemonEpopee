/**
 * Type bars per language.
 *
 * The type bars (`types2/FightingIC.png`...) have the type's name drawn into the image, so
 * each language gets its own folder with the same file names: `types2/fr/FightingIC.png`.
 * The icons (`*_Icon.png`) carry no text and are shared.
 *
 * To add a language: create `types2/<lang>/` with every `*IC.png`, then list it here.
 */

const LOCALIZED_TYPE_IMAGES = ["fr"];

/** A system type bar: `.../static/css/images/types2/<Name>IC.png`, not in a language folder. */
const BAR_PATH = /^(.*\/static\/css\/images\/types2\/)([^/]+IC\.png)$/;

/**
 * The bar for the current language. Any other path - an icon, a custom type's image from
 * the type settings - comes back unchanged.
 *
 * @param {string} path
 * @returns {string}
 */
function localizedTypeImage(path) {
    if (typeof path !== "string") return path;
    const lang = game.i18n?.lang;
    if (!LOCALIZED_TYPE_IMAGES.includes(lang)) return path;
    const match = path.match(BAR_PATH);
    return match ? `${match[1]}${lang}/${match[2]}` : path;
}

export { LOCALIZED_TYPE_IMAGES, localizedTypeImage };
