/**
 * 月音香 LINE秘書 — Code.gs (Google Apps Script)
 *
 * 主な機能:
 *  - LINE Messaging API Webhook 受信
 *  - Googleカレンダー予定の取得・返信
 *  - 天気情報取得 (OpenWeatherMap)
 *  - ChatGPT (OpenAI) による自然言語応答
 *
 * Script Properties (必須):
 *  LINE_ACCESS_TOKEN  : LINE チャンネルアクセストークン
 *  LINE_USER_ID       : 送信先 LINE ユーザー ID
 *  SPREADSHEET_ID     : ログ用スプレッドシート ID
 *  OPENAI_API_KEY     : OpenAI API キー
 *  WEATHER_CITY       : 天気取得都市 (例: Susaki,Kochi)
 */

'use strict';

/* =============================================
   定数・設定
============================================= */
var PROPS = PropertiesService.getScriptProperties();

var LINE_ACCESS_TOKEN = PROPS.getProperty('LINE_ACCESS_TOKEN');
var LINE_USER_ID      = PROPS.getProperty('LINE_USER_ID');
var SPREADSHEET_ID    = PROPS.getProperty('SPREADSHEET_ID');
var OPENAI_API_KEY    = PROPS.getProperty('OPENAI_API_KEY');
var WEATHER_CITY      = PROPS.getProperty('WEATHER_CITY') || 'Tokyo,JP';

var LINE_REPLY_URL = 'https://api.line.me/v2/bot/message/reply';
var LINE_PUSH_URL  = 'https://api.line.me/v2/bot/message/push';

/* =============================================
   エントリーポイント: Webhook 受信
============================================= */
function doPost(e) {
  try {
    var json   = JSON.parse(e.postData.contents);
    var events = json.events;

    if (!events || events.length === 0) {
      return ContentService.createTextOutput('OK');
    }

    events.forEach(function (event) {
      if (event.type === 'message' && event.message.type === 'text') {
        handleTextMessage(event);
      }
    });
  } catch (err) {
    logError('doPost', err);
  }

  return ContentService.createTextOutput('OK');
}

/* =============================================
   テキストメッセージ処理
============================================= */
function handleTextMessage(event) {
  var replyToken = event.replyToken;
  var userText   = event.message.text.trim();

  var reply;

  if (/今日の予定|きょうの予定|today/i.test(userText)) {
    reply = getTodayCalendarEvents();
  } else if (/明日の予定|あしたの予定|tomorrow/i.test(userText)) {
    reply = getTomorrowCalendarEvents();
  } else if (/今週の予定|こんしゅうの予定|this week/i.test(userText)) {
    reply = getThisWeekCalendarEvents();
  } else if (/天気|てんき|weather/i.test(userText)) {
    reply = getWeather();
  } else {
    reply = askChatGPT(userText);
  }

  replyMessage(replyToken, reply);
  logMessage(userText, reply);
}

/* =============================================
   カレンダー取得 — 修正版

   問題: CalendarApp.getAllCalendars() はカレンダー一覧を返すだけで
         予定を自動取得しない。各カレンダーに対して
         getEvents(start, end) を呼ぶ必要がある。

   また getAllCalendars() はサブスクライブ済みのカレンダーを含むが、
   プライマリカレンダー（自分のメイン）が漏れる場合があるため
   getDefaultCalendar() を別途取得して重複除去する。
============================================= */

/**
 * 今日の予定を文字列で返す
 */
function getTodayCalendarEvents() {
  var now   = new Date();
  var start = dayStart(now);
  var end   = dayEnd(now);
  return formatCalendarEvents(getCalendarEvents(start, end), '今日');
}

/**
 * 明日の予定を文字列で返す
 */
function getTomorrowCalendarEvents() {
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var start = dayStart(tomorrow);
  var end   = dayEnd(tomorrow);
  return formatCalendarEvents(getCalendarEvents(start, end), '明日');
}

/**
 * 今週（月〜日）の予定を文字列で返す
 */
function getThisWeekCalendarEvents() {
  var today     = new Date();
  var dayOfWeek = today.getDay(); // 0=日, 1=月, ...
  var monday    = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7)); // 月曜に戻す
  var sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  var start = dayStart(monday);
  var end   = dayEnd(sunday);
  return formatCalendarEvents(getCalendarEvents(start, end), '今週');
}

/**
 * 指定期間の全カレンダーから予定を取得する（重複除去済み）
 *
 * @param {Date} start
 * @param {Date} end
 * @return {CalendarEvent[]}
 */
function getCalendarEvents(start, end) {
  var allEvents = [];
  var seenIds   = {};

  // ① プライマリ（デフォルト）カレンダーを明示的に取得
  //    getAllCalendars() だけでは取りこぼす場合がある
  try {
    var defaultCal    = CalendarApp.getDefaultCalendar();
    var defaultEvents = defaultCal.getEvents(start, end);
    defaultEvents.forEach(function (ev) {
      seenIds[ev.getId()] = true;
      allEvents.push(ev);
    });
  } catch (e) {
    logError('getDefaultCalendar', e);
  }

  // ② その他すべてのカレンダー（サブスクライブ含む）
  try {
    var calendars = CalendarApp.getAllCalendars();
    calendars.forEach(function (cal) {
      var events = cal.getEvents(start, end);
      events.forEach(function (ev) {
        var id = ev.getId();
        if (!seenIds[id]) {
          seenIds[id] = true;
          allEvents.push(ev);
        }
      });
    });
  } catch (e) {
    logError('getAllCalendars', e);
  }

  // 開始時刻順でソート
  allEvents.sort(function (a, b) {
    return a.getStartTime() - b.getStartTime();
  });

  return allEvents;
}

