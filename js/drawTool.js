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