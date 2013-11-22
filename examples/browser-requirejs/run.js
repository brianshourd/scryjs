require.config({
    paths: {
        'scry': '../../scry'
    }
});

require(['app'], function(App) {
    App.run();
});
