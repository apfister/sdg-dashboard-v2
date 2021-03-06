import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import uniqueValues from "@arcgis/core/smartMapping/statistics/uniqueValues";
import * as colorRendererCreator from "@arcgis/core/smartMapping/renderers/color";
import Graphic from "@arcgis/core/Graphic";
import Field from "@arcgis/core/layers/support/Field";

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
    this.dataLayer = await this._createDataLayer();

    this.dimensionInformation = await this._getLayerDimensions(
      this.dataLayer,
      this.dimensionConfig,
      this.lookupInformation
    );

    // if there is a Year column on the data,
    // get unique values for years
    if (this.lookupInformation.YEAR_FIELD_NAME) {
      this.years = await this._getUniqueYears(
        this.lookupInformation.YEAR_FIELD_NAME
      );
      this.maxYear = Math.max(...this.years);
      this.dimensionInformation["YEAR"] = {
        name: "Year",
        maxYear: this.maxYear,
        values: this.years.map((y) => ({ code: y, name: y })),
      };
    }

    this.uvs = await this._getUniqueValuesFromGeoLayer(
      this.geoLayer,
      this.geoLayerJoinField
    );

    const whereClause = this._buildWhereClause(
      this.maxYear,
      this.lookupInformation.YEAR_FIELD_NAME,
      this.MONTH_FIELD_NAME,
      this.MONTH_CONST,
      this.lookupInformation.TBL_JOIN_FIELD,
      this.uvs
    );

    const firstKey = Object.keys(this.dimensionInformation)[0];
    const firstMetricFieldName =
      this.dimensionInformation[firstKey]["values"][0]["fieldName"];

    this.activeMetric = firstMetricFieldName;

    const dataFeatures = await this._getAttributeData(
      this.dataLayer,
      this.lookupInformation,
      whereClause,
      firstMetricFieldName
    );

    const geoFeatures = await this._getGeoFeatures(
      this.geoLayer,
      this.geoLayerJoinField,
      this.uvs
    );
    this.geoFeatures = geoFeatures;

    // let firstMetricFieldNameYear = firstMetricFieldName;
    this.activeMetricYear = this.activeMetric;
    if (this.years && this.maxYear) {
      this.activeMetricYear = `${this.activeMetric}_${this.maxYear}`;
    }

    const joinedFeatures = this._joinLayers(
      dataFeatures.features,
      this.lookupInformation.TBL_JOIN_FIELD,
      geoFeatures.features,
      this.geoLayerJoinField,
      this.lookupInformation.TBL_JOIN_CONV,
      this.activeMetric,
      this.activeMetricYear
    );

    const firstMetricFieldAlias = this._getMetricFieldAlias(
      this.dataLayer,
      this.activeMetric
    );

    const joinedFields = this._createJoinedLayerFields(
      this.dataLayer.fields,
      this.lookupInformation.TBL_JOIN_FIELD,
      this.lookupInformation.SERIES_CODE,
      this.years
    );

    this.atttributeTemplate = this._createAttributeTemplate(
      joinedFields,
      this.geoLayerJoinField
    );

    const joinedLayer = this._createJoinedFeatureLayer(
      joinedFeatures,
      joinedFields,
      this.atttributeTemplate
    );

    const rendererResponse = await this._createRenderer(
      joinedLayer,
      this.activeMetricYear,
      this.mapView,
      firstMetricFieldAlias
    );

    joinedLayer.renderer = rendererResponse.renderer;
    joinedLayer.visible = true;
    joinedLayer.attributeLayerItemId = this.attributeLayerItemId;

    // this.featureLayer = joinedLayer;
    joinedLayer.title = firstMetricFieldAlias;
    joinedLayer.dimensionInformation = this.dimensionInformation;

    this.activeFeatureLayer = joinedLayer;

    this.layers[this.attributeLayerItemId] = {
      [this.geoLayer.portalItem.id]: {
        layer: joinedLayer,
        year: this.maxYear || null,
        loadedFields: [
          {
            fieldName: this.activeMetricYear,
            renderer: joinedLayer.renderer,
          },
        ],
      },
    };

    return this;
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

  async _createDataLayer() {
    const fl = await FeatureLayer.fromPortalItem({
      portalItem: {
        id: this.attributeLayerItemId,
      },
    });
    await fl.load();
    return fl;
  }

  async _getUniqueYears(yearFieldName) {
    const uvResponse = await uniqueValues({
      layer: this.dataLayer,
      field: yearFieldName,
    });

    return uvResponse.uniqueValueInfos.map((uv) => uv.value).reverse();
  }

  _buildWhereClause(year, yearField, monthField, month, joinField, uvs) {
    let wc = `${joinField} IN ('${uvs}')`;

    if (year && yearField) {
      wc = `${wc} AND ${yearField} = ${year}`;
    }

    if (month && monthField) {
      wc = `${wc} AND ${monthField} = ${month}`;
    }
    return wc;
  }

  async _getAttributeData(
    dataLayer,
    lookupInfo,
    whereClause,
    metric,
    oidField
  ) {
    const dataQuery = dataLayer.createQuery();

    // let outFields = `${lookupInfo.TBL_JOIN_FIELD}, ${metric}`;
    let outFields = [lookupInfo.TBL_JOIN_FIELD, metric];
    if (oidField) {
      outFields.push(oidField);
    }

    dataQuery.where = whereClause;
    dataQuery.outFields = outFields;

    return await dataLayer.queryFeatures(dataQuery);
  }

  async _getGeoFeatures(layer, field, uvs) {
    let q = layer.createQuery();
    q.where = `${field} IN ('${uvs}')`;
    q.outFields = [field];
    q.returnGeometry = true;

    return await layer.queryFeatures(q);
  }

  _joinLayers(
    dataFeatures,
    dataLookupJoinField,
    geoFeatures,
    geoJoinField,
    lookupConversion,
    metric,
    metricYear
  ) {
    let features = [];
    geoFeatures.forEach((feature, i) => {
      let newFeature = {
        attributes: { ...feature.attributes },
        geometry: feature.geometry,
      };

      let foundDataFeature = dataFeatures.filter((f) => {
        let joinValue = f.attributes[dataLookupJoinField];

        if (lookupConversion) {
          if (lookupConversion === "to-string") {
            joinValue = joinValue.toString();
          } else if (lookupConversion === "to-int") {
            joinValue = parseInt(joinValue);
          }
        }
        return joinValue === feature.attributes[geoJoinField];
      });

      if (foundDataFeature.length === 1) {
        newFeature.attributes[metricYear] =
          foundDataFeature[0].attributes[metric];

        newFeature.attributes.OBJECTID = i;
        newFeature.attributes[geoJoinField] =
          foundDataFeature[0].attributes[dataLookupJoinField];
        features.push(newFeature);
      }
    });

    return features;
  }

  _getMetricFieldAlias(dataLayer, metric) {
    return dataLayer.fields.filter((f) => f.name === metric)[0].alias;
  }

  _createJoinedLayerFields(
    dataLayerFields,
    lookupJoinField,
    seriesCode,
    years
  ) {
    const flFields = [
      {
        name: "OBJECTID",
        alias: "ObjectID",
        type: "oid",
      },
      {
        name: lookupJoinField,
        alias: "geo_id",
        type: "string",
      },
    ];

    let allFields = dataLayerFields.filter((f) => f.name.includes(seriesCode));

    if (years && years.length > 0) {
      let tempCopy = [];
      allFields.forEach((f) => {
        years.forEach((y) => {
          const newFieldNameWithYear = `${f.name}_${y}`;
          tempCopy.push({
            name: newFieldNameWithYear,
            alias: newFieldNameWithYear,
            type: f.type,
          });
        });
      });
      allFields = tempCopy;
    } else {
      allFields = allFields.map((f) => {
        return { name: f.name, alias: f.alias, type: f.type };
      });
    }

    return [...flFields, ...allFields];
  }

  _createAttributeTemplate(joinedFields, geoLayerJoinField) {
    let atttributeTemplate = {};
    joinedFields.forEach((f) => {
      atttributeTemplate[f.name] = null;
    });
    delete atttributeTemplate.OBJECTID;
    delete atttributeTemplate[geoLayerJoinField];

    return atttributeTemplate;
  }

  _createJoinedFeatureLayer(features, joinedFields, attributeTemplate) {
    features.forEach((f) => {
      Object.keys(attributeTemplate).forEach((key) => {
        if (!f.attributes[key]) {
          f.attributes[key] = null;
        }
      });
    });
    return new FeatureLayer({
      source: features,
      fields: joinedFields,
    });
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

  async _getAttributeData2(dataLayer, lookupInfo, uvs, year, metric) {
    const dataQuery = dataLayer.createQuery();
    let whereClause = `YEAR = ${year} AND ${lookupInfo.Join_Field} IN ('${uvs}')`;
    // temp until we deal with reporting month in data
    whereClause = `${whereClause} AND Month = 12`;
    const outFields = `${lookupInfo.Join_Field}, ${metric}`;

    dataQuery.where = whereClause;
    dataQuery.outFields = [outFields];

    return await dataLayer.queryFeatures(dataQuery);
  }

  async _getUniqueValuesFromGeoLayer(geoLayer, geoLayerJoinField) {
    const uvResponse = await uniqueValues({
      layer: geoLayer,
      field: geoLayerJoinField,
    });

    return uvResponse.uniqueValueInfos.map((uv) => uv.value).join("','");
  }

  /** update geography */

  async updateGeography(inGeoLayer) {
    if (
      Object.keys(this.layers[this.attributeLayerItemId]).includes(
        inGeoLayer.itemId
      )
    ) {
      const existingGeoLayerConfig =
        this.layers[this.attributeLayerItemId][inGeoLayer.itemId];

      const foundField = existingGeoLayerConfig.loadedFields.filter(
        (f) => this.activeMetricYear === f.fieldName
      );
      if (foundField) {
        const visibleState = this.activeFeatureLayer.visible;

        this.activeFeatureLayer.listMode = "hide";
        this.activeFeatureLayer.visible = false;
        existingGeoLayerConfig.layer.visible = visibleState;
        existingGeoLayerConfig.layer.listMode = "show";
        this.activeFeatureLayer = existingGeoLayerConfig.layer;
      } else {
        console.log("cant find it; need to create it!");
        // this._createRenderer();
      }
    } else {
      const uvs = await this._getUniqueValuesFromGeoLayer(
        inGeoLayer.fl,
        inGeoLayer.joinField
      );

      const whereClause = this._buildWhereClause(
        this.maxYear,
        this.lookupInformation.YEAR_FIELD_NAME,
        this.MONTH_FIELD_NAME,
        this.MONTH_CONST,
        this.lookupInformation.TBL_JOIN_FIELD,
        uvs
      );

      const dataFeatures = await this._getAttributeData(
        this.dataLayer,
        this.lookupInformation,
        whereClause,
        this.activeMetric
      );

      const geoFeatures = await this._getGeoFeatures(
        inGeoLayer.fl,
        inGeoLayer.joinField,
        uvs
      );

      const joinedFeatures = this._joinLayers(
        dataFeatures.features,
        this.lookupInformation.TBL_JOIN_FIELD,
        geoFeatures.features,
        inGeoLayer.joinField,
        this.lookupInformation.TBL_JOIN_CONV,
        this.activeMetric,
        this.activeMetricYear
      );

      const joinedFields = this._createJoinedLayerFields(
        this.dataLayer.fields,
        this.lookupInformation.TBL_JOIN_FIELD,
        this.lookupInformation.SERIES_CODE,
        this.years
      );

      const joinedLayer = this._createJoinedFeatureLayer(
        joinedFeatures,
        joinedFields,
        this.attributeTemplate
      );

      const metricFieldAlias = this._getMetricFieldAlias(
        this.dataLayer,
        this.activeMetric
      );

      const rendererResponse = await this._createRenderer(
        joinedLayer,
        this.activeMetricYear,
        this.mapView,
        metricFieldAlias
      );

      joinedLayer.renderer = rendererResponse.renderer;
      joinedLayer.attributeLayerItemId = this.attributeLayerItemId;
      joinedLayer.visible = true;
      joinedLayer.title = metricFieldAlias;
      joinedLayer.dimensionInformation = this.dimensionInformation;

      // update visibility
      this.activeFeatureLayer.listMode = "hide";
      this.activeFeatureLayer.visible = false;
      this.mapView.map.add(joinedLayer);
      this.activeFeatureLayer = joinedLayer;

      this.layers[this.attributeLayerItemId][inGeoLayer.fl.portalItem.id] = {
        layer: joinedLayer,
        year: this.activeYear || null,
        loadedFields: [
          {
            fieldName: this.activeMetricYear,
            renderer: joinedLayer.renderer,
          },
        ],
      };
    }
  }

  /** Update year */
  async updateYear(inYear, inGeoLayer) {
    const foundYear =
      this.layers[this.attributeLayerItemId][this.geoLayer.portalItem.id][
        inYear
      ];
    if (foundYear) {
      console.log("yep found year", foundYear);
    } else {
      const uvs = await this._getUniqueValuesFromGeoLayer(
        inGeoLayer.fl,
        inGeoLayer.joinField
      );

      const whereClause = this._buildWhereClause(
        inYear,
        this.lookupInformation.YEAR_FIELD_NAME,
        this.MONTH_FIELD_NAME,
        this.MONTH_CONST,
        this.lookupInformation.TBL_JOIN_FIELD,
        uvs
      );

      const oidFieldName = this.activeFeatureLayer.fields.filter(
        (f) => f.type === "oid"
      )[0].name;
      const dataFeatures = await this._getAttributeData(
        this.dataLayer,
        this.lookupInformation,
        whereClause,
        this.activeMetric,
        oidFieldName
      );
      // console.log(dataFeatures);

      const newFieldName = `${this.activeMetric}_${inYear}`;
      let editFeatures = [];
      for (var i = 0; i < dataFeatures.features.length; i++) {
        let atts = dataFeatures.features[i].attributes;
        // const attValue = atts[this.activeMetric];
        // delete atts[this.activeMetric];
        // atts[newFieldName] = attValue;

        // dataFeatures.features[i].attributes = Object.assign(
        //   this.atttributeTemplate,
        //   atts
        // );
        editFeatures.push(
          new Graphic({
            attributes: {
              [oidFieldName]: atts[oidFieldName],
              [newFieldName]: atts[this.activeMetric],
            },
          })
        );
      }

      await this.activeFeatureLayer.applyEdits({
        updateFeatures: editFeatures,
      });

      const metricFieldAlias = this._getMetricFieldAlias(
        this.dataLayer,
        this.activeMetric
      );

      const rendererResponse = await this._createRenderer(
        this.activeFeatureLayer,
        newFieldName,
        this.mapView,
        metricFieldAlias
      );

      this.activeFeatureLayer.renderer = rendererResponse.renderer;
      this.activeFeatureLayer.title = metricFieldAlias;

      this.layers[this.attributeLayerItemId][inGeoLayer.fl.portalItem.id] = {
        layer: this.activeFeatureLayer,
        year: inYear,
        loadedFields: [
          {
            fieldName: newFieldName,
            renderer: rendererResponse.renderer,
          },
        ],
      };
    }
  }
}
