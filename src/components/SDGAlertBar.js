import { CalciteAlert } from "@esri/calcite-components-react";
import React from "react";

function SDGAlertBar({ isActive, handleAlertClose, alertProps }) {
  const {
    title,
    message,
    color,
    link,
    icon,
    scale,
    autoDismiss,
    autoDismissDuration,
    dismissible,
  } = alertProps || {};
  return (
    <CalciteAlert
      onCalciteAlertClose={handleAlertClose}
      active={isActive ? "" : undefined}
      autoDismiss={autoDismiss ? "" : undefined}
      autoDismissDuration={
        autoDismiss && autoDismissDuration ? autoDismissDuration : undefined
      }
      icon={icon ? icon : null}
      color={color ? color : "green"}
      scale={scale ? scale : "s"}
      dismissible={dismissible ? "" : undefined}
    >
      {title && <div slot="title">{title}</div>}
      {message && <div slot="message">{message}</div>}
      {link && <a href={link.href}>{link.title}</a>}
    </CalciteAlert>
  );
}

export default SDGAlertBar;
