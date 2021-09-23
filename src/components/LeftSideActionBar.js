import React from "react";
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

const LeftSideActionBar = ({ children }) => {
  return (
    <CalciteActionBar slot="action-bar" className="calcite-theme-dark" expanded>
      {children}
    </CalciteActionBar>
  );
};

export default LeftSideActionBar;
