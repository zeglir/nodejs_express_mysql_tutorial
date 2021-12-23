// イベントハンドラ
const btnsubmit_onclick = function(event) {
  const $submit = $(this);
  const $form = $submit.parents("form");
  // HTML dataset API: submit要素から data-* 属性を取得して form の属性に設定する
  $form.attr("method", $submit.data("method"));
  $form.attr("action", $submit.data("action"));
  $form.submit();
};

// すべての submitボタンに対して、click時イベントハンドラを登録する
const document_onready = function() {
  $("input[type='submit']").on("click", btnsubmit_onclick);
};

// ドキュメントの読み込みが完了したときに実行する
// 実は、script src= が読み込み要素より下に配置されているならば、この指定自体が不要
// $(document).ready(document_onready);
$(document_onready);