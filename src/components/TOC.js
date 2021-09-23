import { CalciteButton, CalciteCard } from "@esri/calcite-components-react";
import React from "react";
import TOCItem from "./TOCItem";

const TOC = ({ tocLayers, removeLayer, updateDisplayDimensions }) => {
  const handleRemoveLayerClick = (tocLayer) => {
    removeLayer(tocLayer);
  };

  const handleUpdateDisplayDimensions = (tocLayer) => {
    updateDisplayDimensions(tocLayer);
  };

  return (
    <div>
      {tocLayers.map((tocLayer, i) => {
        return (
          <TOCItem
            key={`toclayercard_${i}`}
            tocLayer={tocLayer}
            handleRemoveLayerClick={handleRemoveLayerClick}
            updateDisplayDimensions={handleUpdateDisplayDimensions}
          />
        );
      })}
    </div>
  );
};

export default TOC;
