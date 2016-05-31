var Dealer = cc.Sprite.extend({
    _pos: null,
    _pokers: null,
    _status: null,
    ctor: function () {
        this._super();
        var size = cc.director.getWinSize();

        this._pos = cc.rect(size.width / 2, size.height, 50, 50);
        this.rifflePoker(); 
    },
    rifflePoker: function () {
        this._pokers = Poker.init().riffle();
    },
    getAPoker: function (type) {
        var poker = Poker.get(), type = type || 'private';
        return new PokerCard(poker._num, poker._color, type);
    },
    sendPokerToPlayer: function (poker, owner) {
        poker.setPosition(this._pos.x, this._pos.y);
        poker.moveTo(cc.p(owner.x, owner.y));
    },
    sendPokerToMe: function (poker, owner) {
        poker.setPosition(this._pos.x, this._pos.y);
        poker.moveToAndShow(cc.p(owner.x, owner.y));
    },
    sendPokerToDesk: function (poker, pos) {
        poker.setPosition(this._pos.x, this._pos.y);
        poker.moveToAndShow(cc.p(pos.x, pos.y));
    },
    getThreePoker: function () {
        var poker = [], _poker;
        if(this._status === GameConst.DEALER_READY){
            for(var i=0;i<3;i++){
                _poker = Poker.get();
                _poker = new PokerCard(_poker._num, _poker._color, 'public');
                _poker.setScale(2/3);
                poker.push(_poker);
            }
            this.updateStatus(GameConst.DEALER_THREE);
        }
        return poker;
    },
    updateStatus: function (status) {
        this._status = status;
    },
    reset: function () {
        this._status = null;
    },
    getPos: function () {
        return this._pos;
    }
});