import React, { MutableRefObject } from "react";
import { CSSObject } from '@emotion/react';
interface ZoomProjectorThumbnailPropsType {
    thumbImgSrc: string;
    fullImgSrc?: string;
    zoomLevel?: {
        initial?: number;
        min?: number;
        max?: number;
        load?: number;
    };
    wheelSensitivity?: number;
    alt?: string;
    zoomInside: boolean;
    rewriteInterval?: number;
    projectorRef: MutableRefObject<any>;
    debugState?: {
        state?: object;
        setState?: any;
    };
}
declare const ZoomProjectorThumbnail: {
    (props: ZoomProjectorThumbnailPropsType): import("@emotion/react/jsx-runtime").JSX.Element;
    defaultProps: {
        zoomInside: boolean;
        zoomLevel: {
            initial: number;
            min: number;
            max: number;
            load: number;
        };
        rewriteInterval: number;
        wheelSensitivity: number;
    };
};
interface ZoomProjectorPropsType {
    projectorCSS?: CSSObject;
}
declare const ZoomProjector: React.ForwardRefExoticComponent<ZoomProjectorPropsType & React.RefAttributes<unknown>>;
export { ZoomProjector };
export default ZoomProjectorThumbnail;
