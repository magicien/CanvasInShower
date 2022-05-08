# CanvasInShower
May showers bring playful hours

![Canvas in a shower](https://raw.githubusercontent.com/magicien/CanvasInShower/main/public/img/card.png)

[実際のページはこちら](https://magicien.github.io/CanvasInShower/)

---

これは、[しぐれうい](https://twitter.com/ui_shig)さんの誕生日、ソロアルバム発売、リアルイベント開催を記念した非公式ファンアートです。

しぐれういさんの特設サイトはこちら↓

[まだ雨はやまない＆うい・おん・すてーじ-雨上がりの文化祭-特設サイト](https://madaame-shigureui.com)

## ビルド方法

### 必要なもの

- npm (Node.js)
- yarn

### ビルド、サーバ起動

```bash
$ git clone https://github.com/magicien/CanvasInShower.git
$ cd CanvasInShower
$ yarn install
$ yarn build
$ yarn start
```

### 実行

- ブラウザで http://localhost:8080 を開く

## 使用しているもの

- 雨粒の描画に関する画像、アルゴリズムはLucas Bebber氏によるものを元に改変して使用しています
    - https://tympanus.net/codrops/2015/11/04/rain-water-effect-experiments/
    - ソースコード、画像はCoderopsよりMITライセンスの下で配布されています
        - https://tympanus.net/codrops/licensing/
    - 使用しているファイル
        - public/img/drop-color-alpha.png
        - src/shaders/OuterWindowShader.js
        - src/shaders/RainShader.js
        - src/Canvas.js
        - src/Raindrop.js
        - src/utils.js
- ボタンの描画に関する画像、アルゴリズムはLucas Bebber氏によるものを元に改変して使用しています
    - https://tympanus.net/codrops/2015/03/10/creative-gooey-effects/
    - ソースコードはCoderopsよりMITライセンスの下で配布されています
        - https://tympanus.net/codrops/licensing/
    - 使用しているファイル
        - public/index.html
        - public/style.css
        - src/Button.js
        - src/Menu.js
- ボタンのアイコンにはFont Awesomeを使用しています
    - https://fontawesome.com
    - フォントファイルはSIL OFL 1.1ライセンス、ソースコードはMITライセンスの下で配布されています
        - https://fontawesome.com/license/free
    - 使用しているファイル
        - public/fontawesome以下のファイル全て
- 上記以外のファイルについては、MITライセンスの下で配布します
