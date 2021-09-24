import React, { useEffect, useRef, useState } from "react";
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
  CalciteModal,
  CalciteTooltip,
  CalciteTooltipManager,
  CalciteBlock,
} from "@esri/calcite-components-react";

import sdgMetadata from "./config/metadata_2021.Q1.G.01.json";
import SDGDatasetPanel from "./components/SDGDatasetPanel";
import { getLookupFeatures } from "./utils/arcgisQueryHelper";
import ReactMap from "./components/ReactMap";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import SDGAlertBar from "./components/SDGAlertBar";

import * as intl from "@arcgis/core/intl";

// import config from "./config/config-census.json";
// import config from "./config/config-wci.json";

function App() {
  const { t, i18n } = useTranslation();

  const [config, setConfig] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [activeTheme, setActiveTheme] = useState("dark");
  const [activeAg, setActiveAg] = useState("layers");
  const [isLeftActionBarExpanded, setIsLeftActionBarExpanded] = useState(false);
  const [activeRightAg, setActiveRightAg] = useState(null);
  const [addedSDGDatasets, setAddedSDGDatasets] = useState([]);
  const [lookupFeatures, setLookupFeatures] = useState(null);
  const [geoLayers, setGeoLayers] = useState([]);
  const [selectedGeoLayer, setSelectedGeoLayer] = useState(null);
  const [activeDynamicLayer, setActiveDynamicLayer] = useState(null);
  const [isLoadingLayer, setIsLoadingLayer] = useState(false);
  const [loadedLayers, setLoadedLayers] = useState([]);
  const [selectedDimensions, setSelectedDimensions] = useState({});
  const [selectedDimensionYear, setSelectedDimensionYear] = useState(null);
  const [layersPanelHasIndicator, setLayersPanelHasIndicator] =
    useState(undefined);
  const [isRemoveLayerModalActive, setIsRemoveLayerModalActive] =
    useState(null);
  const [stashedRemoveEvent, setStashedRemoveEvent] = useState(null);
  const [isNoticeActive, setIsNoticeActive] = useState(false);
  const [alertProps, setAlertProps] = useState(null);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(true);
  const [isLegendVisible, setIsLegendVisible] = useState(false);
  const [selectedLayerTitle, setSelectedLayerTitle] = useState(null);

  const mapRef = useRef();

  const location = useLocation();

  // look for locale URL parameter on app load
  useEffect(() => {
    let params = new URLSearchParams(location.search);
    if (params.has("locale")) {
      const loc = params.get("locale");
      if (["en", "es"].includes(loc)) {
        i18n.changeLanguage(loc);
        intl.setLocale(loc);
      }
    }

    let config = "./config";
    let data = null;
    let inventory = null;
    if (params.has("config")) {
      const c = params.get("config");
      data = require(`${config}/${c}.json`);
      inventory = require(`${config}/series-inventory/${c}.json`);
    } else {
      data = require(`${config}/guam.json`);
      inventory = require(`${config}/series-inventory/guam.json`);
    }
    setConfig(data);
    setInventory(inventory);
  }, []);

  // get lookup feature information on app load
  useEffect(() => {
    (async function () {
      if (!config) return;
      const responseFeatures = await getLookupFeatures(
        config.availableLookupItem
      );
      console.log(responseFeatures);
      setLookupFeatures(responseFeatures);
    })();
  }, [config]);

  // update light/dark theme
  useEffect(() => {
    const style = document.getElementById("esri-js-api-style");
    style.href = `https://js.arcgis.com/4.21/@arcgis/core/assets/esri/themes/${activeTheme}/main.css`;
  }, [activeTheme]);

  const updateGeoLayers = (layers) => {
    // console.log("layers", layers);
    setGeoLayers(layers);
    const defaultSelectedGeoLayer = layers.filter((l) => l.isDefault)[0];
    setSelectedGeoLayer(defaultSelectedGeoLayer);
  };

  const onCalciteAgActionClick = (heading) => {
    if (heading === activeAg) {
      setActiveAg(null);
      setIsLeftPanelCollapsed(true);
      return;
    }

    setActiveAg(heading);
    setIsLeftPanelCollapsed(false);

    if (
      activeAg !== heading &&
      heading === "layers" &&
      layersPanelHasIndicator === ""
    ) {
      setTimeout(() => {
        setLayersPanelHasIndicator(undefined);
      }, 2500);
    }
  };

  const addLayerToMap = async (lookupInfo) => {
    // console.log(lookupInfo);

    setIsLoadingLayer(true);

    const itemId = lookupInfo.TBL_ITEMID;

    let dynamicLayer = await mapRef.current.createDynamicLayer(
      itemId,
      config.dimensionConfig,
      lookupInfo,
      selectedGeoLayer,
      null
    );

    setActiveDynamicLayer(dynamicLayer);
    setLoadedLayers((prev) => [...prev, dynamicLayer]);

    if (lookupInfo.YEAR_FIELD_NAME) {
      setSelectedDimensionYear(
        dynamicLayer.dimensionInformation["YEAR"].maxYear
      );
    }

    setIsLoadingLayer(false);
    setLayersPanelHasIndicator("");

    displayNotice(
      t("notice.add.title"),
      t("notice.add.message"),
      "green",
      null,
      "layers",
      "s",
      true,
      "fast"
    );
  };

  const handleRemoveLayerTrigger = (event) => {
    setStashedRemoveEvent(event);
    setIsRemoveLayerModalActive("");
  };

  const handleDimensionsTrigger = (item) => {
    showDimensionsPanel(item.layer);
  };

  const showDimensionsPanel = (layer) => {
    // update dimension information
    setSelectedDimensions(layer.dimensionInformation);

    setSelectedLayerTitle(layer.title);

    setActiveRightAg("dimensions");

    setIsRightPanelCollapsed(false);
  };

  const confirmRemoveLayer = async () => {
    setIsRemoveLayerModalActive(null);

    const attributeLayerItemId =
      stashedRemoveEvent.item.layer.attributeLayerItemId;
    const newLoadedLayers = loadedLayers.filter(
      (l) => Object.keys(l.layers)[0] !== attributeLayerItemId
    );
    setLoadedLayers(newLoadedLayers);

    stashedRemoveEvent.item.view.map.remove(stashedRemoveEvent.item.layer);
    setStashedRemoveEvent(null);

    // reset dimensions panel
    setSelectedDimensions({});
    setSelectedLayerTitle(null);

    displayNotice(
      t("notice.remove.title"),
      null,
      "green",
      null,
      "layer-hide",
      "s",
      true,
      "fast"
    );
  };

  const handleRightAgClick = (title) => {
    if (title === activeRightAg) {
      setActiveRightAg(null);
      setIsRightPanelCollapsed(true);
      return;
    }

    setActiveRightAg(title);
    setIsRightPanelCollapsed(false);
  };

  const displayNotice = (
    title,
    message,
    color,
    link,
    icon,
    scale,
    autoDismiss,
    autoDismissDuration
  ) => {
    setAlertProps({
      title,
      message,
      color,
      link,
      icon,
      scale,
      autoDismiss,
      autoDismissDuration,
    });
    setIsNoticeActive(true);
  };

  const geoLayerChange = (e, layer) => {
    if (e.detail.selected) {
      setSelectedGeoLayer(layer);
      activeDynamicLayer.updateGeography(layer);
    }
  };

  const updateDynamicLayerDimension = (selected, fieldName) => {
    if (selected && !activeDynamicLayer.isUpdating) {
      activeDynamicLayer.updateDimensionDisplay(fieldName);
      activeDynamicLayer.isUpdating = true;
    }
  };

  const updateDynamicLayerYear = (e, year) => {
    if (e.detail.selected) {
      console.log("setting year", year);
      setSelectedDimensionYear(year);
      activeDynamicLayer.updateYear(year, selectedGeoLayer);
    }
  };

  return (
    <CalciteShell className={`calcite-theme-${activeTheme}`}>
      <CalciteShellPanel
        slot="primary-panel"
        position="start"
        collapsed={isLeftPanelCollapsed ? "" : undefined}
      >
        <CalciteActionBar
          slot="action-bar"
          {...(isLeftActionBarExpanded ? { expanded: true } : {})}
          onCalciteActionBarToggle={() =>
            setIsLeftActionBarExpanded(!isLeftActionBarExpanded)
          }
        >
          <CalciteActionGroup>
            <CalciteAction
              icon="layers"
              scale="m"
              text={t("layers.title")}
              indicator={layersPanelHasIndicator}
              onClick={() => onCalciteAgActionClick("layers")}
            ></CalciteAction>
            {sdgMetadata.map((item, i) => {
              const heading = `Goal ${item.code}`;
              const itemKey = `ca_${item.code}`;
              const className = `sdgca_${item.code}`;
              return (
                <CalciteAction
                  key={itemKey}
                  scale="m"
                  icon={`sdg${item.code}`}
                  className={className}
                  active={activeAg === heading ? "" : null}
                  onClick={() => onCalciteAgActionClick(heading)}
                  text={heading}
                ></CalciteAction>
              );
            })}
          </CalciteActionGroup>
        </CalciteActionBar>

        <CalcitePanel
          heading={t("layers.title")}
          style={{ overflow: "auto" }}
          className={activeAg === "layers" ? "d-block" : "d-none"}
        >
          <div id="map-legend"></div>
        </CalcitePanel>

        {inventory &&
          lookupFeatures &&
          sdgMetadata.map((item, i) => (
            <SDGDatasetPanel
              key={`cp_${item.code}`}
              item={item}
              activeAg={activeAg}
              addedSDGDatasets={addedSDGDatasets}
              inventory={
                inventory.filter((goal) => goal.goal === `goal${item.code}`)[0]
              }
              lookupFeatures={lookupFeatures}
              addLayerToMap={addLayerToMap}
              isLoadingLayer={isLoadingLayer}
              loadedLayers={loadedLayers}
            />
          ))}
      </CalciteShellPanel>

      <CalciteShellPanel
        slot="contextual-panel"
        position="end"
        widthScale="m"
        collapsed={isRightPanelCollapsed ? "" : undefined}
      >
        <CalciteActionBar slot="action-bar">
          <CalciteActionGroup>
            <CalciteTooltipManager>
              <CalciteAction
                id="ca-dim"
                text={t("dimensions.title")}
                active={activeRightAg === "dimensions" ? "" : undefined}
                onClick={() => handleRightAgClick("dimensions")}
                icon="chord-diagram"
              />
              <CalciteTooltip
                // referenceElement="ca-dim"
                referenceElement={isRightPanelCollapsed ? "ca-dim" : undefined}
              >
                {t("dimensions.title")}
              </CalciteTooltip>
            </CalciteTooltipManager>
            <CalciteAction
              text={t("charts.title")}
              active={activeRightAg === "charts" ? "" : undefined}
              onClick={() => handleRightAgClick("charts")}
              icon="graph-bar"
              // disabled
            />
            <CalciteAction
              text="Export"
              active={activeRightAg === "export" ? "" : undefined}
              onClick={() => handleRightAgClick("export")}
              icon="print"
              disabled
            />
            <CalciteAction
              text="Save"
              active={activeRightAg === "save" ? "" : undefined}
              onClick={() => handleRightAgClick("save")}
              icon="save"
              disabled
            />
            <CalciteAction
              text={t("legend.title")}
              onClick={() => setIsLegendVisible(!isLegendVisible)}
              icon="legend"
            />
            <CalciteAction
              text="Theme"
              onClick={() => {
                activeTheme === "light"
                  ? setActiveTheme("dark")
                  : setActiveTheme("light");
              }}
              icon="brightness"
            />
          </CalciteActionGroup>
        </CalciteActionBar>

        <CalcitePanel
          style={{
            overflow: "auto",
          }}
          className={activeRightAg === "dimensions" ? "d-block" : "d-none"}
          heading={
            selectedLayerTitle
              ? selectedLayerTitle
              : t("dimensions.notSelectedTitle")
          }
        >
          {selectedLayerTitle ? (
            <>
              {/* <h6 className="p-3">{selectedLayerTitle}</h6> */}
              {"TOTAL" in selectedDimensions && (
                <CalcitePickListGroup groupTitle="Totals">
                  <CalcitePickList>
                    {Object.keys(selectedDimensions)
                      .filter((d) => d === "TOTAL")
                      .map((dim, i) => {
                        return (
                          <CalcitePickListItem
                            key="dimcpi_total"
                            label="Totals"
                            value="Total"
                            icon="square"
                            selected
                          ></CalcitePickListItem>
                        );
                      })}
                  </CalcitePickList>
                </CalcitePickListGroup>
              )}

              <CalcitePickList>
                <CalcitePickListGroup groupTitle={t("dimensions.geography")}>
                  {geoLayers.map((item, i) => {
                    // console.log(item, selectedGeoLayer?.itemId);
                    return (
                      <CalcitePickListItem
                        key={`geopl_${item.name}`}
                        label={item.name}
                        value={item.name}
                        {...(item.itemId === selectedGeoLayer?.itemId
                          ? { selected: true }
                          : {})}
                        icon="square"
                        onCalciteListItemChange={(e) => geoLayerChange(e, item)}
                      ></CalcitePickListItem>
                    );
                  })}
                </CalcitePickListGroup>
              </CalcitePickList>

              {selectedDimensions["YEAR"] && (
                <CalcitePickList>
                  <CalcitePickListGroup
                    style={{ maxHeight: 300, overflow: "scroll" }}
                    groupTitle={t("dimensions.year.title")}
                  >
                    {selectedDimensions["YEAR"].values.map((year, i) => (
                      <CalcitePickListItem
                        key={`dimyearcpi_${year.code}`}
                        label={year.code}
                        value={year.code}
                        icon="square"
                        {...(selectedDimensionYear === year.code
                          ? { selected: true }
                          : {})}
                        // {...getAvailableYears(year)}
                        onCalciteListItemChange={(e) =>
                          updateDynamicLayerYear(e, year.code)
                        }
                      ></CalcitePickListItem>
                    ))}
                  </CalcitePickListGroup>
                </CalcitePickList>
              )}

              {Object.keys(selectedDimensions).filter((d) => d !== "TOTAL")
                .length > 0 && (
                <CalciteBlock collapsible heading={t("dimensions.more")}>
                  <CalcitePickList>
                    {Object.keys(selectedDimensions)
                      .filter((d) => d !== "TOTAL" && d !== "YEAR")
                      .map((dim, i) => {
                        return (
                          <CalcitePickListGroup
                            key={`dimcpg_${i}`}
                            groupTitle={selectedDimensions[dim].name}
                          >
                            {selectedDimensions[dim].values.map((d, a) => (
                              <CalcitePickListItem
                                key={`dimcpi_${a}`}
                                label={d.name}
                                value={d.fieldName}
                                icon="square"
                                {...(activeDynamicLayer.defaultMetric ===
                                d.fieldName
                                  ? { selected: true }
                                  : {})}
                                onCalciteListItemChange={(e) =>
                                  updateDynamicLayerDimension(
                                    e.detail.selected,
                                    d.fieldName
                                  )
                                }
                              ></CalcitePickListItem>
                            ))}
                          </CalcitePickListGroup>
                        );
                      })}
                  </CalcitePickList>
                </CalciteBlock>
              )}
            </>
          ) : (
            <div className="m-3">{t("dimensions.notSelected")}</div>
          )}
        </CalcitePanel>
        <CalcitePanel
          className={activeRightAg === "charts" ? "d-block" : "d-none"}
          heading={t("charts.title")}
        >
          hello charts
        </CalcitePanel>
      </CalciteShellPanel>

      <ReactMap
        config={config}
        ref={mapRef}
        activeTheme={activeTheme}
        isLegendVisible={isLegendVisible}
        updateGeoLayers={updateGeoLayers}
        isLoadingLayer={isLoadingLayer}
        handleDimensionsTrigger={handleDimensionsTrigger}
        handleRemoveLayerTrigger={handleRemoveLayerTrigger}
      />

      <CalciteModal scale="s" width="s" active={isRemoveLayerModalActive}>
        <h6 slot="header">{t("modal.remove.confirm")}</h6>
        <div slot="content">
          <p>{t("modal.remove.title")}</p>
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
          {t("modal.remove.cancel")}
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
          {t("modal.remove.remove")}
        </CalciteButton>
      </CalciteModal>

      <SDGAlertBar
        isActive={isNoticeActive}
        handleAlertClose={() => setIsNoticeActive(false)}
        alertProps={alertProps}
      />
    </CalciteShell>
  );
}

export default App;
