var Player = cc.Sprite.extend({
    ctor: function (name, money) {
        this._super();
        this.name = name;
        this.money = money;
        this.isActive = false; // 是否激活
        this.isLive = true; // 本局是否还活着
        this.isDeath = false; // 是否已经出局
        this.isMaster = false; // 是否是真实玩家
        this.isD = false; // 是否是庄家
        this.isSmall = false; // 是否是小盲
        this.isBig = false; // 是否是大盲
        this._pokers = [];
    },
    seatDown: function (seat) {
        seat.empty = false;
        this._seat = seat;
        var pos = this.getSeatPosition();
        pos.x -= 6;
        pos.y -= 1;
        var timeline = new Timing(pos, 46, 51, GameConst.THING_TIME*10);
        this.timeline = timeline;
        return this;
    },
    renderUI: function (sence) {
        var money = '金币：' + this.money;
        var label = new cc.LabelTTF(money, "Arial", 11);
        var nameLabel = new cc.LabelTTF(this.name, "Arial", 11);
        var pos = this.getSeatPosition();

        label.setPosition(pos.x - (20 - money.length) / 2, pos.y - 37);
        nameLabel.setPosition(pos.x - (10 - this.name.length) / 2, pos.y + 37);

        sence.addChild(this.moneyLabel = label, GameConst.FONT_Z);
        sence.addChild(nameLabel, GameConst.FONT_Z );
    },
    updateMoney: function (money) {
        this.money = money - 0;
        this.moneyLabel.setString('金币：' + this.money);
    },
    getMoney: function (money) {
        var m = money - 0;
        this.money += m;
        this.updateMoney(this.money);
    },
    putMoney: function (money) {
        var real = money;
        if(this.money - money >= 0){
            this.money -= money;
        }
        else{
            real = this.money;
            this.money = 0;
        }
        this.updateMoney(this.money);
        return real;
    },
    timing: function () {
        if(this.timeline){
            this.timeline.drawLine();
        }
    },
    getSeatPosition: function () {
        return new cc.p(this._seat.x, this._seat.y);
    },
    getOnePoker: function (poker) {
        this._pokers.push(poker);
    },
    clear: function (sence) {
        for (var i = 0; i < this._pokers.length; i++) {
            sence.removeChild(this._pokers[i]._face);
            sence.removeChild(this._pokers[i]);
        }
        this._pokers.length = 0;
    }
});