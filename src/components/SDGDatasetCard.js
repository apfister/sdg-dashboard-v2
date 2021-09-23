import React, { useState } from "react";
import {
  CalciteBlock,
  CalciteButton,
  CalciteCard,
  CalciteChip,
} from "@esri/calcite-components-react";
import { withTranslation } from "react-i18next";

const SDGDatasetCard = ({
  itemId,
  indicatorInfo,
  layerChange,
  tocLayers,
  lookupInfo,
  addedSDGDatasets,
  addLayerToMap,
  isLoadingLayer,
  loadedLayers,
  t,
}) => {
  const createMarkup = (desc) => {
    return { __html: desc };
  };

  const handleOnAddToMapClick = (lookupInfo) => {
    addLayerToMap(lookupInfo);
  };

  const findByItemId = (itemId) => {
    return loadedLayers.filter(
      (layer) => Object.keys(layer.layers)[0] === itemId
    );
  };

  const getIsDisabled = () => {
    const found = findByItemId(lookupInfo.TBL_ITEMID);
    if (isLoadingLayer || found.length > 0) {
      return "";
    }
    return undefined;
  };

  const getButtonText = () => {
    const found = findByItemId(lookupInfo.TBL_ITEMID);
    if (found.length > 0) {
      return t("addedToMap");
    }
    return t("addToMap");
  };

  return (
    <CalciteCard>
      <span slot="title">{lookupInfo.TITLE}</span>
      {/* <div dangerouslySetInnerHTML={createMarkup(lookupInfo.description)}></div> */}
      <div slot="footer-leading"></div>
      <div slot="footer-trailing">
        <CalciteButton
          appearance="outline"
          scale="s"
          iconStart="plus"
          loading={isLoadingLayer ? "" : undefined}
          onClick={() => handleOnAddToMapClick(lookupInfo)}
          disabled={getIsDisabled()}
          // disabled={
          //   isLoadingLayer || loadedLayers.includes(lookupInfo.TBL_ITEMID)
          //     ? ""
          //     : undefined
          // }
        >
          {/* {loadedLayers.includes(lookupInfo.TBL_ITEMID)
            ? t("addedToMap")
            : t("addToMap")} */}
          {getButtonText()}
        </CalciteButton>
      </div>
    </CalciteCard>
  );
};

export default withTranslation()(SDGDatasetCard);
