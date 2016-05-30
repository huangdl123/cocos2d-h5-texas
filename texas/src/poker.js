var PokerCard = cc.Sprite.extend({
    _cardWidth: 70,
    _cardHeight: 95,
    ctor: function (num, color, type) {
        this._super('poker.png', cc.rect(4 * this._cardWidth, 4 * this._cardHeight, this._cardWidth, this._cardHeight));
        this._num = num;
        this._color = color;
        this._type = type;
        this._face = new cc.Sprite('poker.png', cc.rect((num - 1) * this._cardWidth, (4 - color) * this._cardHeight, this._cardWidth, this._cardHeight));

        this.setScale(1 / 2);
        this.setPosition(-500, -500);
    },
    setScale: function (scale) {
        this._super(scale);
        this._face.setScale(scale);
    },
    setPosition: function (x, y) {
        this._super(x, y);
        this._face.setPosition(x, y);
    },
    moveTo: function (p) {
        var pokerMove = cc.moveTo(1.0, cc.p(p.x, p.y));
        var pokerRotate = cc.rotateBy(1.0, 360, 360);
        var poker = this;
        var pokerFaceMove = pokerMove.clone();
        var pokerFaceRotate = pokerRotate.clone();
        if (arguments[1] === true) {
            pokerMove.stop = function () {
                this.target = null;
                poker.show();
            };
        }
        this._face.runAction(pokerFaceMove);
        this._face.runAction(pokerFaceRotate);
        this.runAction(pokerMove);
        this.runAction(pokerRotate);
    },
    powerful: function () {
        var pokerScale = cc.scaleBy(1.0, this._type === 'public' ? 1.5 : 1.9);
        var pokerScaleReverse = pokerScale.reverse();

        this._face.stopAllActions();
        this._face.setScale(this._type === 'public' ? 2 / 3 : 1 / 2);
        this._face.runAction(cc.sequence(pokerScale, pokerScaleReverse).repeatForever());
    },
    moveToAndShow: function (p) {
        this.moveTo(p, true);
    },
    show: function () {
        this.setLocalZOrder(GameConst.POKER_FACE_Z);
        this._face.setLocalZOrder(GameConst.POKER_Z);
    },
    clone: function () {
        return new PokerCard(this._num, this._color);
    }
});

var Poker = {
    _pokers: [],
    create:function (num, color) {
        return Object.create(null, {
            _num: {value: num},
            _color: {value: color}
        });
    },
    init: function () {
        var types = [GameConst.POKER_HEITAO, GameConst.POKER_HONGTAO, GameConst.POKER_MEIHUA, GameConst.POKER_FANGKUAI];
        this.reset();
        for(var i=1;i<types.length;i++){
            for(var j=1;j<14;j++){
                this._pokers.push(this.create(j, types[i]));
            }
        }
        return this;
    },
    riffle: function () {
        return this._pokers.sort(function () {
            return Math.random() - 0.5;
        });
    },
    get: function () {
        return this._pokers.pop();
    },
    reset: function () {
        this._pokers.length = 0;
    }
};
