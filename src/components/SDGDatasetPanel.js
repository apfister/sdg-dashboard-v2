import { CalcitePanel } from "@esri/calcite-components-react";
import React from "react";
import SDGDatasetCard from "./SDGDatasetCard";
import { withTranslation } from "react-i18next";

const SDGDatasetPanel = ({
  item,
  activeAg,
  addedSDGDatasets,
  lookupFeatures,
  inventory,
  layerChange,
  tocLayers,
  addLayerToMap,
  isLoadingLayer,
  loadedLayers,
  t,
}) => {
  const heading = `Goal ${item.code}`;
  // const filteredFeatures = lookupFeatures?.filter(
  //   (feature) => feature.attributes.SDG_Goal === item.code
  // );

  // var sources = images.reduce(function(result, img) {
  //   if (img.src.split('.').pop() !== "json") {
  //     result.push(img.src);
  //   }
  //   return result;
  // }, []);

  const filteredFeatures = inventory.series_inventory.reduce(
    (result, serie) => {
      const serieItemId = serie.itemid;
      const found = lookupFeatures.filter(
        (feature) => feature.attributes.TBL_ITEMID === serieItemId
      );
      if (found && found.length > 0) {
        found[0].attributes.TITLE = serie.name;
        found[0].attributes.SERIES_CODE = serie.seriesCode;
        result.push(found[0]);
      }
      return result;
    },
    []
  );

  // const filteredFeatures = inventory.series_inventory.map((serie) => {
  //   const serieItemItd = serie.itemid;
  //   const found = lookupFeatures.filter(
  //     (feature) => feature.attributes.Item_ID === serieItemItd
  //   );
  //   if (found && found.length > 0) {
  //     found[0].attributes.title = serie.name;
  //     return found[0];
  //   }
  //   return null;
  // });

  return (
    <CalcitePanel
      heading={item.shortLabelEN}
      style={{ overflow: "auto" }}
      className={activeAg === heading ? "d-block" : "d-none"}
      // dismissible
      // dismissed={activeAg === heading ? undefined : true}
    >
      {/* {filteredFeatures.length > 0 ? (
        filteredFeatures.map((feature) => {
          const itemId = feature.attributes.Item_ID;
          const inTarget = feature.attributes.SDG_Target;
          const inIndicator = feature.attributes.SDG_Indicator;
          const targetInfo = item.targets.filter((t) => t.code === inTarget)[0];
          const indicatorInfo = targetInfo.indicators.filter(
            (i) => i.reference === inIndicator
          )[0];

          return (
            <SDGDatasetCard
              addedSDGDatasets={addedSDGDatasets}
              tocLayers={tocLayers}
              layerChange={layerChange}
              key={`ddc_${itemId}`}
              itemId={itemId}
              lookupInfo={feature.attributes}
              indicatorInfo={indicatorInfo}
              addLayerToMap={addLayerToMap}
              isLoadingLayer={isLoadingLayer}
              loadedLayers={loadedLayers}
            />
          );
        })
      ) : (
        <div className="m-3">{t("sdgDatasetsPanel.noDatasets")}</div>
      )} */}

      {filteredFeatures.length > 0 ? (
        filteredFeatures.map((serie) => {
          const itemId = serie.attributes.TBL_ITEMID;

          return (
            <SDGDatasetCard
              addedSDGDatasets={addedSDGDatasets}
              tocLayers={tocLayers}
              layerChange={layerChange}
              key={`ddc_${itemId}`}
              itemId={itemId}
              lookupInfo={serie.attributes}
              // indicatorInfo={indicatorInfo}
              addLayerToMap={addLayerToMap}
              isLoadingLayer={isLoadingLayer}
              loadedLayers={loadedLayers}
            />
          );
        })
      ) : (
        <div className="m-3">{t("sdgDatasetsPanel.noDatasets")}</div>
      )}
    </CalcitePanel>
  );
};

export default withTranslation()(SDGDatasetPanel);
