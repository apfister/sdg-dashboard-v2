import {
  CalciteAction,
  CalciteValueList,
  CalciteValueListItem,
} from "@esri/calcite-components-react";
import React from "react";
import { withTranslation } from "react-i18next";

function LayersPanel({
  tocLayers,
  removeLayer,
  updateLayerVisibility,
  showDimensionsPanel,
}) {
  return (
    <CalciteValueList dragEnabled>
      {tocLayers.map((tocLayer, i) => {
        return (
          <CalciteValueListItem
            key={`toclayercard_${i}`}
            tocLayer={tocLayer}
            label={tocLayer.lookupInfo.title}
            // updateDisplayDimensions={handleUpdateDisplayDimensions}
          >
            {/* <CalciteAction
              scale="s"
              slot="actions-start"
              appearance="solid"
              icon="information"
            ></CalciteAction> */}
            <CalciteAction
              scale="s"
              slot="actions-end"
              appearance="solid"
              icon="minus"
              onClick={() => removeLayer(tocLayer)}
            ></CalciteAction>
            <CalciteAction
              scale="s"
              slot="actions-end"
              appearance="solid"
              icon="view-mixed"
              onClick={() => updateLayerVisibility(tocLayer)}
            ></CalciteAction>
            <CalciteAction
              scale="s"
              slot="actions-end"
              appearance="solid"
              icon="chord-diagram"
              onClick={() => showDimensionsPanel(tocLayer)}
            ></CalciteAction>
          </CalciteValueListItem>
        );
      })}
    </CalciteValueList>
  );
}

export default withTranslation()(LayersPanel);
