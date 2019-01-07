import '@webcomponents/webcomponentsjs/bundles/webcomponents-sd-ce.js';
import css from '../sass/_content.scss';

chrome.runtime.sendMessage({
    show: true
}, () => {});

let props = {
    autoFlag: false,
    guideHideFlag: false,
    setColorFlag: false,
    baseColor: '#00ffff',
    focusColor: '#0000ff',
    defaultBaseColor: '#00ffff',
    defaultFocusColor: '#0000ff',
    padding: true,
    inline: true,
    filter: false,
    query: '*',
    defaultQuery: '*',
    limitFlag: false,
    limit: 20000
};

const getOption = () => {
    return new Promise(resolve => {
        chrome.storage.sync.get(props, value => {
            let total = 0;
            Object.keys(props).forEach((key, i, array) => {
                props[key] = value[key] !== undefined ? value[key] : props[key];
                total++;
                if (total === array.length) resolve();
            })
        });
    })
};
getOption();

const init = () => {
    customElements.define("dom-guides", DomGuides)
    const root = document.createElement('dom-guides');
    document.body.appendChild(root);
    chrome.runtime.sendMessage({
        view: true
    }, () => {});
}

window.addEventListener('load', () => {
    props.autoFlag && getOption().then(() => {
        init();
    });
});

chrome.runtime.onMessage.addListener(() => {
    !document.querySelector('dom-guides') && getOption().then(() => {
        init();
    });
});

