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
      scale="s"
    >
      {/* <CalciteComboboxItem
        key="hiiii"
        icon="layerPolygon"
        value="hello"
        textLabel="pl"
      /> */}
      {layers.map((layer, i) => {
        return (
          <CalciteComboboxItem
            key={layer.fl.id}
            icon="layerPolygon"
            value="hello"
            selected={layer.defaultSelected}
            textLabel={layer.name}
          />
        );
      })}
    </CalciteCombobox>
  );
};

export default GeographyCombobox;
