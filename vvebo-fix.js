// VVebo 用户主页 / 时间线修复 —— 小火箭（Shadowrocket）专用单脚本版
// 原理：把 statuses/user_timeline 改写成 profile/statuses/tab，
//       由脚本自己去请求新接口，再把结果整理成 VVebo 能识别的格式返回。
//       （绕开小火箭不支持“改写网址后再匹配响应脚本”的两段式写法）
var uidKey = "vvebo_uid";

(function () {
  var url = ($request && $request.url) ? $request.url : "";
  if (url.indexOf("statuses/user_timeline") < 0) { $done({}); return; }

  var m = url.match(/uid=(\d+)/);
  var uid = (m ? m[1] : "") || $persistentStore.read(uidKey) || "";

  var tabUrl = url
    .replace("statuses/user_timeline", "profile/statuses/tab")
    .replace("max_id", "since_id")
    + "&containerid=230413" + uid + "_-_WEIBO_SECOND_PROFILE_WEIBO";

  $httpClient.get({ url: tabUrl, headers: $request.headers }, function (err, resp, data) {
    if (err || !data) { $done({}); return; }
    try {
      var d = JSON.parse(data);
      var cards = d.cards || [];
      var out = [];
      for (var i = 0; i < cards.length; i++) {
        var g = cards[i].card_group ? cards[i].card_group : [cards[i]];
        for (var j = 0; j < g.length; j++) {
          if (g[j] && g[j].card_type === 9 && g[j].mblog) {
            var s = g[j].mblog;
            if (s.isTop) { s.label = "置顶"; }
            out.push(s);
          }
        }
      }
      var since = (d.cardlistInfo || {}).since_id;
      $done({ body: JSON.stringify({ statuses: out, since_id: since, total_number: 100 }) });
    } catch (e) { $done({}); }
  });
})();
