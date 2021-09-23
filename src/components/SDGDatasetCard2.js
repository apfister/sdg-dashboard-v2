import {
  CalciteButton,
  CalciteCard,
  CalciteChip,
} from "@esri/calcite-components-react";
import React, { useEffect, useState } from "react";

const SDGDatasetCard = ({
  itemId,
  indicatorInfo,
  layerChange,
  tocLayers,
  lookupInfo,
  addedSDGDatasets,
}) => {
  useEffect(() => {
    if (tocLayers) {
      // console.log("tocLayers from DataDisplay2", tocLayers);
      if (
        tocLayers.findIndex((k) => k.itemId === itemId) === -1 ? false : true
      ) {
        // console.log("re-enabling!");
        setIsAddToMapDisabled("");
      } else {
        setIsAddToMapDisabled(null);
      }
    }
  }, [tocLayers, itemId]);

  const [isAddToMapDisabled, setIsAddToMapDisabled] = useState(null);

  const handleAddToMapClick = () => {
    // console.log("click");
    setIsAddToMapDisabled("");
    layerChange(
      itemId,
      lookupInfo,
      indicatorInfo.labelEN,
      indicatorInfo.descEN
    );
  };

  const createMarkup = (desc) => {
    return { __html: desc };
  };

  return (
    <CalciteCard data-itemId={itemId}>
      {/* <span slot="title">{indicatorInfo.labelEN}</span>
      <span slot="subtitle">{indicatorInfo.descEN}</span> */}
      <span slot="title">{lookupInfo.title}</span>
      <span
        slot="subtitle"
        dangerouslySetInnerHTML={createMarkup(lookupInfo.description)}
      ></span>
      <span slot="footer-leading">
        {lookupInfo.tags.map((tag, i) => (
          <CalciteChip
            key={`tagchip_${i}`}
            className={`sdgChip sdgChip_${lookupInfo.SDG_Goal}`}
            scale="s"
            color="clear"
            style={{ marginBottom: "10px" }}
          >
            {tag}
          </CalciteChip>
        ))}
      </span>
      <span slot="footer-trailing">
        <CalciteButton
          scale="s"
          appearance="clear"
          iconStart="map"
          // disabled={isAddToMapDisabled}
          disabled={addedSDGDatasets.includes(itemId) ? "" : null}
          onClick={handleAddToMapClick}
        >
          Add to Map
        </CalciteButton>
      </span>
    </CalciteCard>
  );
};

export default SDGDatasetCard;
