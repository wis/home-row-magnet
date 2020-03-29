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
        onPaint: {
            ctx.textAlign = "center"
            requestAnimationFrame(draw)
        }

        function requestDraw() { requestAnimationFrame(draw) }

        function draw(timestamp) {
            ctx.clearRect(0, 0, width, height)
            console.log("drawing?")
            let cell = 0
            let cellWidth = _width / length, cellHeight = _height / length
            console.log("cellwidth", cellWidth, "cellheight", cellHeight)
            console.log("fond", ctx.font)
            ctx.strokeStyle = "#FFFFFF"
            ctx.strokeStyle = "white" //set the color of the stroke line
            ctx.lineWidth = cellHeight < 10 ? 0 : 1
            ctx.fillStyle = "black"
            ctx.font = (Number(cellWidth * 0.9) + 2) + "px FreeMono"
            for (var _y = 0; _y < length; _y++) {
                for (var _x = 0; _x < length; _x++) {
                    ctx.fillText(
                                keys[cell].toUpperCase(),
                                xOffset + _x * cellWidth + cellWidth / 2, yOffset
                                + (_y % 2 === 0 ? 0 : 1 + Math.floor(
                                                      _y / 2) * 2) + _y * cellHeight + cellHeight,
                                cellWidth)
                    ctx.strokeText(
                                keys[cell].toUpperCase(),
                                xOffset + _x * cellWidth + cellWidth / 2, yOffset
                                + (_y % 2 === 0 ? 0 : 1 + Math.floor(
                                                      _y / 2) * 2) + _y * cellHeight + cellHeight,
                                cellWidth)

                    cell++
                }
            }
        }
    }
}
