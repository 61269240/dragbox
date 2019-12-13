//v1.2.X

// 全局数据;
let currentEle = undefined;  // 当前正在选的
let selLineDiv = undefined; //用来选择的框框
let selLineDivTimer = 0; // 删除连线选择框的计时器
// 所有图元的hass表
let toolHass = {}

// 获取随机不重复id
let GenNonDuplicateID = (randomLength) => {
    return 'a' + Number(Math.random().toString().substr(3, randomLength) + Date.now()).toString(36)
}

// 画线
let line = d3.line().x((d) => {
    return d[0]
}).y((d) => {
    return d[1]
})

// 获取两个点的中点
let center = (d, c) => {
    return {X: (d.X + c.X) / 2, Y: (d.Y + c.Y) / 2}
}

//画图工具
let dt = {
    isLine: (g, f, e) => {
        let d, c;
        if ((g.x - e.x) == 0) {
            d = 1
        } else {
            d = (g.y - e.y) / (g.x - e.x)
        }
        c = (f.x - e.x) * d + e.y;
        if ((f.y - c) < 10 && (f.y - c) > -10) {
            f.y = c;
            return true
        }
        return false
    },
    // 两点中点位置
    center: function (d, c) {
        // throw 123;
        // console.log(d);
        return {x: (d.X + c.X) / 2, y: (d.Y + c.Y) / 2}
    },
    // 运行后nextid为一个函数，在被运行时依次输出：0，1，2，3.。。
    nextId: (() => {
        let c = 0;
        return function () {
            return ++c
        }
    })(),
    // 从两个矩形中心的连线，这个连线与矩形边界的交点。j为矩形，d为点
    connPoint: (j, d) => {
        // console.log('连线',j,d)
        let c = {x: d.X, y: d.Y},
            // e为矩形j中心点
            e = {x: j.X + j.width / 2, y: j.Y + j.height / 2};
        let l = (e.y - c.y) / (e.x - c.x);// e
        l = isNaN(l) ? 0 : l; // nan的l变成0
        let k = j.height / j.width;
        // 比较d，e的位置关系
        let h = c.y < e.y ? -1 : 1, f = c.x < e.x ? -1 : 1, g, i;
        // i为x，g为y
        if (Math.abs(l) > k && h == -1) {
            // console.log(1);
            g = e.y - j.height / 2;
            i = e.x + h * j.height / 2 / l
        } else if (Math.abs(l) > k && h == 1) {
            // console.log(2);
            g = e.y + j.height / 2;
            i = e.x + h * j.height / 2 / l
        } else if (Math.abs(l) < k && f == -1) {
            // console.log(3);
            g = e.y + f * j.width / 2 * l;
            i = e.x - j.width / 2
        } else if (Math.abs(l) < k && f == 1) {
            // console.log(4);
            g = e.y + j.width / 2 * l;
            i = e.x + j.width / 2
        }
        return {X: i, Y: g}
    }
}

// 装所有拖动小块用的大框框,option 中height,width为大框的尺寸
class dragBigBox {
    // dad为一个d3对象，表示了bigBox将被放在哪里
    constructor(dad, option) {
        if (typeof dad === 'string' && dad[0] == '#') {
            dad = d3.select(dad)
        }
        this.option = option || {}
        this.option.height = this.option.height || 500
        this.option.width = this.option.width || 500
        this.smallIdObj = {}; //里面装的所有的小框框，以id为键，以其box对象为值
        this.lineObj = {};
        this.movingEle = undefined;  //正在被拖动的对象
        this.selectEle = undefined;  // 当前被选择的对象
        this.mode = 'normal'  // 运行模式,normal为正常选择与拖动,move为移动整个svg
        this.X = 0
        this.Y = 0
        this.oldMouseX = 0
        this.oldMouseY = 0
        // 事件回调
        this.onSelect = (ele) => {
        };  // 先显示小框，后调用
        this.onMouseEnter = (ele, event) => {
        };  // 鼠标进入小框时触发
        this.onClickBlank = (event) => {
        };  // 鼠标点击空白处时触发
        this.onDragBox = (boxObj) => {
        };  // 拖动小块时触发


        this.id = GenNonDuplicateID();  //为大框框设置id
        this.svg = dad.append('svg') // 添加大框框到文档中
            .attr('id', this.id)
            .attr('height', this.option.height + 'px')
            .attr('width', this.option.width + 'px')
            .attr('class', 'dragSvg')

            // 鼠标移动时，移动被拖动组件，movingEle的X,Y为位置，然后调用renewMove
            .on('mousemove', () => {
                if (this.movingEle) {
                    let box = this.movingEle;
                    box.X = d3.event.pageX - box.oldMouseX + box.oldX;
                    box.Y = d3.event.pageY - box.oldMouseY + box.oldY;
                    box.renewMove();
                    if (box.isBox) {
                        this.onDragBox(box)
                    }
                }
            })
            // 鼠标松开时丢下被移动组件
            .on('mouseup', (e) => {
                this.movingEle = undefined;
            })
            // 点击时取消选择
            .on('click', (d) => {
                // console.log('click', this.selectEle)
                if (this.selectEle) {
                    this.cancelSelect(this.selectEle)
                }
                this.onClickBlank(d3.event)
            })
            // 鼠标点svg时运行运行,用来拖动svg
            .on('mousedown', (d) => {

                if (this.mode === 'move') {
                    let e = d3.event
                    this.oldMouseX = e.pageX
                    this.oldMouseY = e.pageY
                    this.oldX = this.X
                    this.oldY = this.Y
                    console.log(e.pageX, e.pageY);
                    this.movingEle = this
                }


            })
            // 箭头
            .html('<defs>\n' +
                '        <marker id="markerArrow" markerWidth="8" markerHeight="8" refx="2" refy="5" orient="auto">\n' +
                '            <path d="M2,2 L2,8 L8,5 L2,2" style="fill: black;"/>\n' +
                '        </marker>\n' +
                '        <marker id="markerArrowRed" markerWidth="8" markerHeight="8" refx="2" refy="5" orient="auto">\n' +
                '            <path d="M2,2 L2,8 L8,5 L2,2" style="fill: red;"/>\n' +
                '        </marker>\n' +
                '    </defs>');

        if (option.load) {
            this.load(option.load)
            delete option.load
        }

    }

