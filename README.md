# Home Row Magnet
helps you keep your hands on the keyboard and not the mouse, draws a grid of
small rectangles on the screen with a permutation inside each one, you enter the characters
of the permutation in the rectangle you're targeting.

## Supported mouse operations:
  - (left) click: enter the permutation, normally.
  - right click: hold `shift` while entering the last character of the permutation
  - double (left) click: ^... `alt` ...
  - middle click: ^^... `ctrl` / `control` ...
  - move cursor: press (by default) `m` before entering the permutation
    - this is configurable in the [options.toml](./options.toml) file under
      the `key_bindings` section

## Development
- git clone git@github.com:wis/home-row-magnet.git
- cd home-row-magnet
- qpm install
- open in qtcreator
-  run for the first time to create the debug/release binary/build directory
- move options.toml.example to options.toml in the build directory

## License
MIT
