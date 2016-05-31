
var GameLayer = cc.Layer.extend({
    showWinnerTime: GameConst.SHOW_WINNER_TIME,
    smallMoney: 10,
    bigMoney: 20,
    moneyPool: 0,
    ctor: function () {
        this._super();
        this._players = [];
        this._pokers = [];
        this.clickExitTimes = 0;
        this.timingIndex = 0;
        this.activePlayer = null;
        var size = cc.director.getWinSize();

        // add background
        var bg = new cc.Sprite('bg.png');
        bg.setPosition(size.width / 2, size.height / 2);
        this.addChild(bg, 0);

        // 初始化荷官
        this._dealer = new Dealer();
        this.addChild(this._dealer);

        // 玩家入座
        var names = ["Ray", "Joey", "Tubey", "Kevin", "Tony", "HanWei", "Rui", "Jam", "Sunny"];
        for (var i = 1; i < names.length + 1; i++) {
            var player = new Player(names[i - 1], 2000);
            if(1 === i){
                player.isMaster = true;
                player.isD = true;
                this.master = player;
                this.dPlayer = player;
            }
            else if(2 === i){
                player.isSmall = true;
                this.smallPlayer = player;
            }
            else if(3 === i){
                player.isBig = true;
                this.bigPlayer = player;
            }
            player.seatDown(Seat[i]).renderUI(this);
            this.addChild(player.timeline);
            this._players.push(player);
        }

        this.playerNum = this._players.length;
        this.drawButton();
        this.begin();

        this.schedule(function () {
            this.winnerLabel && this.showWinnerTime === 0 && this.clearWinnerLabel();
            this.showWinnerTime && (this.showWinnerTime -= 1);
        }.bind(this), 1);
        this.schedule(function () {
            var p;
            for(var i=0;i<this._players.length;i++) {
                p = this._players[i];
                if (p.isLive && p.isActive && p.timeline) {
                    var skip = Math.ceil(Math.random() * p.timeline.allStep);
                    if (!p.isMaster && p.timeline.curStep > skip) {
                        p.timeline.stop();
                    }
                    else {
                        p.timeline.drawStep();
                    }
                }
            }
        }.bind(this), .1);
    },
    begin: function () {
        var player, left = [], turn = false, self = this;
        // 确定发牌序列，并唤醒弃牌者，注册计时超时处理
        for(var i=0;i<this._players.length;i++) {
            player = this._players[i];
            if(player.isLive === false && player.isDeath === false){
                player.isLive = true;
            }
            if(!this.registerPlayerAI) {
                (function (player) {
                    player.timeline.setTimeoutCallBack(function () {
                        var masterCall = arguments[1] ? true : false;
                        // 继续计时
                        // AI 处理
                        // 第一轮 call
                        if (player.isMaster && !masterCall) {
                            player.isLive = false;
                        }
                        else if (player.isLive) {
                            if (self._dealer._status === GameConst.DEALER_READY) {
                                if (player.isSmall) {
                                    player.putMoney(self.smallMoney);
                                    self.moneyPool += self.smallMoney;
                                }
                                else if (!player.isBig) {
                                    player.putMoney(self.bigMoney);
                                    self.moneyPool += self.bigMoney;
                                }
                            }
                            else {
                                // 其它轮次 call
                                player.putMoney(self.bigMoney);
                                self.moneyPool += self.bigMoney;
                            }
                            var xx = '';
                            if (player.isSmall) {
                                xx = ' is small';
                            }
                            if (player.isBig) {
                                xx += ' is big';
                            }
                            cc.log(player.name, xx);
                            self.updateMoneyPool();
                        }
                        self.beginTiming();
                    });
                }(player));
            }
            if (turn || player.isSmall) {
                turn = true;
                continue;
            }
            else {
                this._players.splice(i--, 1);
                left.push(player);
            }
        }

        this.registerPlayerAI = true;
        this._players = this._players.concat(left);
        this.send2poker();
        this.smallPlayer.putMoney(this.smallMoney);
        this.bigPlayer.putMoney(this.bigMoney);
        this.moneyPool = this.smallMoney+this.bigMoney;
        turn = false;

        // 确定计时序列
        this._players.push(this._players.shift());
        this._players.push(this._players.shift());

        this.timingIndex = 0;
        this.updateMoneyPool();
    },
    beginTiming: function () {
        var player;
        for(;this.timingIndex<this.playerNum;) {
            player = this._players[this.timingIndex++];
            if (player.isLive) {
                this.activePlayer && (this.activePlayer.isActive = false);
                player.isActive = true;
                this.activePlayer = player;
                player.timing();
                if(player.isMaster){
                    this.drawUserButton();
                }
                else{
                    this.removeUserButton();
                }
                return;
            }
        }
        this.timingIndex++;
        // 所有计时器遍历完
        this.timingEnd();
    },
    send2poker: function () {
        // 给每位角色发2张牌
        var queue = [], context = this;
        for(var i=0;i<2;i++) {
            for (var j = 0; j < this._players.length; j++) {
                var poker = this._dealer.getAPoker();
                var pos = this._players[j].getSeatPosition();
                if (i == 0) {
                    pos.x -= 17;
                }
                else{
                    pos.x += 5;
                }
                this.addChild(poker, GameConst.POKER_Z);
                this.addChild(poker._face, GameConst.POKER_FACE_Z);
                this._players[j].getOnePoker(poker);
                // this._dealer[j === 0 ? 'sendPokerToMe':'sendPokerToPlayer'](poker, pos);
                queue.push({
                    action: this._players[j].isMaster ? 'sendPokerToMe':'sendPokerToPlayer',
                    poker: poker,
                    pos: pos
                });
            }
        }

        (function sendPoker() {
            var frame = queue.shift();
            if(frame){
                context._dealer[frame.action](frame.poker, frame.pos);
                setTimeout(sendPoker, 50);
            }
            else{
                context.beginTiming();
            }
        }());
        this._dealer.updateStatus(GameConst.DEALER_READY);
    },
    showPoker: function () {
        for (var i = 0; i < this._players.length; i++) {
            this._players[i]._pokers.forEach(function (poker) {
                poker.show();
            });
        }
    },
    nextDPlayer: function () {
        var prevDPlayer, dPlayer, player, firstLivePlayer =null, secondLivePlayer =null, threeLivePlayer = null, finded = false, small, big;
        for(var i=0;i<this._players.length;i++) {
            player = this._players[i];
            if(!player.isDeath) {
                firstLivePlayer && secondLivePlayer && !threeLivePlayer && (threeLivePlayer = player);
                firstLivePlayer && !secondLivePlayer && (secondLivePlayer = player);
                !firstLivePlayer && (firstLivePlayer = player);
                if(finded && small && !big){
                    big = player;
                }
                if(finded && !small){
                    small = player;
                }
                if (!finded && prevDPlayer) {
                    prevDPlayer.isD = false;
                    player.isD = true;
                    dPlayer = player;
                    finded = true;
                }
            }
            !finded && player.isD && (prevDPlayer = player);
        }

        if(!small){
            if(prevDPlayer){
                if(prevDPlayer === firstLivePlayer){
                    return this.showTheLastWinner(firstLivePlayer);
                }
                else{
                    if(threeLivePlayer){
                        small = secondLivePlayer;
                        big = threeLivePlayer;
                    }
                    else {
                        small = secondLivePlayer;
                        big = firstLivePlayer;
                    }
                }
            }
            else{
                return false;
            }
        }
        else if(!big){
            if(prevDPlayer){
                if(prevDPlayer === firstLivePlayer){
                    return this.showTheLastWinner(firstLivePlayer);
                }
                else{
                    big = firstLivePlayer;
                }
            }
            else{
                return false;
            }
        }

        if(!finded){ //没有成功设置庄家
            if(prevDPlayer){ // 有庄家
                if(prevDPlayer === firstLivePlayer){
                    // 最终获胜者
                    return this.showTheLastWinner(firstLivePlayer);
                }
                else { // 轮庄
                    prevDPlayer.isD = false;
                    firstLivePlayer.isD = true;
                    dPlayer = firstLivePlayer;
                }
            }
            else{
                return false;
            }
        }
        this.dPlayer = dPlayer;
        this.smallPlayer && (this.smallPlayer.isSmall = false);
        this.bigPlayer && (this.bigPlayer.isBig = false);
        cc.log('old', this.smallPlayer.name, this.bigPlayer.name);
        small.isSmall = true;
        big.isBig = true;
        this.smallPlayer = small;
        this.bigPlayer = big;

        cc.log(this.smallPlayer.name, this.bigPlayer.name);
    },
    drawButton: function () {
        var size = cc.director.getWinSize(), scale = 3 / 5, opacity = 188;
        var startbtn = new cc.Sprite('button.png', cc.rect(400, 0, 100, 68));
        var exitbtn = new cc.Sprite('button.png', cc.rect(500, 0, 100, 68));
        var startbtnselect = new cc.Sprite('button.png', cc.rect(400, 68, 100, 68));
        var exitbtnselect = new cc.Sprite('button.png', cc.rect(500, 68, 100, 68));

        var _startbutton = new cc.MenuItemSprite(startbtn, startbtnselect, null, this.evt_start.bind(this));
        var _exitbutton = new cc.MenuItemSprite(exitbtn, exitbtnselect, null, this.evt_exit.bind(this));

        var menu = new cc.Menu(_startbutton, _exitbutton);
        menu.alignItemsHorizontallyWithPadding(0);
        menu.setScale(scale);
        menu.setOpacity(opacity);
        menu.setPosition(-90, -68);

        var pos = this.dPlayer.getSeatPosition();
        var dealerPos = this._dealer.getPos();
        var dButton = new cc.Sprite('button.png', cc.rect(602, 0, 100, 68));

        dButton.setPosition(dealerPos.x, dealerPos.y);
        dButton.setScale(scale);

        var deskMoneyLabel = new cc.LabelTTF('底池：0', 'Aria', 11);
        deskMoneyLabel.setFontFillColor(cc.color(255, 215, 0));
        deskMoneyLabel.setPosition(size.width / 2 - 20, size.height - 180);

        this.addChild(menu);
        this.addChild(this.deskMoneyLabel = deskMoneyLabel, GameConst.D_MENU_Z);
        this.dButton = dButton;
        this.addChild(dButton, GameConst.D_MENU_Z);
        this.dButtonMoveTo(pos);
    },
    dButtonMoveTo: function (p) {
        var move = cc.moveTo(1.0, cc.p(p.x + 9, p.y + 60));
        this.dButton.runAction(move);
    },
    drawUserButton: function () {
        if(this.userMenu){
            cc.log('show user menu')
            this.userMenu.setVisible(true);
            return this;
        }
        var size = cc.director.getWinSize(), scale = 3 / 5, opacity = 188;
        var callbtn = new cc.Sprite('button.png',  cc.rect(0,   0, 100, 68));
        var raisebtn = new cc.Sprite('button.png', cc.rect(100, 0, 100, 68));
        var checkbtn = new cc.Sprite('button.png', cc.rect(200, 0, 100, 68));
        var foldbtn = new cc.Sprite('button.png',  cc.rect(300, 0, 100, 68));
        var callbtnselect = new cc.Sprite('button.png',  cc.rect(0,   68, 100, 68));
        var raisebtnselect = new cc.Sprite('button.png', cc.rect(100, 68, 100, 68));
        var checkbtnselect = new cc.Sprite('button.png', cc.rect(200, 68, 100, 68));
        var foldbtnselect = new cc.Sprite('button.png',  cc.rect(300, 68, 100, 68));

        var _callbutton = new cc.MenuItemSprite(callbtn, callbtnselect, null, this.evt_call.bind(this));
        var _raisebutton = new cc.MenuItemSprite(raisebtn, raisebtnselect, null, this.evt_raise.bind(this));
        var _checkbutton = new cc.MenuItemSprite(checkbtn, checkbtnselect, null, this.evt_check.bind(this));
        var _foldbutton = new cc.MenuItemSprite(foldbtn, foldbtnselect, null, this.evt_fold.bind(this));

        var menu = new cc.Menu(_callbutton, _raisebutton, _checkbutton, _foldbutton);
        menu.alignItemsHorizontallyWithPadding(0);
        menu.setScale(scale);
        menu.setOpacity(opacity);
        menu.setPosition(size.width / 2 - 200*scale - 40, 50);

        this.addChild(this.userMenu = menu, GameConst.USER_MENU_Z);
    },
    removeUserButton: function () {
        if(this.userMenu){
            this.userMenu.setVisible(false);
            return this;
        }
    },
    updateMoneyPool: function() {
        if (this.deskMoneyLabel) {
            this.deskMoneyLabel.setString('底池：' + this.moneyPool);
        }
    },
    showTheLastWinner: function (winner) {
        cc.log('The last winner is ' + winner.name);
    },
    clear: function () {
        for (var i = 0; i < this._players.length; i++) {
            this._players[i].clear(this);
        }
        for(var i=0;i<this._pokers.length;i++){
            this.removeChild(this._pokers[i]._face);
            this.removeChild(this._pokers[i]);
        }
        this._pokers.length = 0;
        this.clearWinnerLabel();
        this.activePlayer = null;
        this.timingIndex = 0;
    },
    clearWinnerLabel: function () {
        if(this.winnerLabel) {
            this.removeChild(this.winnerLabel)
            this.winnerLabel = null;
        }
    },
    getWinner: function () {
        var pokerType = ['', '高牌', '对子', '两对', '三条', '顺子', '同花', '葫芦', '金刚', '同花顺', '皇家同花顺'],
            winner = [],
            maxType, player,
            size = cc.director.getWinSize();

        for(var i= 0;i<this._players.length;i++){
            player = this._players[i];
            if(player.isLive) {
                if(maxType) {
                    if (player.finally.type > maxType.finally.type) {
                        maxType = player;
                    }
                }else{
                    maxType = player;
                }
            }
        }
        winner.push(maxType);
        for (var i = 0; i < this._players.length; i++) {
            player = this._players[i];
            if (player.isLive && player.__instanceId !== maxType.__instanceId && player.finally.type === maxType.finally.type) {
                winner.push(player);
            }
        }

        if(winner.length === 1){
            for(var i=0;i<winner[0].finally.pokers.length;i++){
                winner[0].finally.pokers[i].powerful();
            }
            winner[0].getMoney(this.moneyPool);
        }
        else {
            for (var i = 0; i < 5; i++) {
                winner.sort(function (a, b) {
                    var v1 = a.finally.pokers[i]._num, v2 = b.finally.pokers[i]._num;
                    v1 === 1 && (v1 = 14);
                    v2 === 1 && (v2 = 14);
                    return v2 - v1;
                });
                var large = winner[0].finally.pokers[i]._num;
                for (var j = 1; j < winner.length; j++) {
                    if (winner[j].finally.pokers[i]._num !== large) {
                        winner.splice(j--, 1);
                    }
                }
            }

            var perMoney = parseInt(this.moneyPool / winner.length);
            for (var i = 0; i < winner.length; i++) {
                for (var j = 0; j < winner[i].finally.pokers.length; j++) {
                    winner[i].finally.pokers[j].powerful();
                }
                winner[i].getMoney(perMoney);
            }
        }

        this.clearWinnerLabel();
        this.moneyPool = 0;
        var winnerLabel = new cc.LabelTTF(pokerType[winner[0].finally.type]+"赢！", "微软雅黑", 36);
        winnerLabel.setPosition(size.width /2 , size.height - 120);
        this.addChild(this.winnerLabel = winnerLabel);
        this.showWinnerTime = GameConst.SHOW_WINNER_TIME;
        this.updateMoneyPool();
    },
    settlement: function(){
        var mypokers = [];
        for(var i=0;i<this._players.length;i++){
            mypokers = this._pokers.slice(0);
            mypokers.push(this._players[i]._pokers[0], this._players[i]._pokers[1]);
            this._players[i].finally = this.getMaxPokerCombination(mypokers);
        }

        // test
        // mypokers = [
        //     new PokerCard(1, GameConst.POKER_MEIHUA),
        //     new PokerCard(2, GameConst.POKER_MEIHUA),
        //     new PokerCard(3, GameConst.POKER_MEIHUA),
        //     new PokerCard(4, GameConst.POKER_FANGKUAI),
        //     new PokerCard(4, GameConst.POKER_MEIHUA),
        //     new PokerCard(4, GameConst.POKER_HONGTAO),
        //     new PokerCard(4, GameConst.POKER_HEITAO)
        // ];
        //
        // console.log(this.getMaxPokerCombination(mypokers));
    },
    getMaxPokerCombination: function (pokers) {
        var s = this.getStraight(pokers), ss = this.getSameColor(pokers), second;
        if(s !== false && ss !== false) {
            second = this.getStraight(ss);
            if (second !== false) {
                var max = this.getMaxFive(second);
                return {
                    pokers: max,
                    type: max[0]._num === 1 && max[1]._num === 13 ? 10 : 9
                }
            }
            else {
                return {
                    pokers: this.getMaxFive(ss),
                    type: 6
                }
            }
        }
        else if(s !== false){
            return {
                pokers: this.getMaxFive(s),
                type: 5
            }
        }
        else if(ss !== false){
            return {
                pokers: this.getMaxFive(ss),
                type: 6
            }
        }
        else{
            second = this.isFourSame(pokers);
            if(second !== false){
                return {
                    pokers: second,
                    type: 8
                }
            }
            else {
                second = this.isFullHouse(pokers);
                if(second !== false){
                    return {
                        pokers : second,
                        type: 7
                    }
                }
                else{
                    second = this.isThreeSame(pokers);
                    if(second !== false){
                        return {
                            pokers: second,
                            type: 4
                        }
                    }
                    else{
                        second = this.isTwoPair(pokers);
                        if(second !== false){
                            return {
                                pokers: second,
                                type: 3
                            }
                        }
                        else{
                            second = this.isPair(pokers);
                            if(second !== false){
                                return {
                                    pokers: second,
                                    type: 2
                                }
                            }
                            else {
                                return {
                                    pokers: this.getMaxFive(pokers),
                                    type: 1
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    getStraight: function (pks) {
        var result = [], count = 1, prev, hasAce = false, aceClone;
        var pokers = pks.sort(function (a, b) {
            return a._num - b._num;
        });
        if (pokers[0]._num === 1) {
            hasAce = true;
            aceClone = pokers[0].clone();
            aceClone._num = 14;
            pokers.push(aceClone);
        }
        result.push(prev = pokers[pokers.length - 1]);
        for (var i = pokers.length - 2; i >= 0; i--) {
            if (prev._num - 1 === pokers[i]._num) {
                result.unshift(prev = pokers[i]);
                count++;
            }
            else if(prev._num === pokers[i]._num){
                prev = pokers[i];
            }
            else {
                if (count >= 5) {
                    return clear();
                }
                result.length = 0;
                result.push(prev = pokers[i]);
                count = 1;
            }
        }
        if (count >= 5) {
            return clear();
        }
        if(hasAce){
            pokers.pop();
        }
        return false;
        function clear() {
            if (hasAce) {
                pokers.pop();
                if (result[0]._num === 1) {
                    return result;
                }
                else if (result[result.length - 1]._num === 14) {
                    result[result.length - 1] = pokers[0];
                    return result;
                }
            }
            return result;
        }
    },
    getSameColor: function (pks) {
        var result = [], count = 1, prev;
        var pokers = pks.sort(function (a, b) {
            return a._color - b._color;
        });
        result.push(prev = pokers[0]);
        for(var i=1;i<pokers.length;i++){
            if(pokers[i]._color === prev._color){
                result.push(prev = pokers[i]);
                count++;
            }
            else{
                if(count >=5 ){
                    return result;
                }
                else{
                    result.length = 0;
                    result.push(prev = pokers[i]);
                    count = 1;
                }
            }
        }
        if(count >=5 ){
            return result;
        }
        return false;
    },
    isFourSame: function (pks) {
        var r = this.getGroup(pks, 4);
        if(r !== false){
            r[0].push(r[1][0]);
            return r[0];
        }
        return false;
    },
    isFullHouse: function (pks) {
        var r = this.getGroup(pks, 3);
        if (r !== false) {
            var left = this.getGroup(r[1], 2);
            if (left !== false) {
                return r[0].concat([left[0][0], left[0][1]]);
            }
        }
        return false;
    },
    isThreeSame: function (pks) {
        var r = this.getGroup(pks, 3);
        if(r !== false){
            return r[0].concat([r[1][0], r[1][1]]);
        }
        return false;
    },
    isTwoPair: function (pks) {
        var r = this.getGroup(pks, 2);
        if(r!==false){
            var left = this.getGroup(r[1],2);
            if(left !== false){
                return r[0].concat(left[0]).concat([left[1][0]]);
            }
        }
        return false;
    },
    isPair: function (pks) {
        var r = this.getGroup(pks, 2);
        if(r !== false){
            return r[0].concat([r[1][0],r[1][1], r[1][2]]);
        }
        return false;
    },
    getMaxFive: function (pks) {
        var r = this.getGroup(pks, 1);
        var f = r[1].slice(0, 4);
        f.unshift(r[0][0]);
        return f;
    },
    getGroup: function (pks, samenum) {
        var result = [], count = 1, prev;
        var pokers = pks.sort(function (a, b) {
            var v1 = a._num, v2 = b._num;
            v1 === 1 && (v1 = 14);
            v2 === 1 && (v2 = 14);
            return v2 - v1;
        });
        result.push(prev = pokers[0]);
        for(var i=1;i<pokers.length;i++){
            if(prev._num === pokers[i]._num){
                result.push(pokers[i]);
                count++;
            }
            else{
                if(count >= samenum){
                    return group();
                }
                result.length = 0;
                result.push(prev = pokers[i]);
                count = 1;
            }
        }
        if(count >= samenum){
            return group();
        }
        return false;
        function group() {
            return [result, pokers.filter(function (a) {
                return a._num !== result[0]._num;
            })]
        }
    },
    timingEnd: function () {
        var dealer = this._dealer, poker;
        if(dealer._status === GameConst.DEALER_READY){
            var pokers = dealer.getThreePoker();
            if(pokers && pokers.length){
                for(var i=0;i<pokers.length;i++){
                    this.addChild(pokers[i], GameConst.POKER_Z);
                    this.addChild(pokers[i]._face, GameConst.POKER_FACE_Z);
                    this._pokers.push(pokers[i]);
                    dealer.sendPokerToDesk(pokers[i], PokerPositionOnDesk[i+1]);
                }
            }
            // 调整计时顺序
            this._players.unshift(this._players.pop());
            this._players.unshift(this._players.pop());
            // 开始新的计时
            this.timingIndex = 0;
            this.beginTiming();
        }
        else if(dealer._status === GameConst.DEALER_THREE || dealer._status === GameConst.DEALER_FOUR) {
            poker = dealer.getAPoker('public');
            poker.setScale(2/3);
            this.addChild(poker, GameConst.POKER_Z);
            this.addChild(poker._face, GameConst.POKER_FACE_Z);
            this._pokers.push(poker);
            dealer.sendPokerToDesk(poker, PokerPositionOnDesk[dealer._status === GameConst.DEALER_THREE ? 4 : 5]);
            dealer.updateStatus(dealer._status === GameConst.DEALER_THREE ? GameConst.DEALER_FOUR : GameConst.DEALER_FIVE);
            // 开始计时
            this.timingIndex = 0;
            this.beginTiming();
        }
        else if(dealer._status === GameConst.DEALER_FIVE) {
            this.showPoker();
            dealer.updateStatus(null);
            this.removeUserButton();
            this.timingEnd();
        }
        else{
            this.settlement();
            this.getWinner();
        }
        cc.log('timing end');
    },
    evt_call: function () {
        cc.log('call');
        this.master.timeline.stop([true]);
    },
    evt_raise: function () {
        cc.log('player raise');
    },
    evt_check: function () {
        cc.log('player check');
        this.nextDPlayer();
        this.dButtonMoveTo(this.dPlayer.getSeatPosition());
    },
    evt_fold: function () {
        cc.log('play fold');
        this.master.timeline.stop();
    },
    evt_start: function () {
        this.clear();
        this._dealer.rifflePoker();
        this.nextDPlayer();
        this.dButtonMoveTo(this.dPlayer.getSeatPosition());
        this.begin();
    },
    evt_exit: function () {
        this.clickExitTimes += 1;
        this.clickExitTimes % 2 === 0 ? this.removeUserButton() : this.drawUserButton();
    }
});

var GameScene = cc.Scene.extend({
    ctor: function () {
        this._super();
        this.addChild(this.gamelayer = new GameLayer());
    }
});