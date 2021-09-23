import {
  CalciteAction,
  CalciteActionBar,
  CalciteActionGroup,
  CalciteShell,
  CalciteShellPanel,
  CalcitePanel,
  CalciteButton,
  CalcitePickList,
  CalcitePickListGroup,
  CalcitePickListItem,
  CalciteChip,
  CalciteModal,
} from "@esri/calcite-components-react";
import React, { useEffect, useRef, useState } from "react";
import ReactMap from "./ReactMap";
import sdgMetadata from "../config/metadata_2021.Q1.G.01.json";
import styled from "styled-components";
import config from "../config/config.json";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
// import DataDisplayCard from "./DataDisplayCard";
import TOC from "./TOC";
import { getLayerInfoAndDimensions } from "../utils/arcgisQueryHelper";
// import GeographyCombobox from "./GeographyCombobox";
// import DataDisplayCard2 from "./DataDisplayCard2";
import SDGDatasetPanel from "./SDGDatasetPanel";

import esriRequest from "@arcgis/core/request";
import { createDynamicLayer } from "../utils/dynamicLayer";
import FeatureLayerChart from "./FeatureLayerChart";

const ToggleLeftContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 3;
`;

const ToggleRightContainer = styled.div`
  position: absolute;
  top: 10px;
  z-index: 3;
  right: 10px;
  margin-right: 130px;
`;

const NumberCircle = styled.span`
  border-radius: 0.8em;
  -moz-border-radius: 0.8em;
  -webkit-border-radius: 0.8em;
  color: #ffffff;
  display: inline-block;
  font-weight: bold;
  line-height: 1.6em;
  margin-right: 15px;
  text-align: center;
  width: 1.6em;
`;

const NumberCircleContainer = styled.p`
  position: absolute;
  top: 10px;
  left: 9px;
  z-index: 1;
`;

const AppHeader = styled.header`
  height: 50px;
