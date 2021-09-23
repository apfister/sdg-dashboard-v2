import { CalciteButton, CalciteCard } from "@esri/calcite-components-react";
import React from "react";

const TOCItem = ({
  tocLayer,
  handleRemoveLayerClick,
  updateDisplayDimensions,
}) => {
  const createMarkup = (desc) => {
    return { __html: desc };
  };

  return (
    <CalciteCard>
      {/* <span slot="title">{tocLayer.title}</span>
      <span slot="subtitle">{tocLayer.desc}</span> */}
      <span slot="title">{tocLayer.lookupInfo.title}</span>
      <span
        slot="subtitle"
        dangerouslySetInnerHTML={createMarkup(tocLayer.lookupInfo.description)}
      ></span>
      <div slot="footer-leading">
        <CalciteButton
          scale="s"
          appearance="transparent"
          iconStart="minus-circle"
          color="red"
          onClick={() => handleRemoveLayerClick(tocLayer)}
        ></CalciteButton>
      </div>
      <div slot="footer-trailing">
        <CalciteButton
          scale="s"
          appearance="transparent"
          iconStart="view-mixed"
        ></CalciteButton>
        <CalciteButton
          scale="s"
          appearance="transparent"
          iconStart="chord-diagram"
          onClick={() => updateDisplayDimensions(tocLayer)}
        ></CalciteButton>
      </div>
    </CalciteCard>
  );
};

export default TOCItem;
