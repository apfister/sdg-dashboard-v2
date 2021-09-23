import { CalciteTileSelect } from "@esri/calcite-components-react";

const DataDisplayCard = ({ itemId, indicatorInfo }) => {
  return (
    <div>
      <CalciteTileSelect
        change
        width="full"
        type="checkbox"
        inputEnabled
        inputAlignment="end"
        value="one"
        data-itemId={itemId}
        heading={indicatorInfo.labelEN}
        description={indicatorInfo.descEN}
      >
        {/* <CalciteChip scale="s" color="blue">
          Indicator
        </CalciteChip> */}
      </CalciteTileSelect>
    </div>
  );
};

export default DataDisplayCard;
