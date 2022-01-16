"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoomProjector = void 0;
const jsx_runtime_1 = require("@emotion/react/jsx-runtime");
const react_1 = require("react");
const react_2 = require("@emotion/react");
const lodash_1 = __importDefault(require("lodash"));
const thumbnailImgCSS = (0, react_2.css)({
    objectFit: "contain",
    width: "100%",
    height: "100%",
});
const defaultMaskCSS = (0, react_2.css)({
    opacity: 0.5,
    position: "absolute",
    backgroundColor: "white",
    left: 0,
    top: 0,
    width: "0px",
    height: "0px"
});
const projectionElementHidden = (0, react_2.css)({
    position: "absolute",
    overflow: "hidden",
    contentVisibility: "hidden"
});
const projectionElementVisible = (0, react_2.css)({
    position: "absolute",
    overflow: "hidden",
    contentVisibility: "auto"
});
const defaultZoomProjectorThumbnailProps = {
    zoomInside: false,
    zoomLevel: {
        initial: 1.0,
        min: 1.0,
        max: 10.0,
        load: 2.0
    },
    rewriteInterval: 50,
    wheelSensitivity: 0.1
};
const ZoomProjectorThumbnail = (props) => {
    const [mouseState, setMouseState] = (0, react_1.useState)(false);
    const [mousePosition, setMousePosition] = (0, react_1.useState)({ x: 0, y: 0 });
    const [thumbElementRect, setThumbElementRect] = (0, react_1.useState)({ w: 0, h: 0, x: 0, y: 0 });
    const [imageSize, setImageSize] = (0, react_1.useState)({ w: 0, h: 0 });
    const [thumbImgPadding, setThumbImgPadding] = (0, react_1.useState)({ w: 0, h: 0 });
    const [projectionElementRect, setProjectionElementRect] = (0, react_1.useState)({ w: 0, h: 0, x: 0, y: 0 });
    const [currentZoomLevel, setCurrentZoomLevel] = (0, react_1.useState)(props.zoomLevel?.initial ?? defaultZoomProjectorThumbnailProps.zoomLevel.initial);
    const [maskCSS, setMaskCSS] = (0, react_1.useState)({ top: {}, bottom: {}, left: {}, right: {} });
    const [projectionElementStyle, setProjectionElementStyle] = (0, react_1.useState)({});
    const [projectionElementCSS, setProjectionElementCSS] = (0, react_1.useState)(projectionElementHidden);
    const [projectionImgStyle, setProjectionImgStyle] = (0, react_1.useState)({});
    const [projectionImgSrc, setProjectionImgSrc] = (0, react_1.useState)(undefined);
    const [isFullImgLoaded, setIsFullImgLoaded] = (0, react_1.useState)(false);
    const thumbElementRef = (0, react_1.useRef)(null);
    const thumbImgRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        const thumbImg = new Image();
        thumbImg.src = props.thumbImgSrc;
        thumbImg.onload = () => {
            setProjectionImgSrc(props.thumbImgSrc);
            setImageSize({ w: thumbImg.naturalWidth, h: thumbImg.naturalHeight });
        };
    }, [props.thumbImgSrc]);
    (0, react_1.useEffect)(() => {
        const thumbElementObserver = new ResizeObserver((entries) => {
            if (thumbElementRef.current) {
                setThumbElementRect({
                    w: entries[0].contentRect.width,
                    h: entries[0].contentRect.height,
                    x: thumbElementRef.current.getBoundingClientRect()?.left,
                    y: thumbElementRef.current.getBoundingClientRect()?.top
                });
            }
        });
        if (thumbElementRef.current != null) {
            thumbElementObserver.observe(thumbElementRef.current);
        }
        const projectorObserver = new ResizeObserver((entries) => {
            if (props.projectorRef.current) {
                setProjectionElementRect({
                    w: entries[0].contentRect.width,
                    h: entries[0].contentRect.height,
                    x: props.projectorRef.current.getBoundingClientRect()?.left,
                    y: props.projectorRef.current.getBoundingClientRect()?.top
                });
            }
        });
        if (props.projectorRef.current != null) {
            projectorObserver.observe(props.projectorRef.current);
        }
        return () => {
            thumbElementObserver.disconnect();
            projectorObserver.disconnect();
        };
    }, []);
    (0, react_1.useEffect)(() => {
        const aspectRatio = (imageSize.w ?? 1) / (imageSize.h ?? 1);
        const currentAspectRatio = (thumbElementRect.w ?? 1) / (thumbElementRect.h ?? 1);
        let paddingW = 0;
        let paddingH = 0;
        if (currentAspectRatio > aspectRatio) {
            paddingH = 0;
            paddingW = (thumbElementRect.w - thumbElementRect.h * aspectRatio) / 2;
        }
        else if (currentAspectRatio < aspectRatio) {
            paddingH = (thumbElementRect.h - thumbElementRect.w / aspectRatio) / 2;
            paddingW = 0;
        }
        setThumbImgPadding({ w: paddingW, h: paddingH });
    }, [thumbElementRect, imageSize]);
    (0, react_1.useEffect)(() => {
        setProjectionElementStyle({ ...projectionElementStyle, ...{
                height: projectionElementRect.h,
                width: projectionElementRect.w,
                left: projectionElementRect.x,
                top: projectionElementRect.y,
            } });
    }, [projectionElementRect]);
    (0, react_1.useEffect)(() => {
        if (!mouseState) {
            return;
        }
        if (projectionElementRect.w === 0) {
            return;
        }
        const aspect = thumbElementRect.w / thumbElementRect.h;
        const lensAspect = projectionElementRect.w / projectionElementRect.h;
        let areaW;
        let areaH;
        if (aspect > lensAspect) {
            areaH = thumbElementRect.h / currentZoomLevel;
            areaW = areaH * lensAspect;
        }
        else {
            areaW = thumbElementRect.w / currentZoomLevel;
            areaH = areaW / lensAspect;
        }
        const lensW = (thumbElementRect.w - thumbImgPadding.w * 2) / areaW * projectionElementRect.w;
        const lensH = (thumbElementRect.h - thumbImgPadding.h * 2) / areaH * projectionElementRect.h;
        const lensX = -(mousePosition.x - thumbImgPadding.w - (areaW / 2)) * projectionElementRect.w / areaW;
        const lensY = -(mousePosition.y - thumbImgPadding.h - (areaH / 2)) * projectionElementRect.h / areaH;
        setMaskCSS({
            top: {
                width: "100%",
                height: Math.max(0, (mousePosition.y - (areaH / 2))).toString() + "px",
                left: 0,
                top: 0,
            },
            left: {
                width: Math.max(0, (mousePosition.x - areaW / 2)).toString() + "px",
                height: areaH.toString() + "px",
                left: 0,
                top: (mousePosition.y - (areaH / 2)).toString() + "px",
            },
            right: {
                width: (thumbElementRect.w - mousePosition.x - areaW / 2).toString() + "px",
                height: areaH.toString() + "px",
                left: (mousePosition.x + areaW / 2).toString() + "px",
                top: (mousePosition.y - (areaH / 2)).toString() + "px",
            },
            bottom: {
                width: "100%",
                height: (thumbElementRect.h - mousePosition.y - areaH / 2).toString() + "px",
                left: 0,
                top: (mousePosition.y + areaH / 2).toString() + "px",
            }
        });
        let newProjectImgCSS = {
            width: lensW,
            height: lensH,
            marginTop: "0px",
            marginLeft: "0px",
            objectPosition: "",
        };
        if (lensW < projectionElementRect.w) {
            if (lensH < projectionElementRect.h) {
                newProjectImgCSS.marginTop = lensY.toString() + "px";
                newProjectImgCSS.marginLeft = lensX.toString() + "px";
            }
            else {
                newProjectImgCSS.marginLeft = lensX.toString() + "px";
                newProjectImgCSS.objectPosition = "0px " + lensY.toString() + "px";
            }
        }
        else {
            if (lensH < projectionElementRect.h) {
                newProjectImgCSS.marginTop = lensY.toString() + "px";
                newProjectImgCSS.objectPosition = lensX.toString() + "px 0px";
            }
            else {
                newProjectImgCSS.objectPosition = lensX.toString() + "px " + lensY.toString() + "px";
            }
        }
        setProjectionImgStyle(newProjectImgCSS);
    }, [mousePosition, currentZoomLevel]);
    const mouseOverEvent = () => {
        setMouseState(true);
        setProjectionElementCSS(projectionElementVisible);
        // checkElementSize();
    };
    const mouseLeaveEvent = () => {
        setMouseState(false);
        setProjectionElementCSS(projectionElementHidden);
        setMaskCSS({ top: {}, bottom: {}, left: {}, right: {} });
    };
    const wheelEvent = (event) => {
        if (event.deltaY > 0) {
            let next = currentZoomLevel - Math.max(1, Math.floor(currentZoomLevel)) *
                (props.wheelSensitivity ?? defaultZoomProjectorThumbnailProps.wheelSensitivity);
            let next_next = currentZoomLevel - Math.max(1, Math.floor(next)) *
                (props.wheelSensitivity ?? defaultZoomProjectorThumbnailProps.wheelSensitivity);
            setCurrentZoomLevel(Math.round(100 * Math.max(props.zoomLevel?.min ?? defaultZoomProjectorThumbnailProps.zoomLevel.min, next, next_next)) / 100);
        }
        else if (event.deltaY < 0) {
            setCurrentZoomLevel(Math.round(100 * Math.min(props.zoomLevel?.max ?? defaultZoomProjectorThumbnailProps.zoomLevel.max, currentZoomLevel + Math.max(1, Math.floor(currentZoomLevel)) *
                (props.wheelSensitivity ?? defaultZoomProjectorThumbnailProps.wheelSensitivity))) / 100);
            if (props.fullImgSrc && !isFullImgLoaded && currentZoomLevel > (props.zoomLevel?.load ?? defaultZoomProjectorThumbnailProps.zoomLevel.load)) {
                loadZoomImg(props.fullImgSrc);
            }
            else {
                console.log(props.fullImgSrc, isFullImgLoaded, currentZoomLevel, (props.zoomLevel?.load ?? defaultZoomProjectorThumbnailProps.zoomLevel.load));
            }
        }
    };
    (0, react_1.useEffect)(() => {
        setIsFullImgLoaded(false);
        setCurrentZoomLevel(props.zoomLevel?.initial ?? defaultZoomProjectorThumbnailProps.zoomLevel.initial);
        setProjectionImgSrc(props.thumbImgSrc);
    }, [props.thumbImgSrc, props.fullImgSrc]);
    const loadZoomImg = (loadImgSrc) => {
        setIsFullImgLoaded(true);
        const fullImg = new Image();
        fullImg.src = loadImgSrc;
        fullImg.onload = () => {
            setProjectionImgSrc(props.fullImgSrc);
            setImageSize({ w: fullImg.naturalWidth, h: fullImg.naturalHeight });
        };
    };
    const mouseMoveEvent = lodash_1.default.throttle((event) => {
        if (thumbElementRef.current == null) {
            return;
        }
        setMousePosition({
            x: event.clientX - thumbElementRect.x,
            y: event.clientY - thumbElementRect.y,
        });
    }, props.rewriteInterval);
    (0, react_1.useEffect)(() => {
        if (props.debugState && props.debugState.setState) {
            props.debugState.setState({
                mouseState: mouseState,
                mousePosition: mousePosition,
                zoomLevel: currentZoomLevel,
                imageSize: imageSize
            });
        }
    }, [mouseState, mousePosition, currentZoomLevel, imageSize]);
    return ((0, jsx_runtime_1.jsxs)("div", { css: (0, react_2.css)({ height: "100%" }), children: [(0, jsx_runtime_1.jsxs)("div", { css: (0, react_2.css)({ position: "relative", overflow: "hidden", height: "100%", width: "100%" }), onMouseOver: mouseOverEvent, onMouseLeave: mouseLeaveEvent, onMouseMove: mouseMoveEvent, onWheel: wheelEvent, ref: thumbElementRef, children: [(0, jsx_runtime_1.jsx)("img", { src: props.thumbImgSrc, alt: props.alt, css: thumbnailImgCSS, ref: thumbImgRef }, void 0), (0, jsx_runtime_1.jsx)("div", { css: defaultMaskCSS, style: maskCSS.top }, void 0), (0, jsx_runtime_1.jsx)("div", { css: defaultMaskCSS, style: maskCSS.left }, void 0), (0, jsx_runtime_1.jsx)("div", { css: defaultMaskCSS, style: maskCSS.right }, void 0), (0, jsx_runtime_1.jsx)("div", { css: defaultMaskCSS, style: maskCSS.bottom }, void 0)] }, void 0), (0, jsx_runtime_1.jsx)("div", { css: projectionElementCSS, style: projectionElementStyle, children: (0, jsx_runtime_1.jsx)("img", { src: projectionImgSrc, style: projectionImgStyle, alt: props.alt }, void 0) }, void 0)] }, void 0));
};
ZoomProjectorThumbnail.defaultProps = defaultZoomProjectorThumbnailProps;
const ZoomProjector = (0, react_1.forwardRef)(({ projectorCSS }, ref) => {
    return (0, react_1.useMemo)(() => (((0, jsx_runtime_1.jsx)("div", { css: (0, react_2.css)(projectorCSS), ref: ref }, void 0))), [projectorCSS]);
});
exports.ZoomProjector = ZoomProjector;
ZoomProjector.defaultProps = {
    projectorCSS: {
        height: "100%",
        width: "100%"
    }
};
exports.default = ZoomProjectorThumbnail;
//# sourceMappingURL=react-zoom-projector.js.map