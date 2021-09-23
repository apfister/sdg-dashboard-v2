import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import uniqueValues from "@arcgis/core/smartMapping/statistics/uniqueValues";
import * as colorRendererCreator from "@arcgis/core/smartMapping/renderers/color";

async function getAttributeData(dataLayer, lookupInfo, uvs, year) {
  const dataQuery = dataLayer.createQuery();
  if (!year) {
    const years = lookupInfo.Years.split(",");
    year = years[years.length - 1];
  }
  const whereClause = `YEAR = ${year} AND ${lookupInfo.Join_Field} IN ('${uvs}')`;
  const outFields = `${lookupInfo.Join_Field}, ${lookupInfo.DefaultMetricCode}`;

  dataQuery.where = whereClause;
  dataQuery.outFields = [outFields];

  return await dataLayer.queryFeatures(dataQuery);
}

export async function createDynamicLayer(
  itemId,
  selectedGeoLayer,
  lookupInfo,
  mapView,
  year
) {
  const geoLayer = selectedGeoLayer.fl;
  const geoField = selectedGeoLayer.joinField;
  const uvResponse = await uniqueValues({
    layer: geoLayer,
    field: geoField,
  });

  const uvs = uvResponse.uniqueValueInfos.map((uv) => uv.value).join("','");

  const dataLayer = await FeatureLayer.fromPortalItem({
    portalItem: {
      id: itemId,
    },
  });

  const dataResponse = await getAttributeData(dataLayer, lookupInfo, uvs, year);

  let q = geoLayer.createQuery();
  q.where = `${geoField} IN ('${uvs}')`;
  q.outFields = [geoField];
  q.returnGeometry = true;

  const geoResponse = await geoLayer.queryFeatures(q);

  let features = [];
  geoResponse.features.forEach((feature, i) => {
    let newFeature = {
      attributes: { ...feature.attributes },
      geometry: feature.geometry,
    };

    let foundDataFeature = dataResponse.features.filter((f) => {
      let joinValue = f.attributes[lookupInfo.Join_Field];

      if (lookupInfo.Join_Field_Conversion) {
        if (lookupInfo.Join_Field_Conversion === "to-string") {
          joinValue = joinValue.toString();
        } else if (lookupInfo.Join_Field_Conversion === "to-int") {
          joinValue = parseInt(joinValue);
        }
      }
      return joinValue === feature.attributes[geoField];
    });

    if (foundDataFeature.length === 1) {
      newFeature.attributes[lookupInfo.DefaultMetricCode] =
        foundDataFeature[0].attributes[lookupInfo.DefaultMetricCode];

      newFeature.attributes.OBJECTID = i;
      features.push(newFeature);
    }
  });

  const layer = new FeatureLayer({
    source: features,
    fields: [
      {
        name: "OBJECTID",
        alias: "ObjectID",
        type: "oid",
      },
      {
        name: lookupInfo.Join_Field,
        alias: "geo_id",
        type: "string",
      },
      {
        name: lookupInfo.DefaultMetricCode,
        alias: dataLayer.fields.filter(
          (f) => f.name === lookupInfo.DefaultMetricCode
        )[0].alias,
        type: "double",
      },
    ],
  });

  const colorParams = {
    layer: layer,
    view: mapView,
    field: lookupInfo.DefaultMetricCode,
    theme: "high-to-low",
    outlineOptimizationEnabled: true,
  };

  const rendResponse = await colorRendererCreator.createContinuousRenderer(
    colorParams
  );
  layer.renderer = rendResponse.renderer;

  return layer;
}

export async function updateDynamicLayerYear() {}
