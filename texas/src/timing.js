var Timing = cc.DrawNode.extend({
    lineWidth: 5,
    lineColor: cc.color(0, 255, 0),
    alphaColor: cc.color(0, 0, 0),
    ctor: function (center, x0 , y0, sectionNum) {
        this._super();
        this.lines = [];
        this.allStep = sectionNum;
        this.curStep = 0;
        var lineLength = 4*(x0+y0);
        var offset = lineLength / sectionNum, curStatus = 1;
        var point1 = cc.p(center.x - x0, center.y + y0),
            point2 = cc.p(center.x + x0, center.y + y0),
            point3 = cc.p(center.x + x0, center.y - y0),
            point4 = cc.p(center.x - x0, center.y - y0);
        var points = [], resultPoint, prevPoint = point1;

        points.push(point1);
        for(var i=0;i<sectionNum;i++) {
            if (1 === curStatus) {
                if (prevPoint.x + offset <= point2.x) {
                    resultPoint = prevPoint = cc.p(prevPoint.x + offset, prevPoint.y);
                }
                else {
                    resultPoint = [point2, prevPoint = cc.p(point2.x, point2.y -(offset- (point2.x - prevPoint.x)))];
                    curStatus = 2;
                }
            }
            else if (2 === curStatus) {
                if(prevPoint.y-offset>=point3.y){
                    resultPoint = prevPoint = cc.p(point2.x, prevPoint.y-offset);
                }
                else{
                    resultPoint = [point3, prevPoint = cc.p(point3.x-(offset - (prevPoint.y - point3.y)), point3.y)];
                    curStatus = 3;
                }
            }
            else if (3 === curStatus) {
                if(prevPoint.x - offset >=point4.x){
                    resultPoint = prevPoint = cc.p(prevPoint.x-offset, point3.y);
                }
                else{
                    resultPoint = [point4, prevPoint = cc.p(point4.x, point4.y+(offset-(prevPoint.x-point4.x)))];
                    curStatus = 4;
                }
            }
            else if (4 === curStatus) {
                if(prevPoint.y+offset <= point1.y){
                    resultPoint = prevPoint = cc.p(point4.x, prevPoint.y+offset);
                }
                else{
                    resultPoint = point1;
                }
            }
            points.push(resultPoint);
        }

        this.points = points;
    },
    drawLine: function (start, end, da) {
        this.cleanup();
        var p, from, to, color = this.lineColor, drawAlpha = !!da;
        start = start || 0;
        end = end || this.points.length;
        from = this.points[start];
        drawAlpha && (color = this.alphaColor);
        for (var i = start + 1; i < end; i++) {
            to = p = this.points[i];
            if (Util.isArray(p)) {
                to = p[0];
                this.drawSegment(from, to, this.lineWidth, color);
                from = to, to = p[1];
            }
            this.drawSegment(from, to, this.lineWidth, color);
            from = to;
        }
        !drawAlpha && (this.curStep = 0);
    },
    drawStep: function () {
        if(this.curStep >= this.allStep)return;
        var from, to, fromP = this.curStep, toP = fromP + 1, p;
        if (toP > this.allStep) {
            toP = this.allStep;
        }
        to = p = this.points[toP];
        from = this.points[fromP];
        if (Util.isArray(p)) {
            to = p[0];
            this.drawSegment(from, to, this.lineWidth, this.alphaColor);
            from = to, to = p[1];
        }
        this.drawSegment(from, to, this.lineWidth, this.alphaColor);
        this.curStep++;
        if(this.curStep === this.allStep){
            var cb = this.getTimeoutCallBack();
            cb && cb.call(null, this);
            cc.log('done');
        }
    },
    stop: function (args) {
        if (this.curStep >= this.allStep) return;
        if (this.curStep > 0 && this.curStep < this.allStep) {
            this.drawLine(this.curStep, this.allStep, true);
            this.curStep = this.allStep;
        }
        var cb = this.getTimeoutCallBack();        
        cb && cb.apply(null, [this].concat(args));
        cc.log('done.');
    },
    setTimeoutCallBack: function (fn) {
        if(Util.isFunction(fn)){
            this.timeoutCallback = fn;
        }
    },
    getTimeoutCallBack: function () {
        return this.timeoutCallback;
    }
});