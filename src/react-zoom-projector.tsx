import React, {
    forwardRef,
    MutableRefObject,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import {css, CSSObject, SerializedStyles} from '@emotion/react'
import _ from "lodash";

interface ZoomProjectorThumbnailPropsType {
    thumbImgSrc: string;
    fullImgSrc?: string;
    zoomLevel?: {
        initial?: number;
        min?: number;
        max?: number;
        load?: number;
    },
    wheelSensitivity?: number;
    alt?: string;
    zoomInside: boolean;
    rewriteInterval?: number;
    projectorRef: MutableRefObject<any>;
    debugState?: {
        state?: object,
        //     {
        //     mouseState: boolean,
        //     mousePosition: posType,
        //     zoomLevel: number,
        //     imageSize: sizeType
        // },
        //
        setState?: any
    }
}

const thumbnailImgCSS = css({
    objectFit: "contain",
    width: "100%",
    height: "100%",
});

const defaultMaskCSS = css({
    opacity: 0.5,
    position: "absolute",
    backgroundColor: "white",
    left: 0,
    top: 0,
    width: "0px",
    height: "0px"

});

const projectionElementHidden = css({
    position: "absolute",
    overflow: "hidden",
    contentVisibility: "hidden"
});

const projectionElementVisible = css({
    position: "absolute",
    overflow: "hidden",
    contentVisibility: "auto"
})

type styleType = {
    [key: string]: string | number | null
};

type maskCSSType = {
    top: styleType,
    bottom: styleType,
    left: styleType,
    right: styleType
};

type posType = {
    x: number,
    y: number
}

type sizeType = {
    w: number,
    h: number
}
type rectType = sizeType & posType;

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

const ZoomProjectorThumbnail = (props: ZoomProjectorThumbnailPropsType ) => {
    const [mouseState, setMouseState] = useState<boolean>(false);
    const [mousePosition, setMousePosition] = useState<posType>({x: 0,y: 0});
    const [thumbElementRect, setThumbElementRect] = useState<rectType>({w: 0, h: 0, x: 0, y: 0});
    const [imageSize, setImageSize] = useState<sizeType>({w: 0, h: 0});
    const [thumbImgPadding, setThumbImgPadding] = useState<sizeType>({w:0, h:0});
    const [projectionElementRect, setProjectionElementRect] = useState<rectType>({w: 0, h: 0, x: 0, y: 0});
    const [currentZoomLevel, setCurrentZoomLevel] = useState<number>(props.zoomLevel?.initial ?? defaultZoomProjectorThumbnailProps.zoomLevel.initial);
    const [maskCSS, setMaskCSS] = useState<maskCSSType>({top:{}, bottom:{}, left:{}, right:{}});
    const [projectionElementStyle, setProjectionElementStyle] = useState<styleType>({});
    const [projectionElementCSS, setProjectionElementCSS] = useState<SerializedStyles>(projectionElementHidden);
    const [projectionImgStyle, setProjectionImgStyle] = useState<styleType>({});
    const [projectionImgSrc, setProjectionImgSrc] = useState<string | undefined>(undefined);
    const [isFullImgLoaded, setIsFullImgLoaded] = useState<boolean>(false);
    const thumbElementRef = useRef<HTMLDivElement | null>(null);
    const thumbImgRef = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
        const thumbImg = new Image();
        thumbImg.src = props.thumbImgSrc;
        thumbImg.onload = () => {
            setProjectionImgSrc(props.thumbImgSrc);
            setImageSize({w: thumbImg.naturalWidth, h: thumbImg.naturalHeight});
        }
    }, [props.thumbImgSrc]);

    useEffect(() => {
        const thumbElementObserver = new ResizeObserver((entries) => {
            if(thumbElementRef.current){
                setThumbElementRect({
                    w: entries[0].contentRect.width,
                    h: entries[0].contentRect.height,
                    x: thumbElementRef.current.getBoundingClientRect()?.left,
                    y: thumbElementRef.current.getBoundingClientRect()?.top
                });
            }
        });
        if(thumbElementRef.current != null){
            thumbElementObserver.observe(thumbElementRef.current as Element);
        }
        const projectorObserver =  new ResizeObserver((entries) => {
            if(props.projectorRef.current){
                setProjectionElementRect({
                    w: entries[0].contentRect.width,
                    h: entries[0].contentRect.height,
                    x: props.projectorRef.current.getBoundingClientRect()?.left,
                    y: props.projectorRef.current.getBoundingClientRect()?.top
                });
            }
        });
        if(props.projectorRef.current != null){
            projectorObserver.observe(props.projectorRef.current as Element);
        }


        return (): void => {
            thumbElementObserver.disconnect();
            projectorObserver.disconnect();
        };
    }, []);

    useEffect( () => {
        const aspectRatio = (imageSize.w ?? 1) / (imageSize.h ?? 1);
        const currentAspectRatio = (thumbElementRect.w ?? 1) / (thumbElementRect.h ?? 1);
        let paddingW = 0;
        let paddingH = 0;
        if(currentAspectRatio > aspectRatio){
            paddingH = 0;
            paddingW = (thumbElementRect.w - thumbElementRect.h * aspectRatio) / 2;
        }else if (currentAspectRatio < aspectRatio){
            paddingH = (thumbElementRect.h - thumbElementRect.w / aspectRatio) / 2;
            paddingW = 0;
        }
        setThumbImgPadding({w: paddingW, h:paddingH});
    }, [thumbElementRect, imageSize]);

    useEffect( () => {
        setProjectionElementStyle({...projectionElementStyle, ...{
                height: projectionElementRect.h,
                width: projectionElementRect.w,
                left: projectionElementRect.x,
                top: projectionElementRect.y,}}
        );
    }, [projectionElementRect]);

    useEffect(() => {
        if(!mouseState){
            return;
        }
        if(projectionElementRect.w === 0){
            return;
        }
        const aspect = thumbElementRect.w / thumbElementRect.h;
        const lensAspect = projectionElementRect.w / projectionElementRect.h;
        let areaW: number;
        let areaH: number;
        if(aspect > lensAspect){
            areaH = thumbElementRect.h / currentZoomLevel;
            areaW = areaH * lensAspect;
        }else{
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
        }
        if(lensW < projectionElementRect.w){
            if(lensH < projectionElementRect.h){
                newProjectImgCSS.marginTop = lensY.toString() + "px";
                newProjectImgCSS.marginLeft = lensX.toString() + "px";
            }else{
                newProjectImgCSS.marginLeft = lensX.toString() + "px";
                newProjectImgCSS.objectPosition = "0px " + lensY.toString() + "px";
            }
        }else{
            if(lensH < projectionElementRect.h){
                newProjectImgCSS.marginTop = lensY.toString() + "px";
                newProjectImgCSS.objectPosition = lensX.toString() + "px 0px";
            }else{
                newProjectImgCSS.objectPosition = lensX.toString()+"px " + lensY.toString() + "px";
            }

        }
        setProjectionImgStyle(newProjectImgCSS);
    }, [mousePosition, currentZoomLevel]);

    const mouseOverEvent = () => {
        setMouseState(true);
        setProjectionElementCSS(projectionElementVisible);
        // checkElementSize();
    }

    const mouseLeaveEvent = () => {
        setMouseState(false)
        setProjectionElementCSS(projectionElementHidden);
        setMaskCSS({top: {}, bottom: {}, left: {}, right: {}});
    }

    const wheelEvent = (event: React.WheelEvent):void => {
        if(event.deltaY > 0){
            let next = currentZoomLevel - Math.max(1, Math.floor(currentZoomLevel)) *
                (props.wheelSensitivity ?? defaultZoomProjectorThumbnailProps.wheelSensitivity);
            let next_next = currentZoomLevel - Math.max(1, Math.floor(next)) *
                (props.wheelSensitivity ?? defaultZoomProjectorThumbnailProps.wheelSensitivity);
            setCurrentZoomLevel(Math.round(100 * Math.max(
                props.zoomLevel?.min ?? defaultZoomProjectorThumbnailProps.zoomLevel.min ,
                next, next_next
                )) / 100
            );
        }else if(event.deltaY < 0){
            setCurrentZoomLevel(Math.round(100 * Math.min(
                props.zoomLevel?.max ?? defaultZoomProjectorThumbnailProps.zoomLevel.max,
                currentZoomLevel + Math.max(1, Math.floor(currentZoomLevel)) *
                    (props.wheelSensitivity ?? defaultZoomProjectorThumbnailProps.wheelSensitivity)
                )) / 100
            );
            if(props.fullImgSrc && !isFullImgLoaded && currentZoomLevel > (props.zoomLevel?.load ?? defaultZoomProjectorThumbnailProps.zoomLevel.load )){
                loadZoomImg(props.fullImgSrc);
            }else{
                console.log(props.fullImgSrc , isFullImgLoaded, currentZoomLevel,  (props.zoomLevel?.load ?? defaultZoomProjectorThumbnailProps.zoomLevel.load ));
            }

        }
    }


    useEffect(() => {
        setIsFullImgLoaded(false);
        setCurrentZoomLevel(props.zoomLevel?.initial ?? defaultZoomProjectorThumbnailProps.zoomLevel.initial);
        setProjectionImgSrc(props.thumbImgSrc);
    }, [props.thumbImgSrc, props.fullImgSrc]);


    const loadZoomImg = (loadImgSrc:string) => {
        setIsFullImgLoaded(true);
        const fullImg = new Image();
        fullImg.src = loadImgSrc;
        fullImg.onload = () => {
            setProjectionImgSrc(props.fullImgSrc);
            setImageSize({w: fullImg.naturalWidth, h: fullImg.naturalHeight});
        }
    }

    const mouseMoveEvent= _.throttle((event: React.MouseEvent):void => {
        if(thumbElementRef.current == null){
            return;
        }
        setMousePosition({
            x: event.clientX - thumbElementRect.x,
            y: event.clientY - thumbElementRect.y,
        });
    }, props.rewriteInterval);

    useEffect(() => {
        if(props.debugState && props.debugState.setState){
            props.debugState.setState({
                mouseState: mouseState,
                mousePosition: mousePosition,
                zoomLevel: currentZoomLevel,
                imageSize: imageSize
            })
        }
    },  [mouseState, mousePosition, currentZoomLevel, imageSize]);

    return (
        <div css={css({height:"100%"})}>
            <div css={css({position:"relative", overflow:"hidden", height:"100%", width: "100%"})}
                 onMouseOver={mouseOverEvent}
                 onMouseLeave={mouseLeaveEvent}
                 onMouseMove={mouseMoveEvent}
                 onWheel={wheelEvent}
                 ref={thumbElementRef}
            >
                <img src={props.thumbImgSrc} alt={props.alt} css={thumbnailImgCSS} ref={thumbImgRef} />
                <div css={defaultMaskCSS} style={maskCSS.top} />
                <div css={defaultMaskCSS} style={maskCSS.left} />
                <div css={defaultMaskCSS} style={maskCSS.right} />
                <div css={defaultMaskCSS} style={maskCSS.bottom} />
            </div>
            <div css={projectionElementCSS} style={projectionElementStyle}>
                <img src={projectionImgSrc} style={projectionImgStyle} alt={props.alt} />
            </div>

        </div>
    );
};

ZoomProjectorThumbnail.defaultProps = defaultZoomProjectorThumbnailProps;

interface ZoomProjectorPropsType {
    projectorCSS?: CSSObject
}
const ZoomProjector = forwardRef(({projectorCSS}:ZoomProjectorPropsType, ref:any) => {
    return useMemo(() => ((
        <div css={css(projectorCSS)} ref={ref}/>
    )), [projectorCSS]);
});

ZoomProjector.defaultProps = {
    projectorCSS: {
        height: "100%",
        width: "100%"
    }
}

export {ZoomProjector};
export default ZoomProjectorThumbnail;
