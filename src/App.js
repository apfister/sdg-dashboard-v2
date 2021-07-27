import "./App.css";

import FeatureLayerChart from "./FeatureLayerChart";
import ReactMap from "./ReactMap";
import { Container, Row, Col } from "react-bootstrap";
import {
  CalciteAvatar,
  CalciteButton,
  CalciteIcon,
  CalciteSlider,
  CalciteTabs,
  CalciteTab,
  CalciteTabNav,
  CalciteTabTitle,
} from "@esri/calcite-components-react";
import GeographyCombobox from "./controls/GeographyCombobox";
import { useState } from "react";

function App() {
  const [geoLayers, setGeoLayers] = useState([]);

  const updateGeoLayers = (layers) => {
    // console.log("layers", layers);
    setGeoLayers(layers);
  };

  return (
    <div className="d-flex align-items-stretch flex-column h-100">
      <div className="d-flex align-items-center p-1 header">
        {/* <CalciteButton onClick={() => alert("hi")}>Hello Button</CalciteButton> */}
        <h4>SDG Dashboard</h4>
        <GeographyCombobox layers={geoLayers} />
      </div>
      <div className="flex-grow-1 h-100">
        <ReactMap updateGeoLayers={updateGeoLayers} />
      </div>
    </div>
  );
}

export default App;
