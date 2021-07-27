import React from "react";
import config from "../config/config.json";

import {
  CalciteCombobox,
  CalciteComboboxItem,
} from "@esri/calcite-components-react";

const GeographyCombobox = ({ layers }) => {
  const handleChange = (e) => {
    console.log(e);
  };
  return (
    <CalciteCombobox
      onSelect={handleChange}
      placeholder="Select Geography"
      selectionMode="single"
    >
      {layers.map((layer, i) => {
        return (
          <CalciteComboboxItem
            key={layer.fl.id}
            icon="layerPolygon"
            value="hello"
            textLabel={layer.name}
          />
        );
      })}
    </CalciteCombobox>
  );
};

export default GeographyCombobox;
