import { resolvePath } from './pathUtils.js';

const stripFontFaceRules = (cssText) => cssText.replace(/@font-face\s*{[\s\S]*?}/gi, '');

const processCssUrls = async (cssText, zip, cssPath, createTrackedObjectUrl) => {
    const cssBasePath = cssPath.includes('/') ? cssPath.substring(0, cssPath.lastIndexOf('/')) : '';
    const urlPattern = /url\(['"]?([^'")]+)['"]?\)/g;
    const cssWithoutFontFaces = stripFontFaceRules(cssText);
    const matches = [...cssWithoutFontFaces.matchAll(urlPattern)];
    let updated = cssWithoutFontFaces;

    for (const match of matches) {
        const original = match[1];
        if (!original
            || original.startsWith('data:')
            || original.startsWith('blob:')
        ) continue;

        const resolved = resolvePath(cssBasePath, original);
        const file = zip.file(resolved);
        if (!file) continue;

        try {
            const blob = await file.async('blob');
            const blobUrl = createTrackedObjectUrl(blob);
            updated = updated.replace(match[0], `url('${blobUrl}')`);
        } catch (error) {
            console.warn('Unable to process CSS asset:', resolved, error);
        }
    }

    return updated;
};

export const parseAndProcessChapter = async (chapterContent, zip, basePath, createTrackedObjectUrl) => {
    const parser = new DOMParser();
    const xhtmlDoc = parser.parseFromString(chapterContent, 'application/xhtml+xml');
    const parseError = xhtmlDoc.querySelector('parsererror');
    const doc = parseError ? parser.parseFromString(chapterContent, 'text/html') : xhtmlDoc;

    const links = doc.querySelectorAll("link[rel='stylesheet']");
    for (const link of Array.from(links)) {
        const href = link.getAttribute('href') || '';
        const resolved = resolvePath(basePath, href);
        const file = zip.file(resolved);
        if (!file) continue;

        try {
            const cssContent = await file.async('string');
            const processedCss = await processCssUrls(
                cssContent,
                zip,
                resolved,
                createTrackedObjectUrl
            );
            /**
             * Inline the CSS instead of linking a blob: URL.
             * fixing the blocked blob stylesheets in firefox.
             */
            const styleTag = doc.createElement('style');
            styleTag.textContent = processedCss;
            const media = link.getAttribute('media');
            if (media) styleTag.setAttribute('media', media);
            link.replaceWith(styleTag);
        } catch (error) {
            console.warn('Unable to process stylesheet:', resolved, error);
        }
    }

    const styleTags = doc.querySelectorAll('style');
    for (const styleTag of Array.from(styleTags)) {
        if (!styleTag.textContent) {
            continue;
        }
        styleTag.textContent = await processCssUrls(
            styleTag.textContent,
            zip,
            basePath,
            createTrackedObjectUrl
        );
    }

    const images = doc.querySelectorAll('img');
    for (const image of Array.from(images)) {
        const src = image.getAttribute('src') || '';
        if (!src
            || src.startsWith('data:')
            || src.startsWith('blob:')
        ) continue;

        const resolved = resolvePath(basePath, src);
        const file = zip.file(resolved);
        if (!file) continue;

        try {
            const blob = await file.async('blob');
            image.setAttribute('src', createTrackedObjectUrl(blob));
        } catch (error) {
            console.warn('Unable to process image:', resolved, error);
        }
    }

    const svgImages = doc.querySelectorAll('image');
    for (const image of Array.from(svgImages)) {
        const href = image.getAttribute('xlink:href') || image.getAttribute('href') || '';
        if (!href
            || href.startsWith('data:')
            || href.startsWith('blob:')
        ) continue;

        const resolved = resolvePath(basePath, href);
        const file = zip.file(resolved);
        if (!file) continue;

        try {
            const blob = await file.async('blob');
            const blobUrl = createTrackedObjectUrl(blob);
            image.setAttribute('href', blobUrl);
            image.removeAttribute('xlink:href');
        } catch (error) {
            console.warn('Unable to process SVG image:', resolved, error);
        }
    }

    return new XMLSerializer().serializeToString(doc);
};