    // 为大框添加小box,小box自动添加到smallIdObj里面
    addSmallBox(data, option) {
        let ele = new dragSmallBox(this, data, option);
        this.smallIdObj[ele.id] = ele;
        return ele.id
    }

    addLine(idFrom, idTo, data, option) {
        // console.log('addLine', idFrom, idTo)
        let line = new dragLine(this, idFrom, idTo, data, option)
        this.lineObj[line.id] = line
        return line.id
    }

    ele(tag) {
        if (tag) {
            return d3.select('#' + this.id).select(tag)
        } else {
            return d3.select('#' + this.id)
        }
    }

    // 输入id或id数组
    reDraw(idOridList) {
        if (typeof idOridList === 'string') {
            this.smallIdObj[idOridList].reDraw()
        } else {
            for (let i in idOridList) {
                this.smallIdObj[idOridList[i]].reDraw()
            }
        }
    }

    // 重画一个box相连的线
    renewLineByBox(boxIdOrObj) {
        let line
        if (typeof boxIdOrObj === 'string') {
            line = this.smallIdObj[boxIdOrObj].line
        } else {
            line = boxIdOrObj.line
        }
        for (let i in line) {
            line[i].renewMove()
        }
    }

    // 通过id选择小块或线
    select(id) {
        if (this.smallIdObj[id]) {
            return this.smallIdObj[id]
        } else if (this.lineObj[id]) {
            return this.lineObj[id]
        } else {
            return undefined
        }

    }

    // 将整个框保存为一个json字符串
    save() {
        let str = {
            box: {},
            line: {}
        }
        for (let i in this.smallIdObj) {
            let box = this.smallIdObj[i]
            str.box[i] = {
                id: box.id,
                data: box.data,
                option: box.option,
                X: box.X,
                Y: box.Y
            }
        }
        for (let i in this.lineObj) {
            let li = this.lineObj[i]
            str.line[i] = {
                id: li.id,
                data: li.data,
                option: li.option,
                from: li.fromBox.id, // 两连接点的id
                to: li.toBox.id,
                midX: li.mid.X,  //中点位置
                midY: li.mid.Y,
                textX: li.textPosition.X,  // 文字相对位置
                textY: li.textPosition.Y
            }
        }
        return JSON.stringify(str)
    }

    // 加载保存的字符串
    load(str) {
        let obj = JSON.parse(str)
        console.log(obj)
        for (let i in obj.box) {
            let box = obj.box[i]
            box.option._id = box.id
            let boxId = this.addSmallBox(box.data, box.option)
            console.log(boxId);
            this.select(boxId).setLocation(box.X, box.Y)
        }
        for (let i in obj.line) {
            let li = obj.line[i]
            li.option._id = li.id
            li.option._textX = li.textX
            li.option._textY = li.textY
            li.option._midP = {
                X: li.midX,
                Y: li.midY
            }
            let lineId = this.addLine(li.from, li.to, li.data, li.option)
            this.select(lineId).renewMove()
        }
    }

    // 选择和强调
    selectIt(ele) {
        if (this.selectEle) {
            this.cancelSelect(this.selectEle)
        }
        this.selectEle = ele;
        if (ele.isBox) {
            // this.movingEle = ele;
            ele.strong = ele.G.append('g').attr('fill', 'none').attr('stroke', 'black').attr('stroke-width', 2)
            ele.strong.append('path')
                .attr('d', line([[-5, 15], [-5, -5], [15, -5]]))
            ele.strong.append('path')
                .attr('d', line([[ele.width + 5, 15], [ele.width + 5, -5], [ele.width - 15, -5]]))
            ele.strong.append('path')
                .attr('d', line([[-5, ele.height - 15], [-5, ele.height + 5], [15, ele.height + 5]]))
            ele.strong.append('path')
                .attr('d', line([[ele.width - 15, ele.height + 5], [ele.width + 5, ele.height + 5], [ele.width + 5, ele.height - 15]]))
        } else if (ele.isLine) {
            ele.path.attr('stroke', 'red')
                .attr('marker-end', "url(#markerArrowRed)");
            ele.midPoint.attr('stroke', 'red')
        }
        this.onSelect(ele)  // 选择回调
    }

