cc.game.onStart = function () {
    cc.loader.resPath = 'res';

    cc.LoaderScene.preload(g_resources, function () {
        cc.director.runScene(new GameScene());
    }, this);
};
cc.game.run();