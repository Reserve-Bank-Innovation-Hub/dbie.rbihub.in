declare module "react-plotly.js" {
    import * as React from "react";
    import * as Plotly from "plotly.js";

    export interface Figure {
            data     : Plotly.Data[];
            layout   : Partial<Plotly.Layout>;
            frames ? : Plotly.Frame[];
    }

    export interface PlotProps {
            data                      : Plotly.Data[];
            layout                  ? : Partial<Plotly.Layout>;
            config                  ? : Partial<Plotly.Config>;
            frames                  ? : Plotly.Frame[];
            revision                ? : number;
            onInitialized           ? : (figure : Readonly<Figure>, graphDiv : Readonly<HTMLElement>) => void;
            onUpdate                ? : (figure : Readonly<Figure>, graphDiv : Readonly<HTMLElement>) => void;
            onPurge                 ? : (figure : Readonly<Figure>, graphDiv : Readonly<HTMLElement>) => void;
            onError                 ? : (err : Readonly<Error>) => void;
            onClickAnnotation       ? : (event : Readonly<Plotly.ClickAnnotationEvent>) => void;
            onClick                 ? : (event : Readonly<Plotly.PlotMouseEvent>) => void;
            onHover                 ? : (event : Readonly<Plotly.PlotMouseEvent>) => void;
            onUnhover               ? : (event : Readonly<Plotly.PlotMouseEvent>) => void;
            onSelected              ? : (event : Readonly<Plotly.PlotSelectionEvent>) => void;
            onDeselect              ? : () => void;
            onRelayout              ? : (event : Readonly<Plotly.PlotRelayoutEvent>) => void;
            onRelayouting           ? : (event : Readonly<Plotly.PlotRelayoutEvent>) => void;
            onRestyle               ? : (event : Readonly<Plotly.PlotRestyleEvent>) => void;
            onRedraw                ? : () => void;
            onAfterExport           ? : () => void;
            onAfterPlot             ? : () => void;
            onAnimated              ? : () => void;
            onAnimatingFrame        ? : (event : Readonly<Plotly.FrameAnimationEvent>) => void;
            onAnimationInterrupted  ? : () => void;
            onAutoSize              ? : () => void;
            onBeforeExport          ? : () => void;
            onButtonClicked         ? : (event : Readonly<Plotly.ButtonClickEvent>) => void;
            onDoubleClick           ? : () => void;
            onFramework             ? : () => void;
            onLegendClick           ? : (event : Readonly<Plotly.LegendClickEvent>) => boolean;
            onLegendDoubleClick     ? : (event : Readonly<Plotly.LegendClickEvent>) => boolean;
            onSliderChange          ? : (event : Readonly<Plotly.SliderChangeEvent>) => void;
            onSliderEnd             ? : (event : Readonly<Plotly.SliderEndEvent>) => void;
            onSliderStart           ? : (event : Readonly<Plotly.SliderStartEvent>) => void;
            onTransitioning         ? : () => void;
            onTransitionInterrupted ? : () => void;
            onWebGlContextLost      ? : () => void;
            divId                   ? : string;
            className               ? : string;
            style                   ? : React.CSSProperties;
            useResizeHandler        ? : boolean;
            debug                   ? : boolean;
    }

    export default class Plot extends React.Component<PlotProps> {}
}