    //取消选择
    cancelSelect(ele) {
        // console.log(ele.isLine);
        if (ele.isBox) {
            ele.strong.remove()
        } else if (ele.isLine) {
            ele.path.attr('stroke', 'black')
                .attr('marker-end', "url(#markerArrow)");
            ele.midPoint.attr('stroke', 'black');
        }
    }

    // 完全清空
    clear() {
        for (let i in this.smallIdObj) {
            this.smallIdObj[i].remove()
        }
    }

    //更新大框整体的移动
    renewMove() {
        this.svg.attr('transform', 'translate(' + this.X + ',' + this.Y + ')')
    }

    //改变模式
    changeMode(newMode) {

        if (newMode === this.mode) {
            return
        } else if (this.mode === 'normal' && newMode === 'move') {
            this.svg.style('cursor', 'move')
        } else if (this.mode === 'move' && newMode === 'normal') {
            this.svg.style('cursor', 'auto');
            this.movingEle = undefined;
        }
        this.mode = newMode
    }

}

// 拖动小框
class dragSmallBox {
    // dad为装小框的大框对象，data为小框的内容,text为文本,src为链接（视频或图片的），color,backgroundColor,edgeColor为字，背景，边框的颜色
    // option.mode为显示模式，其中可包含字符：v,i,t分别表示视频，图片，文字，mHeight和mWidth表示了
    constructor(dad, data, option) {
        // 数据初始化
        this.option = option || {}
        this.id = this.option._id || GenNonDuplicateID();   //有_id表示为为加载
        this.data = data || {}
        delete this.option._id
        this.option.color = this.option.color || 'black';
        this.option.backgroundColor = this.option.backgroundColor || 'skyblue';
        this.option.edgeColor = this.option.edgeColor || 'orange';
        this.option.mode = this.option.mode || 't'
        this.option.mHeight = this.option.mHeight || 100;
        this.option.mWidth = this.option.mWidth || 100;
        // 初始化结束

        this.isBox = true
        this.isLine = false

        this.dad = dad;
        this.line = [];// 所有与这个小框相连的线对象
        this.X = 0;
        this.Y = 0;
        this.width = 100;
        this.height = 80;
        // 以下四个用来控制拖拽
        this.oldX = 0;
        this.oldY = 0;
        this.oldMouseX = 0;
        this.oldMouseY = 0;
        // this.data = {
        //     text: this.data.text
        // }
        this.draw();
    }

    // 将小框画进大框里
    draw() {
        let dad = this.dad;

        // 向大框中添加小框
        this.G = dad.svg.append('g')
            .attr('id', this.id)
            .attr('class', 'dragSmall')
            .attr('fill', 'black')

        // 添加背景框
        this.rect = this.G
            .append('rect')
            .attr('height', this.height + 'px')
            .attr('width', this.width + 'px')
            .attr('fill', this.option.backgroundColor)
            .attr('stroke', this.option.edgeColor)
            .attr('stroke-width', 2)
            .attr('rx', 8)
            .attr('ry', 8)
            .style('cursor', 'move');

        let haveImg = this.option.mode.match('i')
        // 添加图片
        if (haveImg) {
            // console.log(this.data.src);
            this.img = this.G.append('image')
                .attr('href', this.data.src)
                .attr('height', this.option.mHeight)
                .attr('width', this.option.mWidth)
                .attr('y', 10)
                .attr('preserveAspectRatio', 'none meet')
        }

        //text用来装框中的文字
        this.text = this.G
            .selectAll('text')
            .data([this.data.text])
            .enter()
            .append('text')
            .text((d) => {
                return d;
            })
            .attr('fill', this.option.color)
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "middle")
            .attr('x', this.width / 2)
            .attr('y', (haveImg ? this.option.mHeight + 40 : this.height / 2))
            .attr('display', this.option.mode.match('t') ? 'auto' : 'none');


        this.G
        // 开始拖拽
            .on('mousedown', () => {
                // dad.movingEle = this;
                dad.selectIt(this)
                dad.movingEle = this
                this.oldMouseX = d3.event.pageX;
                this.oldMouseY = d3.event.pageY;
                this.oldX = this.X;
                this.oldY = this.Y;
            })
            // 结束拖拽
            .on('mouseup', (e) => {
                dad.movingEle = undefined;
            })
            .on('click', (e) => {
                // console.log(d3.event);
                d3.event.stopPropagation()
            })
            .on('mouseenter', (e) => {
                this.dad.onMouseEnter(this, d3.event)
            })

