import React from "react";
import {
  CalciteBlock,
  CalciteButton,
  CalciteCard,
  CalciteChip,
} from "@esri/calcite-components-react";
import styled from "styled-components";

const StyledDatasetContainer = styled.div`
  padding: 10px;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  border-bottom: 1px solid rgba(0, 0, 0, 0.25);
  // &:hover {
  box-shadow: rgb(0 0 0 / 8%) 0px 4px 16px 0px, rgb(0 0 0 / 4%) 0px 2px 8px 0px;
  z-index: 1;
  cursor: pointer;
  // }
`;

const SDGDatasetCard = ({
  itemId,
  indicatorInfo,
  layerChange,
  tocLayers,
  lookupInfo,
  addedSDGDatasets,
}) => {
  const createMarkup = (desc) => {
    return { __html: desc };
  };

  return (
    // <CalciteBlock open collapsible heading={lookupInfo.title}>

    <StyledDatasetContainer>
      <div>
        <h6
          style={{
            borderBottom: "1px solid rgba(0,0,0,0.25)",
            paddingBottom: "10px",
          }}
        >
          {lookupInfo.title}
        </h6>
        <div
          // style={{ fontSize: "12px" }}
          dangerouslySetInnerHTML={createMarkup(lookupInfo.description)}
        ></div>
      </div>

      <div className="d-flex mt-2">
        <CalciteButton
          appearance="outline"
          scale="s"
          iconStart="map"
        ></CalciteButton>
      </div>

      <br />
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
      {/* </CalciteBlock> */}
    </StyledDatasetContainer>
  );
};

export default SDGDatasetCard;
