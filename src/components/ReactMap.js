import React, { useRef, useEffect, useState, useImperativeHandle } from "react";
import MapView from "@arcgis/core/views/MapView";
import Map from "@arcgis/core/Map";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Legend from "@arcgis/core/widgets/Legend";
import BasemapGallery from "@arcgis/core/widgets/BasemapGallery";
import LayerList from "@arcgis/core/widgets/LayerList";
import Expand from "@arcgis/core/widgets/Expand";
import Search from "@arcgis/core/widgets/Search";
import { SDGDynamicLayer } from "../classes/SDGDynamicLayer";
import { createDynamicLayer } from "../utils/dynamicLayer";

const ReactMap = React.forwardRef(
  (
    {
      config,
      updateGeoLayers,
      handleDimensionsTrigger,
      handleRemoveLayerTrigger,
      activeTheme,
      isLegendVisible,
    },
    ref
  ) => {
    // console.log(config);

    const mapDiv = useRef(null);
    const [mapView, setMapView] = useState(null);
    const [mapObj, setMapObj] = useState(null);
    const [legendObj, setLegendObj] = useState(null);
    const [basemapGalleryObj, setBasemapGalleryObj] = useState(null);

    useEffect(() => {
      if (!basemapGalleryObj) {
        return;
      }
      const basemap = activeTheme === "light" ? "gray" : "dark-gray";
      basemapGalleryObj.activeBasemap = basemap;
    }, [activeTheme]);

    useEffect(() => {
      if (!legendObj) {
        return;
      }
      legendObj.visible = isLegendVisible;
    }, [isLegendVisible]);

    useImperativeHandle(ref, () => ({
      async createDynamicLayer(
        itemId,
        dimensionConfig,
        lookupInfo,
        selectedGeoLayer,
        metric
      ) {
        if (!metric) {
          metric = lookupInfo.DefaultMetric;
        }

        const dynamicLayer = new SDGDynamicLayer({
          itemId,
          dimensionConfig,
          selectedGeoLayer,
          lookupInfo,
          mapView,
          metric,
        });

        await dynamicLayer.init();

        mapObj.add(dynamicLayer.activeFeatureLayer);

        return dynamicLayer;
      },
    }));

    const handleLayerListTrigger = (event) => {
      const id = event.action.id;
      if (id === "remove-layer") {
        // event.item.view.map.remove(event.item.layer);
        handleRemoveLayerTrigger(event);
      } else if (id === "show-dimensions") {
        handleDimensionsTrigger(event.item);
      }
    };

    useEffect(() => {
      (async () => {
        if (mapDiv.current && config) {
          const map = new Map({
            basemap: "dark-gray",
          });

          setMapObj(map);

          let configuredGeoLayers = [];
          let zoomTo = null;
          for (const item of config.geographyLayers) {
            const fl = await FeatureLayer.fromPortalItem({
              portalItem: {
                id: item.itemId,
              },
            });

            fl.listMode = "hide";
            item.fl = fl;
            configuredGeoLayers.push(item);

            fl.visible = false;
            // if (item.defaultSelected && item.initialExtent) {
            //   zoomTo = item.initialExtent;
            // }

            map.add(fl);
          }

          updateGeoLayers(configuredGeoLayers);

          const view = new MapView({
            container: mapDiv.current,
            map: map,
          });

          setMapView(view);

          if (zoomTo || config.initialExtent) {
            view.when(() => {
              view.extent = zoomTo || config.initialExtent;
            });
          }

          const legend = new Legend({
            view: view,
            visible: false,
          });

          view.ui.add(legend, "bottom-left");

          setLegendObj(legend);

          const search = new Search({
            view,
          });

          const searchExpand = new Expand({
            view: view,
            content: search,
          });

          view.ui.add(searchExpand, "top-left");

          const basemap = new BasemapGallery({ view: view });
          setBasemapGalleryObj(basemap);

          const expand = new Expand({
            view,
            content: basemap,
          });

          view.ui.add(expand, "top-left");

          const layerList = new LayerList({
            view,
            container: "map-legend",
            listItemCreatedFunction: (event) => {
              let item = event.item;

              item.actionsSections = [
                [
                  {
                    title: "Dimensions",
                    className: "esri-icon-dashboard",
                    id: "show-dimensions",
                  },
                  {
                    title: "Move Up",
                    className: "esri-icon-up-arrow",
                    id: "move-up",
                  },
                  {
                    title: "Move Down",
                    className: "esri-icon-down-arrow",
                    id: "move-down",
                  },
                  {
                    title: "Remove",
                    className: "esri-icon-minus-circled",
                    id: "remove-layer",
                  },
                ],
              ];
              item.actionsOpen = true;
            },
          });

          layerList.on("trigger-action", (e) =>
            handleLayerListTrigger(e, mapObj)
          );
        }
      })();
    }, [config, mapDiv]);

    return <div className="mapDiv p-0" ref={mapDiv}></div>;
  }
);

export default ReactMap;
