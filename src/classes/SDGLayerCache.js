export class SDGLayerCache {
  constructor() {
    this.cache = {};
  }

  add(cacheKey, layer) {
    this.cache[cacheKey] = layer;
  }

  hasCachedLayer(cacheKey) {
    return this.cache.hasOwnProperty(cacheKey);
  }

  getLayer(cacheKey) {
    return this.cache[cacheKey];
  }
}
