import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import TopFeaturesQuery from "@arcgis/core/rest/support/TopFeaturesQuery";
import TopFilter from "@arcgis/core/rest/support/TopFilter";
import PortalItem from "@arcgis/core/portal/PortalItem";
import esriRequest from "@arcgis/core/request";

export async function getLookupFeatures(availableLookupItem) {
  const lookupTable = await FeatureLayer.fromPortalItem({
    portalItem: {
      id: availableLookupItem,
    },
  });

  const q = lookupTable.createQuery();
  q.where = "DISABLED is null";
  const featureSet = await lookupTable.queryFeatures(q);
  // const itemIds = featureSet.features.map((f) => f.attributes.Item_ID);

  // const options = {
  //   responseType: "json",
  //   query: {
  //     q: `id:(${itemIds.join(" OR ")})`,
  //     f: "json",
  //   },
  // };
  // const res = await esriRequest(
  //   "https://www.arcgis.com/sharing/rest/search",
  //   options
  // );
  // // console.log(res);
  // res.data.results.forEach((r) => {
  //   const foundFeature = featureSet.features.filter(
  //     (f) => f.attributes.Item_ID === r.id
  //   )[0];
  //   if (foundFeature) {
  //     foundFeature.attributes["tags"] = r.tags;
  //     foundFeature.attributes["title"] = r.title;
  //     foundFeature.attributes["description"] = r.description;
  //   }
  // });

  return featureSet.features;
}

export async function queryForDimensionInfoByMetric(
  dimensionItemId,
  defaultMetric
) {
  const dimensionFl = await FeatureLayer.fromPortalItem({
    portalItem: {
      id: dimensionItemId,
    },
  });

  const q = dimensionFl.createQuery();
  q.where = `METRIC = '${defaultMetric}'`;
  q.outFields = ["*"];
  q.returnDistinctValues = true;

  const distQuery = await dimensionFl.queryFeatures(q);
  return distQuery;
}

function parseDimensions(dimInfo) {
  let dims = {};
  dimInfo.features.forEach((feature) => {
    const dimName = feature.attributes.NAME;
    if (!dims[dimName]) {
      dims[dimName] = [];
    }
    dims[dimName].push({
      code: feature.attributes.CODE,
      label: feature.attributes.ALIAS,
      metric: feature.attributes.METRIC,
    });
  });
  return dims;
}

export async function getLayerInfoAndDimensions(
  itemId,
  dimensionItemId,
  defaultMetric
) {
  const dimInfo = await queryForDimensionInfoByMetric(
    dimensionItemId,
    defaultMetric
  );

  const finalizedDimensions = parseDimensions(dimInfo);

  return finalizedDimensions;

  // let portalItem = new PortalItem({
  //   id: itemId,
  // });
  // await portalItem.load();

  // const fl = await FeatureLayer.fromPortalItem(portalItem);

  // const query = new TopFeaturesQuery({
  //   outFields: ["Dimension, DimensionValue"],
  //   topFilter: new TopFilter({
  //     topCount: 1,
  //     groupByFields: ["Dimension, DimensionValue"],
  //     orderByFields: ["Dimension ASC"],
  //   }),
  // });

  // const response = await fl.queryTopFeatures(query);
  // // console.log(fl.title, response);
  // let ret = {};
  // response.features.forEach((item) => {
  //   const dim = item.attributes.Dimension;
  //   if (!(dim in ret)) {
  //     ret[dim] = [];
  //   }
  //   ret[dim].push(item.attributes.DimensionValue);
  // });

  // Object.keys(ret).forEach((r) => ret[r].sort());

  // const tags = portalItem.tags;
  // let itemInfo = {};
  // tags.forEach((tag) => {
  //   if (tag.includes(":")) {
  //     const splits = tag.split(":");
  //     itemInfo[splits[0]] = splits[1];
  //   }
  // });

  // return ret;
  // return {
  //   itemInfo,
  //   dimensionInfo: ret,
  // };
}
