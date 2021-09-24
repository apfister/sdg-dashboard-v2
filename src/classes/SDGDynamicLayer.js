import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import uniqueValues from "@arcgis/core/smartMapping/statistics/uniqueValues";
import * as colorRendererCreator from "@arcgis/core/smartMapping/renderers/color";
import { queryAllJSON } from "@arcgis/core/layers/support/featureQueryAll";

export class SDGDynamicLayer {
  constructor(props) {
    // console.log(props);

    this.attributeLayerItemId = props.itemId;
    this.dimensionConfig = props.dimensionConfig;
    this.geoLayer = props.selectedGeoLayer.fl;
    this.geoLayerJoinField = props.selectedGeoLayer.joinField;
    this.lookupInformation = props.lookupInfo;

    this.mapView = props.mapView;

    this.years = null;
    this.maxYear = null;

    this.atttributeTemplate = null;

    this.activeFeatureLayer = null;
    this.activeMetric = null;
    this.activeMetricYear = null;
    this.activeYear = null;

    // cache
    this.layers = {};

    // Temp
    this.MONTH_FIELD_NAME = "Month";
    this.MONTH_CONST = "12";
  }

  async init() {
    const dataLayer = await this._createDataLayer(this.attributeLayerItemId);

    this.dimensionInformation = await this._getLayerDimensions(
      dataLayer,
      this.dimensionConfig,
      this.lookupInformation
    );

    const { dataFeatureSet, dataFeatureSetFields } =
      await this._queryForAllData(this.attributeLayerItemId);

    // if there is a Year column on the data,
    // get unique values for years
    if (this.lookupInformation.YEAR_FIELD_NAME) {
      this.years = await this._getUniqueYears(
        dataLayer,
        this.lookupInformation.YEAR_FIELD_NAME
      );
      this.maxYear = Math.max(...this.years);
      this.dimensionInformation["YEAR"] = {
        name: "Year",
        maxYear: this.maxYear,
        values: this.years.map((y) => ({ code: y, name: y })),
      };
    }

    const firstKey = Object.keys(this.dimensionInformation)[0];
    const firstMetricFieldName =
      this.dimensionInformation[firstKey]["values"][0]["fieldName"];

    this.activeMetric = firstMetricFieldName;

    this.activeMetricYear = this.activeMetric;
    if (this.years && this.maxYear) {
      this.activeMetricYear = `${this.activeMetric}_${this.maxYear}`;
    }

    const fSetPivoted = this._pivotData(
      dataFeatureSet,
      dataFeatureSetFields,
      this.lookupInformation.TBL_JOIN_FIELD,
      this.lookupInformation.SERIES_CODE,
      this.lookupInformation.YEAR_FIELD_NAME
    );

    const firstMetricFieldAlias = fSetPivoted.fields.filter(
      (f) => f.name === this.activeMetricYear
    )[0].alias;

    const geoFeatureSet = await this._getGeoFeatures(
      this.geoLayer,
      this.geoLayerJoinField
    );

    const joinedFeatures = this._joinFeatures(
      fSetPivoted.features,
      this.lookupInformation.TBL_JOIN_FIELD,
      geoFeatureSet.features,
      this.geoLayerJoinField,
      this.lookupInformation.TBL_JOIN_CONV
    );

    const featureLayer = new FeatureLayer({
      source: joinedFeatures,
      fields: fSetPivoted.fields,
    });

    const rendererResponse = await this._createRenderer(
      featureLayer,
      this.activeMetricYear,
      this.mapView,
      firstMetricFieldAlias
    );

    featureLayer.renderer = rendererResponse.renderer;
    featureLayer.title = firstMetricFieldAlias;
    // featureLayer.attributeLayerItemId = this.attributeLayerItemId;

    this.mapView.map.add(featureLayer);
  }

  async _getLayerDimensions(dataLayer, dimensionConfig, lookupInfo) {
    const dimensionFl = await FeatureLayer.fromPortalItem({
      portalItem: {
        id: dimensionConfig.itemId,
      },
    });

    let q = dimensionFl.createQuery();
    q.where = `${dimensionConfig.seriesCodeField} = '${lookupInfo.SERIES_CODE}'`;
    q.returnGeometry = false;
    q.outFields = ["*"];

    const dimQuery = await dimensionFl.queryFeatures(q);

    const dimensionInfo = this._parseDimensionInfo(
      dataLayer.fields.map((f) => f.name),
      dimQuery.features
    );
    return dimensionInfo;
  }

  _parseDimensionInfo(fields, dimFeatures) {
    let output = {};
    dimFeatures
      .filter((f) => fields.includes(f.attributes.FIELD_NAME))
      .forEach((f) => {
        let dimCode = f.attributes.DIM_CODE;
        if (!(dimCode in output)) {
          output[dimCode] = {
            name: f.attributes.DIM_NAME,
            values: [],
          };
        }

        output[dimCode]["values"].push({
          code: f.attributes.VALUE_CODE,
          name: f.attributes.VALUE_NAME,
          fieldName: f.attributes.FIELD_NAME,
        });
      });

    return output;
  }

  async _createDataLayer(attributeLayerItemId) {
    const fl = await FeatureLayer.fromPortalItem({
      portalItem: {
        id: attributeLayerItemId,
      },
    });
    await fl.load();
    return fl;
  }