class DomGuides extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({
            mode: "open"
        });

        this.root = document.createElement('div');
        this.root.className = 'root';
        shadow.appendChild(this.root);
        const style = document.createElement('style')
        style.innerHTML = css;
        shadow.appendChild(style);
        const elms = ['lineBox', 'userLineBox', 'lineSize'];
        elms.forEach(name => {
            const elm = document.createElement('div');
            elm.className = name;
            this.root.appendChild(elm);
        })
        this.focusGuide = false;
        this.currentGuide = false;

        this.settings();
        this.setUserLines();
        this.setEvents();
    }

    setWrapper() {
        return new Promise(resolve => {
            const w = window;
            const d = document;
            let width = d.documentElement.clientWidth || d.body.clientWidth;
            let height = w.innerHeight || d.documentElement.clientHeight || d.body.clientHeight;
            width = Math.max.apply(null, [width, d.documentElement.scrollWidth, d.body.scrollWidth]);
            height = Math.max.apply(null, [height, d.documentElement.scrollHeight, d.body.scrollHeight]);
            this.root.style.width = width + 'px';
            this.root.style.height = height + 'px';
            this.size = [width, height];
            resolve();
        });
    }
    setDomGuide() {
        const d = document;
        const lineData = [];
        const fixedList = {};
        const transparentList = {};
        const query = props.filter ? props.query : props.defaultQuery;
        const domList = d.querySelectorAll(query);
        const scrollX = d.documentElement.scrollLeft;
        const scrollY = d.documentElement.scrollTop;
        for (let i = 0; domList.length > i; i++) {
            const current = domList[i];
            const style = getComputedStyle(current);
            const transparent = style.opacity * 1 === 0 || style.visibility === 'hidden' || style.display === 'none' || style.maxWidth === '0px' || style.maxHeight === '0px';
            if (style.position === 'fixed') {
                fixedList[i] = true;
                const findList = current.querySelectorAll(query);
                findList.length && findList.forEach((none, n) => {
                    fixedList[i + n + 1] = true;
                })
            }
            if (transparent) {
                transparentList[i] = true;
                const findList = current.querySelectorAll(query);
                findList.length && findList.forEach((none, n) => {
                    transparentList[i + n + 1] = true;
                })
            }
        }
        for (let i = 0; domList.length > i; i++) {
            const current = domList[i];
            const rect = current.getBoundingClientRect();
            const height = current.offsetHeight;
            const width = current.offsetWidth;
            const transparent = transparentList[i];
            const style = getComputedStyle(current);
            const inlineFlag = !props.inline && style.display === 'inline';
            if (height !== 0 && width !== 0 && !transparent && !inlineFlag) {
                const offsetX = rect.left + scrollX;
                const offsetY = rect.top + scrollY;
                const fixed = fixedList[i];
                const baseNum = 4;
                const pushLine = (x, y, w, h, exclude) => {
                    for (let i = 0; baseNum > i; i++) {
                        const yFlag = i < 2;
                        if (exclude && (exclude.height && !yFlag || exclude.width && yFlag)) continue;
                        const line = {
                            type: yFlag ? 'y' : 'x',
                            size: yFlag ? h : w,
                            point: [x - (fixed ? scrollX : 0) + (i === 1 ? w : 0), y - (fixed ? scrollY : 0) + (i === 3 ? h : 0)],
                            fixed: fixed
                        };
                        lineData.push(line);
                    }
                }
                pushLine(offsetX, offsetY, width, height);
                if (props.padding) {
                    const pWidth = width - (style.paddingLeft.slice(0, -2) * 1 + style.paddingRight.slice(0, -2) * 1 + style.borderLeftWidth.slice(0, -2) * 1 + style.borderRightWidth.slice(0, -2) * 1);
                    const pHeight = height - (style.paddingTop.slice(0, -2) * 1 + style.paddingBottom.slice(0, -2) * 1 + style.borderTopWidth.slice(0, -2) * 1 + style.borderBottomWidth.slice(0, -2) * 1);
                    const pOffsetX = offsetX + style.paddingLeft.slice(0, -2) * 1 + style.borderLeftWidth.slice(0, -2) * 1;
                    const pOffsetY = offsetY + style.paddingTop.slice(0, -2) * 1 + style.borderTopWidth.slice(0, -2) * 1;
                    const exclude = {
                        width: width === pWidth,
                        height: height === pHeight
                    }
                    pushLine(pOffsetX, pOffsetY, pWidth, pHeight, exclude);
                }
            }
        }
        let lineBoxData = '';
        for (let i = 0; lineData.length > i; i++) {
            if (props.limitFlag && i >= props.limit) break;
            const currentLine = lineData[i];
            const x = currentLine.type === 'x';
            const type = x ? 'typeX' : 'typeY';
            const size = x ? 'width' : 'height';
            const pointX = this.size[0] === currentLine.point[0] ? currentLine.point[0] - 1 : currentLine.point[0];
            const pointY = this.size[1] === currentLine.point[1] ? currentLine.point[1] - 1 : currentLine.point[1];
            lineBoxData += '<div class="domGuidesList ' + type + '" style="' + 'border-color:' + (props.setColorFlag ? props.baseColor : props.defaultBaseColor) + ';' + size + ':' + lineData[i].size + 'px; left:' + pointX + 'px;top:' + pointY + 'px;' + (lineData[i].fixed ? 'position:fixed;' : '') + '"data-set="' + lineData[i].size + ',' + currentLine.point[0] + ',' + currentLine.point[1] + '"></div>';
        }
        const lineBox = this.root.querySelector('.lineBox');
        lineBox.innerHTML = lineBoxData;
        lineBox.style.display = props.guideHideFlag ? 'none' : 'block';
    }
    setEvents() {
        let timer = false;
        const reload = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                this.settings();
            }, 500);
        }
        window.addEventListener('resize', reload);
        window.addEventListener('orientationchange', reload);

        const clickGuide = e => {
            const current = e.composedPath()[0];
            if (current.classList.contains('domGuidesList')) {
                if (this.focusGuide !== false) {
                    const prev = this.focusGuide;
                    const prevX = prev.classList.contains('typeX');
                    const prevUser = prev.classList.contains('user');
                    prev.style.borderColor = props.setColorFlag ? props.baseColor : props.defaultBaseColor;
                    prev.style.zIndex = 100001;
                    if (!prevUser) {
                        const prevData = prev.getAttribute('data-set').split(',');
                        if (prevX) {
                            prev.style.width = prevData[0] + 'px';
                            prev.style.left = prevData[1] + 'px';
                        } else {
                            prev.style.height = prevData[0] + 'px';
                            prev.style.top = prevData[2] + 'px';
                        }
                    }
                }
                current.style.borderColor = props.setColorFlag ? props.focusColor : props.defaultFocusColor;
                current.style.zIndex = 100002;
                const currentX = current.classList.contains('typeX');
                const currentUser = current.classList.contains('user');
                if (!currentUser) {
                    if (currentX) {
                        current.style.width = this.size[0] + 'px';
                        current.style.left = 0;
                    } else {
                        current.style.height = this.size[1] + 'px';
                        current.style.top = 0;
                    }
                }
                this.focusGuide = current;
            }
        }
        document.addEventListener('mousedown', clickGuide);

        const onGuide = e => {
            const current = e.composedPath()[0];
            if (current.classList && current.classList.contains('domGuidesList')) {
                if (this.currentGuide && this.focusGuide !== this.currentGuide) {
                    this.currentGuide.style.borderColor = props.setColorFlag ? props.baseColor : props.defaultBaseColor;
                    this.currentGuide.style.zIndex = 100001;
                }
                this.currentGuide = current;
                current.style.borderColor = props.setColorFlag ? props.focusColor : props.defaultFocusColor;
                current.style.zIndex = 100002;
                if (this.focusGuide !== false) {
                    const base = this.focusGuide;
                    const viewFlag = current.classList.contains('typeX') && base.classList.contains('typeX') || current.classList.contains('typeY') && base.classList.contains('typeY');
                    if (viewFlag) {
                        const pointerPosition = [e.clientX, e.clientY];
                        const typeX = base.classList.contains('typeX')
                        const rightPosition = e.clientX < 100;
                        const downPosition = e.clientY < 100;
                        const basePosition = base.getAttribute('data-set').split(',')[typeX ? 2 : 1] * 1;
                        const currentPosition = current.getAttribute('data-set').split(',')[typeX ? 2 : 1] * 1;
                        const difference = basePosition - currentPosition;
                        const down = difference < 0 && typeX;
                        const right = difference < 0 && !typeX;
                        const size = Math.abs(difference);
                        const supportLine = '<div class="supportLine" style="left:' + (pointerPosition[0] + (right ? -size : 0) + (typeX ? -10 : 0)) + 'px;top:' + (pointerPosition[1] + (down ? -size : 0) + (typeX ? 0 : -3)) + 'px;' + (typeX ? 'height' : 'width') + ':' + size + 'px;background:' + (props.setColorFlag ? props.focusColor : props.defaultFocusColor) + '">';
                        const sizeBox = '<div class="sizeBox" style="left:' + (pointerPosition[0] + (rightPosition ? 10 : -57)) + 'px;top:' + (pointerPosition[1] + (downPosition ? 10 : -30)) + 'px;' + '">' + Math.round(size) + 'px</div>';
                        this.root.querySelector('.lineSize').innerHTML = supportLine + (this.focusGuide !== this.currentGuide ? sizeBox : '');
                    }
                }
            } else if (this.currentGuide) {
                if (this.focusGuide !== this.currentGuide) {
                    this.currentGuide.style.borderColor = props.setColorFlag ? props.baseColor : props.defaultBaseColor;
                    this.currentGuide.style.zIndex = 100001;
                }
                this.root.querySelector('.lineSize').innerHTML = '';
                this.currentGuide = false;
            }
        }
        document.addEventListener('mousemove', onGuide);

        chrome.runtime.onMessage.addListener(() => {
            const style = getComputedStyle(this.root);
            if (style.display === 'none') {
                this.root.style.display = 'block';
                this.settings();
                chrome.runtime.sendMessage({
                    view: true
                }, () => {});
            } else {
                this.root.style.display = 'none';
                chrome.runtime.sendMessage({
                    view: false
                }, () => {});
            }
        });
        chrome.storage.onChanged.addListener(() => {
            getOption().then(()=>{
                this.settings();
            });
        });
    }
    setUserLines() {
        let startX, startY, dragFlag, lineMoveFlag, shiftKeyFlag;
        dragFlag = lineMoveFlag = shiftKeyFlag = false;

        const addLine = (type, position) => {
            const x = type === 'x';
            const newLine = document.createElement('div');
            newLine.className = 'domGuidesList user ' + (x ? 'typeX' : 'typeY');
            newLine.setAttribute('style', (x ? 'top' : 'left') + ': ' + position + 'px;' + (x ? 'width' : 'height') + ':100000px;');
            newLine.setAttribute('data-set', '0,' + position + ',' + position);
            this.root.querySelector('.userLineBox').appendChild(newLine);
            this.focusGuide = newLine;
        };

        document.addEventListener('mousedown', e => {
            if (shiftKeyFlag) {
                dragFlag = true;
                startX = e.clientX;
                startY = e.clientY;
                const current = e.composedPath()[0];
                if (current.classList.contains('domGuidesList') && current.classList.contains('user')) {
                    lineMoveFlag = true
                }
            }
        });

        document.addEventListener('mousemove', e => {
            if (shiftKeyFlag) {
                const moveX = e.clientX;
                const moveY = e.clientY;
                const scrollX = document.documentElement.scrollLeft;
                const scrollY = document.documentElement.scrollTop;
                const positionX = scrollX + moveX;
                const positionY = scrollY + moveY;
                if (dragFlag) {
                    if (!lineMoveFlag) {
                        const addY = Math.abs(startX - moveX) > 50;
                        const addX = Math.abs(startY - moveY) > 50;
                        if (addY || addX) {
                            if (this.focusGuide) this.focusGuide.style.borderColor = props.setColorFlag ? props.baseColor : props.defaultBaseColor;
                            const type = addY ? 'y' : 'x';
                            const position = addY ? positionX : positionY;
                            addLine(type, position);
                            lineMoveFlag = true;
                        }
                    } else {
                        const current = this.focusGuide;
                        const x = current.classList.contains('typeX');
                        const position = x ? positionY : positionX;
                        current.style[x ? 'top' : 'left'] = position + 'px';
                        current.setAttribute('data-set', '0,' + position + ',' + position);
                    }
                }
            }
        })

        document.addEventListener('mouseup', () => {
            dragFlag = lineMoveFlag = startX = startY = false;
        })

        const stopSelect = e => {
            e.preventDefault();
        }

        document.addEventListener('keydown', e => {
            if (e.keyCode === 16) {
                shiftKeyFlag = true;
                document.addEventListener('selectstart', stopSelect)
            }
        })
        document.addEventListener('keyup', e => {
            if (e.keyCode === 8 && this.focusGuide.classList.contains('user')) {
                this.focusGuide.parentNode.removeChild(this.focusGuide)
            } else if (e.keyCode === 16) {
                shiftKeyFlag = false;
                document.removeEventListener('selectstart', stopSelect)
            }
        })
    }
    settings() {
        this.setWrapper().then(() => {
            this.setDomGuide();
        })
    }
}