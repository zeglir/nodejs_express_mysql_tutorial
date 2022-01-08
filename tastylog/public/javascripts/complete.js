// ChromeやEdgeではこれらの制御が効かない

// 戻るボタン押下をトリガーに履歴をカラにする
const window_onPopState = function(event) {
  history.pushState(null, null, null);  
};

// 読み込み直後に履歴をカラにする
const document_onready = function(event) {
  history.pushState(null, null, null);
  $(window).on("popstate", window_onPopState);
};

// ドキュメントの読み込みが完了したときに実行する
// 実は、script src= が読み込み要素より下に配置されているならば、この指定自体が不要
// $(document).ready(document_onready);
$(document_onready);