        this.renewMove()
        // 更新方框尺寸
        this.renewSize()
    }

    //更新方框尺寸
    renewSize() {
        let textSize = this.text.node().getBBox();
        let w, h;
        let haveImg = this.option.mode.match('i')
        this.height = 80
        this.width = 100
        if (haveImg) {
            w = this.option.mWidth > textSize.width ? this.option.mWidth : textSize.width
            h = textSize.height + this.option.mHeight + 10
        } else {
            w = textSize.width
            h = textSize.height
        }
        if (w >= 80) {
            this.width = w * 1.25

        }
        // console.log(textSize,this.option,textSize.height + (haveImg ? this.option.mHeight + 10 : 0));
        if (h > 70) {
            this.height = h + 30
        }
        this.rect.attr('height', this.height)
        this.rect.attr('width', this.width)
        this.text.attr('x', this.width / 2)
        if (haveImg) {
            this.img.attr('x', (this.width - this.option.mWidth) / 2)
        }
        // 更新移动
        if (this.dad.selectEle === this) {
            this.dad.selectIt(this)
        }
    }

    // 重画，先删除再画进大框里
    reDraw() {
        this.G.remove()
        this.draw()
    }

    // 重画连线
    renewLine() {
        for (let i in this.line) {
            this.line[i].renewMove()
        }
    }

    // 将这个G移动到x，y标记的位置
    renewMove() {
        // console.log(this.X, this.Y)
        this.G.attr('transform', 'translate(' + this.X + ',' + this.Y + ')');
        this.renewLine()
    }

    //动态选择元素
    ele(tag) {
        if (tag) {
            return d3.select('#' + this.id + '>' + tag)
        } else {
            return d3.select('#' + this.id)
        }

    }

    // 设置数据
    setData(dataObj) {
        // this.data.text = dataObj.text || this.data.text
        for (let i in dataObj) {
            this.data[i] = dataObj[i]
        }
        this.text.text(this.data.text)
        this.renewSize()
        this.renewLine()
    }

    // 设置位置
    setLocation(x, y) {
        this.X = x
        this.Y = y
        this.renewMove()
        this.renewLine()
    }

    // 中心位置
    center() {
        return {
            X: this.X + this.width / 2,
            Y: this.Y + this.height / 2
        }
    }

    remove() {
        for (let i in this.line) {
            this.line[i].remove()
        }
        this.G.remove()
        delete this.dad.smallIdObj[this.id]
    }

    // 获取所有进入或离开小框的线,输入为in或out，表示获取进入还是离开它的线对象
    getLine(inOrOut) {
        let ans = [];
        // console.log(this.line);
        for (let i in this.line) {
            if (inOrOut === 'in') {
                if (this.line[i].toBox === this) {
                    ans.push(this.line[i])
                }
            } else if (inOrOut === 'out') {
                if (this.line[i].fromBox === this) {
                    ans.push(this.line[i])
                }
            }
        }
        return ans;
    }
}

// 拖动框的连线,option包括haveMid有中点（bool)
class dragLine {
    constructor(dad, fromId, toId, data, option) {
        this.dad = dad
        this.data = data || {}
        this.option = option || {}
        // 加载id
        this.id = this.option._id || GenNonDuplicateID()
        delete this.option._id

        this.dad = dad
        this.fromBox = (typeof  fromId === 'string') ? dad.smallIdObj[fromId] : fromId
        this.toBox = (typeof toId === 'string') ? dad.smallIdObj[toId] : toId

        this.isBox = false
        this.isLine = true

        // 文字位置控制
        this.textPosition = {
            X: this.option._textX || 0,
            Y: this.option._textY || 0,
            // 以下四个用来控制拖拽
            oldX: 0,
            oldY: 0,
            oldMouseX: 0,
            oldMouseY: 0,
            renewMove: () => {
                this.renewTextPosition()
            }
        }
        // console.log('123',this.fromBox);

        this.mid = this.option._midP || center(this.fromBox.center(), this.toBox.center())
        delete this.option._midP, this.option._textX, this.option._textY
        this.mid.renewMove = () => {
            this.renewMove()
        };

        // 以下四个用来控制拖拽
        this.mid.oldX = 0;
        this.mid.oldY = 0;
        this.mid.oldMouseX = 0;
        this.mid.oldMouseY = 0;
        console.log(this.mid)
        this.draw()
        if (typeof fromId === 'string') {
            dad.smallIdObj[fromId].line.push(this)
        } else {
            fromId.line.push(this)
        }
        if (typeof toId === 'string') {
            dad.smallIdObj[toId].line.push(this)
        } else {
            toId.line.push(this)
        }

        return this.id
    }

