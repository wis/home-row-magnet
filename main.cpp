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
//    qDebug() << "input " << QString::fromStdString(input) << " input.length " << input.length();
    if (input.length() == 0) return std::make_tuple(x, y);
    std::size_t cidx = keys.find(input[0]);
    auto cols = cidx % length;
    auto rows = std::floor(cidx / length);
    x = cols * (width / length);
    y = rows * (height / length);
//    qDebug() << "rows " << rows << " cols " << cols;
    auto subx = 0,
      suby = 0;
    std::tie(subx, suby) = getCoords(
      width / length,
      height / length,
      input.length() > 0 ? input.substr(1) : "",
      keys,
      length);
//    qDebug() << "subx " << subx << " suby " << suby;
    x += subx;
    y += suby;
//    qDebug() << "x " << x << " y " << y;
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

    QScreen *screen = QGuiApplication::primaryScreen();
    QRect  screenGeometry = screen->geometry();
    int height = screenGeometry.height();
    int width = screenGeometry.width();

    const auto data      = toml::parse("options.toml");
    const auto permutation = toml::find(data, "permutation");
    const auto keys    = toml::find<std::string>(permutation, "keys");
    const auto length    = toml::find<std::int8_t>(permutation, "length");
    const auto shortcuts_data = toml::find(data, "shortcuts");
    const auto font_family_setting = toml::find<std::string>(data, "font_family");
    const auto cancel_shortcut = toml::find<std::string>(shortcuts_data, "cancel");
    std::vector<std::string> operations = {
        "move", "left_click", "middle_click", "right_click", "drag_left", "drag_right"
    };
    std::map<std::string, std::string> shortcuts;
    for(auto& operation : operations)
    {
        shortcuts[operation] = toml::find<std::string>(shortcuts_data, operation);
    }

    std::vector<QHotkey *> hotkeys;

    auto canvas = object->findChild<QObject*>("glass_canvas");

    canvas->setProperty("keys", QString::fromStdString(keys));
    qDebug() << "font family: " << QString::fromStdString(font_family_setting);
    canvas->setProperty("fontFamily", QString::fromStdString(font_family_setting));
    canvas->setProperty("length", length);

    auto calc_new_size = [length](int width, int height, int n) {
        auto newWidth = width / pow(length, n);
        auto newHeight = height / pow(length, n);
        return std::make_tuple(newWidth, newHeight);
    };

    auto draw = [canvas](int x, int y, int width, int height)
    {
        canvas->setProperty("xOffset", x);
        canvas->setProperty("yOffset", y);
        canvas->setProperty("_width", QVariant::fromValue(width));
        canvas->setProperty("_height", QVariant::fromValue(height));
        QMetaObject::invokeMethod(canvas, "requestDraw");
    };

    std::string operation = "";
    std::string input = "";

    qDebug() << "creating cancel QHotkey";
    auto cancel_hotkey = new QHotkey(QKeySequence(QString::fromStdString(cancel_shortcut)), false, &app);

    auto enableKeys = [&](bool enable) {
        for (ulong i = 0; i < hotkeys.size(); ++i) {
            qDebug() << "hotkeys.at(i): " <<  hotkeys.at(i) << "enabled: " << enable;
            hotkeys.at(i)->setRegistered(enable);
        }
    };

    auto reset = [&]() {
        input = "";
        operation = "";
        canvas->setProperty("visible", false);
        enableKeys(false);
        cancel_hotkey->setRegistered(false);
    };

    auto render = [&]()
    {
        auto x = 0, y = 0; std::tie(x, y) = getCoords(width , height, input, keys, length);
        auto newWidth = 0, newHeight = 0; std::tie(newWidth, newHeight) = calc_new_size(width, height, input.length());
        qDebug() << "newWidth " <<  newWidth << " newHeight " << newHeight;
        draw(x, y, newWidth, newHeight);
    };

    QObject::connect(cancel_hotkey, &QHotkey::activated, qApp, [&]() {
        if (input.length() == 0) {
            reset();
            return;
        }
        input = input.substr(0, input.length() - 1);
        qDebug() << "new input " <<  QString::fromStdString(input);
        render();
    });

    auto click = [](_MMMouseButton button)
    {
        toggleMouse(true, button);
        toggleMouse(false, button);
    };


    for (ulong i = 0; i < keys.length(); ++i) {
        std::string keyChar = keys.substr(i, 1);
        QHotkey *ahotkey = new QHotkey(QKeySequence(QString::fromStdString(keyChar)), false, &app);
        qDebug() << "ahotkey: " << QString::fromStdString(keyChar) << " " << ahotkey << (ahotkey == NULL);
        hotkeys.push_back(ahotkey);
        qDebug() << "hotkeys[i]: " <<  hotkeys.at(i);
        QObject::connect(hotkeys.at(i), &QHotkey::activated, qApp, [&, keyChar](){
            qDebug() << "input Hotkey Activated." <<  QString::fromStdString(keyChar) << " " << QString::fromStdString(keyChar);
            input += keyChar;
            auto x = 0, y = 0;
            std::tie(x, y) =  getCoords(width , height, input, keys, length);
            auto newWidth = 0, newHeight = 0;
            std::tie(newWidth, newHeight) =  calc_new_size(width, height, input.length());
            qDebug() << "newWidth " <<  newWidth << " newHeight " << newHeight;
            if (input.length() == length) {
                auto point = MMSignedPointMake(x + newWidth / 2, y + newHeight / 2);
                moveMouse(point);
                if (operation == "left_click")
                    click(LEFT_BUTTON);
                else if (operation == "right_click")
                    click(RIGHT_BUTTON);
                else if (operation == "middle_click")
                    click(CENTER_BUTTON);
                reset();
                x = 0, y = 0;
                newWidth = width, newHeight = height;
            }
            draw(x, y, newWidth, newHeight);
        });
    }


    for(auto& shortcut : shortcuts)
    {
        qDebug() << "regestering trigger Hotkey" << QString::fromStdString(shortcut.second);
        auto shortcut_hotkey = new QHotkey(QKeySequence(QString::fromStdString(shortcut.second)), true, &app);
        QObject::connect(shortcut_hotkey, &QHotkey::activated, qApp, [&, shortcut]() {
            operation = shortcut.first;
            qDebug() << "trigger Hotkey Activated." << QString::fromStdString(shortcut.second);
            moveMouse(MMSignedPointMake(width, height));
            canvas->setProperty("visible", true);
            QMetaObject::invokeMethod(object, "raiseWindow");
            enableKeys(true);
            qDebug() << "enabling canecl QHotkey";
            cancel_hotkey->setRegistered(true);
        });
    }

    return app.exec();
}
