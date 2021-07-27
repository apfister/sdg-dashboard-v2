import React, { useRef, useEffect } from "react";
import MapView from "@arcgis/core/views/MapView";
import Map from "@arcgis/core/Map";
import WebMap from "@arcgis/core/WebMap";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Bookmarks from "@arcgis/core/widgets/Bookmarks";
import Expand from "@arcgis/core/widgets/Expand";
import config from "./config/config.json";

const ReactMap = ({ updateGeoLayers }) => {
  console.log(config);

  const mapDiv = useRef(null);

  useEffect(() => {
    (async function () {
      if (mapDiv.current) {
        const map = new Map({
          basemap: "streets",
        });

        let configuredGeoLayers = [];
        // config.geographyLayers.forEach(async (item) => {
        for (const item of config.geographyLayers) {
          const fl = await FeatureLayer.fromPortalItem({
            portalItem: {
              id: item.itemId,
            },
          });

          item.fl = fl;
          configuredGeoLayers.push(item);

          fl.visible = item.visible;
          map.add(fl);
        }

        console.log(configuredGeoLayers);

        updateGeoLayers(configuredGeoLayers);

        const view = new MapView({
          container: mapDiv.current,
          map: map,
        });
      }
    })();
  }, []);
  return <div className="mapDiv p-0" ref={mapDiv}></div>;
};

export default ReactMap;