    // 画线
    draw() {
        let connPFrom = dt.connPoint(this.fromBox, this.mid)
        let connPTo = dt.connPoint(this.toBox, this.mid)
        this.G = this.dad.svg.append('g').attr('id', this.id)
            .on('click', () => {
                d3.event.stopPropagation()
            })
            .on('mousedown', () => {
                this.dad.selectIt(this)
            })
            .on('dblclick', () => {
                console.log('111');
                if (this.option.haveMid) {
                    this.cancelMid()
                } else {
                    this.showMid()
                }
            })
        // 画线
        this.path = this.G.selectAll('path')
            .data([{
                from: [connPFrom.X, connPFrom.Y],
                to: [connPTo.X, connPTo.Y],
                text: this.data.text,
                mid: this.mid
            }])
            .enter()
            .append('path')
            .attr('d', (d) => {
                return line([d.from, [d.mid.X, d.mid.Y], d.to])
            })
            .attr('fill', 'none')
            .attr('stroke', 'black')
            .attr('stroke-width', 1)
            .attr('marker-end', "url(#markerArrow)");

        // 画文字
        this.drawText()

        //画中点框
        this.midPoint = this.G
            .append('rect')
            .attr('stroke', 'black')
            .attr('stroke-width', 3)
            .attr('x', this.mid.X)
            .attr('y', this.mid.Y)
            // .attr("dominant-baseline", "middle")
            // .attr("text-anchor", "middle")
            .attr('width', 2)
            .attr('height', 2)
            .style('cursor', 'move')
            .style('display', this.option.haveMid ? 'absolute' : 'none')
            // 开始拖拽
            .on('mousedown', () => {
                this.dad.movingEle = this.mid;
                this.mid.oldMouseX = d3.event.pageX;
                this.mid.oldMouseY = d3.event.pageY;
                this.mid.oldX = this.mid.X;
                this.mid.oldY = this.mid.Y;
            })
            // 结束拖拽
            .on('mouseup', (e) => {
                this.dad.movingEle = undefined;
            })

    }

    // 画文字
    drawText() {
        if (this.data.text) {
            this.text = this.G.selectAll('text')
                .data([this.data.text])
                .enter()
                .append('text')
                .attr('fill', 'black')
                .attr('x', this.mid.X + this.textPosition.X)
                .attr('y', this.mid.Y + this.textPosition.Y)
                .attr("dominant-baseline", "middle")
                .attr("text-anchor", "middle")
                .text((d) => {
                    return d
                });
            console.log(this.text);
            this.text
            // 开始拖拽
                .on('mousedown', () => {
                    this.dad.movingEle = this.textPosition;
                    this.textPosition.oldMouseX = d3.event.pageX;
                    this.textPosition.oldMouseY = d3.event.pageY;
                    this.textPosition.oldX = this.textPosition.X;
                    this.textPosition.oldY = this.textPosition.Y;
                })
                // 结束拖拽
                .on('mouseup', (e) => {
                    this.dad.movingEle = undefined;
                })
        }
    }

    // 更新移动数据
    renewMove() {
        let connPFrom, connPTo

        //画中点
        if (this.option.haveMid) {
            connPFrom = dt.connPoint(this.fromBox, this.mid)
            connPTo = dt.connPoint(this.toBox, this.mid)
        } else {
            connPFrom = dt.connPoint(this.fromBox, this.toBox.center())
            connPTo = dt.connPoint(this.toBox, this.fromBox.center())
            let midP = center(connPFrom, connPTo)
            this.mid.X = midP.X
            this.mid.Y = midP.Y
        }

        this.path.attr('d', line([
            [connPFrom.X, connPFrom.Y],
            [this.mid.X, this.mid.Y],
            [connPTo.X, connPTo.Y]
        ]))

        if (this.midPoint) {
            this.midPoint
                .attr('x', this.mid.X)
                .attr('y', this.mid.Y)
        }
        if (this.text) {
            this.renewTextPosition()
        }
    }

    renewTextPosition() {
        // 这里的that就是this.textPosition
        // console.log(this)
        this.text.attr('x', this.mid.X + this.textPosition.X)
            .attr('y', this.mid.Y + this.textPosition.Y)
    }

    //隐藏中点，变为直线
    cancelMid() {
        this.option.haveMid = false;
        this.midPoint.style('display', 'none')
        this.renewMove()
    }

    // 重新显示中点
    showMid() {
        this.option.haveMid = true;
        this.midPoint.style('display', 'block')
    }

    remove() {
        this.G.remove()
        delete this.dad.lineObj[this.id]
    }

    // 设置数据
    setData(dataObj) {
        // this.data.text = dataObj.text || this.data.text
        for (let i in dataObj) {
            this.data[i] = dataObj[i]
        }
        this.text.text(this.data.text)
    }
}

