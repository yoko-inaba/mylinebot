'use strict'; // おまじない

// ########################################
//               初期設定など
// ########################################

// パッケージを使用します
const express = require('express');
const line = require('@line/bot-sdk');


const firebase = require('firebase/compat/app');
require('firebase/compat/firestore');
require("dotenv").config();
//const { firestore } = require('firebase-admin');
//import { initializeApp } from 'firebase/app';
//import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';

const firebaseConfig = {
// Configの部分を貼り付ける
  apiKey: process.env.REACT_APP_FIREBASE_KEY,  
  authDomain: process.env.REACT_APP_FIREBASE_DOMAIN,   
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,   
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,   
  messagingSenderId: process.env.REACT_APP_FIREBASE_SENDER_ID,  
  appId: process.env.REACT_APP_FIREBASE_APP_ID   
};
// Initialize Firebase
/////firebase.initializeApp(firebaseConfig);
/////const db = firebase.firestore();

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
//const db = getFirestore(app); getFirestore.Firestore();


console.log(`aaaaa`);

// Messaging APIで利用するクレデンシャル（秘匿情報）です。
const config = {
  channelSecret: process.env.REACT_APP_LINE_CHANNEL_SECRET,   
  channelAccessToken: process.env.REACT_APP_LINE_CHANNEL_ACCESSTOKEN   
};

console.log(`bbbbb`);

// ########################################
//  LINEサーバーからのWebhookデータを処理する部分
// ########################################

// LINE SDKを初期化します
const client = new line.Client(config);

console.log(`ccccc`);


// LINEサーバーからWebhookがあると「サーバー部分」から以下の "handleEvent" という関数が呼び出されます
async function handleEvent(event) {
        console.log("------");
        console.log(event);
        console.log("------");
        console.log(event.source);
        console.log("------");
        console.log(event.source.userId);

  // 受信したWebhookが「テキストメッセージ以外」であればnullを返すことで無視します
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  // データベースにデータを追加
  const now = new Date();            //日付取得準備（必須）！！
  const month = now.getMonth() + 1;  //月+１を足す
  const date = now.getDate();        //日       
  const h = now.getHours();          //時
  const m = now.getMinutes();        //分
  const s = now.getSeconds();       //秒
  //日時表示文字列の作成
  const time = month + "/" + date + " " + h + ":" + m + ":" + s;
  const dgDay = time;

  console.log(event.message.text);
  console.log(dgDay);
  console.log(now);

 
  const res = db.collection(event.source.userId).doc();
  await res.set({
    dgname: event.message.text,
    dgday: dgDay,
    time: now
  });

 /*  
  await db.collection(event.source.userId).add({
    dgname : event.message.text,
    dgday: dgDay,
    time: now
  });
 */

  // 「テキストメッセージ」であれば、受信したテキストをそのまま返事します
  return client.replyMessage(event.replyToken,[
     {
    type: 'text',
    text:  event.source.userId + '『' + event.message.text + '』' + dgDay + '-' + now + 'を診断名として入力しました。' // ← ここに入れた言葉が実際に返信されます
  },{
    type: 'text',
    text: '下のメニューからご確認ください。' // ← ここに入れた言葉が実際に返信されます
  }]
  );
};


// ########################################
//          Expressによるサーバー部分
// ########################################

// expressを初期化します
const app = express();

// HTTP GETによって '/' のパスにアクセスがあったときに 'Hello LINE BOT! (HTTP GET)' と返事します
// これはMessaging APIとは関係のない確認用のものです
app.get('/', (req, res) => res.send('Hello LINE BOT! (HTTP GET)'));

// HTTP POSTによって '/webhook' のパスにアクセスがあったら、POSTされた内容に応じて様々な処理をします
app.post('/webhook', line.middleware(config), (req, res) => {
  // Webhookの中身を確認用にターミナルに表示します
  console.log('tets1:'+req.body.events);

  // 空っぽの場合、検証ボタンをクリックしたときに飛んできた"接続確認"用
  // 削除しても問題ありません
  if (req.body.events.length == 0) {
    res.send('Hello LINE BOT! (HTTP POST)'); // LINEサーバーに返答します
    console.log('検証イベントを受信しました！'); // ターミナルに表示します
    return; // これより下は実行されません
  }

  // あらかじめ宣言しておいた "handleEvent" 関数にWebhookの中身を渡して処理してもらい、
  // 関数から戻ってきたデータをそのままLINEサーバーに「レスポンス」として返します
  Promise.all(req.body.events.map(handleEvent)).then((result) => res.json(result));
});

// ローカル（自分のPC）でサーバーを公開するときのポート番号です
const PORT = process.env.PORT || 3000;

// 最初に決めたポート番号でサーバーをPC内だけに公開します
// （環境によってはローカルネットワーク内にも公開されます）
app.listen(PORT);
console.log(`ポート${PORT}番でExpressサーバーを実行中です…`);