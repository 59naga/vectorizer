# Return to edge-world.

![こんなんいいよね](example.html.png)

[動いてるのが見たい](http://jsdo.it/59naga/vectorizer)
```bash
$ git clone https://github.com/59naga/vectorizer.git
$ cd vectoriser/
$ python -m SimpleHTTPServer | open "http:localhost:8000/example.html"
```

## や<del>ら</del>さしい使い方

### 1. < img>を置きます

```html
<img src="images/card.png">
```

### 2. < script>を置きます

```html
<script src="vectorizer.js"></script>
<img src="images/card.png">
```

### 3. svgにしたい< img>に class="vectorize" を付けます

```html
<script src="vectorizer.js"></script>
<img class="vectorise" src="images/card.png">
```

### 4. できた

<img title="画像はイメージですって日本語おかしくね？" src="https://raw.githubusercontent.com/59naga/vectorizer/master/images/card.png">

## 動かない時

* http://で始まる他所のファイルをsrcに書いた時、vectorizeできへん。
* だいたいの画像は変換できますが、変換にCanvasを使用しているので、ブラウザによってサポートはマチマチ、筋肉モリモリ、マッチョマンの変態だ。

![コマンドー](https://pbs.twimg.com/media/Bs2VhUACEAAwetH.png "わけがわからないよ")
