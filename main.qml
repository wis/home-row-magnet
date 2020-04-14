import QtQuick 2.2
import QtQuick.Window 2.2

Window {
    visible: true
    visibility: "FullScreen"
    width: Screen.width
    height: Screen.height
    color: "#00000000"
    flags: Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint
           | Qt.WindowTransparentForInput | Qt.Popup
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
        property variant length
        property variant keys
        property variant fontFamily
        onPaint: {
            ctx.textAlign = "center"
            ctx.lineWidth = 1
            requestAnimationFrame(draw)
        }

        function requestDraw() { requestAnimationFrame(draw) }

        function draw(timestamp) {
            ctx.clearRect(0, 0, width, height)
            console.log("drawing?")
            let cellWidth = _width / length, cellHeight = _height / length, cell = 0
            console.log("cellwidth", cellWidth, "cellheight", cellHeight)
            ctx.font = (Number(cellWidth * 0.9) + 2) + "px " + fontFamily;
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
