import JSZip from "jszip";
import { parseAndProcessChapter } from "./processChapter.js";
import { parseTableOfContents } from "./parseTableOfContents.js";
import { resolvePath } from "./pathUtils.js";

const MIN_TOC_SIZE_THRESHOLD = 3;
const MIN_SPINE_SIZE_FOR_FALLBACK = 5;

const parseOpfPath = (containerXml) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(containerXml, "application/xml");
  return doc.querySelector("rootfile")?.getAttribute("full-path") || null;
};

export async function parseEpubArchive(file, createTrackedObjectUrl) {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const containerContent = await zip
    .file("META-INF/container.xml")
    ?.async("string");
  if (!containerContent) {
    throw new Error("Invalid EPUB: Missing META-INF/container.xml");
  }

  const opfPath = parseOpfPath(containerContent);
  if (!opfPath) {
    throw new Error("Invalid EPUB: Could not determine OPF path");
  }

  const opfContent = await zip.file(opfPath)?.async("string");
  if (!opfContent) {
    throw new Error("Invalid EPUB: Missing package document");
  }

  const opfBasePath = opfPath.includes("/")
    ? opfPath.substring(0, opfPath.lastIndexOf("/") + 1)
    : "";
  const opfDoc = new DOMParser().parseFromString(opfContent, "application/xml");

  const metadata = {
    title:
      opfDoc
        .querySelector("metadata > title, metadata > dc\\:title")
        ?.textContent?.trim() || "Untitled",
    creator:
      opfDoc
        .querySelector("metadata > creator, metadata > dc\\:creator")
        ?.textContent?.trim() || "Unknown Author",
    identifier:
      opfDoc
        .querySelector("metadata > identifier, metadata > dc\\:identifier")
        ?.textContent?.trim() || "",
  };

  const manifestItems = Array.from(
    opfDoc.querySelectorAll("manifest > item"),
  ).map((item) => ({
    id: item.getAttribute("id") || "",
    href: item.getAttribute("href") || "",
    mediaType: item.getAttribute("media-type") || "",
    properties: item.getAttribute("properties") || "",
  }));

  const manifestById = new Map(manifestItems.map((item) => [item.id, item]));
  const spineItems = Array.from(opfDoc.querySelectorAll("spine > itemref"))
    .map((itemRef) => {
      const idref = itemRef.getAttribute("idref") || "";
      const entry = manifestById.get(idref);
      return entry?.href
        ? { id: idref, href: resolvePath(opfBasePath, entry.href) }
        : null;
    })
    .filter(Boolean);

  const parsedToc = await parseTableOfContents(zip, manifestItems, opfBasePath);
  const flatToc = [];
  const flattenToc = (entries) =>
    entries.forEach((entry) => {
      flatToc.push(entry);
      if (entry.subitems?.length) flattenToc(entry.subitems);
    });
  flattenToc(parsedToc);

  const chapterEntries = [];
  for (let index = 0; index < spineItems.length; index += 1) {
    const spineItem = spineItems[index];
    const chapterFile = zip.file(spineItem.href);
    if (!chapterFile) continue;
    try {
      const rawContent = await chapterFile.async("string");
      const chapterBasePath = spineItem.href.includes("/")
        ? spineItem.href.substring(0, spineItem.href.lastIndexOf("/"))
        : "";
      const content = await parseAndProcessChapter(
        rawContent,
        zip,
        chapterBasePath,
        createTrackedObjectUrl,
      );
      const doc = new DOMParser().parseFromString(content, "text/html");
      const stylesHtml = Array.from(
        doc.querySelectorAll('style, link[rel="stylesheet"]'),
      )
        .map((style) => style.outerHTML)
        .join("");
      const bodyNode = doc.querySelector("body");
      const bodyHtml = bodyNode ? bodyNode.innerHTML : content;
      const chapterFileName = spineItem.href.split("/").pop() || spineItem.href;
      const matchingToc = flatToc.find(
        (item) => item.href.split("#")[0].split("/").pop() === chapterFileName,
      );
      chapterEntries.push({
        index,
        href: spineItem.href,
        title: matchingToc?.label || `Section ${index + 1}`,
        content,
        styles: stylesHtml,
        body: bodyHtml,
      });
    } catch (error) {
      console.error(`Failed to parse chapter ${index}:`, error);
    }
  }

  const useSpineFallbackToc =
    parsedToc.length === 0 ||
    (parsedToc.length < MIN_TOC_SIZE_THRESHOLD &&
      spineItems.length > MIN_SPINE_SIZE_FOR_FALLBACK);

  const sidebarToc = useSpineFallbackToc
    ? chapterEntries.map((chapter) => ({
        label: chapter.title,
        href: chapter.href,
        subitems: [],
      }))
    : parsedToc;

  let cover = null;
  const declared =
    manifestItems.find((item) =>
      item.properties.split(" ").includes("cover-image"),
    ) ||
    manifestById.get(
      opfDoc.querySelector('meta[name="cover"]')?.getAttribute("content"),
    );
  const candidates = [
    declared,
    ...manifestItems.filter((item) => item.mediaType.startsWith("image/")),
  ].filter(Boolean);
  for (const item of candidates) {
    const entry = zip.file(resolvePath(opfBasePath, item.href));
    if (!entry) continue;
    cover =
      "data:" + item.mediaType + ";base64," + (await entry.async("base64"));
    break;
  }
  return {
    cover,
    metadata,
    sidebarToc,
    chapterEntries,
    spineItems,
  };
}
