import React, { useRef, useState } from "react";
import LayerList from "@arcgis/core/widgets/LayerList";

const LayerListWidget = ({ mapView }) => {
  if (!mapView) {
    return <div>no layers</div>;
  }
  // const lwRef = useRef();
  // const [layerList, setLayerList] = useState(null);

  const handleActionClick = (event) => {
    console.log(event, mapView);
  };

  const ll = new LayerList({
    view: mapView,
    container: "map-legend",
    listItemCreatedFunction: (event) => {
      let item = event.item;

      item.actionsSections = [
        [
          {
            title: "Dimensions",
            className: "esri-icon-dashboard",
            id: "dimensions-layer",
          },
          {
            title: "Remove",
            className: "esri-icon-minus",
            id: "remove-layer",
          },
        ],
      ];
    },
  });

  // setLayerList(ll);

  ll.on("trigger-action", handleActionClick);

  return <div id="map-legend"></div>;
};

export default LayerListWidget;
