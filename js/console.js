// const MEMOMAX = 5;
class Console {
  constructor() {
    this.layer = null;
    this.memo = [];
  }

  init() {
    this.layer = document.getElementById("layer");

    // this.ctx.fillRect(160-50,20,160+50,60);
    // this.ctx.strokeRect(160-50,20,160+50,60);
    this.text("こんにちは。私と勝負しましょう。<br>枝を切れなくなったほうが負けです。<br><br>(クリックで枝を切る)");
  }
  text(txt) {
    this.layer.innerHTML = txt;
  }
};