/**
 * CalendarEvent 配列をLINE向けテキストに整形
 *
 * @param {CalendarEvent[]} events
 * @param {string} label  - "今日" / "明日" / "今週"
 * @return {string}
 */
function formatCalendarEvents(events, label) {
  if (events.length === 0) {
    return label + 'の予定はありません。';
  }

  var lines = [label + 'の予定（' + events.length + '件）:'];

  events.forEach(function (ev) {
    var title    = ev.getTitle() || '（タイトルなし）';
    var isAllDay = ev.isAllDayEvent();
    var timeStr;

    if (isAllDay) {
      timeStr = '終日';
    } else {
      timeStr = formatTime(ev.getStartTime()) + '〜' + formatTime(ev.getEndTime());
    }

    lines.push('・' + timeStr + '　' + title);
  });

  return lines.join('\n');
}

/* =============================================
   天気取得 (OpenWeatherMap)
============================================= */
function getWeather() {
  try {
    var url = 'https://api.openweathermap.org/data/2.5/weather'
      + '?q=' + encodeURIComponent(WEATHER_CITY)
      + '&appid=' + OPENAI_API_KEY  // ※ 別途 WEATHER_API_KEY を推奨
      + '&units=metric&lang=ja';

    // Script Properties に WEATHER_API_KEY があれば優先使用
    var weatherKey = PROPS.getProperty('WEATHER_API_KEY');
    if (weatherKey) {
      url = 'https://api.openweathermap.org/data/2.5/weather'
        + '?q=' + encodeURIComponent(WEATHER_CITY)
        + '&appid=' + weatherKey
        + '&units=metric&lang=ja';
    }

    var res  = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var data = JSON.parse(res.getContentText());

    if (data.cod !== 200) {
      return '天気情報を取得できませんでした（' + (data.message || data.cod) + '）';
    }

    var desc  = data.weather[0].description;
    var temp  = Math.round(data.main.temp);
    var feels = Math.round(data.main.feels_like);
    var city  = data.name;

    return city + 'の現在の天気: ' + desc
      + '\n気温: ' + temp + '°C（体感 ' + feels + '°C）';
  } catch (e) {
    logError('getWeather', e);
    return '天気情報の取得中にエラーが発生しました。';
  }
}

/* =============================================
   ChatGPT 応答 (OpenAI)
============================================= */
function askChatGPT(userText) {
  try {
    var payload = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'あなたは「月音香（つきねか）」という名のAI秘書です。'
            + '丁寧で温かみのある日本語で簡潔に答えてください。'
        },
        { role: 'user', content: userText }
      ],
      max_tokens: 500,
      temperature: 0.7
    };

    var res = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + OPENAI_API_KEY },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var data = JSON.parse(res.getContentText());

    if (data.error) {
      logError('askChatGPT', data.error.message);
      return '申し訳ありません、応答の生成に失敗しました。';
    }

    return data.choices[0].message.content.trim();
  } catch (e) {
    logError('askChatGPT', e);
    return '申し訳ありません、エラーが発生しました。';
  }
}

/* =============================================
   LINE メッセージ送信
============================================= */
function replyMessage(replyToken, text) {
  var payload = {
    replyToken: replyToken,
    messages: [{ type: 'text', text: text }]
  };

  UrlFetchApp.fetch(LINE_REPLY_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + LINE_ACCESS_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

/**
 * プッシュ通知（定期実行トリガー等で使用）
 */
function pushMessage(text) {
  var payload = {
    to: LINE_USER_ID,
    messages: [{ type: 'text', text: text }]
  };

  UrlFetchApp.fetch(LINE_PUSH_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + LINE_ACCESS_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

/* =============================================
   朝の予定通知トリガー用（毎朝 7:00 に実行設定推奨）
============================================= */
function sendMorningBriefing() {
  var calText     = getTodayCalendarEvents();
  var weatherText = getWeather();
  pushMessage('おはようございます。\n\n' + weatherText + '\n\n' + calText);
}

/* =============================================
   ユーティリティ
============================================= */

/** 指定日の 00:00:00 */
function dayStart(date) {
  var d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 指定日の 23:59:59 */
function dayEnd(date) {
  var d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Date を "HH:MM" 形式に */
function formatTime(date) {
  var h = ('0' + date.getHours()).slice(-2);
  var m = ('0' + date.getMinutes()).slice(-2);
  return h + ':' + m;
}

/** スプレッドシートにログ記録 */
function logMessage(userText, reply) {
  try {
    if (!SPREADSHEET_ID) return;
    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('ログ') || ss.insertSheet('ログ');
    sheet.appendRow([new Date(), userText, reply]);
  } catch (e) {
    // ログ失敗は無視
  }
}

/** エラーログ */
function logError(context, err) {
  console.error('[月音香秘書] ' + context + ': ' + (err.message || err));
  try {
    if (!SPREADSHEET_ID) return;
    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('エラーログ') || ss.insertSheet('エラーログ');
    sheet.appendRow([new Date(), context, String(err.message || err)]);
  } catch (e) {
    // 無視
  }
}
