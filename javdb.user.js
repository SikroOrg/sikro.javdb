// ==UserScript==
// @name         JavDB 尝试修改
// @version      1.0.2
// @description  在影片详情页添加跳转到在线观看网站的按钮，并检查对应是否存在资源，如果对应网站上存在该资源则为绿色，否则显示红色，顺便检测有无中文字幕。
// @author       sikro
// @match        https://javdb.com/*
// @include      /^https:\/\/(\w*\.)?javdb(\d)*\.com.*$/
// @icon         https://javdb.com/favicon-32x32.png
// @license      MIT
// @connect      jable.tv
// @connect      missav.com
// @connect      javhhh.com
// @connect      netflav.com
// @connect      javbus.com
// @connect      avgle.com
// @connect      bestjavporn.com
// @connect      jav.guru
// @connect      javmost.cx
// @connect      hpjav.tv
// @connect      av01.tv
// @connect      停用mm-cg.com
// @connect      translate.google.cn
// @connect      translate.google.com
// @connect      *
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @namespace http://tampermonkey.net/
// ==/UserScript==

"use strict";

/** 网站列表 */
const site = [
    {
        id: 0,
        name: "Jable",
        hostname: "jable.tv",
        url: "https://jable.tv/videos/(code)/",
        search: false,
        domQuery: { subQuery: ".header-right>h6" },
        methods: temp,
    },
    {
        id: 1,
        name: "MISSAV",
        hostname: "missav.com",
        url: "https://missav.com/(code)/",
        search: false,
        domQuery: {
            subQuery: '.space-y-2>.text-nord4>a[href="https://missav.com/chinese-subtitle"]',
            leakQuery: "div.mb-5.p-2.rounded-lg.bg-nord11 ",
        },
        methods: temp,
    },
    {
        id: 2,
        name: "NETFLAV",
        hostname: "netflav.com",
        url: "https://netflav.com/search?type=title&keyword=(code)",
        search: true,
        domQuery: { linkQuery: ".grid_cell>a", titleQuery: ".grid_cell>a>.grid_title" },
        methods: temp,
    },
    {
        id: 3,
        name: "Avgle",
        hostname: "avgle.com",
        url: "https://avgle.com/search/videos?search_query=(code)&search_type=videos",
        search: true,
        domQuery: {
            linkQuery: ".container>.row .row .well>a[href]",
            titleQuery: ".container>.row .row .well .video-title",
        },
        methods: temp,
    },
    {
        id: 4,
        name: "JAVHHH",
        hostname: "javhhh.com",
        url: "https://javhhh.com/v/?wd=(code)",
        search: true,
        domQuery: {
            linkQuery: ".typelist>.i-container>a[href]",
            titleQuery: ".typelist>.i-container>a[href]",
        },
        methods: temp,
    },
    {
        id: 5,
        name: "BestJavPorn",
        hostname: "BestJavPorn.com",
        url: "https://www2.bestjavporn.com/search/(code)/",
        search: true,
        domQuery: { linkQuery: "article.thumb-block>a", titleQuery: "article.thumb-block>a" },
        methods: temp,
    },
    {
        id: 6,
        name: "Jav.Guru",
        hostname: "jav.guru",
        url: "https://jav.guru/?s=(code)",
        search: true,
        domQuery: { linkQuery: ".imgg>a[href]", titleQuery: ".inside-article>.grid1 a[title]" },
        methods: temp,
    },
    {
        id: 7,
        name: "JAVMOST",
        hostname: "javmost.cx",
        url: "https://javmost.cx/search/(code)/",
        search: true,
        domQuery: {
            linkQuery: "#content .card>a[href]",
            titleQuery: "#content .card-block .card-title",
        },
        methods: temp,
    },
    {
        id: 8,
        name: "HPJAV",
        hostname: "hpjav.tv",
        url: "https://hpjav.tv/tw?s=(code)",
        search: true,
        domQuery: { linkQuery: ".entry-title a[href]", titleQuery: ".entry-title a[href]" },
        methods: temp,
    },
    {
        id: 9,
        name: "AV01",
        hostname: "av01.tv",
        url: "https://www.av01.tv/search/videos?search_query=(code)",
        search: true,
        domQuery: { linkQuery: "div[id].well-sm>a", titleQuery: ".video-views>.pull-left" },
        methods: temp,
    },
    {
        id: 10,
        name: "JavBus",
        hostname: "javbus.com",
        url: "https://javbus.com/(code)",
        search: false,
        domQuery: null,
        methods: temp,
    },
];

/** 字幕等样式 */
function addStyle() {
    GM_addStyle(
        '.provide-sub::before {  position:absolute;  content:"字幕";  padding: 1px;  top:-5px;  left:-3px;  line-height:1;  color:white;  background: green;}',
    );
    GM_addStyle(
        `.provide-leak::after {  position:absolute;  content:"无码";  padding: 1px;  top:-5px;  left:30px;  line-height:1;  color:white;  background: green;}`,
    );
}