`;

const AppShell = () => {
  const [attLayerCache, setAttLayerCache] = useState({});
  const [tocLayers, setTocLayers] = useState([]);
  const [geoLayers, setGeoLayers] = useState([]);
  const [selectedGeoLayer, setSelectedGeoLayer] = useState(null);
  const [attributeLayers, setAttributeLayers] = useState([]);
  const [lookupFeatures, setLookupFeatures] = useState(null);
  const [activeAction, setActiveAction] = useState("layers");
  const [rightActiveAction, setRightActiveAction] = useState("dimensions");
  const [currentExpandCollapseLevel, setCurrentExpandCollapseLevel] =
    useState("m");
  const [currentRightExpandCollapseLevel, setCurrentRightExpandCollapseLevel] =
    useState("m");

  const [activeLayer, setActiveLayer] = useState(null);
  const [activeYear, setActiveYear] = useState(null);
  const [selectedDimensions, setSelectedDimensions] = useState({});
  const [selectedDimensionYears, setSelectedDimensionYears] = useState([]);

  const [isRemoveLayerModalActive, setIsRemoveLayerModalActive] =
    useState(null);
  const [stashedRemoveLayer, setStashedRemoveLayer] = useState(null);

  const [chartData, setChartData] = useState([]);

  const mapRef = useRef();

  const updateGeoLayers = (layers) => {
    console.log("layers", layers);
    setGeoLayers(layers);
    setSelectedGeoLayer(layers.filter((l) => l.isDefault));
  };

  useEffect(() => {
    (async function () {
      const lookupTable = await FeatureLayer.fromPortalItem({
        portalItem: {
          id: config.availableLookupItem,
        },
      });

      const q = lookupTable.createQuery();
      q.where = "Enabled = 'Y'";
      const features = await lookupTable.queryFeatures(q);
      const itemIds = features.features.map((f) => f.attributes.Item_ID);

      const options = {
        responseType: "json",
        query: {
          q: `id:(${itemIds.join(" OR ")})`,
          f: "json",
        },
      };
      const res = await esriRequest(
        "https://www.arcgis.com/sharing/rest/search",
        options
      );
      // console.log(res);
      res.data.results.forEach((r) => {
        const foundFeature = features.features.filter(
          (f) => f.attributes.Item_ID === r.id
        )[0];
        if (foundFeature) {
          foundFeature.attributes["tags"] = r.tags;
          foundFeature.attributes["title"] = r.title;
          foundFeature.attributes["description"] = r.description;
        }
      });

      setLookupFeatures(features);
    })();
  }, []);

  /** START -- Toggle Expand/Collapse Side Panels */
  const expandCollapsePanel = (panelSide, inc) => {
    if (inc < 0) {
      if (panelSide === "left") {
        if (currentExpandCollapseLevel === "l") {
          setCurrentExpandCollapseLevel("m");
        }
      } else {
        if (currentRightExpandCollapseLevel === "l") {
          setCurrentRightExpandCollapseLevel("m");
        }
      }
    } else {
      if (panelSide === "left") {
        if (currentExpandCollapseLevel === "m") {
          setCurrentExpandCollapseLevel("l");
        }
      } else {
        if (currentRightExpandCollapseLevel === "m") {
          setCurrentRightExpandCollapseLevel("l");
        }
      }
    }
  };

  const getActiveAction = (inAction) => {
    return inAction === activeAction ? true : null;
  };

  const getRightActiveAction = (inAction) => {
    return inAction === rightActiveAction ? true : null;
  };

  const getPanelHideShow = (inAction) => {
    if (inAction === activeAction) {
      return "d-block";
    }
    return "d-none";
  };

  const getRightPanelHideShow = (inAction) => {
    if (inAction === rightActiveAction) {
      return "d-block";
    }
    return "d-none";
  };

  const toggleMainPanelDisplay = (e) => {
    const inPanelId = e.target.getAttribute("data-panelId");
    const panels = document.querySelectorAll("[data-panel-panelId]");
    for (const panel of panels) {
      const id = panel.getAttribute("data-panel-panelId");
      if (id === inPanelId) {
        setActiveAction(id);
        break;
      }
    }
  };

  const toggleRightPanelDisplay = (e) => {
    const inPanelId = e.target.getAttribute("data-rightPanelId");
    const panels = document.querySelectorAll("[data-panel-rightPanelId]");
    for (const panel of panels) {
      const id = panel.getAttribute("data-panel-rightPanelId");
      if (id === inPanelId) {
        setRightActiveAction(id);
        break;
      }
    }
  };
  /** END -- Toggle Expand/Collapse Side Panels */

  const updateTocLayers = (info) => {
    console.log("updateTocLayers", info);
  };

  const layerChange = async (itemId, lookupInfo, title, desc) => {
    let dimensionInfo = null;

    if (itemId in attLayerCache) {
      dimensionInfo = attLayerCache[itemId];
    } else {
      dimensionInfo = await getLayerInfoAndDimensions(
        itemId,
        lookupInfo.DimensionItemId,
        lookupInfo.DefaultMetric
      );
      setAttLayerCache((prev) => ({ ...prev, [itemId]: dimensionInfo }));
    }
    const newTocLayer = {
      itemId,
      lookupInfo,
      title,
      desc,
      dimensionInfo,
    };
    setTocLayers((prev) => [...prev, newTocLayer]);

    const activeLayer = await mapRef.current.addLayerToMap(
      itemId,
      selectedGeoLayer,
      lookupInfo
    );

    setActiveLayer(activeLayer);
    const years = lookupInfo.Years.split(",");
    setActiveYear(years[years.length - 1]);

    updateDisplayDimensions(newTocLayer);
  };

  const geoLayerChange = async (e, layer) => {
    // if (e.detail.selected) {
    //   console.log(layer);
    //   setSelectedGeoLayer(layer);
    //   const activeLayer = await mapRef.current.addLayerToMap(
    //     itemId,
    //     layer,
    //     lookupInfo
    //   );
    // }
  };

  const removeLayer = (layer) => {
    // console.log("removeLayer", layer);
    setStashedRemoveLayer(layer);
    setIsRemoveLayerModalActive("");
  };

  const confirmRemoveLayer = () => {
    console.log("confirmRemoveLayer", stashedRemoveLayer, tocLayers);
    let newTocLayers = tocLayers.filter(
      (item) => item.itemId !== stashedRemoveLayer.itemId
    );
    setTocLayers((prev) => newTocLayers);
    setIsRemoveLayerModalActive(null);
  };

  const updateDisplayDimensions = (tocLayer) => {
    setSelectedDimensions(tocLayer.dimensionInfo);
    setSelectedDimensionYears(tocLayer.lookupInfo.Years.split(","));
  };

  return (
    <CalciteShell>
      {/* <div>
        <CalciteShellPanel slot="header" position="start">
          <AppHeader>
            <GeographyCombobox layers={geoLayers} />
          </AppHeader>
        </CalciteShellPanel>
      </div> */}
      <CalciteShellPanel
        slot="primary-panel"
        position="start"
        widthScale={currentExpandCollapseLevel}
      >
        <ToggleLeftContainer className="expandPanelToggle">
          <CalciteButton
            onClick={() => expandCollapsePanel("left", -1)}
            width="half"
            appearance="transparent"
            color="blue"
            alignment="right"
            icon-start="arrow-left"
            scale="s"
            disabled={currentExpandCollapseLevel === "m" ? "disabled" : null}
          ></CalciteButton>
          <CalciteButton
            onClick={() => expandCollapsePanel("left", 1)}
            width="half"
            appearance="transparent"
            color="blue"
            icon-start="arrow-right"
            alignment="right"
            scale="s"
            disabled={currentExpandCollapseLevel === "l" ? "disabled" : null}
          ></CalciteButton>
        </ToggleLeftContainer>
        <CalciteActionBar
          slot="action-bar"
          className="calcite-theme-dark"
          expanded
        >
          <CalciteActionGroup style={{ overflow: "auto" }}>
            {/* LAYERS ACTION */}
            <CalciteAction
              onCalciteActionClick={toggleMainPanelDisplay}
              data-panelId="layers"
              text="Layers"
              textEnabled
              scale="l"
              active={getActiveAction("layers")}
              icon="layers"
            />

            {/* GOALS ACTIONS */}
            {sdgMetadata.map((item, i) => {
              const heading = `Goal ${item.code}`;
              const itemKey = `ca_${item.code}`;
              const iconSrc = `../assets/action-bar-imgs/${item.code}.png`;
              return (
                <CalciteAction
                  key={itemKey}
                  id={itemKey}
                  data-panelId={heading}
                  scale="s"
                  active={getActiveAction(heading)}
                  onCalciteActionClick={toggleMainPanelDisplay}
                  textEnabled
                  text={item.shortLabelEN}
                >
                  <CalciteChip scale="s" appearance="clear" className="sdgIcon">
                    <img alt="" src={iconSrc} />
                  </CalciteChip>
                </CalciteAction>
              );
            })}
          </CalciteActionGroup>
        </CalciteActionBar>

        {/* LAYERS PANEL */}
        <CalcitePanel
          heading="Layers"
          data-panel-panelId="layers"
          style={{ overflow: "auto" }}
          className={getPanelHideShow("layers")}
        >
          <TOC
            tocLayers={tocLayers}
            removeLayer={removeLayer}
            updateDisplayDimensions={updateDisplayDimensions}
          />
        </CalcitePanel>

        {/* SDG DATASET PANELS */}
        {sdgMetadata.map((item, i) => (
          <SDGDatasetPanel
            key={`cp_${item.code}`}
            item={item}
            tocLayers={tocLayers}
            lookupFeatures={lookupFeatures}
            getPanelHideShow={getPanelHideShow}
            layerChange={layerChange}
          />
        ))}
      </CalciteShellPanel>

      <CalciteShellPanel
        slot="contextual-panel"
        position="end"
        widthScale={currentRightExpandCollapseLevel}
      >
        {/* <ToggleRightContainer className="expandRightPanelToggle">
          <CalciteButton
            onClick={() => expandCollapsePanel("right", 1)}
            width="half"
            appearance="transparent"
            color="blue"
            alignment="right"
            icon-start="arrow-left"
            scale="s"
            disabled={
              currentRightExpandCollapseLevel === "l" ? "disabled" : null
            }
          ></CalciteButton>
          <CalciteButton
            onClick={() => expandCollapsePanel("right", -1)}
            width="half"
            appearance="transparent"
            color="blue"
            icon-start="arrow-right"
            alignment="right"
            scale="s"
            disabled={
              currentRightExpandCollapseLevel === "m" ? "disabled" : null
            }
          ></CalciteButton>
        </ToggleRightContainer> */}
        <CalciteActionBar
          slot="action-bar"
          className="calcite-theme-dark"
          expanded
          expandDisabled
        >
          <CalciteActionGroup>
            <CalciteAction
              text="Dimensions"
              onCalciteActionClick={toggleRightPanelDisplay}
              data-rightPanelId={"dimensions"}
              active={getRightActiveAction("dimensions")}
              icon="chord-diagram"
            />
            <CalciteAction
              text="Charts"
              onCalciteActionClick={toggleRightPanelDisplay}
              data-rightPanelId={"charts"}
              active={getRightActiveAction("charts")}
              icon="graph-bar"
            />
            <CalciteAction
              text="Export"
              onCalciteActionClick={toggleRightPanelDisplay}
              data-rightPanelId={"export"}
              active={getRightActiveAction("export")}
              icon="print"
              disabled
            />
            <CalciteAction
              text="Save"
              onCalciteActionClick={toggleRightPanelDisplay}
              data-rightPanelId={"save"}
              active={getRightActiveAction("save")}
              icon="save"
              disabled
            />
          </CalciteActionGroup>
        </CalciteActionBar>
        <CalcitePanel
          heading="Dimensions"
          data-panel-rightPanelId="dimensions"
          style={{
            overflow: "auto",
          }}
          className={getRightPanelHideShow("dimensions")}
        >
          <CalcitePickList>
            <CalcitePickListGroup groupTitle="Geography">
              {geoLayers.length > 0 &&
                geoLayers.map((item, i) => (
                  <CalcitePickListItem
                    key={`geopl_${item.itemId}`}
                    label={item.name}
                    value={item.itemId}
                    icon="square"
                    // onCalciteListItemChange={(e) => geoLayerChange(e, item)}
                  >
                    <calcite-action
                      slot="actions-end"
                      icon="layer"
                    ></calcite-action>
                  </CalcitePickListItem>
                ))}
            </CalcitePickListGroup>
          </CalcitePickList>

          <CalcitePickList>
            <CalcitePickListGroup groupTitle="Year">
              {selectedDimensionYears.map((year, i) => (
                <CalcitePickListItem
                  key={`dimyearcpi_${year}`}
                  label={year}
                  value={year}
                  icon="square"
                ></CalcitePickListItem>
              ))}
            </CalcitePickListGroup>
          </CalcitePickList>

          <CalcitePickList>
            {Object.keys(selectedDimensions)
              .filter((d) => d !== "TOTAL")
              .map((dim, i) => {
                return (
                  <CalcitePickListGroup key={`dimcpg_${i}`} groupTitle={dim}>
                    {selectedDimensions[dim].map((d, a) => (
                      <CalcitePickListItem
                        key={`dimcpi_${a}`}
                        label={d.label}
                        value={d.code}
                        icon="square"
                      ></CalcitePickListItem>
                    ))}
                  </CalcitePickListGroup>
                );
              })}
          </CalcitePickList>
        </CalcitePanel>
        <CalcitePanel
          heading="Charts"
          data-panel-rightPanelId="charts"
          style={{ overflow: "auto" }}
          className={getRightPanelHideShow("charts")}
        >
          {/* <FeatureLayerChart chartData={chartData}/> */}
        </CalcitePanel>
        <CalcitePanel
          heading="Export"
          data-panel-rightPanelId="export"
          style={{ overflow: "auto" }}
          className={getRightPanelHideShow("export")}
        ></CalcitePanel>
        <CalcitePanel
          heading="Save"
          data-panel-rightPanelId="save"
          style={{ overflow: "auto" }}
          className={getRightPanelHideShow("save")}
        ></CalcitePanel>
      </CalciteShellPanel>
      {/* <footer slot="footer">Footer</footer> */}
      <ReactMap
        ref={mapRef}
        attributeLayers={attributeLayers}
        updateGeoLayers={updateGeoLayers}
        updateTocLayers={updateTocLayers}
      />
      <CalciteModal scale="s" width="s" active={isRemoveLayerModalActive}>
        <h6 slot="header">Confirm</h6>
        <div slot="content">
          <p>Are you sure you want to remove this layer?</p>
        </div>
        <CalciteButton
          slot="secondary"
          width="full"
          appearance="outline"
          alignment="center"
          color="blue"
          scale="s"
          onClick={() => setIsRemoveLayerModalActive(null)}
        >
          Cancel
        </CalciteButton>
        <CalciteButton
          slot="primary"
          width="full"
          alignment="center"
          appearance="solid"
          color="red"
          scale="s"
          onClick={confirmRemoveLayer}
        >
          Remove
        </CalciteButton>
      </CalciteModal>
    </CalciteShell>
  );
};

export default AppShell;