//实例画drag
let drag = new dragBigBox('#myDiv', {
    width: 1000,
    height: 1000,
    // load: '{"box":{"a5igag34jux400000000":{"id":"a5igag34jux400000000","data":{"text":"12345678901234"},"option":{},"X":294,"Y":95},"a78l6bh1afh000000000":{"id":"a78l6bh1afh000000000","data":{"text":"灏宝宝"},"option":{},"X":42,"Y":161},"a1l7v1i1klpy8000000":{"id":"a1l7v1i1klpy8000000","data":{"text":"abc..............aaaaaaaaaaaaa"},"option":{},"X":220,"Y":350}},"line":{"afuy2pbo22mg0000000":{"id":"afuy2pbo22mg0000000","data":{"text":"1->2"},"option":{},"from":"a5igag34jux400000000","to":"a78l6bh1afh000000000","midX":125,"midY":355,"textX":-12,"textY":21},"ahsa1fhahnvs0000000":{"id":"ahsa1fhahnvs0000000","data":{},"option":{},"from":"a5igag34jux400000000","to":"a1l7v1i1klpy8000000","midX":419.298828125,"midY":258,"textX":0,"textY":0},"a2m8p42pwvt200000000":{"id":"a2m8p42pwvt200000000","data":{},"option":{},"from":"a78l6bh1afh000000000","to":"a1l7v1i1klpy8000000","midX":70.298828125,"midY":474,"textX":0,"textY":0}}}'
});

// 设置一个对象的数据，将name作为name和text分别放进data，输入可以是小框数据对象或者连线数据对象
let setEleData = (obj) => {
    obj.data = obj.data || {};
    obj.option = obj.option || {};
    obj.data.text = obj.name;
    obj.data.name = obj.name;
    //初始化默认数据
    obj.data.att = obj.data.att || '';
    let change = obj.data.change;
    for (let j in change) {
        if (change[j].kind === 't') {
            change[j].default = change[j].default || ''
        }
    }
};

let detUl = $('#detail ul');

// 详细展示框，这些是系统保留的必选项
let det = {
    name: $('#det-name'), //组件名,
    text: $('#det-text'), //组件显示文字
    X: $('#det-X'),
    Y: $('#det-Y'),
    att: $('#det-att'), //组件备注
    butt: $('#det-button')

};

let otherDet = {};

//隐藏全部的小框
let hideAllDet = () => {
    let list = detUl[0].children
    for (let i in det) {
        det[i].css({
            display: 'none'
        })
    }
    for (let i in otherDet) {
        otherDet[i].remove()
    }
}

// 选择某一元素后的回调,小框对象
drag.onSelect = (ele) => {
    console.log(ele);
    currentEle = ele;
    hideAllDet();
    det.butt.css({display: ''})
    // 显示额外的
    let change = ele.option.change
    for (let i in change) {
        let li = $('<li>').attr('id', 'det-' + change[i].name).appendTo(detUl)
        li.append($('<p>').text(change[i].name));
        if (change[i].kind === 't') {// 文字
            $('<input>').val(ele.data[change[i].name]).appendTo(li)
        } else { // 选择
            let select = $('<select>').appendTo(li)
            let selectIndex = 0;
            for (let j in change[i].av) {
                let text = change[i].av[j]; // 关键字名
                let option = $('<option value="' + text + '">').text(text); // 一个选项$对象
                if (text === ele.data[change[i].name]) {
                    selectIndex = j;
                    console.log(j, select);
                }
                option.appendTo(select)
            }
            select[0].selectedIndex = selectIndex
        }
        otherDet[change[i].name] = li
    }
    det.name.css({display: ''})
    det.text.css({display: ''})
    det.att.css({display: ''})
    det.name[0].children[1].innerHTML = currentEle.data.name
    det.text[0].children[1].value = currentEle.data.text
    det.att[0].children[1].value = currentEle.data.att
    if (ele.isBox) {
        // 块块出现
        det.X.css({display: ''})
        det.Y.css({display: ''})
        // 块块加字
        det.X[0].children[1].value = currentEle.X
        det.Y[0].children[1].value = currentEle.Y
    }
};
// 点击空白处的回调
drag.onClickBlank = (e) => {
    console.log(e);
    currentEle = undefined

    // 详情框清空
    hideAllDet();

    //处理选线框删除
    clearTimeout(selLineDivTimer)
    if (selLineDiv) {
        selLineDiv.remove()
    }
    det.butt.css({
        display: 'none'
    })
}

// 鼠标进入块块后的回调，ele为小框对象，event为鼠标事件
drag.onMouseEnter = (ele, event) => {
    // console.log(ele, event);
    if (selLineDiv) {
        selLineDiv.remove()
    }
    clearTimeout(selLineDivTimer);
    if (!currentEle || currentEle === ele) {
        return
    }
    let allowList = toolHass[currentEle.data.name].conn(ele); // 可使用的连接
    if (!allowList) {
        return
    }
    //显示可选连接
    if (ele.isBox) {
        selLineDiv = $('<div class="selectLine">')
            .css({
                // 获取组件绝对位置的语句
                top: event.target.getBoundingClientRect().top + ele.height,
                left: event.x
            })
            .appendTo($('body'))

        // 添加选项
        for (let i in allowList) {
            selLineDiv.append(
                $('<div>').text(allowList[i].name)
                    .on('click', () => {
                        setEleData(allowList[i]);
                        drag.addLine(currentEle, ele, allowList[i].data, allowList[i].option)
                    })
            )
        }

        // 删除连线选择小块
        selLineDivTimer = setTimeout(() => {
            selLineDiv.remove()
        }, 5000)
    }
}

