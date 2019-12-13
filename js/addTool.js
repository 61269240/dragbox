let toolSt = [];
let toolDepth = 0;  //工具应该保持的深度,0为空

// 递归删除元素，达到删除工具到指定深度的目的,0
let delTool = () => {

    // if (depth >= toolDepth) {
    //     return
    // }
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