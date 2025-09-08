declare module "react-plotly.js/factory" {
  import Plotly from "plotly.js-basic-dist";
  import { ComponentType } from "react";

  interface PlotParams {
    data: Plotly.Data[];
    layout?: Partial<Plotly.Layout>;
    config?: Partial<Plotly.Config>;
    onInitialized?: (figure: any, graphDiv: HTMLDivElement) => void;
    onUpdate?: (figure: any, graphDiv: HTMLDivElement) => void;
    style?: React.CSSProperties;
    className?: string;
  }

  const factory: (plotly: typeof Plotly) => ComponentType<PlotParams>;
  export default factory;
}
