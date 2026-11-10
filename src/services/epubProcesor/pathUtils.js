export const normalizePath = (path) => String(path || "").replace(/^\/+/, "");
export const toTokenList = (value) =>
  String(value || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

export const resolvePath = (basePath, relativePath) => {
  if (!relativePath) return "";
  if (relativePath.startsWith("data:") || relativePath.startsWith("blob:"))
    return relativePath;
  if (relativePath.startsWith("/")) return relativePath.slice(1);

  const baseParts = normalizePath(basePath).split("/").filter(Boolean);
  const relParts = relativePath.split("/");

  for (const part of relParts) {
    if (part === "..") {
      baseParts.pop();
    } else if (part && part !== ".") {
      baseParts.push(part);
    }
  }

  return baseParts.join("/");
};
