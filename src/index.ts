import '@logseq/libs'; //https://plugins-doc.logseq.com/
import { settingsTemplate } from './settings';
import { setup as l10nSetup, t } from "logseq-l10n"; //https://github.com/sethyuan/logseq-l10n
import ja from "./translations/ja.json";
import { removeProvideStyle } from './lib';
import { LSPluginBaseInfo } from '@logseq/libs/dist/LSPlugin.user';
import CSS from './style.css?inline';

/* main */
const main = () => {
  (async () => {
    try {
      await l10nSetup({ builtinTranslations: { ja } });
    } finally {
      /* user settings */
      logseq.useSettingsSchema(settingsTemplate());
      if (!logseq.settings) setTimeout(() => logseq.showSettingsUI(), 300);
    }
  })();

  //初回読み込み時にCSSを反映させる
  /* side block */
  provideStyle();

  //常時適用CSS
  logseq.provideStyle(`
  div#root>div>main>div#app-container a.tag[data-ref*=".side"] {display: none}
  `);


  //ツールバーに設定画面を開くボタンを追加
  logseq.App.registerUIItem('toolbar', {
    key: 'customBulletIconSettingsButton',
    template: `<div><a class="button icon" data-on-click="customBulletIconSettingsButton" style="font-size: 14px">🥦</a></div>`,
  });
  //ツールバーボタンのクリックイベント
  logseq.provideModel({
    customBulletIconSettingsButton: () => {
      logseq.showSettingsUI();
    }
  });

  //Setting changed
  logseq.onSettingsChanged((newSet: LSPluginBaseInfo['settings'], oldSet: LSPluginBaseInfo['settings']) => {
    if (newSet.booleanFunction !== oldSet.booleanFunction) {
      if (newSet.booleanFunction === true) provideStyle();
      else removeProvideStyle("bullet-point-custom-icon");
    }
  });
};/* end_main */


const provideStyle = () => logseq.provideStyle({ key: 'bullet-point-custom-icon', style: CSS });




logseq.ready(main).catch(console.error);