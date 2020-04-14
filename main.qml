import QtQuick 2.2
import QtQuick.Window 2.2

Window {
    id: window
    visible: true
    visibility: "FullScreen"
    width: Screen.width
    height: Screen.height
    color: "#00000000"
    flags: Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint
           | Qt.WindowTransparentForInput | Qt.Popup

    function raiseWindow() { raise() }

    Canvas {
        property var ctx
        id: glass_canvas
        objectName: "glass_canvas"
        visible: false
        width: Screen.width
        height: Screen.height
        onAvailableChanged: if (available)
                                ctx = getContext('2d')
        property variant _width: Screen.width
        property variant _height: Screen.height
        property variant xOffset: 0
        property variant yOffset: 0
        property variant input_sequence: ""
        property variant length
        property variant keys
        property variant fontFamily
        onPaint: {
            ctx.textAlign = "center"
            ctx.lineWidth = 1
            requestAnimationFrame(draw)
            console.log("pixeldensity:", Screen.pixelDensity);
        }

        function requestDraw() { requestAnimationFrame(draw) }

        function draw(timestamp) {
            ctx.clearRect(0, 0, width, height)
            console.log("drawing?")
            let cellWidth = _width / length, cellHeight = _height / length, cell = 0
            console.log("cellwidth", cellWidth, "cellheight", cellHeight)
            ctx.font = (Number(cellWidth * 0.9) + 2) + "px " + fontFamily;
            for (var lx = xOffset; lx < xOffset + _width + 1; lx+=cellWidth) {
                ctx.beginPath();
                ctx.strokeStyle = "black"
                ctx.moveTo(lx - 1, yOffset);
                ctx.lineTo(lx - 1, yOffset + _height);
                ctx.moveTo(lx + 1, yOffset);
                ctx.lineTo(lx + 1, yOffset + _height);
                ctx.stroke();
                ctx.strokeStyle = "white"
                ctx.moveTo(lx, yOffset);
                ctx.lineTo(lx, yOffset + _height);
                ctx.stroke();
            }
            if (input_sequence.length < length - 1) {
                for (var ly = yOffset; ly < yOffset + _height + 1; ly+=cellHeight) {
                    ctx.beginPath();
                    ctx.strokeStyle = "black"
                    ctx.moveTo(xOffset, ly - 1);
                    ctx.lineTo(xOffset + _width, ly - 1);
                    ctx.moveTo(xOffset, ly + 1);
                    ctx.lineTo(xOffset + _width, ly + 1);
                    ctx.stroke();
                    ctx.strokeStyle = "white"
                    ctx.moveTo(xOffset, ly);
                    ctx.lineTo(xOffset + _width, ly);
                    ctx.stroke();
                }
            }
            for (var _y = 0; _y < length; _y++) {
                for (var _x = 0; _x < length; _x++) {
                    if ((cell + _y) % 2 == 0) {
                        ctx.strokeStyle = "white"
                        ctx.fillStyle = "black"
                    } else {
                        ctx.strokeStyle = "black"
                        ctx.fillStyle = "white"
                    }
                    ctx.fillText(
                                keys[cell],
                                xOffset + _x * cellWidth + cellWidth / 2, yOffset + _y * cellHeight + cellHeight,
                                cellWidth)
                    if (cellHeight > Screen.pixelDensity * 2) {
                        ctx.strokeText(
                                    keys[cell],
                                    xOffset + _x * cellWidth + cellWidth / 2, yOffset + _y * cellHeight + cellHeight,
                                    cellWidth)
                    }
                    cell++
                }
            }
        }
    }
}