// 鼠标拖动小块时的回调
drag.onDragBox = (box) => {
    // console.log(box.X, box.Y);
    det.X[0].children[1].value = box.X
    det.Y[0].children[1].value = box.Y
}

// 保存小块内容
$('#save-button').on('click', () => {
    let change = currentEle.option.change;
    let exData = {
        att: det.att[0].children[1].value,
        text: det.text[0].children[1].value
    }
    for (let i in change) {
        let val = $('#det-' + change[i].name)[0].children[1].value
        console.log(val)
        exData[change[i].name] = val
    }
    currentEle.setData(exData)
    if (currentEle.isBox) {
        currentEle.setLocation(parseInt(det.X[0].children[1].value),
            parseInt(det.Y[0].children[1].value))
    }
    alert('保存成功')
})

// 删除元素
$('#del-button').on('click', () => {
    currentEle.remove()
    drag.onClickBlank()
});

// 顶部的保存和加载按钮
$('#save-all-button').on('click', () => {
    let str = drag.save();
    console.log(str);
    // 如果需要使用json传递数据,则直接:
    // $.post('/data',str);
    // 如果要与url形式传递数据，则：
    $.post('/data', JSON.parse(str))
})
$('#load-all-button').on('click', () => {
    console.log('load');
    drag.clear();
    drag.load(
        '{"box":{"a99ab7yy4ps00000000":{"id":"a99ab7yy4ps00000000","data":{"text":"输入点C","name":"输入点C","att":""},"option":{"backgroundColor":"white","edgeColor":"black","color":"black","mode":"t","mHeight":100,"mWidth":100},"X":21,"Y":177},"ar81htaw916o0000000":{"id":"ar81htaw916o0000000","data":{"text":"输出点R","name":"输出点R","att":""},"option":{"backgroundColor":"white","edgeColor":"black","color":"black","mode":"t","mHeight":100,"mWidth":100},"X":757,"Y":178},"auafqiwjo0680000000":{"id":"auafqiwjo0680000000","data":{"text":"引出点","name":"引出点","att":""},"option":{"color":"black","backgroundColor":"skyblue","edgeColor":"orange","mode":"t","mHeight":100,"mWidth":100},"X":594,"Y":178},"a68c78z5j6so0000000":{"id":"a68c78z5j6so0000000","data":{"text":"单位响应","name":"单位响应","att":"","比例系数":"正反馈（+1）"},"option":{"change":[{"name":"比例系数","kind":"ch","av":["正反馈（+1）","负反馈（-1）"]}],"color":"black","backgroundColor":"skyblue","edgeColor":"orange","mode":"t","mHeight":100,"mWidth":100},"X":401,"Y":386},"a1xfifawqsleo0000000":{"id":"a1xfifawqsleo0000000","data":{"src":"img/比较点.png","text":"比较点","name":"比较点","att":""},"option":{"mHeight":50,"mWidth":50,"mode":"i","color":"black","backgroundColor":"skyblue","edgeColor":"orange"},"X":208,"Y":181},"aarm402t8f08000000":{"id":"aarm402t8f08000000","data":{"text":"G(s)","name":"自定义传递函数","att":"","传递函数":"x^2/2"},"option":{"change":[{"name":"传递函数","kind":"t","default":"x"}],"color":"black","backgroundColor":"skyblue","edgeColor":"orange","mode":"t","mHeight":100,"mWidth":100},"X":400,"Y":178}},"line":{"a8f3py2x7wko0000000":{"id":"a8f3py2x7wko0000000","data":{"text":"conn1","name":"conn1","att":""},"option":{"change":[{"name":"连接强度","kind":"t","default":"100%"},{"name":"连接重要性","kind":"ch","av":["高","低"]}]},"from":"auafqiwjo0680000000","to":"ar81htaw916o0000000","midX":725.5,"midY":218,"textX":0,"textY":0},"a3fk3l2usjkq0000000":{"id":"a3fk3l2usjkq0000000","data":{"text":"conn1","name":"conn1","att":""},"option":{"change":[{"name":"连接强度","kind":"t","default":"100%"},{"name":"连接重要性","kind":"ch","av":["高","低"]}],"haveMid":true},"from":"auafqiwjo0680000000","to":"a68c78z5j6so0000000","midX":638.5,"midY":427,"textX":0,"textY":0},"aj3apvf3klhk0000000":{"id":"aj3apvf3klhk0000000","data":{"text":"conn1","name":"conn1","att":"","连接强度":"100","连接重要性":"高"},"option":{"change":[{"name":"连接强度","kind":"t","default":"100%"},{"name":"连接重要性","kind":"ch","av":["高","低"]}]},"from":"a99ab7yy4ps00000000","to":"a1xfifawqsleo0000000","midX":164.5,"midY":219,"textX":0,"textY":0},"a6tkuunkg25000000000":{"id":"a6tkuunkg25000000000","data":{"text":"conn2","name":"conn2","att":""},"option":{},"from":"a1xfifawqsleo0000000","to":"aarm402t8f08000000","midX":354,"midY":219.5,"textX":0,"textY":0},"ag183kfzqccw0000000":{"id":"ag183kfzqccw0000000","data":{"text":"conn2","name":"conn2","att":""},"option":{},"from":"aarm402t8f08000000","to":"auafqiwjo0680000000","midX":547,"midY":218,"textX":0,"textY":0},"a35o9qqmf4x600000000":{"id":"a35o9qqmf4x600000000","data":{"text":"conn1","name":"conn1","att":""},"option":{"change":[{"name":"连接强度","kind":"t","default":"100%"},{"name":"连接重要性","kind":"ch","av":["高","低"]}],"haveMid":true},"from":"a68c78z5j6so0000000","to":"a1xfifawqsleo0000000","midX":259.5,"midY":424.5,"textX":0,"textY":-1}}}'
    )
})

