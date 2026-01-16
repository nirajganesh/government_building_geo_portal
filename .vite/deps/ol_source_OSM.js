import {
  XYZ_default
} from "./chunk-ZYAQTXBL.js";
import "./chunk-HZGXDQTO.js";
import "./chunk-V2B4IIEL.js";
import "./chunk-PGNYMJJ7.js";
import "./chunk-RE46EP5S.js";
import "./chunk-MLRGRSJU.js";
import "./chunk-VLTZGDTC.js";
import "./chunk-FMNGDYBL.js";
import "./chunk-2R5FCMUD.js";
import "./chunk-LGM7OQVS.js";
import "./chunk-OIBWFOTW.js";
import "./chunk-UY3IBMKS.js";
import "./chunk-MOGRN7JF.js";
import "./chunk-SDXVV5Z4.js";
import "./chunk-KSVQUBRU.js";
import "./chunk-HTT3M4KG.js";
import "./chunk-ZYDEI2JY.js";
import "./chunk-R5DNHDJW.js";

// node_modules/ol/source/OSM.js
var ATTRIBUTION = '&#169; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors.';
var OSM = class extends XYZ_default {
  /**
   * @param {Options} [options] Open Street Map options.
   */
  constructor(options) {
    options = options || {};
    let attributions;
    if (options.attributions !== void 0) {
      attributions = options.attributions;
    } else {
      attributions = [ATTRIBUTION];
    }
    const crossOrigin = options.crossOrigin !== void 0 ? options.crossOrigin : "anonymous";
    const url = options.url !== void 0 ? options.url : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
    super({
      attributions,
      attributionsCollapsible: false,
      cacheSize: options.cacheSize,
      crossOrigin,
      interpolate: options.interpolate,
      maxZoom: options.maxZoom !== void 0 ? options.maxZoom : 19,
      reprojectionErrorThreshold: options.reprojectionErrorThreshold,
      tileLoadFunction: options.tileLoadFunction,
      transition: options.transition,
      url,
      wrapX: options.wrapX,
      zDirection: options.zDirection
    });
  }
};
var OSM_default = OSM;
export {
  ATTRIBUTION,
  OSM_default as default
};
//# sourceMappingURL=ol_source_OSM.js.map