/** 查找是否包含字幕、无码的 tag 信息 */
function querytag(dom, button) {
    if (this.domQuery === null) {
        return;
    }
    const SubQueryStr =
        this.domQuery.subQuery === undefined ? this.domQuery.titleQuery : this.domQuery.subQuery;
    const LeakQueryStr = this.domQuery.leakQuery;
    if (
        dom.querySelector(SubQueryStr)?.innerText.includes("字幕") ||
        dom.querySelector(SubQueryStr)?.innerText.includes("subtitle")
    ) {
        button.classList.add("provide-sub");
    }
    if (dom.querySelector(LeakQueryStr)) {
        button.classList.add("provide-leak");
    }
}

function temp() {
    return;
}

/** 传入网站，处理网站 */
function getWebsite(site) {
    let videoCode = document.querySelector("[data-clipboard-text]").attributes[2].value;

    if (videoCode.includes("FC2")) {
        videoCode =
            site.name === "Jable" ? videoCode.replace("FC2", "fc2ppv") : videoCode.replace("FC2-", "");
    }

    if (videoCode.includes("复制")) {
        videoCode = videoCode.replace("复制", "");
    }

    let xhrResult = "";
    const siteUrl = site.url.replace("(code)", videoCode);

    const buttonG = document.createElement("a");
    document.querySelectorAll(".panel-block div.buttons")[1].appendChild(buttonG);
    buttonG.classList.add("button", "is-info", "is-outlined", "button-g");
    buttonG.innerHTML = site.name;
    buttonG.setAttribute("target", "_blank");
    buttonG.href = siteUrl;

    xhr(xhrResult);
}

function setbuttonGColor(color) {
    buttonG.style.color = color;
    buttonG.style.borderColor = color;
}

function xhr(xhrResult) {
    GM_xmlhttpRequest({
        method: "GET",
        url: siteUrl,
        onload: function (result) {
            xhrResult = result.status;
            console.log(`---${site.name} onload,${xhrResult},-${siteUrl}`);
            const xhrDOM = new DOMParser().parseFromString(result.responseText, "text/html");

            if (site.search) {
                let linkElement = xhrDOM.querySelectorAll(site.domQuery.linkQuery)[0];
                let titleElement = xhrDOM.querySelectorAll(site.domQuery.titleQuery)[0];

                if (linkElement != undefined && titleElement.outerHTML.includes(videoCode)) {
                    buttonG.href = linkElement.href.replace(linkElement.hostname, site.hostname);
                } else {
                    xhrResult = 404;
                }
            }
            xhrResult == 404 ? setbuttonGColor("red") : setbuttonGColor("green");

            if (xhrResult != 404) {
                querytag.call(site, xhrDOM, buttonG);
            }
        },
        onerror: function (result) {
            console.log(`---${site.hostname} onerror`, xhrResult);
            console.log(result);
            setbuttonGColor("red");
        },
    });
}

/** 谷歌翻译 */
function translateTitle() {
    let isTranslated = false;
    const ButtonTran = document.createElement("h2");
    const h2title = document.querySelector("h2.title.is-4");
    h2title.style.cursor = "pointer";
    h2title.appendChild(ButtonTran);
    ButtonTran.classList.add("title", "is-6", "button_t");
    ButtonTran.innerHTML = "翻译";
    ButtonTran.style.display = "none";
    ButtonTran.style.border = "1px solid #3e8ed";

    h2title.addEventListener("mouseover", () => {
        ButtonTran.style.display = "inline";
    });
    h2title.addEventListener("mouseout", () => {
        if (!isTranslated) {
            ButtonTran.style.display = "none";
        }
    });

    ButtonTran.addEventListener("click", getTranslate);

    // const data = {
    //     client: "gtx",
    //     dt: "t",
    //     dj: 1,
    //     ie: "UTF-8",
    //     sl: "auto", //目的类型
    //     tl: "zh-CN", //目标语言
    //     q: h2title.innerHTML,
    // };
    // const requestUrl = "https://translate.google.cn/translate_a/single?" + Qs.stringify(data);

    const queryStr = `client=gtx&dt=t&dj=1&ie=UTF-8&sl=auto&tl=zh-CN&q=${h2title.innerHTML}`;
    const requestUrl = `https://translate.google.cn/translate_a/single?${queryStr}`;
    function getTranslate() {
        if (isTranslated) {
            return;
        }
        GM_xmlhttpRequest({
            method: "GET",
            url: requestUrl,
            onload: function (res) {
                const json = JSON.parse(res.responseText);
                ButtonTran.innerHTML = json.sentences[0].trans;
                isTranslated = true;
            },
        });
    }
}

function vPage() {
    translateTitle();
    site.forEach((item) => {
        getWebsite(item);
    });
}

const curLocation = location.pathname;
if (document.querySelector(".tabs.is-boxed")) {
    console.log("mainPage");
} else if (curLocation.includes("/v/") && document.querySelector("h2")) {
    console.log("vPage");
    vPage();
    addStyle();
}
