import { resolvePath, toTokenList } from './pathUtils.js';

const NCX_NAMESPACE = 'http://www.daisy.org/z3986/2005/ncx/';

export const parseTableOfContents = async (zip, manifestEntries, basePath) => {
    const ncxManifestItem = manifestEntries.find(
        (item) => item.mediaType === 'application/x-dtbncx+xml'
    );

    if (ncxManifestItem?.href) {
        const ncxPath = resolvePath(basePath, ncxManifestItem.href);
        const ncxContent = await zip.file(ncxPath)?.async('string');

        if (ncxContent) {
            const ncxBasePath = ncxPath.includes('/') ? ncxPath.substring(0, ncxPath.lastIndexOf('/')) : '';
            const parser = new DOMParser();
            const doc = parser.parseFromString(ncxContent, 'application/xml');
            // Read NCX tags with namespace-first lookup, then fallback for non-namespaced files.
            const getNcxElementList = (node, tagName) => {
                const namespaced = Array.from(node.getElementsByTagNameNS(NCX_NAMESPACE, tagName));
                if (namespaced.length) return namespaced;
                return Array.from(node.getElementsByTagName(tagName));
            };

            // Recursively map NCX navPoint tree into sidebar TOC entries.
            const mapNcxNavPoint = (navPoint) => {
            const directChildren = Array.from(navPoint.children || [])
                .filter((child) => {
                const tag = child.tagName?.toLowerCase?.() || '';
                return tag === 'navpoint' || tag.endsWith(':navpoint');
                })
                .map(mapNcxNavPoint)
                .filter((item) => item.href);

                const labelNode = getNcxElementList(navPoint, 'text')[0];
                const contentNode = getNcxElementList(navPoint, 'content')[0];
                const label = labelNode?.textContent?.trim() || 'Section';
                const src = contentNode?.getAttribute('src') || '';
                return {
                    label,
                    href: resolvePath(ncxBasePath, src),
                    subitems: directChildren
                };
            };

            const navMap = getNcxElementList(doc, 'navMap')[0];
            const topLevelPoints = navMap
            ? Array.from(navMap.children || []).filter((child) => {
                const tag = child.tagName?.toLowerCase?.() || '';
                return tag === 'navpoint' || tag.endsWith(':navpoint');
                })
            : [];

            const ncxToc = topLevelPoints
            .map(mapNcxNavPoint)
            .filter((item) => item.href);

            if (ncxToc.length) return ncxToc;
        }
    }

    const navManifestItem = manifestEntries.find((item) => {
        const properties = toTokenList(item.properties);
        return item.mediaType === 'application/xhtml+xml' && properties.includes('nav');
    });

    if (!navManifestItem?.href) return [];

    const navPath = resolvePath(basePath, navManifestItem.href);
    const navContent = await zip.file(navPath)?.async('string');
    if (!navContent) return [];
    const navBasePath = navPath.includes('/') ? navPath.substring(0, navPath.lastIndexOf('/')) : '';

    const parser = new DOMParser();
    const xhtmlDoc = parser.parseFromString(navContent, 'application/xhtml+xml');
    const parseError = xhtmlDoc.querySelector('parsererror');
    const doc = parseError ? parser.parseFromString(navContent, 'text/html') : xhtmlDoc;

    const navElements = Array.from(doc.querySelectorAll('nav'));
    const tocNav = navElements.find((navElement) => {
        const epubTypeTokens = toTokenList(navElement.getAttribute('epub:type'));
        const typeTokens = toTokenList(navElement.getAttribute('type'));
        const roleTokens = toTokenList(navElement.getAttribute('role'));
        const id = String(navElement.getAttribute('id') || '').toLowerCase();
        const classTokens = toTokenList(navElement.getAttribute('class'));
        return epubTypeTokens.includes('toc')
            || typeTokens.includes('toc')
            || roleTokens.includes('doc-toc')
            || id === 'toc'
            || classTokens.includes('toc')
            || classTokens.includes('table-of-contents');
    }) || navElements[0];

    if (!tocNav) return [];

    // Recursively map EPUB3 nav list items (ol/ul > li > a) into nested TOC entries.
    const mapNavListItem = (listItem) => {
        const directAnchor = Array.from(listItem.children || []).find((child) => {
            const tag = child.tagName?.toLowerCase?.() || '';
            return tag === 'a';
        });

        if (!directAnchor) return null;

        const nestedList = Array.from(listItem.children || []).find((child) => {
            const tag = child.tagName?.toLowerCase?.() || '';
            return tag === 'ol' || tag === 'ul';
        });

        const subitems = nestedList
            ? Array.from(nestedList.children || [])
                .map(mapNavListItem)
                .filter((item) => item?.href)
            : [];

        const label = directAnchor.textContent?.trim() || 'Section';
        const href = directAnchor.getAttribute('href') || '';
        return {
            label,
            href: resolvePath(navBasePath, href),
            subitems
        };
    };

    const topLevelList = tocNav.querySelector('ol, ul');
    const navToc = topLevelList
    ? Array.from(topLevelList.children || [])
        .map(mapNavListItem)
        .filter((item) => item?.href)
    : [];

    return navToc;
};