  async _getUniqueYears(dataLayer, yearFieldName) {
    const uvResponse = await uniqueValues({
      layer: dataLayer,
      field: yearFieldName,
    });

    return uvResponse.uniqueValueInfos.map((uv) => uv.value).reverse();
  }

  async _queryForAllData(attributeLayerItemId) {
    const fl = await FeatureLayer.fromPortalItem({
      portalItem: {
        id: attributeLayerItemId,
      },
    });
    await fl.load();

    const mxFactor = 5;
    const baseMxCount = fl.capabilities.query.maxRecordCount;
    const recordsPerQuery = mxFactor * baseMxCount;

    let q = fl.createQuery();
    q.where = "1=1";
    q.returnGeometry = false;
    q.outFields = "*";
    q.maxRecordCountFactor = mxFactor;
    q.num = recordsPerQuery;

    let responseFeatures = [];
    let exceeds = true;
    let didCatchFields = false;
    let fields = [];
    do {
      const response = await fl.queryFeatures(q);

      if (!didCatchFields) {
        fields = this._parseFields(
          response.fields,
          this.lookupInformation.SERIES_CODE
        );
        didCatchFields = true;
      }

      responseFeatures = [...responseFeatures, ...response.features];

      if (response.features.length === 0 || !response.exceededTransferLimit) {
        exceeds = false;
      }

      q.start = responseFeatures.length;
    } while (exceeds === true);

    return { dataFeatureSet: responseFeatures, dataFeatureSetFields: fields };
  }

  _parseFields(fields, seriesCode) {
    return fields
      .filter((f) => {
        return f.name.indexOf(seriesCode) > -1;
      })
      .map((f) => ({ name: f.name, alias: f.alias, type: f.type }))
      .reduce((acc, f) => {
        acc[f.name] = { alias: f.alias, type: f.type };
        return acc;
      }, {});
  }

  _pivotData(
    inFeatures,
    dataFeatureSetFields,
    tableJoinField,
    metricCode,
    yearField
  ) {
    let oidCounter = 1;
    let fields = [
      { name: "OBJECTID", alias: "OBJECTID", type: "oid" },
      { name: this.lookupInformation.TBL_JOIN_FIELD, type: "string" },
    ];

    const features = inFeatures.reduce((acc, feature) => {
      const found = acc.filter(
        (a) =>
          a.attributes[tableJoinField] === feature.attributes[tableJoinField]
      );
      let year = feature.attributes[yearField];

      if (!found || found.length === 0) {
        let newAtts = {
          OBJECTID: oidCounter,
        };
        oidCounter += 1;

        newAtts[tableJoinField] = feature.attributes[tableJoinField];
        Object.keys(feature.attributes).forEach((key) => {
          if (key.indexOf(metricCode) > -1) {
            const newFieldName = `${key}_${year}`;

            if (!fields.some((f) => f.name === newFieldName)) {
              fields.push({
                name: newFieldName,
                alias: `${dataFeatureSetFields[key].alias} (${year})`,
                type: dataFeatureSetFields[key].type,
              });
            }

            newAtts[newFieldName] = feature.attributes[key];
          }
        });
        acc.push({
          attributes: newAtts,
        });
      } else {
        Object.keys(feature.attributes).forEach((key) => {
          if (key.indexOf(metricCode) > -1) {
            const newFieldName = `${key}_${year}`;
            if (!fields.some((f) => f.name === newFieldName)) {
              fields.push({
                name: newFieldName,
                alias: `${dataFeatureSetFields[key].alias} (${year})`,
                type: dataFeatureSetFields[key].type,
              });
            }
            found[0].attributes[newFieldName] = feature.attributes[key];
          }
        });
      }

      return acc;
    }, []);

    return { features, fields };
  }

  async _getGeoFeatures(geoLayer, geoLayerJoinField) {
    let q = geoLayer.createQuery();
    q.where = "1=1";
    q.returnGeometry = true;
    q.outFields = geoLayerJoinField;

    // TODO: account for maxRecordCount; page through like we are for data query
    // From Praveen:
    // queryAllJSON( q:Query, fl:FeatureLayer )
    // will not return as Graphic type tho; may not matter?

    return await geoLayer.queryFeatures(q);
  }

  _joinFeatures(
    dataFeatures,
    dataJoinField,
    geoFeatures,
    geoJoinField,
    fieldConv
  ) {
    dataFeatures.forEach((feature) => {
      const foundGeo = geoFeatures.filter((gFeature) => {
        let val = feature.attributes[dataJoinField];
        if (fieldConv) {
          if (fieldConv === "to-string") {
            val = val.toString();
          } else if (fieldConv === "to-int") {
            val = parseInt(val);
          }
        }

        return gFeature.attributes[geoJoinField] === val;
      });
      if (foundGeo && foundGeo.length > 0) {
        try {
          feature.geometry = foundGeo[0].geometry;
        } catch {
          console.log(foundGeo);
        }
      }
    });

    return dataFeatures;
  }

  async _createRenderer(joinedLayer, metric, mapView, metricFieldAlias) {
    const colorParams = {
      layer: joinedLayer,
      view: mapView,
      field: metric,
      theme: "high-to-low",
      outlineOptimizationEnabled: true,
      defaultSymbolEnabled: false,
      legendOptions: {
        title: metricFieldAlias,
      },
    };

    return await colorRendererCreator.createContinuousRenderer(colorParams);
  }
}
