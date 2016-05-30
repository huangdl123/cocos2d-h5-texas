(function(){
    var Util = {
        isArray: function (a) {
            return isType('Array', a);
        },
        isFunction: function (a) {
            return isType('Function', a);
        },
        isNumber: function (a) {
            return isType('Number', a);
        }
    };

    function isType(type, target) {
        return Object.prototype.toString.call(target) === '[object ' + type + ']';
    }

    window.Util = Util;
}())