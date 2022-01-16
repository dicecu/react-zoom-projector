import React, {useRef, useState} from 'react';
import ZoomProjectorThumbnail, {ZoomProjector} from "react-zoom-projector";

const App = () => {
    const images = [
        {t: "./img/t1.jpg",
            f: "./img/f1.jpg"},
        {t: "./img/t2.jpg",
            f: "./img/f2.jpg"},
        {t: "./img/t3.jpg",
            f: "./img/f3.jpg"},
    ]
    const projectorRef = useRef(null);
    const [thumbImgSrc, setThumbImgSrc] = useState(images[0]);
    const [debugState, setDebugState] = useState({
        mouseState: false,
        mousePosition: {x: 0, y: 0},
        zoomLevel: 1,
        imageSize: {w: 0, h: 0}
    });

    const changeImg = (t:number) => {
        setThumbImgSrc(images[t]);
    };
    const States = () => {
        return (
            <p>onMouse: {debugState.mouseState ? "ON" : "OFF"}<br />
                mousePosition: x {debugState.mousePosition.x}, y {debugState.mousePosition.y}<br />
                zoomLevel: {debugState.zoomLevel}<br />
                imageSize: {debugState.imageSize.w} x {debugState.imageSize.h}
        </p>);
    };
    return (
        <div>
            <div>
                <h3><a href="https://github.com/dicecu/react-zoom-projector">react-zoom-projector</a></h3>
            </div>
            <div style={{display: "flex"}}>
                <div style={{height:"400px", width:"400px", border:"1px solid"}}>
                    <ZoomProjectorThumbnail
                        thumbImgSrc={thumbImgSrc.t}
                        fullImgSrc={thumbImgSrc.f}
                        zoomLevel={{
                            initial: 1.5,
                            min: 0.8,
                            max: 20.0,
                            load: 4.0
                        }}
                        rewriteInterval={50}
                        projectorRef={projectorRef}
                        debugState={{
                            state: debugState,
                            setState: setDebugState
                        }}
                    />
                </div>
                <div style={{height:"400px", width:"500px", border:"1px solid", marginLeft:"10px"}}>
                    <ZoomProjector ref={projectorRef} />
                </div>
            </div>
            <div style={{marginTop: "10px"}}>
                <button onClick={() => changeImg(0)}>photo 1</button>
                <button onClick={() => changeImg(1)}>photo 2</button>
                <button onClick={() => changeImg(2)}>photo 3</button>
            </div>
            <div>
                <States />
            </div>
        </div>
    );
}

export default App;