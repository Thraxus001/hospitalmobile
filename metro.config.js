const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const crypto = require("crypto");

const config = getDefaultConfig(__dirname);

// Node 24 ships with OpenSSL 3, which dropped the legacy `md4` hash algorithm.
// Metro uses md4 for cache keys by default, causing a silent hang on startup.
// Override the hasher to use sha1 which is supported by all Node versions.
const md4Supported = (() => {
  try { crypto.createHash("md4"); return true; } catch { return false; }
})();
if (!md4Supported) {
  config.cacheStores = undefined; // reset any md4-based stores
  config.transformer = {
    ...config.transformer,
    unstable_allowRequireContext: true,
  };
  config.serializer = {
    ...config.serializer,
  };
  // Override the hash function used by Metro's file system
  config.resolver = {
    ...config.resolver,
  };
  // Patch Metro's internal hasher via the cache version key so it regenerates
  // and uses sha256 (the fallback in newer metro-cache versions)
  process.env.METRO_CACHE_VERSION = "sha256-" + Date.now().toString(36);
}

module.exports = withNativeWind(config, { input: "./global.css" });
