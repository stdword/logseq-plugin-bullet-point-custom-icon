import { AppUserConfigs, LSPluginBaseInfo, SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user';
import { t } from 'logseq-l10n';
import { keyNameToolbarPopup, openPopupSettingsChanged, provideStyle } from '.';
import { removeProvideStyle, } from './lib';

/* user setting */
// https://logseq.github.io/plugins/types/SettingSchemaDesc.html
export const settingsTemplate = async (): Promise<SettingSchemaDesc[]> => {
    const settingArray: SettingSchemaDesc[] = [
        {//機能の一時的なオンオフ
            key: "booleanFunction",
            type: "boolean",
            title: t("Function On/Off"),
            default: true,
            description: "",
        },
        {//@を含むタグがついている場合、編集中以外は非表示
            key: "booleanAtMarkTagHidden",
            type: "boolean",
            //通常のタグと区別するため、@を含むタグを使う場合
            title: t("Hide the tag of including `@` ? (except when editing) If use a tag that includes `@` to distinguish it from a normal tag"),
            default: true,
            // @tagのように、タグの前に@がついている場合、編集中以外は非表示にする
            description: "default: true / ex: @tag",
        },
        {//指定したタグにHierarchyが含まれている場合、その親に一致する場合にもマッチさせる
            key: "booleanHierarchyParentTag",
            type: "boolean",
            title: t("Match parent tag? (if the specified tag contains Hierarchy)"),
            default: false,
            description: "default: false",
        },
        {//アイコンの大きさを大きくする
            key: "booleanIconLarge",
            type: "enum",
            title: t("Large icon?"),
            enumChoices: ["small", "medium", "large"],
            default: "medium",
            description: "default: medium",
        },
        {//絵文字コピーサイトへの誘導リンク
            key: "headingEmojiCopy",
            type: "heading",
            title: t("Use Emoji icon"),
            default: "",
            description: t("Press the shortcut key and enter from the selection screen, or copy emoji on the site to clipboard. ") + "https://emojilo.com/ ",
        },
        {//Tabler iconの場合は、プラグインをインストールして、アイコンをコピーする
            key: "headingTablerIconCopy",
            type: "heading",
            title: t("Use Tabler icon"),
            default: "",
            description: t("Install `Tabler picker` plugin. Then copy icons to clipboard."),
        },
        {//Tabler iconプラグインがインストールされていれば、呼び出す
            key: "callTablerIconPlugin",
            type: "boolean",
            title: t("Call Tabler picker plugin"),
            default: false,
            description: t("If enable the plugin, call it from here."),
        }
    ];

    //12種類のアイコンを設定する
    const { preferredLanguage } = await logseq.App.getUserConfigs() as AppUserConfigs;
    const hash = preferredLanguage === 'ja' ? {
        '@赤': '🔴',             //1
        '@オレンジ': '🟠',        //2
        '@黄色': '🟡',           //3
        '@ページ': '\\eaa4',      //4
        '@フォルダ': '\\eaad',    //5
        '@タグ': '\\eb34',       //6
        '@疑問': '\\eb1c',       //7
        '@リンク': '\\eade',      //8
        '@索引': '\\eb6b',       //9
        '@アイデア': '\\ea51',    //10
        '@人物': '\\ef68',       //11
        '@本': '\\ea39',         //12
    } : {
        '@red': '🔴',           //1
        '@orange': '🟠',        //2
        '@yellow': '🟡',        //3
        '@page': '\\eaa4',      //4
        '@folder': '\\eaad',    //5
        '@tag': '\\eb34',       //6
        '@query': '\\eb1c',     //7
        '@link': '\\eade',      //8
        '@index': '\\eb6b',     //9
        '@idea': '\\ea51',      //10
        '@person': '\\ef68',    //11
        '@book': '\\ea39',      //12
    };

    settingArray.push({
        key: 'headingIcons',
        type: 'heading',
        title: 'Icons configuration',
        default: '',
        description: `
            For Tabler-icons use icon code (e.g. \`\\eaad\`)<br/>
            Or use one character mark or Emoji (\`Win + .\`, Mac: \`cmd + ctrl + space\`)<br/>
            In text area specify one or more tags separated by line breaks. \`@\` is optional.
        `.trim(),
    })

    for (let i = 0; i < 12; i++) {
        const count = ("0" + (i + 1)).slice(-2);
        settingArray.push(
            {
                key: `icon${count}`,
                type: "string",
                title: t("Tabler-icon or Emoji"),
                description: '',
                default: hash[Object.keys(hash)[i]],
            },
            {
                key: `colorBoolean${count}`,
                type: "boolean",
                title: t("Colorize?"),
                description: '',
                default: false,
            },
            {
                key: `color${count}`,
                type: "string",
                inputAs: "color",
                title: t("Color"),
                description: '',
                default: "#32A482",
            },
            {
                key: `tagsList${count}`,
                type: "string",
                inputAs: "textarea",
                title: t("Tags to set the icon"),
                description: '',
                default: Object.keys(hash)[i] + "\n",
            },
        );
    }

    return settingArray;
};


export const settingChanged = () => {
    logseq.onSettingsChanged(async (newSet: LSPluginBaseInfo['settings'], oldSet: LSPluginBaseInfo['settings']) => {
        if (oldSet.callTablerIconPlugin !== newSet.callTablerIconPlugin) {
            if (newSet.callTablerIconPlugin === true) {
                //Tabler-iconプラグインを呼び出す
                await logseq.App.invokeExternalPlugin('logseq-tabler-picker.models.showPluginToolbarPopup');
                logseq.UI.showMsg("Call Tabler-icon plugin.", "info", { timeout: 2000 });
                setTimeout(() => {
                    logseq.updateSettings({ callTablerIconPlugin: false });
                }, 120);
            }
        } else
            if (newSet.booleanFunction !== oldSet.booleanFunction) {
                if (newSet.booleanFunction === true) {
                    provideStyle();
                    openPopupSettingsChanged();
                } else
                    if (newSet.booleanFunction === false) {
                        removeProvideStyle("bullet-point-custom-icon");
                        //ポップアップが存在したら削除する
                        removeToolbarPopup();
                    }
            } else
                if (oldSet.booleanAtMarkTagHidden !== newSet.booleanAtMarkTagHidden
                    || oldSet.booleanHierarchyParentTag !== newSet.booleanHierarchyParentTag
                    || oldSet.booleanIconLarge !== newSet.booleanIconLarge) reset();
                else
                    if (oldSet.icon01 !== newSet.icon01
                        || oldSet.icon02 !== newSet.icon02
                        || oldSet.icon03 !== newSet.icon03
                        || oldSet.icon04 !== newSet.icon04
                        || oldSet.icon05 !== newSet.icon05
                        || oldSet.icon06 !== newSet.icon06
                        || oldSet.icon07 !== newSet.icon07
                        || oldSet.icon08 !== newSet.icon08
                        || oldSet.icon09 !== newSet.icon09
                        || oldSet.icon10 !== newSet.icon10
                        || oldSet.icon11 !== newSet.icon11
                        || oldSet.icon12 !== newSet.icon12
                        || oldSet.tagsList01 !== newSet.tagsList01
                        || oldSet.tagsList02 !== newSet.tagsList02
                        || oldSet.tagsList03 !== newSet.tagsList03
                        || oldSet.tagsList04 !== newSet.tagsList04
                        || oldSet.tagsList05 !== newSet.tagsList05
                        || oldSet.tagsList06 !== newSet.tagsList06
                        || oldSet.tagsList07 !== newSet.tagsList07
                        || oldSet.tagsList08 !== newSet.tagsList08
                        || oldSet.tagsList09 !== newSet.tagsList09
                        || oldSet.tagsList10 !== newSet.tagsList10
                        || oldSet.tagsList11 !== newSet.tagsList11
                        || oldSet.tagsList12 !== newSet.tagsList12
                        || oldSet.colorBoolean01 !== newSet.colorBoolean01
                        || oldSet.colorBoolean02 !== newSet.colorBoolean02
                        || oldSet.colorBoolean03 !== newSet.colorBoolean03
                        || oldSet.colorBoolean04 !== newSet.colorBoolean04
                        || oldSet.colorBoolean05 !== newSet.colorBoolean05
                        || oldSet.colorBoolean06 !== newSet.colorBoolean06
                        || oldSet.colorBoolean07 !== newSet.colorBoolean07
                        || oldSet.colorBoolean08 !== newSet.colorBoolean08
                        || oldSet.colorBoolean09 !== newSet.colorBoolean09
                        || oldSet.colorBoolean10 !== newSet.colorBoolean10
                        || oldSet.colorBoolean11 !== newSet.colorBoolean11
                        || oldSet.colorBoolean12 !== newSet.colorBoolean12
                        || oldSet.color01 !== newSet.color01
                        || oldSet.color02 !== newSet.color02
                        || oldSet.color03 !== newSet.color03
                        || oldSet.color04 !== newSet.color04
                        || oldSet.color05 !== newSet.color05
                        || oldSet.color06 !== newSet.color06
                        || oldSet.color07 !== newSet.color07
                        || oldSet.color08 !== newSet.color08
                        || oldSet.color09 !== newSet.color09
                        || oldSet.color10 !== newSet.color10
                        || oldSet.color11 !== newSet.color11
                        || oldSet.color12 !== newSet.color12) reset(true);
    });
};

const removeToolbarPopup = () => {
    const element = parent.document.getElementById(logseq.baseInfo.id + "--" + keyNameToolbarPopup) as HTMLDivElement | null;
    if (element) element.remove();
};

export const reset = (toolbarUpdate?: boolean) => {
    removeProvideStyle("bullet-point-custom-icon");
    if (toolbarUpdate === true) removeToolbarPopup();

    setTimeout(() => {
        if (toolbarUpdate === true) openPopupSettingsChanged();//ポップアップの更新
        provideStyle();
    }, 120);

};