let toolSt = [];
let toolDepth = 0;  //工具应该保持的深度,0为空

// 递归删除元素，达到删除工具到指定深度的目的,0
let delTool = () => {
    console.log('del', toolDepth);
    let end = toolSt.length
    for (let i = toolDepth; i < end; i++) {
        toolSt[i].remove()
    }
}

// 将指定ul对象放到栈里面
let addTool = (depth, $Obj) => {
    for (let i = depth; i < toolSt.length; ++i) {
        console.log(toolSt[i]);
        toolSt[i].remove()

    }
    toolSt[depth] = $Obj
    toolDepth = depth + 1
}

//toolArr为工具栏数组，depth为当前在添加的li所在的ul的位置，0为在根目录中添加，root为上一个ul，fix为加下一个ul时的修值
let showTool = (toolArr, depth, root, fix) => {
    if (depth == 0) {
        let tmpDelTimer
        root.on('mouseenter', () => {
            tmpDelTimer = setTimeout(() => {
                toolDepth = 0
                delTool()
            }, 1000)
        })
            .on('mousemove', () => {
                clearTimeout(tmpDelTimer)
            })
            .on('mouseleave', () => {
                toolDepth = 0
                // 延时删除
                setTimeout(() => {
                    console.log('del while leave root');
                    delTool()
                }, 2000)
            })
    }

    for (let i in toolArr) {
        //遍历的同时将组件加到hass
        toolHass[toolArr[i].name] = toolArr[i]
        // tool为将下面的每一个小框li
        let tool = $('<li>').appendTo(root)
        if (toolArr[i].img) {
            tool.append($("<img src='" + toolArr[i].img + "'>"))
        }
        tool.append($('<div>').text(toolArr[i].name))

        // 递归添加子对象，if下为有子对象的大标签
        if (toolArr[i].child) {
            let tmpDelTimer
            tool.append(
                $('<img src="./img/arrow.svg" height="10px" width="10px">')
                    .css({
                        position: 'absolute',
                        right: 0,
                    })
            )
            // 鼠标进入时显示下一个ul
            tool.on('mouseenter', (e) => {
                toolDepth = depth
                console.log(toolDepth);
                let position = tool.offset()
                console.log(tool.width(), tool.offset());
                // son是一个列表，它表示新出现的ul框框
                let son = $('<ul>').attr('class', 'smallToolBox')
                    .css({
                        top: position.top - fix.top,
                        left: position.left + tool.width() - fix.left
                    })
                    // 鼠标进入时设置深度
                    .on('mouseenter', () => {
                        toolDepth = depth + 1;
                        console.log('enter', toolDepth);
                        tmpDelTimer = setTimeout(() => {
                            toolDepth = 0
                            delTool()
                        }, 100)
                    })
                    .on('mousemove', () => {
                        // console.log('move');
                        clearTimeout(tmpDelTimer)
                    })
                    // 鼠标离开时删除
                    .on('mouseleave', () => {
                        toolDepth = 0
                        console.log(toolDepth);
                        // 延时删除
                        setTimeout(() => {
                            delTool()
                        }, 100)

                    });
                son.appendTo($('#toolDiv'))
                // 压栈
                addTool(depth, son)
                // 递归为新的ul加li
                showTool(toolArr[i].child, depth + 1, son, {
                    top: fix.top + 2,
                    left: fix.left
                })
            })

        }
        // else 下为功能小标签
        else {
            tool.on('click', () => {
                toolArr[i].onclick(toolArr[i])
            })
        }


    }
}

// 调用showtool函数,并设置竖直位置修正
let tmp = $('#toolDiv').offset()
showTool(toolData, 0, $('#toolRoot'), {
    top: tmp.top + 2,
    left: tmp.left + 2
})

let saveAll = $('#save-all-button')
saveAll.on('mouseover', () => {
    console.log('1234')
})




