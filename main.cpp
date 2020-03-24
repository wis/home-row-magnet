#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlEngine>
#include <QQmlContext>
#include <QQmlComponent>
#include <QRandomGenerator>
#include <QScreen>
#include <QHotkey>
#include <X11/Xlib.h>
#include "3rdparty/toml11/toml.hpp"
#include <iostream>
#include "robot.h"
#include <vector>
#include <tuple>

std::tuple<float, float> getCoords(int width, int height, std::string input, std::string keys, int8_t length) {
    auto x = 0,
      y = 0;
    qDebug() << "input " << QString::fromStdString(input) << " input.length " << input.length();
    if (input.length() == 0) return std::make_tuple(x, y);
    std::size_t cidx = keys.find(input[0]);
    auto cols = cidx % length;
    auto rows = std::floor(cidx / length);
    x = cols * (width / length);
    y = rows * (height / length);
    qDebug() << "rows " << rows << " cols " << cols;
    auto subx = 0,
      suby = 0;
    std::tie(subx, suby) = getCoords(
      width / length,
      height / length,
      input.length() > 0 ? input.substr(1) : "",
      keys,
      length);
    qDebug() << "subx " << subx << " suby " << suby;
    x += subx;
    y += suby;
    qDebug() << "x " << x << " y " << y;
    return std::make_tuple(x, y);
}

int main(int argc, char *argv[])
{
    QCoreApplication::setAttribute(Qt::AA_DisableHighDpiScaling);

    QGuiApplication app(argc, argv);

    QQmlEngine qengine;
    QQmlContext *objectContext = new QQmlContext(qengine.rootContext());

    QQmlComponent component(&qengine, "qrc:/main.qml");
    QObject *object = component.create(objectContext);

    const auto data      = toml::parse("options.toml");
    const auto permutation = toml::find(data, "permutation");
    const auto keys    = toml::find<std::string>(permutation, "keys");
    const auto length    = toml::find<std::int8_t>(permutation, "length");
    const auto key_bindings = toml::find(data, "key_bindings");
    const auto hotkey_setting    = toml::find<std::string>(key_bindings, "hotkey");

    std::vector<QHotkey *> hotkeys;

    auto canvas = object->findChild<QObject*>("glass_canvas");

    canvas->setProperty("keys", QString::fromStdString(keys));
    canvas->setProperty("length", length);

    QScreen *screen = QGuiApplication::primaryScreen();
    QRect  screenGeometry = screen->geometry();
    int height = screenGeometry.height();
    int width = screenGeometry.width();
    std::string input = "";
    std::vector<std::string> prefixes = {
// :/      "",
        "shift+",
        "ctrl+",
        "ctrl+shift+",
        "alt+"};
    for (std::size_t p = 0; p < prefixes.size(); ++p) {
        auto prefix = prefixes[p];
        for (ulong i = 0; i < keys.length(); ++i) {
            std::string keyChar = keys.substr(i, 1);
            QHotkey *ahotkey = new QHotkey(QKeySequence(QString::fromStdString(prefix + keyChar)), false, &app);
            qDebug() << "ahotkey: " << QString::fromStdString(prefix + keyChar) << " " << ahotkey << (ahotkey == NULL);
            hotkeys.push_back(ahotkey);
            qDebug() << "hotkeys[i]: " <<  hotkeys[i];
            QObject::connect(hotkeys[i], &QHotkey::activated, qApp, [&, keyChar, prefix](){
                qDebug() << "input Hotkey Activated." <<  QString::fromStdString(prefix + keyChar) << " " << QString::fromStdString(keyChar);
                input += keyChar;
                auto x = 0, y = 0;
                std::tie(x, y) =  getCoords(width , height, input, keys, length);
                canvas->setProperty("xOffset", x);
                canvas->setProperty("yOffset", y);
                auto newWidth = width / (length ^ input.length());
                auto newHeight = height / (length ^ input.length());
                qDebug() << "newWidth " <<  newWidth << " newHeight " << newHeight;
                canvas->setProperty("_width", QVariant::fromValue(newWidth));
                canvas->setProperty("_height", QVariant::fromValue(newHeight));
                QMetaObject::invokeMethod(canvas, "requestDraw");
                auto point = MMSignedPointMake(x, y);
                moveMouse(point);
//                toggleKey(0, false, MOD_SHIFT);
//                toggleMouse(true, LEFT_BUTTON);
//                toggleMouse(false, LEFT_BUTTON);
            });
        }
    }

    auto hotkey = new QHotkey(QKeySequence(QString::fromStdString((hotkey_setting))), true, &app);

    QObject::connect(hotkey, &QHotkey::activated, qApp, [&]() {
        qDebug() << "trigger Hotkey Activated." << hotkey->keyCode();
        canvas->setProperty("visible", true);
        qDebug() << "keys.length() * prefixes.size()" << keys.length() * prefixes.size();
        for (ulong i = 0; i < hotkeys.size(); ++i) {
            qDebug() << "2 hotkeys[i]: " <<  hotkeys[i];
            hotkeys[i]->setRegistered(true);
        }
    });

    return app.exec();
}
